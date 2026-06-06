// ============ NATURE — eye-box ↔ screen geometry ============
// Eye boxes are stored normalized to the image (x/y/w/h ∈ 0..1, rot in degrees).
// These helpers map them onto a W×H container that displays the image with the
// `cover` crop, and back again — shared by Photo (render) and EyeBoxEditor (edit).

// Cover-crop transform: how an imgW×imgH image is laid out inside a W×H box.
export function coverTransform(W, H, imgW, imgH) {
  if (imgW && imgH) {
    const scale = Math.max(W / imgW, H / imgH);
    const dispW = imgW * scale, dispH = imgH * scale;
    return { dispW, dispH, offX: (W - dispW) / 2, offY: (H - dispH) / 2 };
  }
  // no image dims known → treat the box as normalized to the container itself
  return { dispW: W, dispH: H, offX: 0, offY: 0 };
}

// Normalized boxes → on-screen rects (left/top/width/height + rot passthrough).
export function coverRects(boxes, W, H, imgW, imgH) {
  if (!W || !H || !boxes?.length) return [];
  const { dispW, dispH, offX, offY } = coverTransform(W, H, imgW, imgH);
  return boxes.map((b) => ({
    left: offX + b.x * dispW,
    top: offY + b.y * dispH,
    width: b.w * dispW,
    height: b.h * dispH,
    rot: b.rot ?? 0,
  }));
}

// Inverse of coverRects for a single rect → a normalized box.
export function screenRectToBox(rect, W, H, imgW, imgH) {
  const { dispW, dispH, offX, offY } = coverTransform(W, H, imgW, imgH);
  if (!dispW || !dispH) return { x: 0, y: 0, w: 0, h: 0, rot: rect.rot ?? 0 };
  return {
    x: (rect.left - offX) / dispW,
    y: (rect.top - offY) / dispH,
    w: rect.width / dispW,
    h: rect.height / dispH,
    rot: rect.rot ?? 0,
  };
}
