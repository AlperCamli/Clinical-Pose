// ============ NATURE — optional ML Kit face detection ============
// @infinitered/react-native-mlkit-face-detection is a THIRD-PARTY native module:
// it exists only in a custom dev/standalone build, NOT in Expo Go. Importing it
// when the native module isn't linked throws "Cannot find native module
// 'RNMLKitFaceDetection'" and crashes the app at launch. So we require it
// defensively and fall back to no-ops — the app runs everywhere; auto eye
// detection simply turns off until you run a dev build.

let mod = null;
try {
  // eslint-disable-next-line global-require
  mod = require('@infinitered/react-native-mlkit-face-detection');
} catch (e) {
  mod = null;
}

export const FACE_DETECTION_AVAILABLE = !!(mod && mod.FaceDetectionProvider);

// Passthrough provider when the native module is absent.
export const FaceDetectionProvider = FACE_DETECTION_AVAILABLE
  ? mod.FaceDetectionProvider
  : ({ children }) => children;

// Returns null detector when absent — detectEyes() then yields no boxes.
export const useFaceDetection = FACE_DETECTION_AVAILABLE
  ? mod.useFaceDetection
  : () => null;
