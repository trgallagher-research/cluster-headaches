"use client";
import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, addAttack, requestPersist } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/model";
import { isRunning, newAttack } from "@/lib/logic";
import { t, APP_NAME } from "@/lib/strings";
import { Home } from "./Home";
import { Enrich } from "./Enrich";
import { History } from "./History";
import { SettingsView } from "./SettingsView";
import { Summary } from "./Summary";

type View =
  | { name: "home" }
  | { name: "attack"; id: string; fresh: boolean }
  | { name: "history" }
  | { name: "settings" }
  | { name: "summary" };

export default function App() {
  const attacks = useLiveQuery(() => db().attacks.toArray(), []);
  const settingsRow = useLiveQuery(() => db().settings.get("settings"), []);
  const settings = settingsRow ?? DEFAULT_SETTINGS;
  const [view, setViewState] = useState<View>({ name: "home" });
  const [now, setNow] = useState(() => new Date());
  const [justStartedId, setJustStartedId] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const handledAction = useRef(false);

  const running = attacks?.filter(isRunning).sort((x, y) => Date.parse(y.started_at) - Date.parse(x.started_at))[0];

  // Clock: every second while an attack runs, otherwise every 30 s.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), running ? 1000 : 30_000);
    setNow(new Date());
    return () => clearInterval(id);
  }, [!!running]); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme: "auto" follows the phone; others pin it.
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "auto") delete root.dataset.theme;
    else root.dataset.theme = settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    requestPersist().then(setPersisted);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Android home-screen shortcut: /?action=start begins an attack straight away.
  useEffect(() => {
    if (!attacks || handledAction.current) return;
    handledAction.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") !== "start") return;
    window.history.replaceState(null, "", "/");
    if (!attacks.some(isRunning)) {
      const a = newAttack(new Date());
      addAttack(a).then(() => setJustStartedId(a.id));
    }
  }, [attacks]);

  // Keep the phone's Back button useful: any view other than Home sits on a history entry.
  function setView(v: View) {
    if (v.name !== "home" && view.name === "home") window.history.pushState({ v: v.name }, "");
    setViewState(v);
  }
  useEffect(() => {
    const onPop = () => setViewState({ name: "home" });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  function goHome() {
    if (view.name !== "home" && window.history.state?.v) window.history.back();
    else setViewState({ name: "home" });
  }

  if (!attacks) return <div className="loading" aria-busy="true" />;

  const current = view.name === "attack" ? attacks.find((a) => a.id === view.id) : undefined;

  let body;
  if (view.name === "attack" && current && !current.deleted_at) {
    body = <Enrich key={current.id} attack={current} attacks={attacks} settings={settings} fresh={view.fresh} onDone={goHome} />;
  } else if (view.name === "history") {
    body = <History attacks={attacks} now={now} openAttack={(id) => setViewState({ name: "attack", id, fresh: false })} openSummary={() => setViewState({ name: "summary" })} />;
  } else if (view.name === "settings") {
    body = <SettingsView settings={settings} persisted={persisted} />;
  } else if (view.name === "summary") {
    body = <Summary attacks={attacks} now={now} onBack={() => setViewState({ name: "history" })} />;
  } else {
    body = (
      <Home
        attacks={attacks}
        running={running}
        settings={settings}
        now={now}
        openAttack={(id, fresh) => setView({ name: "attack", id, fresh })}
        justStartedId={justStartedId}
        setJustStartedId={setJustStartedId}
      />
    );
  }

  const tab = view.name === "history" || view.name === "summary" ? "history" : view.name === "settings" ? "settings" : "home";

  return (
    <div className="app">
      <header className="top no-print">
        <span className="brand">{APP_NAME}</span>
        <button className={"icon-btn" + (tab === "settings" ? " on" : "")} aria-label={t.settings} onClick={() => (tab === "settings" ? goHome() : setView({ name: "settings" }))}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Zm7.43-2.53a7.8 7.8 0 0 0 0-1.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.4 7.4 0 0 0-1.68-.97l-.36-2.54A.5.5 0 0 0 14.14 2h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.6.24-1.17.57-1.68.97l-2.39-.96a.5.5 0 0 0-.6.22L2.86 8.51a.5.5 0 0 0 .12.64l2.03 1.58a7.8 7.8 0 0 0 0 1.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.6.22l2.39-.96c.51.4 1.08.73 1.68.97l.36 2.54c.04.24.25.42.49.42h3.84c.24 0 .45-.18.49-.42l.36-2.54c.6-.24 1.17-.57 1.68-.97l2.39.96c.22.08.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58Z"
            />
          </svg>
        </button>
      </header>
      <div className="rule no-print" />

      <main className="main">{body}</main>

      {view.name !== "attack" && !running ? (
        <nav className="tabs no-print" aria-label="Main">
          <button className={"tab" + (tab === "home" ? " on" : "")} aria-current={tab === "home" ? "page" : undefined} onClick={goHome}>
            {t.home}
          </button>
          <button className={"tab" + (tab === "history" ? " on" : "")} aria-current={tab === "history" ? "page" : undefined} onClick={() => setView({ name: "history" })}>
            {t.history}
          </button>
        </nav>
      ) : null}
    </div>
  );
}
