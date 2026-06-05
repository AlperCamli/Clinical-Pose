// ============ NATURE — on-device eye detection (ML Kit) ============
// Runs once per kept photo; returns a normalized eye-region box so the redaction
// overlay can be drawn (and toggled) later without ever re-detecting.
import { Image } from 'react-native';
import { FACE_DETECTION_AVAILABLE } from './faceDetection';

// Flip to false to silence the per-capture detection logs in Metro.
const DEBUG = true;
const log = (...a) => DEBUG && console.log('[eyes]', ...a);

function getSize(uri) {
  return new Promise((resolve) => {
    Image.getSize(uri, (w, h) => resolve({ w, h }), () => resolve({ w: 0, h: 0 }));
  });
}

function findLandmark(face, type) {
  return face.landmarks?.find((l) => l.type === type && l.position)?.position || null;
}

// A horizontal bar covering both eyes (+ padding), normalized to the image (0..1).
function eyeBar(left, right, imgW, imgH) {
  const d = Math.hypot(right.x - left.x, right.y - left.y) || imgW * 0.1;
  const midX = (left.x + right.x) / 2;
  const midY = (left.y + right.y) / 2;
  const barW = d * 2.0; // both eyes + outer padding
  const barH = d * 0.85;
  let x = Math.max(0, midX - barW / 2);
  let y = Math.max(0, midY - barH / 2);
  const w = Math.min(barW, imgW - x);
  const h = Math.min(barH, imgH - y);
  return { x: x / imgW, y: y / imgH, w: w / imgW, h: h / imgH };
}

// Fallback when eye landmarks are missing but a (near-frontal) face frame exists:
// hide the eye band of the bounding box (~30–52% down, generous horizontal span).
function eyeBandFromFrame(frame, imgW, imgH) {
  const fx = frame.origin.x, fy = frame.origin.y;
  const fw = frame.size.x, fh = frame.size.y;
  const x = Math.max(0, fx + fw * 0.08);
  const y = Math.max(0, fy + fh * 0.30);
  const w = Math.min(fw * 0.84, imgW - x);
  const h = Math.min(fh * 0.22, imgH - y);
  return { x: x / imgW, y: y / imgH, w: w / imgW, h: h / imgH };
}

// detector = RNMLKitFaceDetector from useFaceDetection()
// Returns { eyeBoxes, eyeDetected, imgW, imgH, status } — `status` explains *why*
// there's no box so the capture UI can tell the user what happened.
export async function detectEyes(detector, uri) {
  const empty = { eyeBoxes: [], eyeDetected: false, imgW: 0, imgH: 0, status: 'none' };

  if (!FACE_DETECTION_AVAILABLE || !detector) {
    log('native module unavailable — running without auto eye-detection (Expo Go?)');
    return { ...empty, status: 'unavailable' };
  }
  if (!uri) return { ...empty, status: 'no-image' };

  try {
    // The native detector is nil until initialize() resolves; make sure the model
    // is ready before the first capture so detectFaces() doesn't reject.
    const st = detector.status;
    if (st && st !== 'ready' && st !== 'done' && typeof detector.initialize === 'function') {
      log('detector status', st, '— awaiting initialize()');
      await detector.initialize();
    }

    const { w: imgW, h: imgH } = await getSize(uri);
    if (!imgW || !imgH) return { ...empty, status: 'no-size' };

    const result = await detector.detectFaces(uri);
    const faces = result?.faces || [];
    log('detected', faces.length, 'face(s) in', `${imgW}x${imgH}`);
    if (!faces.length) return { ...empty, imgW, imgH, status: 'no-face' };

    // pick the largest face by frame area
    const face = faces.reduce((a, b) =>
      (b.frame.size.x * b.frame.size.y) > (a.frame.size.x * a.frame.size.y) ? b : a);

    const left = findLandmark(face, 'leftEye');
    const right = findLandmark(face, 'rightEye');
    const yaw = Math.abs(face.headEulerAngleY ?? 0);

    let box;
    let how;
    if (left && right) { box = eyeBar(left, right, imgW, imgH); how = 'landmarks'; }
    else if (yaw < 35 && face.frame) { box = eyeBandFromFrame(face.frame, imgW, imgH); how = 'frame-fallback'; }

    if (!box) {
      log('face found but no usable eye region (yaw', yaw.toFixed(0) + '°)');
      return { ...empty, imgW, imgH, status: 'no-eyes' };
    }

    log('eye box', JSON.stringify(box), `(${how})`);
    return { eyeBoxes: [box], eyeDetected: true, imgW, imgH, status: 'ok' };
  } catch (e) {
    log('error', e?.message || String(e));
    return { ...empty, status: 'error' };
  }
}
