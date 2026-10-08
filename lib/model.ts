// Data model for v0.1 (local-only). Field names follow docs/app-plan.md §6 so the
// v0.2 Supabase schema can mirror them. Treatments used during an attack are
// embedded on the attack for now instead of a separate attack_event table.

export type StartSource = "live" | "adjusted" | "reconstructed";
export type EndSource = "live" | "adjusted" | "asleep" | "unknown" | "reconstructed";
export type EndConfidence = "exact" | "approx" | "unknown";
export type Side = "left" | "right" | "both";
export type Relief = "full" | "partial" | "none";

export interface TreatmentUse {
  id: string;
  code: string; // catalogue code, see TREATMENTS
  at: string; // ISO time it was taken
  flow_lpm?: number | null; // oxygen only
  mask?: string | null; // oxygen only
  relief?: Relief | null;
  relief_after_min?: number | null;
}

export interface Attack {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tz: string; // IANA zone at capture
  started_at: string;
  start_source: StartSource;
  // An attack is "running" while end_source is null.
  ended_at: string | null;
  end_source: EndSource | null;
  end_confidence: EndConfidence | null;
  is_shadow: boolean;
  intensity_max: number | null; // 0–10 NRS
  side: Side | null;
  woke_from_sleep: boolean | null;
  treatments: TreatmentUse[];
  symptoms: string[];
  triggers: string[];
  notes_text: string;
  recorded_fields_at: Record<string, string>; // field -> when it was recorded
}

export interface Settings {
  id: "settings";
  theme: "auto" | "light" | "dark" | "night";
  hidden_treatments: string[];
  bout_gap_days: number;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  theme: "auto",
  hidden_treatments: [],
  bout_gap_days: 14,
};

export interface CatalogueItem {
  code: string;
  label: string;
  short: string;
}

// Acute treatments. Psilocybin/LSD are neutral codes with no dosing guidance
// (open-questions.md #10); users can hide any item in Settings.
export const TREATMENTS: CatalogueItem[] = [
  { code: "o2", label: "Oxygen", short: "O2" },
  { code: "sumatriptan_sc", label: "Sumatriptan injection", short: "Suma inj" },
  { code: "sumatriptan_nasal", label: "Sumatriptan nasal", short: "Suma nasal" },
  { code: "zolmitriptan_nasal", label: "Zolmitriptan nasal", short: "Zolmi nasal" },
  { code: "caffeine", label: "Caffeine / energy drink", short: "Caffeine" },
  { code: "psilocybin", label: "Psilocybin", short: "Psilocybin" },
  { code: "lsd", label: "LSD / analogues", short: "LSD" },
  { code: "other", label: "Other", short: "Other" },
];

export const O2_FLOWS = [10, 12, 15, 20];
export const O2_MASKS: CatalogueItem[] = [
  { code: "nrb", label: "Non-rebreather", short: "NRB" },
  { code: "demand", label: "Demand valve", short: "Demand valve" },
  { code: "other", label: "Other mask", short: "Other" },
];
export const RELIEF_MINUTES = [5, 10, 15, 20, 30];

export const SYMPTOMS: CatalogueItem[] = [
  { code: "eye_watering", label: "Eye watering", short: "Eye watering" },
  { code: "eye_red", label: "Eye red", short: "Eye red" },
  { code: "eyelid_droop", label: "Eyelid droop", short: "Eyelid droop" },
  { code: "nose", label: "Nose blocked / runny", short: "Nose" },
  { code: "sweating", label: "Sweating", short: "Sweating" },
  { code: "restless", label: "Restless / pacing", short: "Restless" },
  { code: "nausea", label: "Nausea", short: "Nausea" },
  { code: "light", label: "Light-sensitive", short: "Light" },
];

export const TRIGGERS: CatalogueItem[] = [
  { code: "alcohol", label: "Alcohol", short: "Alcohol" },
  { code: "nap", label: "Nap", short: "Nap" },
  { code: "poor_sleep", label: "Poor sleep", short: "Poor sleep" },
  { code: "lying_down", label: "Lying down", short: "Lying down" },
  { code: "heat", label: "Heat / weather", short: "Heat" },
  { code: "bright_light", label: "Bright light", short: "Bright light" },
  { code: "stress", label: "Stress", short: "Stress" },
  { code: "smell", label: "Smell", short: "Smell" },
  { code: "none", label: "None noticed", short: "None noticed" },
];

// KIP-style behavioural hints for the 0–10 scale (ux-research.md §7). Plain-language
// anchors, not the KIP scale itself; the stored value is the integer.
export const INTENSITY_HINTS: Record<number, string> = {
  1: "a shadow, comes and goes",
  2: "mild, can ignore it",
  3: "annoying, still doing things",
  4: "hard to concentrate",
  5: "restless, need space",
  6: "can't sit still",
  7: "pacing, can't sit",
  8: "rocking, pressing the head",
  9: "can't think, crying out",
  10: "worst possible",
};

export function labelFor(list: CatalogueItem[], code: string): string {
  return list.find((i) => i.code === code)?.short ?? code;
}
