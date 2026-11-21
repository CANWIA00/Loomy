/**
 * Teklif, servis formu ve stokta secilebilen olcu birimleri.
 *
 * `value` kayitlara ve PDF'lere aynen yazilan degerdir; mevcut kayitlarla uyum
 * icin eski 9 birim (Adet, Kutu, Koli, Kg, Gram, metre, cm, lt, ml) ayni
 * yazimla korunmustur. `hint` yalnizca secicide aciklama olarak gosterilir.
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

export const UNIT_GROUPS: UnitGroup[] = [
  {
    key: "count",
    units: [
      { value: "Adet", hint: h("tane", "piece") },
      { value: "Parça", hint: h("parça", "part") },
      { value: "Takım", hint: h("takım", "kit") },
      { value: "Set" },
      { value: "Çift", hint: h("2 adet", "pair") },
      { value: "Düzine", hint: h("12 adet", "dozen") },
      { value: "Paket", hint: h("paket", "pack") },
      { value: "Kutu", hint: h("kutu", "box") },
      { value: "Koli", hint: h("koli", "carton") },
      { value: "Kasa", hint: h("kasa", "crate") },
      { value: "Palet", hint: h("palet", "pallet") },
      { value: "Çuval", hint: h("çuval", "sack") },
      { value: "Torba", hint: h("torba", "bag") },
      { value: "Rulo", hint: h("rulo", "roll") },
      { value: "Top", hint: h("top (kumaş, kablo)", "bolt") },
      { value: "Bobin", hint: h("bobin", "reel") },
      { value: "Makara", hint: h("makara", "spool") },
      { value: "Deste", hint: h("deste", "bundle of 10") },
      { value: "Demet", hint: h("demet", "bunch") },
      { value: "Bağ", hint: h("bağ", "bundle") },
      { value: "Tabaka", hint: h("tabaka", "sheet") },
      { value: "Levha", hint: h("levha", "board") },
      { value: "Plaka", hint: h("plaka", "plate") },
      { value: "Şişe", hint: h("şişe", "bottle") },
      { value: "Kavanoz", hint: h("kavanoz", "jar") },
      { value: "Tüp", hint: h("tüp", "tube") },
      { value: "Teneke", hint: h("teneke", "can") },
      { value: "Bidon", hint: h("bidon", "jerrycan") },
      { value: "Varil", hint: h("varil", "barrel") },
      { value: "Kartuş", hint: h("kartuş", "cartridge") },
    ],
  },
  {
    key: "weight",
    units: [
      { value: "mg", hint: h("miligram", "milligram") },
      { value: "Gram", hint: h("gram (g)", "gram (g)") },
      { value: "Kg", hint: h("kilogram", "kilogram") },
      { value: "Ton", hint: h("1000 kg", "metric ton") },
      { value: "oz", hint: h("ons", "ounce") },
      { value: "lb", hint: h("libre", "pound") },
      { value: "ct", hint: h("karat", "carat") },
    ],
  },
  {
    key: "length",
    units: [
      { value: "mm", hint: h("milimetre", "millimeter") },
      { value: "cm", hint: h("santimetre", "centimeter") },
      { value: "metre", hint: h("metre (m)", "meter (m)") },
      { value: "km", hint: h("kilometre", "kilometer") },
      { value: "inç", hint: h("inç (in)", "inch (in)") },
      { value: "ft", hint: h("fit", "foot") },
      { value: "yd", hint: h("yarda", "yard") },
      { value: "mil", hint: h("mil (mile)", "mile") },
    ],
  },
  {
    key: "area",
    units: [
      { value: "cm²", hint: h("santimetrekare", "square centimeter") },
      { value: "m²", hint: h("metrekare", "square meter") },
      { value: "km²", hint: h("kilometrekare", "square kilometer") },
      { value: "Dönüm", hint: h("1000 m²", "1000 m²") },
      { value: "Hektar", hint: h("10.000 m²", "hectare") },
      { value: "ft²", hint: h("fitkare", "square foot") },
      { value: "Akre", hint: h("akre", "acre") },
    ],
  },
  {
    key: "volume",
    units: [
      { value: "ml", hint: h("mililitre", "milliliter") },
      { value: "cl", hint: h("santilitre", "centiliter") },
      { value: "lt", hint: h("litre", "liter") },
      { value: "cm³", hint: h("santimetreküp", "cubic centimeter") },
      { value: "m³", hint: h("metreküp", "cubic meter") },
      { value: "gal", hint: h("galon", "gallon") },
      { value: "fl oz", hint: h("sıvı ons", "fluid ounce") },
      { value: "ft³", hint: h("fitküp", "cubic foot") },
    ],
  },
  {
    key: "energy",
    units: [
      { value: "W", hint: h("watt", "watt") },
      { value: "kW", hint: h("kilowatt", "kilowatt") },
      { value: "kWh", hint: h("kilowatt saat", "kilowatt hour") },
      { value: "MWh", hint: h("megawatt saat", "megawatt hour") },
      { value: "kVA", hint: h("kilovolt amper", "kilovolt-ampere") },
      { value: "BTU", hint: h("ısı birimi", "British thermal unit") },
    ],
  },
  {
    key: "time",
    units: [
      { value: "Dakika", hint: h("dakika", "minute") },
      { value: "Saat", hint: h("saat", "hour") },
      { value: "Gün", hint: h("gün", "day") },
      { value: "Hafta", hint: h("hafta", "week") },
      { value: "Ay", hint: h("ay", "month") },
      { value: "Yıl", hint: h("yıl", "year") },
      { value: "Kişi", hint: h("kişi", "person") },
      { value: "Sefer", hint: h("sefer / ziyaret", "trip / visit") },
      { value: "Hizmet", hint: h("hizmet", "service") },
      { value: "Proje", hint: h("proje", "project") },
      { value: "Lisans", hint: h("lisans", "license") },
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
