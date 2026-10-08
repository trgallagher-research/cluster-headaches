"use client";
import { useEffect, useState } from "react";
import { Attack, Settings, TREATMENTS } from "@/lib/model";
import {
  boutDay, durationLabel, fmtElapsed, fmtMinutes, fmtTime, isStale, lastClosedAttack,
  newAttack, hhmm, startedMinutesAgo, stopNow, endedAsleep, todaySummary, uuid, timeOnOrBefore,
} from "@/lib/logic";
import { addAttack, patchAttack, undoAttack } from "@/lib/db";
import { t } from "@/lib/strings";

function buzz(ms = 40) {
  try {
    navigator.vibrate?.(ms); // Android only; iOS ignores it
  } catch {
    /* ignore */
  }
}

export function Home(props: {
  attacks: Attack[];
  running: Attack | undefined;
  settings: Settings;
  now: Date;
  openAttack: (id: string, fresh: boolean) => void;
  justStartedId: string | null;
  setJustStartedId: (id: string | null) => void;
}) {
  const { attacks, running, settings, now } = props;
  const [shadowNote, setShadowNote] = useState(false);
  const [stillGoingAck, setStillGoingAck] = useState<string | null>(null);
  const [showPick, setShowPick] = useState(false);

  // The undo link is visible for 10 seconds after START.
  useEffect(() => {
    if (!props.justStartedId) return;
    const id = setTimeout(() => props.setJustStartedId(null), 10_000);
    return () => clearTimeout(id);
  }, [props.justStartedId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    const a = newAttack(new Date());
    await addAttack(a);
    buzz(60);
    props.setJustStartedId(a.id);
  }

  async function stop() {
    if (!running) return;
    await patchAttack(running.id, stopNow(new Date()));
    buzz(30);
    props.openAttack(running.id, true);
  }

  async function shadow() {
    await addAttack(newAttack(new Date(), { shadow: true }));
    buzz(20);
    setShadowNote(true);
    setTimeout(() => setShadowNote(false), 2500);
  }

  if (running) {
    const startedMs = Date.parse(running.started_at);
    const elapsed = now.getTime() - startedMs;
    const stale = isStale(running, now) && stillGoingAck !== running.id;
    const visible = TREATMENTS.filter((x) => !settings.hidden_treatments.includes(x.code));
    const quick = [visible.find((x) => x.code === "o2"), visible.find((x) => x.code !== "o2" && x.code !== "other")].filter(
      (x): x is (typeof TREATMENTS)[number] => !!x,
    );

    return (
      <div className="home running">
        <p className="kicker live">{t.attackInProgress}</p>

        {stale ? (
          <div className="banner" role="alert">
            <strong>{t.stillGoing}</strong>
            <p>{t.stillGoingBody(fmtTime(running.started_at), fmtMinutes(Math.round(elapsed / 60000)))}</p>
            <div className="chips">
              <button className="chip" onClick={() => setStillGoingAck(running.id)}>{t.yesStillGoing}</button>
              <button
                className="chip"
                onClick={async () => {
                  await patchAttack(running.id, stopNow(new Date()));
                  props.openAttack(running.id, true);
                }}
              >
                {t.itEnded}
              </button>
              <button
                className="chip"
                onClick={async () => {
                  await patchAttack(running.id, endedAsleep());
                  props.openAttack(running.id, true);
                }}
              >
                {t.endedInSleep}
              </button>
            </div>
          </div>
        ) : null}

        <div className="timer" aria-live="off">{fmtElapsed(elapsed)}</div>
        <p className="muted center">
          {t.started} {fmtTime(running.started_at)}
          {running.start_source === "adjusted" ? " (adjusted)" : ""}
        </p>

        <div className="earlier">
          <span className="mini-label">{t.startedEarlier}</span>
          <div className="chips">
            {[5, 15, 30, 60].map((m) => (
              <button
                key={m}
                className="chip"
                onClick={() => patchAttack(running.id, startedMinutesAgo(m, new Date()))}
              >
                {m === 60 ? t.hourAgo : t.minAgo(m)}
              </button>
            ))}
            <button className="chip" onClick={() => setShowPick((v) => !v)}>{t.pick}</button>
          </div>
          {showPick ? (
            <input
              id="start-pick"
              className="time-input"
              type="time"
              aria-label="Start time"
              defaultValue={hhmm(running.started_at)}
              onChange={(e) => {
                const d = timeOnOrBefore(e.target.value, new Date());
                if (d) patchAttack(running.id, { started_at: d.toISOString(), start_source: "adjusted" });
              }}
            />
          ) : null}
        </div>

        <button className="big-btn stop" onClick={stop}>
          {t.stop}
        </button>

        <div className="quick">
          <span className="mini-label">{t.quickAdd}</span>
          <div className="chips">
            {quick.map((q) => {
              const has = running.treatments.some((x) => x.code === q.code);
              return (
                <button
                  key={q.code}
                  className={"chip" + (has ? " on" : "")}
                  aria-pressed={has}
                  onClick={() => {
                    if (has) return;
                    patchAttack(running.id, {
                      treatments: [
                        ...running.treatments,
                        { id: uuid(), code: q.code, at: new Date().toISOString() },
                      ],
                    });
                  }}
                >
                  {q.short}
                  {has ? ` ✓ ${t.added}` : ""}
                </button>
              );
            })}
          </div>
        </div>

        {props.justStartedId === running.id ? (
          <button
            className="link-btn"
            onClick={async () => {
              await undoAttack(running.id);
              props.setJustStartedId(null);
            }}
          >
            {t.undoStart}
          </button>
        ) : null}
      </div>
    );
  }

  const today = todaySummary(attacks, now);
  const bout = boutDay(attacks, now, settings.bout_gap_days);
  const last = lastClosedAttack(attacks);

  return (
    <div className="home">
      <div className="status">
        <span>{t.today(today.count, fmtMinutes(today.minutes))}</span>
        {bout ? <span className="pill">{t.boutDay(bout)}</span> : null}
      </div>

      <button className="big-btn start" onClick={start}>
        {t.start}
      </button>

      <div className="chips center-row">
        <button className="chip outline" onClick={shadow}>
          {shadowNote ? `✓ ${t.shadowLogged}` : t.shadow}
        </button>
      </div>

      {last ? (
        <button className="last" onClick={() => props.openAttack(last.id, false)}>
          <span className="mini-label">{t.last}</span>
          <span>
            {fmtTime(last.started_at)}
            {last.ended_at ? `–${fmtTime(last.ended_at)}` : "–?"} · {durationLabel(last)}
            {last.intensity_max !== null ? ` · ${last.intensity_max}/10` : ""}
          </span>
        </button>
      ) : null}
    </div>
  );
}
