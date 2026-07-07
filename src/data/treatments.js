// ============ NATURE — treatment protocols (angle = the standardized shot) ============

export const TREATMENTS = {
  lip: {
    id: 'lip', name: 'Lip Filler', short: 'Lip', glyph: 'lips',
    blurb: 'Front + 45° + profile lip series',
    angles: [
      { id: 'fr',  name: 'Front — Relaxed', code: 'FRONT/REL', req: true },
      { id: 'fs',  name: 'Front — Smiling', code: 'FRONT/SMI', req: true },
      { id: 'l45', name: 'Left 45°',        code: 'L-45',      req: true },
      { id: 'r45', name: 'Right 45°',       code: 'R-45',      req: true },
      { id: 'sp',  name: 'Side Profile',    code: 'PROFILE',   req: false },
    ],
  },
  botox: {
    id: 'botox', name: 'Botox', short: 'Botox', glyph: 'forehead', blurb: 'Expression series',
    angles: [
      { id: 'fn',  name: 'Front — Neutral', code: 'FRONT/NEU', req: true },
      { id: 'fb',  name: 'Brows Raised',    code: 'BROWS',     req: true },
      { id: 'ff',  name: 'Frowning',        code: 'FROWN',     req: true },
      { id: 'fs',  name: 'Front — Smiling', code: 'FRONT/SMI', req: true },
      { id: 'l45', name: 'Left 45°',        code: 'L-45',      req: false },
      { id: 'r45', name: 'Right 45°',       code: 'R-45',      req: false },
    ],
  },
  nose: {
    id: 'nose', name: 'Rhinoplasty', short: 'Nose', glyph: 'nose', blurb: 'Full nasal series',
    angles: [
      { id: 'fr',  name: 'Front',         code: 'FRONT',  req: true },
      { id: 'lp',  name: 'Left Profile',  code: 'L-PROF', req: true },
      { id: 'rp',  name: 'Right Profile', code: 'R-PROF', req: true },
      { id: 'l45', name: 'Left 45°',      code: 'L-45',   req: true },
      { id: 'r45', name: 'Right 45°',     code: 'R-45',   req: true },
      { id: 'bv',  name: 'Base View',     code: 'BASE',   req: false },
    ],
  },
  jaw: {
    id: 'jaw', name: 'Jawline / Chin', short: 'Jaw', glyph: 'jaw', blurb: 'Contour series',
    angles: [
      { id: 'fn',  name: 'Front — Neutral', code: 'FRONT/NEU', req: true },
      { id: 'l45', name: 'Left 45°',        code: 'L-45',      req: true },
      { id: 'r45', name: 'Right 45°',       code: 'R-45',      req: true },
      { id: 'lp',  name: 'Left Profile',    code: 'L-PROF',    req: false },
    ],
  },
  eye: {
    id: 'eye', name: 'Under-eye', short: 'Under-eye', glyph: 'eye', blurb: 'Periorbital series',
    angles: [
      { id: 'fn',  name: 'Front — Neutral', code: 'FRONT/NEU', req: true },
      { id: 'l45', name: 'Left 45°',        code: 'L-45',      req: true },
      { id: 'r45', name: 'Right 45°',       code: 'R-45',      req: true },
    ],
  },
  skin: {
    id: 'skin', name: 'Skin', short: 'Skin', glyph: 'skin', blurb: 'Texture & tone series',
    angles: [
      { id: 'fr',  name: 'Front',       code: 'FRONT',   req: true },
      { id: 'l45', name: 'Left 45°',    code: 'L-45',    req: true },
      { id: 'r45', name: 'Right 45°',   code: 'R-45',    req: true },
      { id: 'lc',  name: 'Left Cheek',  code: 'L-CHEEK', req: false },
    ],
  },
  hair: {
    id: 'hair', name: 'Hair Transplant', short: 'Hair', glyph: 'hair', blurb: 'Density mapping series',
    angles: [
      { id: 'hl', name: 'Front Hairline', code: 'HAIRLINE', req: true },
      { id: 'tv', name: 'Top View',       code: 'TOP',      req: true },
      { id: 'cr', name: 'Crown',          code: 'CROWN',    req: true },
      { id: 'dn', name: 'Donor Area',     code: 'DONOR',    req: false },
    ],
  },
  custom: {
    id: 'custom', name: 'Custom Protocol', short: 'Custom', glyph: 'plus', blurb: 'Define your own angles',
    angles: [
      { id: 'fr',  name: 'Front',    code: 'FRONT', req: true },
      { id: 'l45', name: 'Left 45°', code: 'L-45',  req: true },
    ],
  },
};

export const TREATMENT_LIST = ['lip', 'botox', 'nose', 'jaw', 'eye', 'skin', 'hair', 'custom'];

// ---- client-facing message templates (Turkish defaults — launch market) ----
// Tokens: {client} {clinic} {doctor} {treatment} {date} {time}. Rendering +
// per-clinic overrides live in src/data/messages.js; clinics edit these in
// Settings → Message templates. {treatment} resolves to `nameTr` below.
const MSG_DEFAULTS = {
  reminder: 'Merhaba {client}, {clinic} olarak hatırlatmak isteriz: {date} günü saat {time}\'te {doctor} ile {treatment} randevunuz bulunmaktadır. Görüşmek üzere!',
  preCare: 'Merhaba {client}, {treatment} randevunuz öncesinde bol su içmenizi ve işlem bölgesine makyaj yapmadan gelmenizi rica ederiz. Sorularınız için bize yazabilirsiniz. — {clinic}',
  afterCare: 'Merhaba {client}, {treatment} işleminiz sonrasında ilk 24 saat işlem bölgesine dokunmaktan ve yoğun egzersizden kaçınınız. Olağan dışı bir durumda bize ulaşın. Geçmiş olsun! — {clinic}',
  resultText: 'Merhaba {client}, {treatment} sürecinizin öncesi/sonrası karşılaştırmasını bilginize sunarız. Sağlıklı günler dileriz. — {clinic}',
  caption: '{treatment} — doğal sonuçlar ✨ {clinic}',
};

const MSG_OVERRIDES = {
  lip: {
    preCare: 'Merhaba {client}, {treatment} randevunuzdan 24 saat önce alkol ve kan sulandırıcı (aspirin vb.) kullanmamanızı rica ederiz. Uçuk geçmişiniz varsa lütfen önceden bildirin. — {clinic}',
    afterCare: 'Merhaba {client}, {treatment} sonrası ilk 24 saat dudaklarınıza masaj yapmayın, sıcak içecek ve güneşten kaçının; hafif şişlik normaldir, soğuk kompres uygulayabilirsiniz. Geçmiş olsun! — {clinic}',
  },
  botox: {
    preCare: 'Merhaba {client}, {treatment} randevunuzdan 24 saat önce alkol almamanızı ve kan sulandırıcı kullanmamanızı rica ederiz. — {clinic}',
    afterCare: 'Merhaba {client}, {treatment} sonrası 4 saat boyunca yatmayınız, işlem bölgesine masaj yapmayınız ve aynı gün ağır egzersizden kaçınınız. Geçmiş olsun! — {clinic}',
  },
  nose: {
    afterCare: 'Merhaba {client}, {treatment} sonrası doktorunuzun önerdiği bakım planına uyunuz; ilk hafta gözlük kullanmaktan ve burnunuza baskıdan kaçının. Geçmiş olsun! — {clinic}',
  },
  hair: {
    preCare: 'Merhaba {client}, {treatment} randevunuzdan 3 gün önce alkol kullanmamanızı, işlem günü rahat ve önden düğmeli bir kıyafetle gelmenizi rica ederiz. — {clinic}',
    afterCare: 'Merhaba {client}, {treatment} sonrası ilk 3 gün ekim bölgesine dokunmayın, ilk yıkamayı kliniğimizde yaptırın ve güneşten koruyun. Geçmiş olsun! — {clinic}',
  },
};

const NAMES_TR = {
  lip: 'Dudak Dolgusu', botox: 'Botoks', nose: 'Burun Estetiği', jaw: 'Çene Hattı Dolgusu',
  eye: 'Göz Altı Dolgusu', skin: 'Cilt Yenileme', hair: 'Saç Ekimi', custom: 'Kişisel Protokol',
};

const DESCRIPTIONS_TR = {
  lip: 'Hyalüronik asit bazlı dudak dolgusu; doğal hacim ve kontur sağlar. Etkisi ortalama 6–12 ay sürer.',
  botox: 'Mimik kaslarına uygulanan botulinum toksini; kırışıklıkların görünümünü azaltır. Etkisi 3–6 ay sürer.',
  nose: 'Burun şeklinin cerrahi veya dolgu ile yeniden şekillendirilmesi; nihai sonuç 6–12 ayda oturur.',
  jaw: 'Çene hattı ve çene ucuna uygulanan dolgu ile daha belirgin bir alt yüz konturu hedeflenir.',
  eye: 'Göz altı ışık dolgusu; morluk ve çöküntü görünümünü azaltır, dinlenmiş bir bakış sağlar.',
  skin: 'Cilt kalitesini artırmaya yönelik mezoterapi/cilt gençleştirme protokolü; seanslar halinde uygulanır.',
  hair: 'FUE/DHI teknikleriyle saç ekimi; nihai yoğunluk 12. ayda değerlendirilir.',
  custom: 'Kliniğinize özel tanımlanmış tedavi protokolü.',
};

for (const id of TREATMENT_LIST) {
  TREATMENTS[id].nameTr = NAMES_TR[id] || TREATMENTS[id].name;
  TREATMENTS[id].description = DESCRIPTIONS_TR[id] || '';
  TREATMENTS[id].msg = { ...MSG_DEFAULTS, ...(MSG_OVERRIDES[id] || {}) };
}

// Fields a clinic can override per treatment (Settings → Message templates).
export const MSG_FIELDS = [
  ['reminder', 'Appointment reminder'],
  ['preCare', 'Before the visit'],
  ['afterCare', 'After-care'],
  ['resultText', 'With result photos'],
  ['caption', 'Social caption'],
];

// ---- session type presets ----
export const BEFORE_LABELS = ['Initial Before', 'Pre-treatment', 'First Visit', 'Baseline'];
export const AFTER_LABELS = [
  'After 1 week', 'After 2 weeks', 'After 1 month',
  'Session 2 Before', 'Session 2 After', 'Final Result',
];
