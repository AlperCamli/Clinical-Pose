// ============ NATURE — redaction style registry ============
// Each entry describes how an eye-cover block renders. Add a new variation by
// adding ONE entry here — it shows up in Settings automatically and renders via
// RedactionMark in Photo.js. `kind` picks the renderer:
//   'blur'  → a single smooth expo-blur, generously rounded (radiusFactor)
//   'pixel' → SVG mosaic pattern
//   'solid' → opaque bar
// `radiusFactor` is the corner radius as a fraction of the block's short side
// (0.5 = fully rounded / pill ends → softest-looking edge).
// Unknown ids fall back to soft blur, so older saved photos keep working.

export const REDACTION_STYLES = {
  blur:   { id: 'blur',   label: 'Soft',   kind: 'blur',  iosIntensity: 75,  androidIntensity: 95,  radiusFactor: 0.5,  tint: 'light' },
  strong: { id: 'strong', label: 'Strong', kind: 'blur',  iosIntensity: 100, androidIntensity: 100, radiusFactor: 0.42, tint: 'light' },
  pixel:  { id: 'pixel',  label: 'Pixel',  kind: 'pixel', cell: 10, radiusFactor: 0.2 },
  bar:    { id: 'bar',    label: 'Bar',    kind: 'solid', radiusFactor: 0.2 },
};

// Order shown in the Settings segmented control.
export const REDACTION_ORDER = ['blur', 'strong', 'pixel', 'bar'];

export const getStyle = (id) => REDACTION_STYLES[id] || REDACTION_STYLES.blur;

// Convenience for the Settings <Segmented> options.
export const REDACTION_OPTIONS = REDACTION_ORDER.map((id) => ({ v: id, l: REDACTION_STYLES[id].label }));
