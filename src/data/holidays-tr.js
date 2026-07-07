// ============ NATURE — Turkish public holidays (2026–2030) ============
// Static, offline dataset for the launch market. Fixed national holidays are
// generated per year; religious holidays (Ramazan/Kurban Bayramı) follow the
// lunar calendar and are listed explicitly from the published Diyanet calendar.
// Arefe (eve) days are half-day holidays → `half: true`.
// NOTE: 2029–2030 religious dates are the currently published projections —
// reconfirm against the official Diyanet calendar closer to those years.

const YEARS = [2026, 2027, 2028, 2029, 2030];

const FIXED = [
  ['01-01', 'Yılbaşı'],
  ['04-23', 'Ulusal Egemenlik ve Çocuk Bayramı'],
  ['05-01', 'Emek ve Dayanışma Günü'],
  ['05-19', 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı'],
  ['07-15', 'Demokrasi ve Millî Birlik Günü'],
  ['08-30', 'Zafer Bayramı'],
  ['10-28', 'Cumhuriyet Bayramı Arifesi', true],
  ['10-29', 'Cumhuriyet Bayramı'],
];

// [arefe (half day), first day, length in full days]
const RAMAZAN = {
  2026: ['03-19', '03-20', 3],
  2027: ['03-08', '03-09', 3],
  2028: ['02-25', '02-26', 3],
  2029: ['02-13', '02-14', 3],
  2030: ['02-02', '02-03', 3],
};
const KURBAN = {
  2026: ['05-26', '05-27', 4],
  2027: ['05-15', '05-16', 4],
  2028: ['05-04', '05-05', 4],
  2029: ['04-23', '04-24', 4],
  2030: ['04-12', '04-13', 4],
};

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  const p = (x) => String(x).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

function build() {
  const map = {};
  for (const y of YEARS) {
    for (const [md, name, half] of FIXED) {
      const key = `${y}-${md}`;
      map[key] = half ? { name, half: true } : { name };
    }
    for (const [label, table, ordinal] of [
      ['Ramazan Bayramı', RAMAZAN, ['1. Gün', '2. Gün', '3. Gün', '4. Gün']],
      ['Kurban Bayramı', KURBAN, ['1. Gün', '2. Gün', '3. Gün', '4. Gün']],
    ]) {
      const row = table[y];
      if (!row) continue;
      const [arefe, first, len] = row;
      map[`${y}-${arefe}`] = { name: `${label} Arifesi`, half: true };
      for (let i = 0; i < len; i++) {
        map[addDays(`${y}-${first}`, i)] = { name: `${label} ${ordinal[i]}` };
      }
    }
  }
  return map;
}

export const TR_HOLIDAYS = build();

// → { name, half? } | null
export const holidayOf = (dateISO) => TR_HOLIDAYS[dateISO] || null;
