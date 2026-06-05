// ============ NATURE — photo file persistence ============
// The app keeps its OWN private copy (the record's source of truth, used for
// in-app display and the future Supabase upload) and ALSO mirrors a copy into a
// "Nature" album in the device gallery (best-effort, honoring the gallery choice).
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

const PHOTO_DIR = (FileSystem.documentDirectory || '') + 'photos/';
const ALBUM = 'Nature';

let mediaPermPromise;
async function ensureMediaPermission() {
  if (!mediaPermPromise) mediaPermPromise = MediaLibrary.requestPermissionsAsync();
  try {
    const res = await mediaPermPromise;
    return !!res?.granted;
  } catch {
    return false;
  }
}

async function mirrorToGallery(localUri) {
  try {
    if (!(await ensureMediaPermission())) return;
    const asset = await MediaLibrary.createAssetAsync(localUri);
    const album = await MediaLibrary.getAlbumAsync(ALBUM);
    if (!album) await MediaLibrary.createAlbumAsync(ALBUM, asset, false);
    else await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  } catch {
    // gallery mirror is non-essential; the private copy is the record of truth
  }
}

// Copy a freshly-captured camera-cache file into app-private storage and return
// its stable uri. Mirrors to the gallery in the background.
export async function persistPhoto(cacheUri, ids) {
  if (!cacheUri) return { uri: undefined };
  try {
    const dir = `${PHOTO_DIR}${ids.clientId}/${ids.caseId}/${ids.sessionId}/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const dest = `${dir}${ids.angleId}_${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: cacheUri, to: dest });
    mirrorToGallery(dest); // fire-and-forget so capture stays snappy
    return { uri: dest };
  } catch {
    // if the copy fails, fall back to the cache uri so the shot still shows now
    return { uri: cacheUri };
  }
}

export async function deletePhotoFile(uri) {
  if (!uri || !String(uri).startsWith('file')) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore — file may already be gone
  }
}
