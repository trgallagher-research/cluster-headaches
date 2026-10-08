// Pure functions over attacks: no IndexedDB, no React, so they can be unit-tested.
import { Attack, TREATMENTS, SYMPTOMS, TRIGGERS, O2_MASKS, labelFor } from "./model";

export const STALE_AFTER_MIN = 180; // ICHD-3 upper bound for one attack
const MIN = 60_000;

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function localTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function newAttack(now: Date, opts: { shadow?: boolean } = {}): Attack {
  const iso = now.toISOString();
  const shadow = !!opts.shadow;
  return {
    id: uuid(),
    created_at: iso,
    updated_at: iso,
    deleted_at: null,
    tz: localTz(),
    started_at: iso,
    start_source: "live",
    // A shadow is logged as a moment, not something that runs.
    ended_at: shadow ? iso : null,
    end_source: shadow ? "live" : null,
    end_confidence: shadow ? "exact" : null,
    is_shadow: shadow,
    intensity_max: null,
    side: null,
    woke_from_sleep: null,
    treatments: [],
    symptoms: [],
    triggers: [],
    notes_text: "",
    recorded_fields_at: { started_at: iso },
  };
}

/** Build a patch that also stamps updated_at and per-field recorded_at. */
export function stamp(patch: Partial<Attack>, now: Date, a?: Attack): Partial<Attack> {
  const iso = now.toISOString();
  const rec = { ...(a?.recorded_fields_at ?? {}) };
  for (const k of Object.keys(patch)) rec[k] = iso;
  return { ...patch, updated_at: iso, recorded_fields_at: rec };
}

export function isRunning(a: Attack): boolean {
  return !a.deleted_at && !a.is_shadow && a.end_source === null;
}

export function isStale(a: Attack, now: Date): boolean {
  return isRunning(a) && now.getTime() - Date.parse(a.started_at) > STALE_AFTER_MIN * MIN;
}

/** Minutes between start and end, or null when the end is unknown. */
export function durationMin(a: Attack): number | null {
  if (!a.ended_at) return null;
  return Math.max(0, Math.round((Date.parse(a.ended_at) - Date.parse(a.started_at)) / MIN));
}

export function fmtMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function durationLabel(a: Attack): string {
  if (a.is_shadow) return "shadow";
  const d = durationMin(a);
  if (d === null) return a.end_source ? "end unknown" : "running";
  return (a.end_confidence === "approx" ? "~" : "") + fmtMinutes(d);
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/** 24-hour HH:MM in local time, the value format <input type="time"> needs. */
export function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function fmtDay(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}

export function fmtElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/** Local calendar-day key, e.g. 2026-10-08. */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// --- start / stop transitions -------------------------------------------------

export function startedMinutesAgo(minutes: number, now: Date): Partial<Attack> {
  return {
    started_at: new Date(now.getTime() - minutes * MIN).toISOString(),
    start_source: minutes === 0 ? "live" : "adjusted",
  };
}

export function stopNow(now: Date): Partial<Attack> {
  return { ended_at: now.toISOString(), end_source: "live", end_confidence: "exact" };
}

export function endedMinutesAgo(a: Attack, minutes: number, now: Date): Partial<Attack> {
  const end = Math.max(Date.parse(a.started_at), now.getTime() - minutes * MIN);
  return { ended_at: new Date(end).toISOString(), end_source: "adjusted", end_confidence: "exact" };
}

/** "Ended in sleep / not sure": closed, end time unknown until the user offers a rough one. */
export function endedAsleep(): Partial<Attack> {
  return { ended_at: null, end_source: "asleep", end_confidence: "unknown" };
}

export function approxEnd(iso: string | null): Partial<Attack> {
  return { ended_at: iso, end_source: "asleep", end_confidence: iso ? "approx" : "unknown" };
}

/** Round to the nearest 15 minutes (for the rough end-time stepper). */
export function round15(t: number): number {
  const q = 15 * MIN;
  return Math.round(t / q) * q;
}

/** A clock time (HH:MM) on the day of `ref`, moved back a day if that lands after `ref`. */
export function timeOnOrBefore(hhmm: string, ref: Date): Date | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const d = new Date(ref);
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  if (d.getTime() > ref.getTime()) d.setDate(d.getDate() - 1);
  return d;
}

// --- "same as last time" ------------------------------------------------------

export function lastClosedAttack(attacks: Attack[], excludeId?: string): Attack | undefined {
  return attacks
    .filter((a) => !a.deleted_at && !a.is_shadow && a.end_source !== null && a.id !== excludeId)
    .sort((x, y) => Date.parse(y.started_at) - Date.parse(x.started_at))[0];
}

export function sameAsLast(target: Attack, last: Attack): Partial<Attack> {
  return {
    intensity_max: last.intensity_max,
    side: last.side,
    symptoms: [...last.symptoms],
    triggers: [...last.triggers],
    treatments: last.treatments.map((t) => ({
      ...t,
      id: uuid(),
      at: target.started_at,
    })),
  };
}

// --- summaries ----------------------------------------------------------------

export function liveAttacks(attacks: Attack[]): Attack[] {
  return attacks.filter((a) => !a.deleted_at);
}

export function todaySummary(attacks: Attack[], now: Date) {
  const key = dayKey(now);
  const today = liveAttacks(attacks).filter(
    (a) => !a.is_shadow && dayKey(new Date(a.started_at)) === key,
  );
  const minutes = today.reduce((s, a) => s + (durationMin(a) ?? 0), 0);
  return { count: today.length, minutes };
}

/**
 * Day number of the current bout (1 = first day), or null if no attack in the last
 * `gapDays`. A bout starts after a gap longer than `gapDays` between attacks.
 */
export function boutDay(attacks: Attack[], now: Date, gapDays: number): number | null {
  const starts = liveAttacks(attacks)
    .filter((a) => !a.is_shadow)
    .map((a) => Date.parse(a.started_at))
    .filter((t) => t <= now.getTime())
    .sort((x, y) => y - x);
  if (!starts.length) return null;
  const gap = gapDays * 24 * 60 * MIN;
  if (now.getTime() - starts[0] > gap) return null;
  let first = starts[0];
  for (const t of starts.slice(1)) {
    if (first - t > gap) break;
    first = t;
  }
  const a = new Date(dayKey(new Date(first)) + "T00:00:00");
  const b = new Date(dayKey(now) + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * MIN)) + 1;
}

export interface DayCount {
  key: string;
  date: Date;
  count: number;
  maxIntensity: number | null;
}

export function dailyCounts(attacks: Attack[], days: number, now: Date): DayCount[] {
  const out: DayCount[] = [];
  const byKey = new Map<string, DayCount>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const row = { key: dayKey(d), date: d, count: 0, maxIntensity: null as number | null };
    out.push(row);
    byKey.set(row.key, row);
  }
  for (const a of liveAttacks(attacks)) {
    if (a.is_shadow) continue;
    const row = byKey.get(dayKey(new Date(a.started_at)));
    if (!row) continue;
    row.count++;
    if (a.intensity_max !== null) row.maxIntensity = Math.max(row.maxIntensity ?? 0, a.intensity_max);
  }
  return out;
}

export function attacksInDays(attacks: Attack[], days: number, now: Date): Attack[] {
  const from = now.getTime() - days * 24 * 60 * MIN;
  return liveAttacks(attacks).filter((a) => Date.parse(a.started_at) >= from);
}

export function periodSummary(attacks: Attack[]) {
  const real = attacks.filter((a) => !a.is_shadow);
  const durations = real.map(durationMin).filter((d): d is number => d !== null).sort((a, b) => a - b);
  const median = durations.length ? durations[Math.floor((durations.length - 1) / 2)] : null;
  const intens = real.map((a) => a.intensity_max).filter((v): v is number => v !== null);
  const night = real.filter((a) => {
    const h = new Date(a.started_at).getHours();
    return h >= 21 || h < 6;
  }).length;
  const sides = { left: 0, right: 0, both: 0 };
  for (const a of real) if (a.side) sides[a.side]++;
  const treat = new Map<string, { used: number; full: number; partial: number; none: number }>();
  for (const a of real)
    for (const t of a.treatments) {
      const r = treat.get(t.code) ?? { used: 0, full: 0, partial: 0, none: 0 };
      r.used++;
      if (t.relief) r[t.relief]++;
      treat.set(t.code, r);
    }
  return {
    attacks: real.length,
    shadows: attacks.length - real.length,
    medianMin: median,
    meanIntensity: intens.length ? intens.reduce((s, v) => s + v, 0) / intens.length : null,
    nightShare: real.length ? night / real.length : null,
    asleepEnds: real.filter((a) => a.end_source === "asleep").length,
    sides,
    treatments: [...treat.entries()].map(([code, r]) => ({ code, label: labelFor(TREATMENTS, code), ...r })),
  };
}

// --- export -------------------------------------------------------------------

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const CSV_COLUMNS = [
  "id", "type", "started_at", "start_source", "ended_at", "end_source", "end_confidence",
  "duration_min", "intensity_max", "side", "woke_from_sleep", "treatments", "symptoms",
  "triggers", "notes", "timezone",
] as const;

export function treatmentSummary(a: Attack): string {
  return a.treatments
    .map((t) => {
      const bits = [labelFor(TREATMENTS, t.code)];
      if (t.flow_lpm) bits.push(`${t.flow_lpm} L/min`);
      if (t.mask) bits.push(labelFor(O2_MASKS, t.mask));
      if (t.relief) bits.push(`relief ${t.relief}`);
      if (t.relief_after_min) bits.push(`after ${t.relief_after_min} min`);
      return bits.join(" ");
    })
    .join("; ");
}

export function toCSV(attacks: Attack[]): string {
  const rows = liveAttacks(attacks)
    .sort((x, y) => Date.parse(x.started_at) - Date.parse(y.started_at))
    .map((a) =>
      [
        a.id, a.is_shadow ? "shadow" : "attack", a.started_at, a.start_source, a.ended_at,
        a.end_source, a.end_confidence, durationMin(a), a.intensity_max, a.side,
        a.woke_from_sleep, treatmentSummary(a),
        a.symptoms.map((c) => labelFor(SYMPTOMS, c)).join("; "),
        a.triggers.map((c) => labelFor(TRIGGERS, c)).join("; "),
        a.notes_text, a.tz,
      ].map(csvCell).join(","),
    );
  return [CSV_COLUMNS.join(","), ...rows].join("\r\n") + "\r\n";
}
