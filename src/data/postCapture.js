// ============ NATURE — render a post slide to an image file ============
// react-native-view-shot is a NATIVE module: present in a dev/standalone build,
// NOT in Expo Go. We require it defensively (like faceDetection.js) so the app
// runs everywhere; in Expo Go captureAsset() rejects and the screen falls back to
// a toast ("rendering needs a dev build"). expo-sharing, by contrast, ships in
// Expo Go and is imported normally by the screen.
let viewShot = null;
try {
  // eslint-disable-next-line global-require
  viewShot = require('react-native-view-shot');
} catch (e) {
  viewShot = null;
}
const captureRef = viewShot?.captureRef;

// Target export resolution per aspect ratio (1080-class, social-friendly).
export const POST_PX = { '1:1': [1080, 1080], '4:5': [1080, 1350], '9:16': [1080, 1920] };

// Snapshot a mounted (off-screen) view ref to a temp jpg; resolves to a file:// uri.
// `format` is the cfg aspect ratio; output is pinned to POST_PX so it's deterministic
// across devices. Throws if the native module isn't linked (Expo Go) or capture fails.
export async function captureAsset(ref, format) {
  if (typeof captureRef !== 'function') throw new Error('capture-unavailable');
  if (!ref) throw new Error('no-ref');
  const [width, height] = POST_PX[format] || POST_PX['1:1'];
  const out = await captureRef(ref, { format: 'jpg', quality: 0.95, width, height, result: 'tmpfile' });
  // normalize to a file:// uri — MediaLibrary / Sharing want a scheme, but tmpfile
  // can come back as a bare path on iOS.
  return out.startsWith('file://') || out.startsWith('content://') ? out : `file://${out}`;
}
