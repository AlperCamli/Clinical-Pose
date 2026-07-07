// ============ NATURE — social post export to gallery ============
// The composed social asset is a snapshot of <PostPreview> — already redacted and
// consent-gated — so it's safe to save to the gallery. We keep it in its OWN album,
// separate from the clinical originals mirrored by photos.js.
import { Platform } from 'react-native';
import { Asset, Album, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';

const POST_ALBUM = 'Nature Posts';

// Share rendered post files via the system sheet. A post can be multi-slide
// (carousel); the share sheet takes one file, so we share the first and rely on
// the caller having saved the full set to the gallery. Returns false if sharing
// is unavailable on the platform.
export async function sharePost(uris) {
  const first = Array.isArray(uris) ? uris[0] : uris;
  if (!first) throw new Error('no-file');
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(first, { mimeType: 'image/jpeg', dialogTitle: 'Share post' });
  return true;
}

// Honest multi-slide sharing: expo-sharing takes ONE file per sheet. On iOS the
// share sheet is presented sequentially per slide (shareAsync resolves when the
// sheet closes); on Android sequential sheets are jarring, so only the first
// slide is shared and the caller's save-to-gallery covers the rest.
// Returns { shared } — how many slides actually went through a sheet.
export async function sharePostSet(uris) {
  const list = (Array.isArray(uris) ? uris : [uris]).filter(Boolean);
  if (!list.length) throw new Error('no-file');
  if (!(await Sharing.isAvailableAsync())) return { shared: 0 };
  if (Platform.OS === 'ios') {
    let shared = 0;
    for (const u of list) {
      // eslint-disable-next-line no-await-in-loop
      await Sharing.shareAsync(u, { mimeType: 'image/jpeg', dialogTitle: `Share slide ${shared + 1} of ${list.length}` });
      shared += 1;
    }
    return { shared };
  }
  await Sharing.shareAsync(list[0], { mimeType: 'image/jpeg', dialogTitle: 'Share post' });
  return { shared: 1 };
}

// Save one rendered asset file (file:// uri) into the "Nature Posts" album.
// Throws 'no-media-permission' if the user declines the gallery permission.
export async function savePostToGallery(fileUri) {
  if (!fileUri) throw new Error('no-file');
  const res = await requestPermissionsAsync();
  if (!res?.granted) throw new Error('no-media-permission');
  // SDK-56 class-based media-library API (same as photos.js)
  const album = await Album.get(POST_ALBUM);
  if (album) await Asset.create(fileUri, album); // create + add in one call
  else await Album.create(POST_ALBUM, [fileUri]); // first time — make the album
}
