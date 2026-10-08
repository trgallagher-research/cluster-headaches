"use client";
import type { DayCount } from "@/lib/logic";

// Attacks per day as inline SVG bars. Bar height = count; colour = worst intensity that day.
export function Bars(props: { days: DayCount[]; label: string }) {
  const { days } = props;
  const max = Math.max(3, ...days.map((d) => d.count));
  const W = 320;
  const H = 96;
  const pad = { top: 8, bottom: 18, left: 20 };
  const bw = (W - pad.left) / days.length;
  const y = (v: number) => pad.top + (H - pad.top - pad.bottom) * (1 - v / max);
  const ticks = max <= 4 ? [0, max] : [0, Math.round(max / 2), max];
  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <figure className="bars">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${props.label}: ${total} attacks in ${days.length} days`}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={W} y1={y(v)} y2={y(v)} className="grid" />
            <text x={pad.left - 4} y={y(v) + 3} className="axis" textAnchor="end">{v}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const h = y(0) - y(d.count);
          const cls = d.maxIntensity === null ? "bar" : d.maxIntensity >= 8 ? "bar hi" : d.maxIntensity >= 5 ? "bar mid" : "bar lo";
          return (
            <rect key={d.key} x={pad.left + i * bw + bw * 0.15} width={bw * 0.7} y={y(d.count)} height={Math.max(0, h)} rx={Math.min(3, bw * 0.2)} className={cls}>
              <title>{`${d.key}: ${d.count} attack${d.count === 1 ? "" : "s"}${d.maxIntensity !== null ? `, worst ${d.maxIntensity}/10` : ""}`}</title>
            </rect>
          );
        })}
        {[0, days.length - 1].map((i) => (
          <text key={i} x={pad.left + i * bw + bw / 2} y={H - 4} className="axis" textAnchor={i === 0 ? "start" : "end"}>
            {days[i].date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          </text>
        ))}
      </svg>
      <figcaption className="legend">
        <span>{props.label}</span>
        <span><i className="sw lo" /> 1–4</span>
        <span><i className="sw mid" /> 5–7</span>
        <span><i className="sw hi" /> 8–10</span>
      </figcaption>
    </figure>
  );
}
