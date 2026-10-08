"use client";
import { useState } from "react";
import { Attack, TREATMENTS, labelFor } from "@/lib/model";
import { dailyCounts, dayKey, durationLabel, fmtDay, fmtTime, liveAttacks, toCSV } from "@/lib/logic";
import { t } from "@/lib/strings";
import { SectionTitle } from "./ui";
import { Bars } from "./Bars";

export function downloadFile(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function History(props: {
  attacks: Attack[];
  now: Date;
  openAttack: (id: string) => void;
  openSummary: () => void;
}) {
  const [range, setRange] = useState(14);
  const list = liveAttacks(props.attacks).sort((x, y) => Date.parse(y.started_at) - Date.parse(x.started_at));
  const groups: { key: string; date: Date; items: Attack[] }[] = [];
  for (const a of list) {
    const d = new Date(a.started_at);
    const key = dayKey(d);
    const g = groups[groups.length - 1];
    if (g && g.key === key) g.items.push(a);
    else groups.push({ key, date: d, items: [a] });
  }

  return (
    <div className="history">
      <SectionTitle>{t.history}</SectionTitle>

      <div className="chips">
        <button className="chip" onClick={() => downloadFile(`clusterlog-${dayKey(props.now)}.csv`, toCSV(props.attacks), "text/csv")}>
          {t.exportCsv}
        </button>
        <button className="chip" onClick={props.openSummary}>{t.doctorSummary}</button>
      </div>

      <div className="seg" role="group" aria-label="Range">
        {[14, 30, 90].map((d) => (
          <button key={d} className={"seg-btn" + (range === d ? " on" : "")} aria-pressed={range === d} onClick={() => setRange(d)}>
            {d} days
          </button>
        ))}
      </div>
      <Bars days={dailyCounts(props.attacks, range, props.now)} label={t.attacksPerDay} />

      {groups.length === 0 ? <p className="muted">{t.noAttacks}</p> : null}
      {groups.map((g) => (
        <div className="day" key={g.key}>
          <h3 className="day-title">{fmtDay(g.date)}</h3>
          {g.items.map((a) => (
            <button key={a.id} className={"row" + (a.is_shadow ? " shadow" : "")} onClick={() => props.openAttack(a.id)}>
              <span className="row-time">
                {fmtTime(a.started_at)}
                {a.is_shadow ? "" : a.ended_at ? `–${fmtTime(a.ended_at)}` : "–?"}
              </span>
              <span className="row-dur">{durationLabel(a)}</span>
              <span className="row-int">{a.intensity_max !== null ? `${a.intensity_max}/10` : ""}</span>
              <span className="row-more">
                {[
                  a.side ? a.side[0].toUpperCase() : "",
                  ...a.treatments.map(
                    (u) => labelFor(TREATMENTS, u.code) + (u.relief === "full" ? " ✓" : u.relief === "partial" ? " ~" : u.relief === "none" ? " ✗" : ""),
                  ),
                  a.end_source === "asleep" ? "ended in sleep" : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
