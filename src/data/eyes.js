// ============ NATURE — on-device eye detection (ML Kit) ============
// Runs once per kept photo; returns a normalized eye-region box so the redaction
// overlay can be drawn (and toggled) later without ever re-detecting.
import { Image } from 'react-native';

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

// detector = RNMLKitFaceDetector from useFaceDetection()
export async function detectEyes(detector, uri) {
  const empty = { eyeBoxes: [], eyeDetected: false, imgW: 0, imgH: 0 };
  if (!detector || !uri) return empty;
  try {
    const { w: imgW, h: imgH } = await getSize(uri);
    if (!imgW || !imgH) return empty;
    const result = await detector.detectFaces(uri);
    const faces = result?.faces || [];
    if (!faces.length) return { ...empty, imgW, imgH };
    // pick the largest face by frame area
    const face = faces.reduce((a, b) =>
      (b.frame.size.x * b.frame.size.y) > (a.frame.size.x * a.frame.size.y) ? b : a);
    const left = findLandmark(face, 'leftEye');
    const right = findLandmark(face, 'rightEye');
    if (!left || !right) return { ...empty, imgW, imgH };
    return { eyeBoxes: [eyeBar(left, right, imgW, imgH)], eyeDetected: true, imgW, imgH };
  } catch {
    return empty;
  }
}
