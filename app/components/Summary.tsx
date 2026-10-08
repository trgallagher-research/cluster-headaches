"use client";
import { useState } from "react";
import { Attack } from "@/lib/model";
import { attacksInDays, dailyCounts, durationLabel, fmtMinutes, fmtTime, periodSummary, treatmentSummary } from "@/lib/logic";
import { t, APP_NAME } from "@/lib/strings";
import { Bars } from "./Bars";

// One-page summary to show or print for a doctor (app-plan.md §8). Print stylesheet
// hides everything else, so "Save as PDF" in the print dialog gives a clean PDF.
export function Summary(props: { attacks: Attack[]; now: Date; onBack: () => void }) {
  const [days, setDays] = useState(30);
  const inRange = attacksInDays(props.attacks, days, props.now).sort((x, y) => Date.parse(x.started_at) - Date.parse(y.started_at));
  const s = periodSummary(inRange);
  const from = new Date(props.now.getTime() - days * 86400_000);
  const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);

  return (
    <div className="summary">
      <div className="no-print chips">
        <button className="chip" onClick={props.onBack}>← {t.back}</button>
        {[30, 90].map((d) => (
          <button key={d} className={"chip" + (days === d ? " on" : "")} aria-pressed={days === d} onClick={() => setDays(d)}>
            {d} days
          </button>
        ))}
        <button className="chip" onClick={() => window.print()}>{t.print}</button>
      </div>

      <h2 className="sum-title">Cluster headache diary summary</h2>
      <p className="muted">
        {from.toLocaleDateString()} – {props.now.toLocaleDateString()} · self-recorded with {APP_NAME}
      </p>

      <dl className="stats">
        <div><dt>Attacks</dt><dd>{s.attacks}</dd></div>
        <div><dt>Per day (avg)</dt><dd>{(s.attacks / days).toFixed(1)}</dd></div>
        <div><dt>Median duration</dt><dd>{s.medianMin === null ? "–" : fmtMinutes(s.medianMin)}</dd></div>
        <div><dt>Mean worst pain</dt><dd>{s.meanIntensity === null ? "–" : `${s.meanIntensity.toFixed(1)}/10`}</dd></div>
        <div><dt>Started 21:00–06:00</dt><dd>{pct(s.nightShare)}</dd></div>
        <div><dt>Side L / R / both</dt><dd>{s.sides.left} / {s.sides.right} / {s.sides.both}</dd></div>
        <div><dt>Shadows</dt><dd>{s.shadows}</dd></div>
        <div><dt>Ended in sleep</dt><dd>{s.asleepEnds}</dd></div>
      </dl>

      <Bars days={dailyCounts(props.attacks, days, props.now)} label={t.attacksPerDay} />

      {s.treatments.length ? (
        <table className="tbl">
          <thead>
            <tr><th>Acute treatment</th><th>Used</th><th>Full relief</th><th>Partial</th><th>None</th></tr>
          </thead>
          <tbody>
            {s.treatments.map((r) => (
              <tr key={r.code}><td>{r.label}</td><td>{r.used}</td><td>{r.full}</td><td>{r.partial}</td><td>{r.none}</td></tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Date</th><th>Time</th><th>Duration</th><th>Pain</th><th>Side</th><th>Treatment</th></tr>
          </thead>
          <tbody>
            {inRange.filter((a) => !a.is_shadow).map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.started_at).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</td>
                <td>{fmtTime(a.started_at)}</td>
                <td>{durationLabel(a)}</td>
                <td>{a.intensity_max ?? "–"}</td>
                <td>{a.side ?? "–"}</td>
                <td>{treatmentSummary(a) || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted small">
        Durations marked "~" are approximate; "end unknown" means the attack ended in sleep. Pain is the patient's worst
        rating on a 0–10 scale. This is a self-kept diary, not a clinical record.
      </p>
    </div>
  );
}
