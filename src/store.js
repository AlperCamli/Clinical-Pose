// ============ NATURE — app store, tweaks, toast, navigation adapter ============
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { SEED_CLIENTS } from './data/seed';
import { clone } from './data/helpers';

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
  const clientsRef = React.useRef(clone(SEED_CLIENTS));
  const [, setVer] = React.useState(0);
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

  const store = React.useMemo(
    () => ({
      get clients() { return clientsRef.current; },
      bump,
      addClient: (c) => { clientsRef.current = [c, ...clientsRef.current]; bump(); },
      addCase: (cid, cs) => {
        const c = clientsRef.current.find((x) => x.id === cid);
        c.cases.unshift(cs);
        bump();
      },
      capturePhoto: (cid, caseId, sid, aid, data) => {
        const c = clientsRef.current.find((x) => x.id === cid);
        const cs = c.cases.find((x) => x.id === caseId);
        const s = cs.sessions.find((x) => x.id === sid);
        s.photos[aid] = data;
        bump();
      },
    }),
    [bump]
  );

  const value = React.useMemo(
    () => ({ store, t, setTweak, toast, toastMsg }),
    [store, t, setTweak, toast, toastMsg]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

// Navigation adapter mirroring the prototype's nav.go / replace / back / home.
export function useNav() {
  const navigation = useNavigation();
  return React.useMemo(
    () => ({
      go: (screen, params = {}) => navigation.push(screen, params),
      replace: (screen, params = {}) => navigation.replace(screen, params),
      back: () => navigation.goBack(),
      home: () => navigation.popToTop(),
    }),
    [navigation]
  );
}
