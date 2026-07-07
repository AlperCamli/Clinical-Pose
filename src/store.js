// ============ NATURE — app store, tweaks, toast, navigation adapter ============
import React from 'react';
import { View } from 'react-native';
import { useNavigation, StackActions } from '@react-navigation/native';
import { SEED_CLIENTS, SEED_APPOINTMENTS } from './data/seed';
import { C } from './theme';
import {
  initDB, seedIfEmpty, loadAll,
  upsertClient, upsertCaseGraph, upsertSession, upsertPhoto, deletePhotoRow, addConsentEvent, upsertPost,
  upsertAppointment, loadAppointments, deleteAppointmentRow,
  getSettingsMap, putSetting, upsertVideo, deleteVideoRow,
} from './data/db';
import { persistPhoto, deletePhotoFile } from './data/photos';
import { recoverVideoRecord, deleteVideoFile } from './data/videos';
import { SETTINGS_DEFAULTS } from './data/settingsDefaults';
import { cancelReminders, cancelScheduled, reconcileNotifications } from './data/notifications';

// fire-and-forget persistence: keep the UI snappy, log if a write fails
const save = (p) => Promise.resolve(p).catch((e) => console.warn('[nature] persist failed', e));

const AppCtx = React.createContext(null);
export const useApp = () => React.useContext(AppCtx);

// Locked defaults (the design's "Tweaks" panel — non-variant build).
const TWEAK_DEFAULTS = {
  eyeStyle: 'blur',
  roundness: 'soft',
  density: 'regular',
  homeStyle: 'spotlight',
  timelineStyle: 'vertical',
  cameraStyle: 'classic',
};

export function AppProvider({ children }) {
  // The in-memory client graph is the runtime working copy; it is hydrated from
  // SQLite on launch and every mutation is mirrored back to the database.
  const clientsRef = React.useRef([]);
  // Appointments are a flat array kept sorted by startAt; settings a KV map
  // that falls back to SETTINGS_DEFAULTS for unset keys.
  const apptsRef = React.useRef([]);
  const settingsRef = React.useRef({});
  const [hydrated, setHydrated] = React.useState(false);
  // `ver` is threaded into the context value below so that bump() (called after
  // every in-place mutation of the client ref) actually re-renders consumers.
  const [ver, setVer] = React.useState(0);
  const bump = React.useCallback(() => setVer((v) => v + 1), []);

  const [t, setT] = React.useState(TWEAK_DEFAULTS);
  const setTweak = React.useCallback((k, v) => setT((o) => ({ ...o, [k]: v })), []);

  const [toastMsg, setToastMsg] = React.useState(null);
  const toastTimer = React.useRef();
  const toast = React.useCallback((m) => {
    setToastMsg(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1900);
  }, []);

  // Hydrate from the database once (seeding the demo data on first launch).
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await initDB();
        await seedIfEmpty(SEED_CLIENTS, SEED_APPOINTMENTS);
        const [data, appts, settings] = await Promise.all([loadAll(), loadAppointments(), getSettingsMap()]);
        if (alive) {
          clientsRef.current = data;
          apptsRef.current = appts;
          settingsRef.current = settings;
        }
      } catch (e) {
        console.warn('[nature] hydrate failed', e);
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Post-hydration housekeeping, off the first-paint critical path:
  //  - repair video uris after a sandbox path change (in-memory only — path
  //    repair must not mark synced rows dirty, mirroring updatePhotoStorage)
  //  - reconcile scheduled notifications with the appointments table
  React.useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    (async () => {
      try {
        for (const c of clientsRef.current) {
          for (const cs of c.cases) {
            for (const s of cs.sessions) {
              for (const v of s.videos || []) {
                const fixed = await recoverVideoRecord(v);
                if (fixed.uri !== v.uri || !!fixed.fileMissing !== !!v.fileMissing) {
                  v.uri = fixed.uri;
                  v.fileMissing = fixed.fileMissing;
                }
              }
            }
          }
        }
        const findClient = (cid) => clientsRef.current.find((x) => x.id === cid);
        const patches = await reconcileNotifications(apptsRef.current, findClient);
        if (!alive) return;
        for (const [aptId, ids] of Object.entries(patches)) {
          const a = apptsRef.current.find((x) => x.id === aptId);
          if (!a) continue;
          a.notificationIds = ids;
          save(upsertAppointment(a));
        }
        if (Object.keys(patches).length) bump();
      } catch (e) {
        console.warn('[nature] boot housekeeping failed', e);
      }
    })();
    return () => { alive = false; };
  }, [hydrated, bump]);

  const store = React.useMemo(() => {
    const find = (cid) => clientsRef.current.find((x) => x.id === cid);
    const findCase = (cid, caseId) => find(cid)?.cases.find((x) => x.id === caseId);
    const findSession = (cid, caseId, sid) => findCase(cid, caseId)?.sessions.find((x) => x.id === sid);
    const findAppt = (id) => apptsRef.current.find((x) => x.id === id);
    return {
      get clients() { return clientsRef.current; },
      bump,
      addClient: (c) => {
        clientsRef.current = [c, ...clientsRef.current];
        bump();
        save(upsertClient(c));
      },
      updateClient: (cid, patch) => {
        const c = find(cid);
        if (!c) return;
        Object.assign(c, patch);
        bump();
        save(upsertClient(c));
      },
      setConsent: (cid, kind, granted) => {
        const c = find(cid);
        if (!c) return;
        if (kind === 'clinical') c.consentClinical = granted; else c.consentSocial = granted;
        bump();
        save(upsertClient(c));
        save(addConsentEvent(cid, kind, granted));
      },
      addCase: (cid, cs) => {
        const c = find(cid);
        if (!c) return;
        c.cases.unshift(cs);
        bump();
        save(upsertCaseGraph(cid, cs));
      },
      addSession: (cid, caseId, session) => {
        const cs = findCase(cid, caseId);
        if (!cs) return;
        cs.sessions.push(session);
        bump();
        save(upsertSession(caseId, session));
      },
      capturePhoto: async (cid, caseId, sid, aid, data) => {
        const s = findSession(cid, caseId, sid);
        if (!s) return null;
        const saved = await persistPhoto(data.uri, { clientId: cid, caseId, sessionId: sid, angleId: aid });
        // eye geometry is normalized (0..1), so it survives the file copy unchanged
        const rec = {
          status: data.status ?? 'captured', eyeHidden: data.eyeHidden, tag: data.tag,
          uri: saved.uri, photoKey: saved.photoKey, galleryAssetId: saved.galleryAssetId,
          galleryUri: saved.galleryUri, fileMissing: false,
          eyeBoxes: data.eyeBoxes ?? [], eyeDetected: !!data.eyeDetected, imgW: data.imgW, imgH: data.imgH,
          bgRemove: false,
        };
        s.photos[aid] = rec;
        bump();
        save(upsertPhoto(sid, aid, rec));
        return rec;
      },
      // flip a saved photo's redaction on/off instantly (no re-detection)
      setPhotoEyeHidden: (cid, caseId, sid, aid, hidden) => {
        const rec = findSession(cid, caseId, sid)?.photos[aid];
        if (!rec) return;
        rec.eyeHidden = hidden;
        bump();
        save(upsertPhoto(sid, aid, rec));
      },
      // persist a hand-adjusted eye box (normalized {x,y,w,h,rot}); re-renders instantly
      setPhotoEyeBoxes: (cid, caseId, sid, aid, boxes) => {
        const rec = findSession(cid, caseId, sid)?.photos[aid];
        if (!rec) return;
        rec.eyeBoxes = boxes || [];
        rec.eyeDetected = !!(boxes && boxes.length);
        bump();
        save(upsertPhoto(sid, aid, rec));
      },
      // flip a saved photo's "remove background (black)" preference; the on-disk
      // original is never modified — the cut-out is generated on demand for display
      setPhotoBgRemove: (cid, caseId, sid, aid, on) => {
        const rec = findSession(cid, caseId, sid)?.photos[aid];
        if (!rec) return;
        rec.bgRemove = !!on;
        bump();
        save(upsertPhoto(sid, aid, rec));
      },
      removePhoto: (cid, caseId, sid, aid) => {
        const s = findSession(cid, caseId, sid);
        if (!s) return;
        const rec = s.photos[aid];
        delete s.photos[aid];
        bump();
        save(deletePhotoRow(sid, aid));
        deletePhotoFile(rec?.uri);
      },
      // ---- social posts ----
      addPost: (cid, caseId, post) => {
        const cs = findCase(cid, caseId);
        if (!cs) return;
        if (!cs.posts) cs.posts = [];
        cs.posts.unshift(post);
        bump();
        save(upsertPost(caseId, post));
      },
      markPostShared: (cid, caseId, postId) => {
        const post = findCase(cid, caseId)?.posts?.find((p) => p.id === postId);
        if (!post) return;
        post.status = 'shared';
        post.sharedAt = Date.now();
        if (post.scheduledNotifId) cancelScheduled(post.scheduledNotifId);
        post.scheduledAt = undefined;
        post.scheduledNotifId = undefined;
        bump();
        save(upsertPost(caseId, post));
      },
      // "remind me to post" (E2) — pairs a fire time with its notification id
      schedulePost: (cid, caseId, postId, whenMs, notifId) => {
        const post = findCase(cid, caseId)?.posts?.find((p) => p.id === postId);
        if (!post) return;
        if (post.scheduledNotifId && post.scheduledNotifId !== notifId) cancelScheduled(post.scheduledNotifId);
        post.scheduledAt = whenMs;
        post.scheduledNotifId = notifId || undefined;
        bump();
        save(upsertPost(caseId, post));
      },
      // ---- appointments ----
      get appointments() { return apptsRef.current; },
      addAppointment: (appt) => {
        apptsRef.current = [...apptsRef.current, appt].sort((a, b) => a.startAt - b.startAt);
        bump();
        save(upsertAppointment(appt));
      },
      updateAppointment: (id, patch) => {
        const a = findAppt(id);
        if (!a) return;
        Object.assign(a, patch);
        if (patch.startAt != null) apptsRef.current = [...apptsRef.current].sort((x, y) => x.startAt - y.startAt);
        bump();
        save(upsertAppointment(a));
      },
      setAppointmentStatus: (id, status) => {
        const a = findAppt(id);
        if (!a) return;
        a.status = status;
        // reminders only make sense ahead of a live booking
        if (status === 'cancelled' || status === 'no-show' || status === 'completed') {
          cancelReminders(a.notificationIds);
          a.notificationIds = [];
        }
        bump();
        save(upsertAppointment(a));
      },
      cancelAppointment: (id) => {
        const a = findAppt(id);
        if (!a) return;
        a.status = 'cancelled';
        cancelReminders(a.notificationIds);
        a.notificationIds = [];
        bump();
        save(upsertAppointment(a));
      },
      deleteAppointment: (id) => {
        const a = findAppt(id);
        if (!a) return;
        cancelReminders(a.notificationIds);
        apptsRef.current = apptsRef.current.filter((x) => x.id !== id);
        bump();
        save(deleteAppointmentRow(id));
      },
      // A6 back-link: stamp which case/session a booking turned into
      linkAppointmentSession: (id, { caseId, sessionId }) => {
        const a = findAppt(id);
        if (!a) return;
        a.caseId = caseId;
        a.sessionId = sessionId;
        bump();
        save(upsertAppointment(a));
      },
      setAppointmentNotifIds: (id, ids) => {
        const a = findAppt(id);
        if (!a) return;
        a.notificationIds = ids || [];
        save(upsertAppointment(a));
      },
      markReminderSent: (id) => {
        const a = findAppt(id);
        if (!a) return;
        a.reminderSentAt = Date.now();
        bump();
        save(upsertAppointment(a));
      },
      // ---- persisted settings (KV with defaults) ----
      getSetting: (key, fallback) => {
        const v = settingsRef.current[key];
        if (v !== undefined && v !== null) return v;
        return SETTINGS_DEFAULTS[key] !== undefined ? SETTINGS_DEFAULTS[key] : fallback;
      },
      setSetting: (key, value) => {
        settingsRef.current = { ...settingsRef.current, [key]: value };
        bump();
        save(putSetting(key, value));
      },
      // ---- clinical videos (attached to a session) ----
      addVideo: (cid, caseId, sid, rec) => {
        const s = findSession(cid, caseId, sid);
        if (!s) return;
        if (!s.videos) s.videos = [];
        s.videos.push(rec);
        bump();
        save(upsertVideo(sid, rec));
      },
      removeVideo: (cid, caseId, sid, videoId) => {
        const s = findSession(cid, caseId, sid);
        if (!s?.videos) return;
        const rec = s.videos.find((v) => v.id === videoId);
        s.videos = s.videos.filter((v) => v.id !== videoId);
        bump();
        save(deleteVideoRow(videoId));
        deleteVideoFile(rec?.uri);
      },
    };
  }, [bump]);

  const value = React.useMemo(
    () => ({ store, t, setTweak, toast, toastMsg, ver }),
    [store, t, setTweak, toast, toastMsg, ver]
  );

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

// Navigation adapter.
//   go      — push a new screen (forward / deeper).
//   popTo   — return to an EXISTING screen, popping everything above it; pushes
//             if it isn't in the stack. This is what stops the back button from
//             cycling A→B→A→B when you navigate "up" to a screen already below.
//   navigateOrReplace — finishing capture: pop back to Session Review if we came
//             from it (re-take), otherwise replace the current camera screen.
//   reset   — rebuild the stack (used to land on the Timeline hub after a save).
export function useNav() {
  const navigation = useNavigation();
  return React.useMemo(
    () => ({
      go: (screen, params = {}) => navigation.push(screen, params),
      push: (screen, params = {}) => navigation.push(screen, params),
      replace: (screen, params = {}) => navigation.replace(screen, params),
      popTo: (screen, params = {}) => navigation.dispatch(StackActions.popTo(screen, params)),
      navigateOrReplace: (screen, params = {}) => {
        const exists = navigation.getState()?.routes?.some((r) => r.name === screen);
        if (exists) navigation.dispatch(StackActions.popTo(screen, params));
        else navigation.replace(screen, params);
      },
      reset: (routes, index) => navigation.reset({ index: index ?? routes.length - 1, routes }),
      back: () => navigation.goBack(),
      home: () => navigation.popToTop(),
    }),
    [navigation]
  );
}
