/**
 * Teklif, servis formu ve stokta secilebilen olcu birimleri.
 *
 * `value` kayitlara ve PDF'lere aynen yazilan degerdir. `hint` yalnizca
 * secicide aciklama olarak gosterilir.
 */
export interface UnitOption {
  value: string;
  hint?: { tr: string; en: string };
}

export interface UnitGroup {
  key: string;
  units: UnitOption[];
}

const h = (tr: string, en: string = tr) => ({ tr, en });

// Genel gecer birimler. Eski 9 birim (Adet, Kutu, Koli, Kg, Gram, metre, cm,
// lt, ml) ayni yazimla korunur. Listede olmayanlari kullanicilar secicideki
// "Yeni birim ekle" ile sirkete ekler (bkz. apiclient/units.ts).
export const UNIT_GROUPS: UnitGroup[] = [
  {
    key: "count",
    units: [
      { value: "Adet", hint: h("tane", "piece") },
      { value: "Paket", hint: h("paket", "pack") },
      { value: "Kutu", hint: h("kutu", "box") },
      { value: "Koli", hint: h("koli", "carton") },
      { value: "Takım", hint: h("takım", "kit") },
      { value: "Set" },
      { value: "Çift", hint: h("2 adet", "pair") },
      { value: "Rulo", hint: h("rulo", "roll") },
    ],
  },
  {
    key: "weight",
    units: [
      { value: "Gram", hint: h("gram (g)", "gram (g)") },
      { value: "Kg", hint: h("kilogram", "kilogram") },
      { value: "Ton", hint: h("1000 kg", "metric ton") },
    ],
  },
  {
    key: "measure",
    units: [
      { value: "mm", hint: h("milimetre", "millimeter") },
      { value: "cm", hint: h("santimetre", "centimeter") },
      { value: "metre", hint: h("metre (m)", "meter (m)") },
      { value: "m²", hint: h("metrekare", "square meter") },
      { value: "m³", hint: h("metreküp", "cubic meter") },
    ],
  },
  {
    key: "volume",
    units: [
      { value: "ml", hint: h("mililitre", "milliliter") },
      { value: "lt", hint: h("litre", "liter") },
    ],
  },
  {
    key: "time",
    units: [
      { value: "Saat", hint: h("saat", "hour") },
      { value: "Gün", hint: h("gün", "day") },
      { value: "Ay", hint: h("ay", "month") },
    ],
  },
];

export const ALL_UNITS: string[] = UNIT_GROUPS.flatMap((g) => g.units.map((u) => u.value));

/** Turkce karakterleri sadelestirerek arama icin normalize eder. */
export function normalizeForSearch(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .trim();
}

export function filterUnitGroups(query: string, lang: "tr" | "en"): UnitGroup[] {
  const q = normalizeForSearch(query);
  if (!q) return UNIT_GROUPS;
  return UNIT_GROUPS.map((g) => ({
    ...g,
    units: g.units.filter((u) =>
      normalizeForSearch(u.value).includes(q) ||
      (u.hint ? normalizeForSearch(u.hint[lang]).includes(q) || normalizeForSearch(u.hint.tr).includes(q) : false)
    ),
  })).filter((g) => g.units.length > 0);
}
