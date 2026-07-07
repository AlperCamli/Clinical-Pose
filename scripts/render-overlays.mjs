// ============ NATURE — overlay preview generator (dev tool) ============
// Renders the per-angle guide shapes from src/data/overlayShapes.js into
// standalone .svg files + an index.html gallery, so guides can be tuned in a
// browser without launching the app. Pure Node (no deps).
//
//   node scripts/render-overlays.mjs        (or: npm run overlays:preview)
//
// The shape→SVG mapping here MUST stay in sync with src/components/GuideOverlay.js
// (same viewBox, attributes, vector-effect, style tiers) so the preview is faithful.
//
// Drop reference photos in overlay-previews/samples/<category>.jpg to composite a
// guide over a real face (category = overlay id minus any -l/-r suffix).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'overlay-previews');
const SAMPLES = path.join(OUT, 'samples');

// ---- load the pure data module by neutralizing `export` and eval-ing it ----
function loadShapes() {
  const src = fs.readFileSync(path.join(ROOT, 'src/data/overlayShapes.js'), 'utf8')
    .replace(/export const/g, 'const')
    .replace(/export function/g, 'function');
  const mod = new Function(`${src}\nreturn { DESIGN, OVERLAY_DEFS };`);
  return mod();
}

const { DESIGN, OVERLAY_DEFS } = loadShapes();
const { W, H } = DESIGN;

const C = (a) => `rgba(130,185,255,${a})`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// one primitive → an SVG element string (mirrors GuideOverlay's <Prim/>)
function prim(s) {
  const stroke = s.soft ? C(0.6) : C(0.95);
  const sw = s.soft ? 2 : 3;
  const dash = s.dash ? ' stroke-dasharray="10 10"' : '';
  const ve = ' vector-effect="non-scaling-stroke"';
  const common = `fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${dash}${ve}`;
  const rot = (cx, cy) => (s.rot ? ` transform="rotate(${s.rot} ${cx} ${cy})"` : '');
  switch (s.kind) {
    case 'ellipse': return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"${rot(s.cx, s.cy)} ${common}/>`;
    case 'rect':    return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.r ?? 0}"${rot(s.x + s.w / 2, s.y + s.h / 2)} ${common}/>`;
    case 'line':    return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" ${common}/>`;
    case 'path':    return `<path d="${esc(s.d)}" ${common}/>`;
    default:        return '';
  }
}

function shapesGroup(def) {
  let body = def.shapes.map(prim).join('\n    ');
  if (def.flipX) body = `<g transform="translate(${W},0) scale(-1,1)">\n    ${body}\n  </g>`;
  // per-overlay calibration (design units, about the design center) — mirrors
  // GuideOverlay's calTransform so the preview shows the tuned fit
  if (def.cal) {
    const { scale = 1, dx = 0, dy = 0 } = def.cal;
    body = `<g transform="translate(${dx},${dy}) translate(${W / 2},${H / 2}) scale(${scale}) translate(${-W / 2},${-H / 2})">\n    ${body}\n  </g>`;
  }
  return body;
}

function thirds() {
  const ln = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.12)" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
  return [
    ln(W / 3, 0, W / 3, H), ln((2 * W) / 3, 0, (2 * W) / 3, H),
    ln(0, H / 3, W, H / 3), ln(0, (2 * H) / 3, W, (2 * H) / 3),
  ].join('\n    ');
}

function sampleFor(id) {
  const cat = id.replace(/-(l|r)$/, '');
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const f = path.join(SAMPLES, `${cat}.${ext}`);
    if (fs.existsSync(f)) return `samples/${cat}.${ext}`;
  }
  return null;
}

function svg(def, { size = 1, grid = true, bg = true } = {}) {
  const sample = sampleFor(def.id);
  const w = Math.round(W * size), h = Math.round(H * size);
  const layers = [];
  if (sample) layers.push(`<image href="${sample}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`);
  else if (bg) layers.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#11151c"/>`);
  if (grid) layers.push(`<g class="grid">\n    ${thirds()}\n  </g>`);
  layers.push(shapesGroup(def));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
  ${layers.join('\n  ')}
</svg>`;
}

// ---- write output ----
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SAMPLES, { recursive: true });

const defs = Object.values(OVERLAY_DEFS);
for (const def of defs) {
  fs.writeFileSync(path.join(OUT, `${def.id}.svg`), svg(def, { size: 0.5 }));
}

const cards = defs.map((def) => {
  const sample = sampleFor(def.id);
  return `<figure class="card">
  ${svg(def, { size: 1 })}
  <figcaption>${esc(def.label)} <span class="id">${def.id}${sample ? ' · sample' : ''}</span></figcaption>
</figure>`;
}).join('\n');

const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Nature — overlay previews</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #0c0f14; color: #e7ecf2; font: 14px/1.4 -apple-system, system-ui, sans-serif; padding: 24px; }
  h1 { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
  p.sub { color: #8b94a3; margin: 0 0 20px; }
  .toolbar { margin: 0 0 18px; display: flex; gap: 16px; align-items: center; }
  .grid-wrap { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
  .card { margin: 0; background: #11151c; border: 1px solid #1e2632; border-radius: 14px; overflow: hidden; }
  .card svg { display: block; width: 100%; height: auto; background: #11151c; }
  figcaption { padding: 10px 12px; font-weight: 600; display: flex; justify-content: space-between; align-items: baseline; }
  .id { color: #7f93ad; font-weight: 500; font-family: ui-monospace, Menlo, monospace; font-size: 11px; }
  body.nogrid .grid { display: none; }
</style></head>
<body>
  <h1>Overlay previews</h1>
  <p class="sub">Generated from <code>src/data/overlayShapes.js</code>. Edit shapes, rerun <code>npm run overlays:preview</code>, refresh. Drop <code>overlay-previews/samples/&lt;category&gt;.jpg</code> to overlay on a real face.</p>
  <div class="toolbar"><label><input type="checkbox" id="g" checked onchange="document.body.classList.toggle('nogrid', !this.checked)"/> rule-of-thirds grid</label></div>
  <div class="grid-wrap">
${cards}
  </div>
</body></html>`;

fs.writeFileSync(path.join(OUT, 'index.html'), html);

console.log(`Wrote ${defs.length} svg + index.html to ${path.relative(ROOT, OUT)}/`);
console.log(`Open: ${path.join(OUT, 'index.html')}`);
