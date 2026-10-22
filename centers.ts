import type { Lang } from "./i18n";
import { erlangC } from "./queue-model.ts";

export type LoadLevel = "low" | "mid" | "high";

export interface MedicalCenter {
  id: string;
  name: Record<Lang, string>;
  type: Record<Lang, string>;
  address: Record<Lang, string>;
  hours: string;
  /** Approximate coordinates by microdistrict (Aktau). */
  lat: number;
  lng: number;
  /** DEMO DATA — queue state is simulated, not official statistics. */
  demo: {
    inQueue: number;
    lambda: number; // arrivals / hour
    mu: number; // patients / hour / room
    rooms: number;
    slots: number[]; // lambda per forecast slot
  };
}

/**
 * Real medical organisations of Aktau (open data: official sites, 2GIS, Yandex Maps).
 * Queue figures are demonstration-only.
 */
export const centers: MedicalCenter[] = [
  {
    id: "onco-center",
    name: {
      ru: "Областной онкологический центр",
      kk: "Облыстық онкологиялық орталық",
    },
    type: { ru: "Онкологическая помощь", kk: "Онкологиялық көмек" },
    address: { ru: "Актау, 1А микрорайон, здание 3", kk: "Ақтау, 1А шағын аудан, 3 ғимарат" },
    hours: "08:15–17:00",
    lat: 43.634512,
    lng: 51.185358,
    demo: { inQueue: 27, lambda: 30, mu: 12, rooms: 3, slots: [18, 30, 34, 26, 20, 10] },
  },

  {
    id: "children-hospital",
    name: {
      ru: "Мангистауская областная многопрофильная детская больница",
      kk: "Маңғыстау облыстық көпсалалы балалар ауруханасы",
    },
    type: { ru: "Детский стационар", kk: "Балалар стационары" },
    address: { ru: "Актау, 26 микрорайон, зд. 50/51", kk: "Ақтау, 26 шағын аудан, 50/51 ғимарат" },
    hours: "Круглосуточно",
    lat: 43.65728,
    lng: 51.16556,
    demo: { inQueue: 4, lambda: 12, mu: 10, rooms: 3, slots: [8, 12, 14, 12, 9, 5] },
  },
  {
    id: "polyclinic-2",
    name: { ru: "Актауская городская поликлиника №2", kk: "Ақтау қалалық №2 емханасы" },
    type: { ru: "Поликлиника (ПМСП)", kk: "Емхана (МСАК)" },
    address: { ru: "Актау, 26 микрорайон, здание 54", kk: "Ақтау, 26 шағын аудан, 54 ғимарат" },
    hours: "08:00–20:00",
    lat: 43.657091,
    lng: 51.1627,
    demo: { inQueue: 9, lambda: 26, mu: 12, rooms: 3, slots: [20, 26, 28, 22, 18, 10] },
  },
  {
    id: "polyclinic-1",
    name: { ru: "Городская поликлиника №1", kk: "Қалалық №1 емхана" },
    type: { ru: "Поликлиника (ПМСП)", kk: "Емхана (МСАК)" },
    address: { ru: "Актау, 7 микрорайон, д. 35А", kk: "Ақтау, 7 шағын аудан, 35А үй" },
    hours: "08:00–20:00",
    lat: 43.644008,
    lng: 51.159567,
    demo: { inQueue: 15, lambda: 28, mu: 12, rooms: 3, slots: [22, 28, 30, 24, 18, 12] },
  },
];

export const AKTAU_CENTER: [number, number] = [43.652, 51.158];

/** Average wait in minutes for a newly arriving patient (DEMO). */
export function centerWaitMin(c: MedicalCenter) {
  const perPersonMin = 60 / c.demo.mu / c.demo.rooms;
  return Math.round(c.demo.inQueue * perPersonMin + 1);
}

export function centerLoad(c: MedicalCenter): LoadLevel {
  const w = centerWaitMin(c);
  if (w >= 35) return "high";
  if (w >= 15) return "mid";
  return "low";
}

export function centerModel(c: MedicalCenter) {
  return erlangC(c.demo.lambda, c.demo.mu, c.demo.rooms);
}

/** Same-category alternative only; specialist centres are not interchangeable. */
export function findAlternative(c: MedicalCenter) {
  return centers
    .filter((x) => x.id !== c.id && x.type.ru === c.type.ru)
    .sort((a, b) => centerWaitMin(a) - centerWaitMin(b))[0];
}

/** Parse QR payload → center id. Supports "smartq://center/<id>", URLs with /center/<id>, or bare id. */
export function parseQrPayload(text: string): string | null {
  const t = text.trim();
  const smartQ = t.match(/smartq:\/\/center\/([a-z0-9-]+)/i);
  const url = t.match(/\/center\/([a-z0-9-]+)/i);

  const id = smartQ?.[1] ?? url?.[1] ?? t;

  return centers.some((c) => c.id === id) ? id : null;
}
export function getCenter(id: string) {
  return centers.find((c) => c.id === id) ?? null;
}
