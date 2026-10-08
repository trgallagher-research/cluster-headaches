"use client";
import { useRef, useState } from "react";
import { Settings, TREATMENTS } from "@/lib/model";
import { dayKey } from "@/lib/logic";
import { exportBackup, importBackup, saveSettings, wipeAll } from "@/lib/db";
import { t, APP_NAME } from "@/lib/strings";
import { Chip, Field, SectionTitle, toggle } from "./ui";
import { downloadFile } from "./History";

export function SettingsView(props: { settings: Settings; persisted: boolean | null }) {
  const s = props.settings;
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="settings">
      <SectionTitle>{t.settings}</SectionTitle>

      <Field title="Theme" hint="Night is extra dim for 3 a.m. attacks.">
        {(["auto", "light", "dark", "night"] as const).map((th) => (
          <Chip key={th} on={s.theme === th} onClick={() => saveSettings({ theme: th })}>
            {th[0].toUpperCase() + th.slice(1)}
          </Chip>
        ))}
      </Field>

      <Field title="My treatments" hint="Only the ones you switch on appear when you log an attack.">
        {TREATMENTS.map((x) => (
          <Chip
            key={x.code}
            on={!s.hidden_treatments.includes(x.code)}
            onClick={() => saveSettings({ hidden_treatments: toggle(s.hidden_treatments, x.code) })}
          >
            {x.label}
          </Chip>
        ))}
      </Field>

      <Field title="New bout after a gap of" hint="Used for the “Bout day” count on Home.">
        {[7, 14, 21, 30].map((d) => (
          <Chip key={d} on={s.bout_gap_days === d} onClick={() => saveSettings({ bout_gap_days: d })}>
            {d} days
          </Chip>
        ))}
      </Field>

      <div className="field">
        <h3 className="field-title">Your data</h3>
        <p className="hint">
          Everything stays on this phone. Nothing is sent anywhere. Make a backup now and then: browsers can clear
          site data, especially on iPhone if the app isn&apos;t on your Home Screen.
          {props.persisted === true ? " This browser has agreed to keep your data." : ""}
        </p>
        <div className="chips">
          <button
            className="chip"
            onClick={async () => {
              const b = await exportBackup();
              downloadFile(`clusterlog-backup-${dayKey(new Date())}.json`, JSON.stringify(b, null, 2), "application/json");
            }}
          >
            Download backup
          </button>
          <button className="chip" onClick={() => fileRef.current?.click()}>Restore from backup</button>
          <input
            ref={fileRef}
            id="restore-file"
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const n = await importBackup(JSON.parse(await f.text()));
                setMsg(`Restored ${n} attack${n === 1 ? "" : "s"}.`);
              } catch (err) {
                setMsg(err instanceof Error ? err.message : "That file couldn't be read.");
              }
              e.target.value = "";
            }}
          />
        </div>
        {msg ? <p className="hint" role="status">{msg}</p> : null}
      </div>

      <div className="field">
        <h3 className="field-title">Add to Home Screen</h3>
        <p className="hint">
          iPhone: open this page in Safari, tap Share, then “Add to Home Screen”. Android: Chrome menu → “Install app”;
          long-press the icon for a “Start attack” shortcut.
        </p>
      </div>

      <div className="field">
        <h3 className="field-title">Delete everything</h3>
        {confirmWipe ? (
          <div className="confirm">
            <p>Delete all attacks and settings on this phone? This can&apos;t be undone.</p>
            <div className="chips">
              <button className="chip" onClick={() => setConfirmWipe(false)}>{t.cancel}</button>
              <button
                className="chip danger"
                onClick={async () => {
                  await wipeAll();
                  setConfirmWipe(false);
                  setMsg("All data deleted.");
                }}
              >
                Yes, delete everything
              </button>
            </div>
          </div>
        ) : (
          <button className="chip" onClick={() => setConfirmWipe(true)}>Delete all data…</button>
        )}
      </div>

      <p className="muted small">
        {APP_NAME} v0.1 · A personal diary, not medical advice. Looking for help or a diagnosis? See clusterinfo.org.
      </p>
    </div>
  );
}
