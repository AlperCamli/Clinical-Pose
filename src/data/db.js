// ============ NATURE — local persistence (expo-sqlite) ============
// Source of truth on device. Tables carry serverId / updatedAt / dirty so a
// backend (Phase 2 — Supabase) can sync without a migration.
import * as SQLite from 'expo-sqlite';
import { uid } from './helpers';
import { recoverPhotoRecord } from './photos';

let dbPromise;
function getDB() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('nature.db');
  return dbPromise;
}

const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY NOT NULL,
  serverId TEXT,
  code TEXT, name TEXT, phone TEXT,
  consentClinical INTEGER, consentSocial INTEGER,
  eyeDefault TEXT, notes TEXT, initials TEXT,
  createdAt INTEGER, updatedAt INTEGER, dirty INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY NOT NULL,
  serverId TEXT,
  clientId TEXT NOT NULL,
  treatment TEXT, started TEXT, practitioner TEXT,
  createdAt INTEGER, updatedAt INTEGER, dirty INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  serverId TEXT,
  caseId TEXT NOT NULL,
  kind TEXT, label TEXT, date TEXT, refSource TEXT,
  createdAt INTEGER, updatedAt INTEGER, dirty INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY NOT NULL,
  serverId TEXT,
  sessionId TEXT NOT NULL,
  angleId TEXT NOT NULL,
  status TEXT, eyeHidden INTEGER, tag TEXT,
  localUri TEXT, remoteUrl TEXT,
  photoKey TEXT, galleryAssetId TEXT, galleryUri TEXT, fileMissing INTEGER DEFAULT 0,
  eyeBoxes TEXT, eyeDetected INTEGER, imgW INTEGER, imgH INTEGER,
  createdAt INTEGER, updatedAt INTEGER, dirty INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS consent_events (
  id TEXT PRIMARY KEY NOT NULL,
  clientId TEXT NOT NULL,
  kind TEXT, granted INTEGER, at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(clientId);
CREATE INDEX IF NOT EXISTS idx_sessions_case ON sessions(caseId);
CREATE INDEX IF NOT EXISTS idx_photos_session ON photos(sessionId);
`;

// Schema version. v1 recovered the corrupted seed (non-unique ids). v2 adds eye
// redaction columns. v3 adds stable photo keys + gallery recovery metadata.
// Additive migrations preserve photos already captured on-device.
const DB_VERSION = 3;
const V2_PHOTO_COLS = ['eyeBoxes TEXT', 'eyeDetected INTEGER', 'imgW INTEGER', 'imgH INTEGER'];
const V3_PHOTO_COLS = ['photoKey TEXT', 'galleryAssetId TEXT', 'galleryUri TEXT', 'fileMissing INTEGER DEFAULT 0'];

export async function initDB() {
  const db = await getDB();
  const row = await db.getFirstAsync('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  // Pre-v1 (corrupted / never-versioned): drop and rebuild from scratch.
  if (current < 1) {
    await db.execAsync(`
      DROP TABLE IF EXISTS clients;
      DROP TABLE IF EXISTS cases;
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS photos;
      DROP TABLE IF EXISTS consent_events;
    `);
  }
  await db.execAsync(SCHEMA);

  // v1 → v2: add the redaction columns to existing photos tables (preserve data).
  if (current >= 1 && current < 2) {
    for (const col of V2_PHOTO_COLS) {
      try { await db.execAsync(`ALTER TABLE photos ADD COLUMN ${col}`); } catch { /* column exists */ }
    }
  }
  if (current >= 1 && current < 3) {
    for (const col of V3_PHOTO_COLS) {
      try { await db.execAsync(`ALTER TABLE photos ADD COLUMN ${col}`); } catch { /* column exists */ }
    }
  }

  if (current < DB_VERSION) await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}

const photoId = (sessionId, angleId) => `${sessionId}:${angleId}`;

// ---------------- upserts ----------------
export async function upsertClient(c, createdAt) {
  const db = await getDB();
  const ts = Date.now();
  await db.runAsync(
    `INSERT INTO clients (id, serverId, code, name, phone, consentClinical, consentSocial, eyeDefault, notes, initials, createdAt, updatedAt, dirty)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)
     ON CONFLICT(id) DO UPDATE SET
       code=excluded.code, name=excluded.name, phone=excluded.phone,
       consentClinical=excluded.consentClinical, consentSocial=excluded.consentSocial,
       eyeDefault=excluded.eyeDefault, notes=excluded.notes, initials=excluded.initials,
       updatedAt=excluded.updatedAt, dirty=1`,
    [c.id, c.serverId ?? null, c.code, c.name, c.phone ?? '', c.consentClinical ? 1 : 0, c.consentSocial ? 1 : 0,
      c.eyeDefault ?? 'hidden', c.notes ?? '', c.initials ?? '', createdAt ?? ts, ts]
  );
}

export async function upsertCase(clientId, cs, createdAt) {
  const db = await getDB();
  const ts = Date.now();
  await db.runAsync(
    `INSERT INTO cases (id, serverId, clientId, treatment, started, practitioner, createdAt, updatedAt, dirty)
     VALUES (?,?,?,?,?,?,?,?,1)
     ON CONFLICT(id) DO UPDATE SET
       treatment=excluded.treatment, started=excluded.started, practitioner=excluded.practitioner,
       updatedAt=excluded.updatedAt, dirty=1`,
    [cs.id, cs.serverId ?? null, clientId, cs.treatment, cs.started, cs.practitioner ?? '', createdAt ?? ts, ts]
  );
}

export async function upsertSession(caseId, s, createdAt) {
  const db = await getDB();
  const ts = Date.now();
  await db.runAsync(
    `INSERT INTO sessions (id, serverId, caseId, kind, label, date, refSource, createdAt, updatedAt, dirty)
     VALUES (?,?,?,?,?,?,?,?,?,1)
     ON CONFLICT(id) DO UPDATE SET
       kind=excluded.kind, label=excluded.label, date=excluded.date, refSource=excluded.refSource,
       updatedAt=excluded.updatedAt, dirty=1`,
    [s.id, s.serverId ?? null, caseId, s.kind, s.label, s.date, s.refSource ?? null, createdAt ?? ts, ts]
  );
}

export async function upsertPhoto(sessionId, angleId, rec, createdAt) {
  const db = await getDB();
  const ts = Date.now();
  const boxes = rec.eyeBoxes != null ? JSON.stringify(rec.eyeBoxes) : null;
  await db.runAsync(
    `INSERT INTO photos (id, serverId, sessionId, angleId, status, eyeHidden, tag, localUri, remoteUrl,
       photoKey, galleryAssetId, galleryUri, fileMissing,
       eyeBoxes, eyeDetected, imgW, imgH, createdAt, updatedAt, dirty)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
     ON CONFLICT(id) DO UPDATE SET
       status=excluded.status, eyeHidden=excluded.eyeHidden, tag=excluded.tag,
       localUri=excluded.localUri, remoteUrl=excluded.remoteUrl,
       photoKey=excluded.photoKey, galleryAssetId=excluded.galleryAssetId,
       galleryUri=excluded.galleryUri, fileMissing=excluded.fileMissing,
       eyeBoxes=excluded.eyeBoxes, eyeDetected=excluded.eyeDetected,
       imgW=excluded.imgW, imgH=excluded.imgH, updatedAt=excluded.updatedAt, dirty=1`,
    [photoId(sessionId, angleId), rec.serverId ?? null, sessionId, angleId, rec.status ?? 'captured',
      rec.eyeHidden ? 1 : 0, rec.tag ?? null, rec.uri ?? null, rec.remoteUrl ?? null,
      rec.photoKey ?? null, rec.galleryAssetId ?? null, rec.galleryUri ?? null, rec.fileMissing ? 1 : 0,
      boxes, rec.eyeDetected ? 1 : 0, rec.imgW ?? null, rec.imgH ?? null, createdAt ?? ts, ts]
  );
}

async function updatePhotoStorage(photoRowId, rec) {
  const db = await getDB();
  await db.runAsync(
    `UPDATE photos SET localUri=?, photoKey=?, galleryAssetId=?, galleryUri=?, fileMissing=?, updatedAt=?, dirty=1 WHERE id=?`,
    [rec.uri ?? null, rec.photoKey ?? null, rec.galleryAssetId ?? null, rec.galleryUri ?? null,
      rec.fileMissing ? 1 : 0, Date.now(), photoRowId]
  );
}

export async function deletePhotoRow(sessionId, angleId) {
  const db = await getDB();
  await db.runAsync('DELETE FROM photos WHERE id=?', [photoId(sessionId, angleId)]);
}

export async function addConsentEvent(clientId, kind, granted) {
  const db = await getDB();
  await db.runAsync('INSERT INTO consent_events (id, clientId, kind, granted, at) VALUES (?,?,?,?,?)',
    [uid(), clientId, kind, granted ? 1 : 0, Date.now()]);
}

// Insert a whole case subtree (case → sessions → photos), used by addCase.
export async function upsertCaseGraph(clientId, cs) {
  await upsertCase(clientId, cs);
  for (const s of cs.sessions || []) {
    await upsertSession(cs.id, s);
    for (const [aid, rec] of Object.entries(s.photos || {})) await upsertPhoto(s.id, aid, rec);
  }
}

// ---------------- seed ----------------
export async function seedIfEmpty(seedClients) {
  const db = await getDB();
  const row = await db.getFirstAsync('SELECT COUNT(*) AS n FROM clients');
  if (row && row.n > 0) return;
  const base = Date.now();
  await db.withTransactionAsync(async () => {
    for (let ci = 0; ci < seedClients.length; ci++) {
      const c = seedClients[ci];
      await upsertClient(c, base - ci); // earlier seeds sort first (DESC)
      for (let csi = 0; csi < c.cases.length; csi++) {
        const cs = c.cases[csi];
        await upsertCase(c.id, cs, base - csi);
        for (let si = 0; si < cs.sessions.length; si++) {
          const s = cs.sessions[si];
          await upsertSession(cs.id, s, base + si); // earlier sessions sort first (ASC)
          for (const [aid, rec] of Object.entries(s.photos || {})) await upsertPhoto(s.id, aid, rec, base + si);
        }
      }
    }
  });
}

// ---------------- hydrate ----------------
export async function loadAll() {
  const db = await getDB();
  const [clientRows, caseRows, sessionRows, photoRows] = await Promise.all([
    db.getAllAsync('SELECT * FROM clients ORDER BY createdAt DESC, rowid DESC'),
    db.getAllAsync('SELECT * FROM cases ORDER BY createdAt DESC, rowid DESC'),
    db.getAllAsync('SELECT * FROM sessions ORDER BY createdAt ASC, rowid ASC'),
    db.getAllAsync('SELECT * FROM photos'),
  ]);

  const casesById = {};
  for (const cs of caseRows) casesById[cs.id] = cs;
  const sessionsById = {};
  for (const s of sessionRows) sessionsById[s.id] = s;

  const photosBySession = {};
  for (const p of photoRows) {
    if (!photosBySession[p.sessionId]) photosBySession[p.sessionId] = {};
    let eyeBoxes;
    try { eyeBoxes = p.eyeBoxes ? JSON.parse(p.eyeBoxes) : undefined; } catch { eyeBoxes = undefined; }
    const sRow = sessionsById[p.sessionId];
    const csRow = sRow ? casesById[sRow.caseId] : null;
    const storage = await recoverPhotoRecord({
      uri: p.localUri || undefined,
      photoKey: p.photoKey || undefined,
      galleryAssetId: p.galleryAssetId || undefined,
      galleryUri: p.galleryUri || undefined,
      ids: csRow ? { clientId: csRow.clientId, caseId: csRow.id, sessionId: p.sessionId, angleId: p.angleId } : undefined,
    });
    if (
      (storage.uri || null) !== (p.localUri || null) ||
      (storage.photoKey || null) !== (p.photoKey || null) ||
      (storage.galleryAssetId || null) !== (p.galleryAssetId || null) ||
      (storage.galleryUri || null) !== (p.galleryUri || null) ||
      (storage.fileMissing ? 1 : 0) !== (p.fileMissing ? 1 : 0)
    ) {
      await updatePhotoStorage(p.id, storage);
    }
    photosBySession[p.sessionId][p.angleId] = {
      status: p.status, eyeHidden: !!p.eyeHidden, tag: p.tag || undefined,
      uri: storage.uri || undefined, remoteUrl: p.remoteUrl || undefined,
      photoKey: storage.photoKey || undefined,
      galleryAssetId: storage.galleryAssetId || undefined,
      galleryUri: storage.galleryUri || undefined,
      fileMissing: !!storage.fileMissing,
      eyeBoxes, eyeDetected: !!p.eyeDetected, imgW: p.imgW || undefined, imgH: p.imgH || undefined,
    };
  }
  const sessionsByCase = {};
  for (const s of sessionRows) {
    if (!sessionsByCase[s.caseId]) sessionsByCase[s.caseId] = [];
    sessionsByCase[s.caseId].push({
      id: s.id, kind: s.kind, label: s.label, date: s.date,
      refSource: s.refSource || undefined, photos: photosBySession[s.id] || {},
    });
  }
  const casesByClient = {};
  for (const cs of caseRows) {
    if (!casesByClient[cs.clientId]) casesByClient[cs.clientId] = [];
    casesByClient[cs.clientId].push({
      id: cs.id, treatment: cs.treatment, started: cs.started,
      practitioner: cs.practitioner, sessions: sessionsByCase[cs.id] || [],
    });
  }
  return clientRows.map((c) => ({
    id: c.id, code: c.code, name: c.name, phone: c.phone,
    consentClinical: !!c.consentClinical, consentSocial: !!c.consentSocial,
    eyeDefault: c.eyeDefault, notes: c.notes || '', initials: c.initials,
    cases: casesByClient[c.id] || [],
  }));
}
