"use client";
import { useState } from "react";
import {
  Attack, Settings, TreatmentUse, TREATMENTS, SYMPTOMS, TRIGGERS, O2_FLOWS, O2_MASKS,
  RELIEF_MINUTES, INTENSITY_HINTS, Relief,
} from "@/lib/model";
import {
  hhmm, approxEnd, durationLabel, endedAsleep, endedMinutesAgo, fmtDay, fmtTime, lastClosedAttack,
  round15, sameAsLast, stopNow, timeOnOrBefore, uuid,
} from "@/lib/logic";
import { deleteAttack, patchAttack } from "@/lib/db";
import { t } from "@/lib/strings";
import { Chip, Field, toggle } from "./ui";

const MIN = 60_000;

export function Enrich(props: {
  attack: Attack;
  attacks: Attack[];
  settings: Settings;
  fresh: boolean;
  onDone: () => void;
}) {
  const a = props.attack;
  const [endMode, setEndMode] = useState<"exact" | "asleep">(
    a.end_source === "asleep" || a.end_source === "unknown" ? "asleep" : "exact",
  );
  const [confirmDel, setConfirmDel] = useState(false);
  const save = (patch: Partial<Attack>) => patchAttack(a.id, patch);
  const last = lastClosedAttack(props.attacks, a.id);
  const hasDetail =
    a.intensity_max !== null || a.side !== null || a.treatments.length || a.symptoms.length || a.triggers.length;
  const visible = TREATMENTS.filter(
    (x) => !props.settings.hidden_treatments.includes(x.code) || a.treatments.some((u) => u.code === x.code),
  );
  // "N min ago" chips only make sense right after the attack, not when editing old ones.
  const endedRecently = props.fresh || (a.ended_at ? Date.now() - Date.parse(a.ended_at) < 2 * 3600_000 : false);

  function setTreatment(code: string, patch: Partial<TreatmentUse> | null) {
    const cur = a.treatments.find((x) => x.code === code);
    let next: TreatmentUse[];
    if (patch === null) next = a.treatments.filter((x) => x.code !== code);
    else if (cur) next = a.treatments.map((x) => (x.code === code ? { ...x, ...patch } : x));
    else next = [...a.treatments, { id: uuid(), code, at: a.started_at, ...patch }];
    save({ treatments: next });
  }

  const roughBase = a.ended_at
    ? Date.parse(a.ended_at)
    : round15(Math.min(Date.now(), Date.parse(a.started_at) + 60 * MIN));
  function stepRough(deltaMin: number) {
    const v = round15(roughBase + deltaMin * MIN);
    const clamped = Math.min(round15(Date.now()), Math.max(Date.parse(a.started_at), v));
    save(approxEnd(new Date(clamped).toISOString()));
  }

  return (
    <div className="enrich">
      <div className="enrich-head">
        <p className="kicker">{props.fresh ? t.saved(durationLabel(a)) : `${t.editAttack} · ${fmtDay(new Date(a.started_at))}`}</p>
        <button className="btn primary" onClick={props.onDone}>{t.done}</button>
      </div>
      <p className="muted small">{t.allSaved}</p>

      {!a.is_shadow ? (
        <>
          <div className="field">
            <h3 className="field-title">{t.started}</h3>
            <input
              id="start-edit"
              className="time-input"
              type="time"
              aria-label="Start time"
              value={hhmm(a.started_at)}
              onChange={(e) => {
                const ref = a.ended_at ? new Date(a.ended_at) : new Date();
                const d = timeOnOrBefore(e.target.value, ref);
                if (d) save({ started_at: d.toISOString(), start_source: "adjusted" });
              }}
            />
          </div>

          <Field title={t.howEnded}>
            <Chip
              on={endMode === "exact"}
              onClick={() => {
                setEndMode("exact");
                if (!a.ended_at || a.end_source === "asleep" || a.end_source === "unknown") save(stopNow(new Date()));
              }}
            >
              {endMode === "exact" && a.ended_at ? t.endedNow(fmtTime(a.ended_at)) : t.endedAt}
            </Chip>
            <Chip
              on={endMode === "asleep"}
              onClick={() => {
                setEndMode("asleep");
                if (a.end_source !== "asleep") save(endedAsleep());
              }}
            >
              {t.inSleep}
            </Chip>
          </Field>

          {endMode === "exact" ? (
            <div className="sub">
              {endedRecently ? (
                <>
                  <p className="mini-label">{t.endedEarlier}</p>
                  <div className="chips">
                    {[5, 15, 30, 60].map((m) => (
                      <Chip key={m} onClick={() => save(endedMinutesAgo(a, m, new Date()))}>
                        {m === 60 ? t.hourAgo : t.minAgo(m)}
                      </Chip>
                    ))}
                  </div>
                </>
              ) : null}
              <input
                id="end-pick"
                className="time-input"
                type="time"
                aria-label="End time"
                value={a.ended_at ? hhmm(a.ended_at) : ""}
                onChange={(e) => {
                  const ref = new Date(Math.max(Date.now(), Date.parse(a.started_at)));
                  const d = timeOnOrBefore(e.target.value, ref);
                  if (d && d.getTime() >= Date.parse(a.started_at))
                    save({ ended_at: d.toISOString(), end_source: "adjusted", end_confidence: "exact" });
                }}
              />
            </div>
          ) : null}

          {endMode === "asleep" ? (
            <div className="sub">
              <p className="mini-label">{t.roughEnd}</p>
              <div className="chips">
                <Chip on={!a.ended_at} onClick={() => save(approxEnd(null))}>{t.dontKnow}</Chip>
                <Chip on={!!a.ended_at} onClick={() => stepRough(0)}>{t.roughTime}</Chip>
              </div>
              {a.ended_at ? (
                <div className="stepper">
                  <button className="chip" aria-label="15 minutes earlier" onClick={() => stepRough(-15)}>− 15</button>
                  <span className="stepper-val">~{fmtTime(a.ended_at)}</span>
                  <button className="chip" aria-label="15 minutes later" onClick={() => stepRough(15)}>+ 15</button>
                </div>
              ) : null}
            </div>
          ) : null}

          {last && !hasDetail ? (
            <button className="btn same" onClick={() => save(sameAsLast(a, last))}>
              {t.sameAsLast}
            </button>
          ) : null}

          <Field
            title={t.intensity}
            hint={a.intensity_max ? `${a.intensity_max} – ${INTENSITY_HINTS[a.intensity_max]}` : "0–10, tap the worst it got"}
          >
            <div className="grid10">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <Chip key={n} on={a.intensity_max === n} label={`${n} out of 10`} onClick={() => save({ intensity_max: a.intensity_max === n ? null : n })}>
                  {n}
                </Chip>
              ))}
            </div>
          </Field>

          <Field title={t.side}>
            {(["left", "right", "both"] as const).map((s) => (
              <Chip key={s} on={a.side === s} onClick={() => save({ side: a.side === s ? null : s })}>
                {s === "left" ? "Left" : s === "right" ? "Right" : "Both / changed"}
              </Chip>
            ))}
          </Field>

          <Field title={t.sleep}>
            <Chip on={a.woke_from_sleep === true} onClick={() => save({ woke_from_sleep: a.woke_from_sleep === true ? null : true })}>{t.wokeMe}</Chip>
            <Chip on={a.woke_from_sleep === false} onClick={() => save({ woke_from_sleep: a.woke_from_sleep === false ? null : false })}>{t.wasAwake}</Chip>
          </Field>

          <Field title={t.treatment}>
            {visible.map((x) => {
              const on = a.treatments.some((u) => u.code === x.code);
              return (
                <Chip key={x.code} on={on} onClick={() => setTreatment(x.code, on ? null : {})}>
                  {x.short}
                </Chip>
              );
            })}
          </Field>

          {a.treatments.map((u) => {
            const item = TREATMENTS.find((x) => x.code === u.code);
            return (
              <div className="sub treat" key={u.id}>
                <p className="sub-title">{item?.label ?? u.code}</p>
                {u.code === "o2" ? (
                  <>
                    <p className="mini-label">{t.flow}</p>
                    <div className="chips">
                      {O2_FLOWS.map((f) => (
                        <Chip key={f} on={u.flow_lpm === f} onClick={() => setTreatment("o2", { flow_lpm: u.flow_lpm === f ? null : f })}>
                          {f === 20 ? "20+" : f}
                        </Chip>
                      ))}
                    </div>
                    <p className="mini-label">{t.mask}</p>
                    <div className="chips">
                      {O2_MASKS.map((m) => (
                        <Chip key={m.code} on={u.mask === m.code} onClick={() => setTreatment("o2", { mask: u.mask === m.code ? null : m.code })}>
                          {m.short}
                        </Chip>
                      ))}
                    </div>
                  </>
                ) : null}
                <p className="mini-label">{t.worked}</p>
                <div className="chips">
                  {([["full", t.fully], ["partial", t.partly], ["none", t.no]] as [Relief, string][]).map(([r, l]) => (
                    <Chip key={r} on={u.relief === r} onClick={() => setTreatment(u.code, { relief: u.relief === r ? null : r })}>
                      {l}
                    </Chip>
                  ))}
                </div>
                {u.relief && u.relief !== "none" ? (
                  <>
                    <p className="mini-label">{t.reliefAfter}</p>
                    <div className="chips">
                      {RELIEF_MINUTES.map((m) => (
                        <Chip key={m} on={u.relief_after_min === m} onClick={() => setTreatment(u.code, { relief_after_min: u.relief_after_min === m ? null : m })}>
                          {m === 30 ? "30+" : m}
                        </Chip>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}

          <Field title={t.symptoms}>
            {SYMPTOMS.map((s) => (
              <Chip key={s.code} on={a.symptoms.includes(s.code)} onClick={() => save({ symptoms: toggle(a.symptoms, s.code) })}>
                {s.short}
              </Chip>
            ))}
          </Field>

          <Field title={t.triggers}>
            {TRIGGERS.map((s) => (
              <Chip key={s.code} on={a.triggers.includes(s.code)} onClick={() => save({ triggers: toggle(a.triggers, s.code) })}>
                {s.short}
              </Chip>
            ))}
          </Field>
        </>
      ) : (
        <p className="muted">A shadow logged at {fmtTime(a.started_at)}.</p>
      )}

      <div className="field">
        <h3 className="field-title">{t.note}</h3>
        <textarea
          id="note"
          className="note"
          rows={3}
          placeholder={t.notePlaceholder}
          defaultValue={a.notes_text}
          onBlur={(e) => {
            if (e.target.value !== a.notes_text) save({ notes_text: e.target.value });
          }}
        />
      </div>

      <div className="enrich-foot">
        <button className="btn primary wide" onClick={props.onDone}>{t.done}</button>
        {confirmDel ? (
          <div className="confirm">
            <p>{t.confirmDelete}</p>
            <div className="chips">
              <button className="chip" onClick={() => setConfirmDel(false)}>{t.cancel}</button>
              <button
                className="chip danger"
                onClick={async () => {
                  await deleteAttack(a.id);
                  props.onDone();
                }}
              >
                {t.yesDelete}
              </button>
            </div>
          </div>
        ) : (
          <button className="link-btn danger-text" onClick={() => setConfirmDel(true)}>{t.delete}</button>
        )}
      </div>
    </div>
  );
}
