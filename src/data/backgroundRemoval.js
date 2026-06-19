// ============ NATURE — optional on-device background removal ============
// react-native-background-remover is a THIRD-PARTY native module (Apple Vision on
// iOS 15+, Google ML Kit on Android). Like faceDetection.js / postCapture.js it
// exists only in a custom dev/standalone build, NOT in Expo Go — importing it
// without the native module linked throws at load. So we require it defensively
// and fall back to no-ops: the toggle simply has no visible effect until you run a
// dev build. Processing is fully on-device, so clinical photos never leave the
// phone. NOTE: the iOS Simulator returns the original image (real device required).
import React from 'react';
import { NativeModules, TurboModuleRegistry } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

let mod = null;
try {
  // On the New Architecture this require eagerly hits TurboModuleRegistry.getEnforcing,
  // which THROWS when the native module is absent (Expo Go) — caught here.
  // eslint-disable-next-line global-require
  mod = require('react-native-background-remover');
} catch (e) {
  mod = null;
}

const removeBackground = mod?.removeBackground || mod?.default?.removeBackground;

// The library wraps a MISSING native module in a Proxy that only throws when called,
// so `removeBackground` existing isn't proof the native side is linked. Probe the
// native module directly (works on both architectures; TurboModuleRegistry.get
// returns null instead of throwing) so the UI can hide/disable the toggle in Expo Go.
function nativePresent() {
  try {
    if (NativeModules.BackgroundRemover) return true;
    return !!(TurboModuleRegistry.get && TurboModuleRegistry.get('BackgroundRemover'));
  } catch (e) {
    return false;
  }
}

export const BG_REMOVAL_AVAILABLE = typeof removeBackground === 'function' && nativePresent();

// The native library names its OUTPUT file after the SOURCE file's basename
// (iOS: tmp/<basename>.png, Android: filesDir/<basename>). Clinical photos are
// stored as .../{sessionId}/{angleId}.jpg, so a before/after pair for the same
// angle share a basename (e.g. front.jpg) and would overwrite each other's
// cut-out — collapsing the comparison into one image. We sidestep this by copying
// each source to a UNIQUELY-named temp input first, so every cut-out lands on its
// own path. A stable hash of the full uri (incl. sessionId) makes the name unique
// per photo yet reusable across re-runs, and lets concurrent calls run safely.
const SRC_DIR = (FileSystem.cacheDirectory || '') + 'bg-src/';

// djb2 — small deterministic, filesystem-safe id for a uri.
function hashUri(uri) {
  let h = 5381;
  for (let i = 0; i < uri.length; i++) h = ((h << 5) + h + uri.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

async function removeOne(srcUri) {
  try {
    const ext = (srcUri.split('?')[0].split('.').pop() || 'jpg').slice(0, 5);
    const tmp = `${SRC_DIR}${hashUri(srcUri)}.${ext}`;
    await FileSystem.makeDirectoryAsync(SRC_DIR, { intermediates: true });
    await FileSystem.deleteAsync(tmp, { idempotent: true });
    await FileSystem.copyAsync({ from: srcUri, to: tmp });
    return await removeBackground(tmp);
  } catch (e) {
    // If the unique-copy path fails for any reason, fall back to the source uri
    // directly (degrades to the prior behavior rather than producing nothing).
    try {
      return await removeBackground(srcUri);
    } catch (e2) {
      console.warn('[nature] background removal failed', e2?.message);
      return null;
    }
  }
}

// Cache the in-flight PROMISE (not just the result) keyed by source uri, so the
// live preview and the export snapshot share one computation and never recompute
// the same cut-out. Resolves to a cut-out image uri, or null on any failure
// (Expo Go, simulator, unsupported) so callers transparently fall back to the
// original image. The clinical original file on disk is never modified.
const cache = new Map();

export function removeBg(srcUri) {
  if (!srcUri || !BG_REMOVAL_AVAILABLE) return Promise.resolve(null);
  if (!cache.has(srcUri)) cache.set(srcUri, removeOne(srcUri));
  return cache.get(srcUri);
}

// Resolve the cut-out for `uri` when `enabled`. Returns { uri, loading } — `uri`
// is the cut-out (or null while loading / when unavailable). Components render the
// original over a black backdrop until the cut-out is ready.
export function useBgRemoved(uri, enabled) {
  const [state, setState] = React.useState({ uri: null, loading: false });
  React.useEffect(() => {
    let alive = true;
    if (!enabled || !uri || !BG_REMOVAL_AVAILABLE) {
      setState({ uri: null, loading: false });
      return undefined;
    }
    setState((s) => ({ uri: s.uri, loading: true }));
    removeBg(uri).then((out) => { if (alive) setState({ uri: out, loading: false }); });
    return () => { alive = false; };
  }, [uri, enabled]);
  return state;
}
