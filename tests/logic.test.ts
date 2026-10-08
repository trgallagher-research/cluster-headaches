import { describe, it, expect } from "vitest";
import {
  newAttack, stopNow, endedAsleep, approxEnd, endedMinutesAgo, startedMinutesAgo, durationMin,
  durationLabel, isRunning, isStale, boutDay, todaySummary, dailyCounts, sameAsLast, lastClosedAttack,
  toCSV, round15, timeOnOrBefore, periodSummary, stamp,
} from "@/lib/logic";
import type { Attack } from "@/lib/model";

const T0 = new Date("2026-10-08T02:14:00");
const min = (m: number) => new Date(T0.getTime() + m * 60_000);
const make = (start: Date, endMin: number | null, extra: Partial<Attack> = {}): Attack => {
  const a = { ...newAttack(start), ...extra };
  if (endMin !== null) Object.assign(a, stopNow(new Date(start.getTime() + endMin * 60_000)));
  return a;
};

describe("start and stop", () => {
  it("a new attack is running until stopped", () => {
    const a = newAttack(T0);
    expect(isRunning(a)).toBe(true);
    expect(durationLabel(a)).toBe("running");
    const b = { ...a, ...stopNow(min(51)) };
    expect(isRunning(b)).toBe(false);
    expect(durationMin(b)).toBe(51);
    expect(b.end_source).toBe("live");
  });

  it("a shadow is a closed moment, never running", () => {
    const s = newAttack(T0, { shadow: true });
    expect(isRunning(s)).toBe(false);
    expect(durationLabel(s)).toBe("shadow");
  });

  it("started earlier moves the start back and marks it adjusted", () => {
    const p = startedMinutesAgo(15, min(5));
    expect(p.started_at).toBe(min(-10).toISOString());
    expect(p.start_source).toBe("adjusted");
  });

  it("ended earlier never goes before the start", () => {
    const a = newAttack(T0);
    const p = endedMinutesAgo(a, 60, min(20));
    expect(p.ended_at).toBe(T0.toISOString());
  });

  it("ended in sleep closes the attack with an unknown end", () => {
    const a = { ...newAttack(T0), ...endedAsleep() };
    expect(isRunning(a)).toBe(false);
    expect(durationMin(a)).toBeNull();
    expect(durationLabel(a)).toBe("end unknown");
  });

  it("a rough end time is stored as approximate", () => {
    const a = { ...newAttack(T0), ...approxEnd(min(61).toISOString()) };
    expect(a.end_confidence).toBe("approx");
    expect(durationLabel(a)).toBe("~1 h 1 min");
    expect({ ...a, ...approxEnd(null) }.end_confidence).toBe("unknown");
  });

  it("flags attacks running over 3 hours", () => {
    const a = newAttack(T0);
    expect(isStale(a, min(179))).toBe(false);
    expect(isStale(a, min(181))).toBe(true);
  });

  it("stamp records when each field was entered", () => {
    const a = newAttack(T0);
    const p = stamp({ intensity_max: 8 }, min(70), a);
    expect(p.recorded_fields_at?.intensity_max).toBe(min(70).toISOString());
    expect(p.recorded_fields_at?.started_at).toBe(T0.toISOString());
  });
});

describe("time helpers", () => {
  it("round15 rounds to the nearest quarter hour", () => {
    expect(new Date(round15(new Date("2026-10-08T03:07:00").getTime())).getMinutes()).toBe(0);
    expect(new Date(round15(new Date("2026-10-08T03:08:00").getTime())).getMinutes()).toBe(15);
  });
  it("timeOnOrBefore picks yesterday when the time is later than now", () => {
    const ref = new Date("2026-10-08T01:00:00");
    expect(timeOnOrBefore("23:30", ref)?.getDate()).toBe(7);
    expect(timeOnOrBefore("00:30", ref)?.getDate()).toBe(8);
    expect(timeOnOrBefore("nope", ref)).toBeNull();
  });
});

describe("summaries", () => {
  const attacks = [
    make(new Date("2026-09-10T02:00:00"), 40),
    make(new Date("2026-10-01T02:00:00"), 45, { intensity_max: 6 }),
    make(new Date("2026-10-07T23:00:00"), 30, { intensity_max: 9 }),
    make(new Date("2026-10-08T02:14:00"), 51, { intensity_max: 8, side: "left" }),
    newAttack(new Date("2026-10-08T05:00:00"), { shadow: true }),
  ];
  const now = new Date("2026-10-08T12:00:00");

  it("today counts attacks, not shadows", () => {
    expect(todaySummary(attacks, now)).toEqual({ count: 1, minutes: 51 });
  });

  it("bout day counts from the first attack after a long gap", () => {
    expect(boutDay(attacks, now, 14)).toBe(8); // bout began 1 Oct
    expect(boutDay(attacks, now, 30)).toBe(29); // 10 Sep is within a 30-day gap
    expect(boutDay(attacks, new Date("2026-11-30T12:00:00"), 14)).toBeNull();
  });

  it("daily counts carry the worst intensity", () => {
    const d = dailyCounts(attacks, 2, now);
    expect(d.map((x) => [x.key, x.count, x.maxIntensity])).toEqual([
      ["2026-10-07", 1, 9],
      ["2026-10-08", 1, 8],
    ]);
  });

  it("period summary", () => {
    const s = periodSummary(attacks);
    expect(s.attacks).toBe(4);
    expect(s.shadows).toBe(1);
    expect(s.medianMin).toBe(40);
    expect(s.nightShare).toBe(1);
  });

  it("same as last time copies details from the latest finished attack", () => {
    const last = lastClosedAttack(attacks)!;
    expect(last.side).toBe("left");
    const fresh = newAttack(now);
    const p = sameAsLast(fresh, { ...last, treatments: [{ id: "x", code: "o2", at: last.started_at, flow_lpm: 15 }] });
    expect(p.intensity_max).toBe(8);
    expect(p.treatments?.[0].flow_lpm).toBe(15);
    expect(p.treatments?.[0].id).not.toBe("x");
    expect(p.treatments?.[0].at).toBe(fresh.started_at);
  });
});

describe("CSV", () => {
  it("escapes commas, quotes and newlines and skips deleted rows", () => {
    const a = make(T0, 30, { notes_text: 'said "ouch", then\nslept' });
    const gone = make(min(100), 10, { deleted_at: min(200).toISOString() });
    const csv = toCSV([a, gone]);
    const lines = csv.trim().split("\r\n");
    expect(lines[0].startsWith("id,type,started_at")).toBe(true);
    expect(csv).toContain('"said ""ouch"", then\nslept"');
    expect(csv).not.toContain(gone.id);
  });
});

describe("hhmm", () => {
  it("gives the 24-hour value a time input needs", async () => {
    const { hhmm } = await import("@/lib/logic");
    expect(hhmm(new Date("2026-10-08T17:05:00").toISOString())).toBe("17:05");
  });
});
