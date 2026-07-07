// ============ NATURE — video file persistence ============
// Clinical documentation videos, stored like photos.js stores stills: the app
// keeps its OWN private copy under documentDirectory/videos/… (stable key →
// path survives sandbox moves) and best-effort mirrors to the "Nature" album.
// Videos attach to a SESSION (a guided turn covers several angles), so the key
// ends in a timestamp instead of an angle id.
import * as FileSystem from 'expo-file-system/legacy';
import { Asset, Album, getPermissionsAsync, requestPermissionsAsync } from 'expo-media-library';

const VIDEO_DIR = (FileSystem.documentDirectory || '') + 'videos/';
const ALBUM = 'Nature';

let mediaPermPromise;
async function ensureMediaPermission() {
  try {
    const current = await getPermissionsAsync();
    if (current?.granted) return true;
    if (!mediaPermPromise) mediaPermPromise = requestPermissionsAsync();
    const res = await mediaPermPromise;
    return !!res?.granted;
  } catch {
    return false;
  }
}

const cleanPart = (x) => encodeURIComponent(String(x || '').replace(/\//g, '-'));

export function makeVideoKey(ids, ts = Date.now()) {
  if (!ids?.clientId || !ids?.caseId || !ids?.sessionId) return undefined;
  return `${cleanPart(ids.clientId)}/${cleanPart(ids.caseId)}/${cleanPart(ids.sessionId)}/${ts}.mp4`;
}

export const uriForVideoKey = (videoKey) => (videoKey ? `${VIDEO_DIR}${videoKey}` : undefined);

async function fileExists(uri) {
  if (!uri || !String(uri).startsWith('file')) return false;
  try {
    return !!(await FileSystem.getInfoAsync(uri))?.exists;
  } catch {
    return false;
  }
}

// Copy a freshly-recorded camera-cache file into app-private storage; mirror to
// the gallery best-effort. Returns { uri, videoKey, galleryAssetId, galleryUri }.
export async function persistVideo(cacheUri, ids) {
  if (!cacheUri) return { uri: undefined };
  const videoKey = makeVideoKey(ids);
  try {
    const dest = uriForVideoKey(videoKey);
    const dir = dest.slice(0, dest.lastIndexOf('/') + 1);
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    await FileSystem.deleteAsync(dest, { idempotent: true });
    await FileSystem.copyAsync({ from: cacheUri, to: dest });
    let mirror;
    try {
      if (await ensureMediaPermission()) {
        const album = await Album.get(ALBUM);
        let asset;
        if (album) asset = await Asset.create(dest, album);
        else {
          asset = await Asset.create(dest);
          await Album.create(ALBUM, [asset]);
        }
        mirror = { galleryAssetId: asset?.id, galleryUri: asset ? await asset.getUri().catch(() => undefined) : undefined };
      }
    } catch {
      // gallery mirror is non-essential; the private copy is the record of truth
    }
    return { uri: dest, videoKey, ...mirror };
  } catch {
    // if the copy fails, fall back to the cache uri so the clip still plays now
    return { uri: cacheUri, videoKey };
  }
}

// Rebuild a video's uri from its key after a sandbox path change (lightweight
// analogue of recoverPhotoRecord — no gallery search, key path or bust).
export async function recoverVideoRecord({ uri, videoKey }) {
  const expected = uriForVideoKey(videoKey);
  if (expected && await fileExists(expected)) return { uri: expected, videoKey, fileMissing: false };
  if (uri && await fileExists(uri)) return { uri, videoKey, fileMissing: false };
  return { uri: expected || uri, videoKey, fileMissing: !!(uri || videoKey) };
}

export async function deleteVideoFile(uri) {
  if (!uri || !String(uri).startsWith('file')) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore — file may already be gone
  }
}
