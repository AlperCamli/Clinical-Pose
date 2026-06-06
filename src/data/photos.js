// ============ NATURE — photo file persistence ============
// The app keeps its OWN private copy (the record's source of truth, used for
// in-app display and the future Supabase upload) and ALSO mirrors a copy into a
// "Nature" album in the device gallery (best-effort, honoring the gallery choice).
import * as FileSystem from 'expo-file-system/legacy';
import { Asset, Album, getPermissionsAsync, requestPermissionsAsync } from 'expo-media-library';

const PHOTO_DIR = (FileSystem.documentDirectory || '') + 'photos/';
const ALBUM = 'Nature';

let mediaPermPromise;
async function ensureMediaPermission({ request = true } = {}) {
  try {
    const current = await getPermissionsAsync();
    if (current?.granted) return true;
    if (!request) return false;
    if (!mediaPermPromise) mediaPermPromise = requestPermissionsAsync();
    const res = await mediaPermPromise;
    return !!res?.granted;
  } catch {
    return false;
  }
}

const cleanPart = (x) => encodeURIComponent(String(x || '').replace(/\//g, '-'));

export function makePhotoKey(ids) {
  if (!ids?.clientId || !ids?.caseId || !ids?.sessionId || !ids?.angleId) return undefined;
  return `${cleanPart(ids.clientId)}/${cleanPart(ids.caseId)}/${cleanPart(ids.sessionId)}/${cleanPart(ids.angleId)}.jpg`;
}

export function uriForPhotoKey(photoKey) {
  return photoKey ? `${PHOTO_DIR}${photoKey}` : undefined;
}

export function keyFromLocalUri(uri) {
  if (!uri) return undefined;
  const marker = '/photos/';
  const i = String(uri).indexOf(marker);
  return i >= 0 ? String(uri).slice(i + marker.length) : undefined;
}

async function fileExists(uri) {
  if (!uri || !String(uri).startsWith('file')) return false;
  try {
    return !!(await FileSystem.getInfoAsync(uri))?.exists;
  } catch {
    return false;
  }
}

async function copyIntoPrivate(sourceUri, photoKey) {
  const dest = uriForPhotoKey(photoKey);
  if (!sourceUri || !dest) return undefined;
  const dir = dest.slice(0, dest.lastIndexOf('/') + 1);
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  await FileSystem.deleteAsync(dest, { idempotent: true });
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

async function mirrorToGallery(localUri) {
  try {
    if (!(await ensureMediaPermission())) return;
    // new class-based media-library API (SDK 56)
    const album = await Album.get(ALBUM);
    let asset;
    if (album) asset = await Asset.create(localUri, album); // create + add in one call
    else {
      asset = await Asset.create(localUri);
      await Album.create(ALBUM, [asset]); // first time — make the album
    }
    return { galleryAssetId: asset?.id, galleryUri: asset ? await asset.getUri().catch(() => undefined) : undefined };
  } catch {
    // gallery mirror is non-essential; the private copy is the record of truth
    return undefined;
  }
}

async function findUniqueAlbumAsset(filename) {
  if (!filename || !(await ensureMediaPermission({ request: false }))) return undefined;
  try {
    const album = await Album.get(ALBUM);
    const assets = album ? await album.getAssets() : [];
    const matches = [];
    for (const asset of assets) {
      try {
        if ((await asset.getFilename()) === filename) matches.push(asset);
      } catch {
        // ignore assets the library can no longer resolve
      }
    }
    return matches.length === 1 ? matches[0] : undefined;
  } catch {
    return undefined;
  }
}

// Copy a freshly-captured camera-cache file into app-private storage and return
// its stable uri. Mirrors to the gallery in the background.
export async function persistPhoto(cacheUri, ids) {
  if (!cacheUri) return { uri: undefined };
  const photoKey = makePhotoKey(ids);
  try {
    const dest = await copyIntoPrivate(cacheUri, photoKey);
    const mirror = await mirrorToGallery(dest);
    return { uri: dest, photoKey, ...mirror };
  } catch {
    // if the copy fails, fall back to the cache uri so the shot still shows now
    return { uri: cacheUri, photoKey };
  }
}

export async function recoverPhotoRecord({ uri, photoKey, galleryAssetId, galleryUri, ids }) {
  const hasStorageHint = !!(uri || photoKey || galleryAssetId || galleryUri);
  const key = photoKey || keyFromLocalUri(uri) || (hasStorageHint ? makePhotoKey(ids) : undefined);
  const expectedUri = uriForPhotoKey(key);

  if (expectedUri && await fileExists(expectedUri)) {
    return { uri: expectedUri, photoKey: key, galleryAssetId, galleryUri, fileMissing: false };
  }

  if (uri && uri !== expectedUri && await fileExists(uri)) {
    try {
      const repairedUri = key ? await copyIntoPrivate(uri, key) : uri;
      return { uri: repairedUri, photoKey: key, galleryAssetId, galleryUri, fileMissing: false };
    } catch {
      return { uri, photoKey: key, galleryAssetId, galleryUri, fileMissing: false };
    }
  }

  let asset;
  if (galleryAssetId && await ensureMediaPermission({ request: false })) {
    try { asset = new Asset(galleryAssetId); } catch { asset = undefined; }
  }
  if (!asset && key) asset = await findUniqueAlbumAsset(key.split('/').pop());

  if (asset) {
    try {
      const sourceUri = await asset.getUri();
      try {
        const repairedUri = key ? await copyIntoPrivate(sourceUri, key) : sourceUri;
        return { uri: repairedUri, photoKey: key, galleryAssetId: asset.id, galleryUri: sourceUri, fileMissing: false };
      } catch {
        return { uri: sourceUri, photoKey: key, galleryAssetId: asset.id, galleryUri: sourceUri, fileMissing: false };
      }
    } catch {
      // fall through to galleryUri
    }
  }

  if (galleryUri && await fileExists(galleryUri)) {
    try {
      const repairedUri = key ? await copyIntoPrivate(galleryUri, key) : galleryUri;
      return { uri: repairedUri, photoKey: key, galleryAssetId, galleryUri, fileMissing: false };
    } catch {
      return { uri: galleryUri, photoKey: key, galleryAssetId, galleryUri, fileMissing: false };
    }
  }

  return { uri: expectedUri || uri, photoKey: key, galleryAssetId, galleryUri, fileMissing: hasStorageHint };
}

export async function deletePhotoFile(uri) {
  if (!uri || !String(uri).startsWith('file')) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore — file may already be gone
  }
}
