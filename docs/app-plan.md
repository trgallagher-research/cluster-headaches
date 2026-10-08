# App plan: cluster headache attack tracker

*Planning document, 2026-10-08. Companion to `ux-research.md` (evidence), `research-dataset.md` (data donation) and `open-questions.md` (decisions).*

## Takeaway

Build a **mobile-first, offline-first PWA** with one job: make starting and stopping an attack a single tap, then let the user add detail later with big chips. Three screens cover 95% of use: **Home (start/stop)**, **Attack detail**, **History/export**. Store everything locally first (IndexedDB), sync to Supabase when online, and keep the optional research donation as a separate, pseudonymised pipeline. Ship an MVP in weeks, not months, with Next.js + Supabase on Vercel, which Tim already knows.

---

## 1. Principles

1. **One tap to start, one tap to stop.** No login wall, no question, no navigation between the home screen icon and the START button.
2. **Log now, detail later.** The attack record is valid with only a start time. Every other field is optional and can be added hours or days later.
3. **Timestamps are the truth.** Auto-capture `started_at` on tap; store `recorded_at` separately for every field so live and reconstructed entries can be told apart.
4. **"Don't know" is a valid answer.** Especially for end time: "ended while asleep / not sure" is a first-class state, never a validation error.
5. **Chips, not keyboards.** Intensity, side, treatments, triggers and symptoms are all tap-to-select with last-used values pre-selected.
6. **Dark by default at night.** Follow OS theme, with a dimmer "night" variant and no white flash on load.
7. **Works with no network.** Attacks happen in cars, on planes, in basements. Local store first, sync opportunistically.
8. **The app is complete without donating data.** Research consent is separate and revocable.
9. **Export anything, any time.** CSV and PDF for the user's own doctor; no lock-in.
10. **Fewer features, bigger targets.** Every proposed feature must survive the question: "would this help at 3 a.m. on oxygen?"

## 2. Core flow: start

**Goal: ≤ 2 seconds from phone in hand to attack recorded.**

Path on iOS (PWA installed via Safari "Add to Home Screen"): tap icon → app opens on Home → tap START. The web app manifest `shortcuts` member is not supported on iOS (https://firt.dev/notes/pwa-ios/ ; https://web.dev/learn/pwa/enhancements), so there is no long-press quick action; the home screen *is* the START screen. Users can go further by making a Shortcut that opens the app URL and assigning it to the Action Button or Back Tap (https://support.apple.com/en-mide/guide/shortcuts/apd621a1ad7a/ios ; https://mybyways.com/blog/shortcuts-on-iphone-home-screen/); provide a help page for this, do not depend on it.

Path on Android (installed PWA): same, plus manifest `shortcuts` give a long-press "Start attack" action that deep-links to `/?action=start`, which starts immediately on load.

On tap:
- Create attack `{id, started_at: now(), start_source: "live"}` in IndexedDB.
- Screen turns into the **running** state (large elapsed timer, STOP button in the same position).
- Confirmation: colour change + large text; `navigator.vibrate(50)` where supported (Android only, see ux-research §5); optional short sound.
- No modal, no prompt. The only secondary control is a small "wrong tap? undo" link visible for 10 seconds.

**"Started earlier" affordance:** under the timer, one row of chips: `now · 5 min ago · 15 min · 30 min · 1 h · pick`. Tapping adjusts `started_at` and sets `start_source: "adjusted"`. This answers the ClusterUck complaint that opening the app can lag the attack onset.

## 3. Core flow: stop

Tap STOP → attack gets `ended_at: now()`, `end_source: "live"`. Screen shows a **three-chip "how did it end?" strip** (dismissable; defaults to the first):

```
[ Ended now ]   [ Ended earlier… ]   [ Ended in sleep / not sure ]
```

- **Ended earlier…** → chips `5 · 15 · 30 · 60 min ago · pick time`.
- **Ended in sleep / not sure** → sets `end_source: "asleep"` (or `"unknown"`), `end_confidence: "approx"`, and shows an **approximate end-time picker in 15-minute steps**, pre-filled with the *last-known-awake* time if the user gives it, otherwise left null. Duration is then stored as a range (`min_duration` = time from start to last interaction with the app; `max_duration` = to wake time or null). Researchers get honest data instead of fake precision.
- The strip is followed by the optional detail chips (§4). The user can leave at any point; the attack is already saved.

**Forgotten stop:** if an attack has been running for > 3 h (the ICHD-3 upper bound) the Home screen shows "Still going?" with `Yes · It ended (set time) · Ended in sleep`. A local notification at 3 h is used where the PWA has permission (iOS requires installed PWA for push; see https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide). On next app open, any attack still "running" from a previous day is auto-flagged `end_source: "unknown"` and surfaced for a one-tap fix.

## 4. Fast enrichment after the attack

Shown on the stop screen and on the attack detail page; all optional, all chips, **last-used values pre-selected** so a typical night attack is confirmed with one tap on "Same as last time".

```
Intensity   [1][2][3][4][5][6][7][8][9][10]     hint: "7 – pacing, can't sit still"
Side        [Left] [Right] [Both/changed]
Treatment   [O2 ▸] [Sumatriptan inj] [Sumatriptan nasal] [Zolmitriptan nasal] [Caffeine/energy drink] [Other…]
            O2 ▸ opens: flow [10][12][15][20+] L/min · mask [NRB][demand valve][other] · "relief in" [5][10][15][20][30][no relief]
Worked?     [Yes, fully] [Partly] [No]   (per treatment, with "relief after N min")
Symptoms    [Eye watering] [Eye red] [Eyelid droop] [Nose blocked/runny] [Sweating] [Restless/pacing] [Nausea] [Light-sensitive]
Triggers    [Alcohol] [Nap] [Poor sleep] [Lying down] [Heat/weather] [Bright light] [Stress] [Smell] [None noticed]
Context     [Woke me] [Was awake] [Shadow before] [Other…]
Note        [ dictate / type ]  (uses OS dictation; free text, timestamped)
```

- Each tap writes immediately; there is no Save button. Each field stores `recorded_at`.
- A per-user **treatment list** (set up once in Settings) limits the Treatment row to what the user actually has, with their usual dose/flow as defaults.
- The chip set, labels and order are configurable in Settings; defaults mirror ICHD-3 and the common trigger surveys (see ux-research §7).

## 5. Screens

Aim: three primary screens plus Settings. No tab bar with five icons; a two-item bottom bar (Home · History) and a Settings gear.

### 5.1 Home (idle)

```
┌──────────────────────────────┐
│  CLUSTER TRACKER     ◐  ⚙    │  ← mono kicker, theme toggle, settings
│                              │
│  Today: 2 attacks · 51 min   │  ← one line, muted
│  Bout day 12                 │
│                              │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │                          │ │
│ │         START            │ │  ← orange, ≥ 45% of viewport height
│ │        ATTACK            │ │
│ │                          │ │
│ │                          │ │
│ └──────────────────────────┘ │
│                              │
│  [ Shadow ]  [ Took preventive ]   ← secondary, purple outline chips
│                              │
│  Last: 02:14–03:05 · 8/10 · O2 ✓  │  ← tap to edit
├──────────────────────────────┤
│   ● Home        History      │
└──────────────────────────────┘
```

### 5.2 Home (running)

```
┌──────────────────────────────┐
│  ATTACK IN PROGRESS          │
│                              │
│        00:17:42              │  ← big mono timer
│  Started 02:14  [earlier ▾]  │  ← chips: 5 · 15 · 30 · 60 min · pick
│                              │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │          STOP            │ │  ← same position/size as START, dark purple
│ │                          │ │
│ └──────────────────────────┘ │
│                              │
│  Quick add (optional):       │
│  [O2 on]  [Sumatriptan]  [8/10]   ← timestamped events during attack
│                              │
│  undo start                  │
└──────────────────────────────┘
```

### 5.3 Stop / enrich (same screen, after STOP)

```
┌──────────────────────────────┐
│  Attack saved · 51 min   ✓   │
│                              │
│  How did it end?             │
│  [Ended now] [Earlier…] [In sleep / not sure]
│    ↳ if "in sleep": "Roughly when were you asleep / awake?"
│      [ 02:45 ]  [ not sure ]   (15-min steps)
│                              │
│  [ Same as last time ✓ ]     │  ← one tap fills chips from previous attack
│                              │
│  Intensity  1 2 3 4 5 6 7 [8] 9 10
│  Side       [Left] Right  Both
│  Treatment  [O2 15 L ✓ 12 min] [Suma inj] …
│  Worked?    [Fully] Partly  No
│  Symptoms   [Eye water] [Restless] …
│  Triggers   [Nap] …
│  Note       ( dictate )      │
│                              │
│  Done                        │  ← or just leave; it's saved
└──────────────────────────────┘
```

### 5.4 History

```
┌──────────────────────────────┐
│  HISTORY            Export ▾ │  ← CSV · PDF summary · JSON
│  [Week] [Month] [Bout] [Year]│
│  ▁▂▅▇▃▁▁▂▆█▅▂  attacks/day   │  ← tiny bar chart, colour = max intensity
│  ─────────────────────────── │  ← gradient rule
│  Tue 07 Oct                  │
│   02:14–03:05  51m  8/10  L  O2✓  Woke me
│   14:40–15:10  30m  6/10  L  Suma✓
│  Mon 06 Oct                  │
│   01:50–?      ~1h  9/10  L  O2✓  ended in sleep
│  …                           │
├──────────────────────────────┤
│     Home        ● History    │
└──────────────────────────────┘
```

Tap a row → Attack detail (same chip layout as 5.3, plus delete and "duplicate for another attack", answering the ClusterUck request for a repeat function).

### 5.5 Settings

Profile (optional; needed only for research), my treatments and defaults, chip customisation, theme (auto / light / dark / night), bout status (in bout / remission / chronic), reminders, research consent (separate page, see research-dataset.md), export/delete all data, about.

## 6. Data model

Keep it small; every table has `id (uuid)`, `created_at`, `updated_at`, `deleted_at` (soft delete for sync).

```
user
  id, auth_id (nullable until they sign in), locale, theme, created_at

profile (optional, 1:1)                       -- only filled if the user chooses
  user_id, birth_year, birth_month?, sex_at_birth, country, onset_year,
  diagnosis (self-reported: none | suspected | diagnosed), diagnosed_year?,
  ch_type (episodic | chronic | unknown), diagnosing_clinician_type?

bout
  id, user_id, started_on, ended_on?, type (bout | remission | chronic),
  notes

attack
  id, user_id, bout_id?,
  started_at (tz-aware), start_source (live | adjusted | reconstructed),
  ended_at?, end_source (live | adjusted | asleep | unknown | reconstructed),
  end_confidence (exact | approx | unknown), last_awake_at?,
  intensity_max (0–10)?, side (left | right | both | changed)?,
  woke_from_sleep (bool)?, is_shadow (bool, default false),
  notes_text?, recorded_fields_at (jsonb: field → timestamp)

attack_event                                   -- things that happened during the attack
  id, attack_id, at, kind (treatment | intensity | symptom | note),
  treatment_id?, dose?, flow_lpm?, mask_type?, relief_after_min?, relief (full | partial | none)?,
  intensity?, symptom_code?, note?

treatment                                      -- user's own list, seeded from a catalogue
  id, user_id, catalogue_code (o2 | sumatriptan_sc | sumatriptan_nasal | zolmitriptan_nasal |
       caffeine | other), label, default_dose, default_flow_lpm, default_mask, is_preventive

symptom / trigger (reference tables, codes + labels, user-extendable)
attack_symptom (attack_id, code)      attack_trigger (attack_id, code)

preventive_log
  id, user_id, treatment_id, at, dose, note

research_consent
  user_id, version, granted_at, withdrawn_at?, scope (jsonb), pseudonym_id (uuid, separate from user_id)

sync_queue (local only): op, table, row_id, payload, queued_at
```

Notes:
- `intensity_max` lives on the attack; intensity changes over time go in `attack_event`, which is how MyClusters' "trace log" idea is kept without complicating the main flow.
- Duration is derived, never stored: `ended_at − started_at`, with `end_confidence` telling you how much to trust it.
- `bout_id` is assigned automatically: an attack starts a new bout if the previous attack was > 14 days ago (configurable), and the user can merge/split in Settings. Episodic vs chronic is inferred from bout history (ICHD-3: remission ≥ 3 months) and shown, not asked.
- Timezones: store UTC plus the IANA zone at capture; night/day analysis needs local time.

## 7. Offline-first and sync

- **Local source of truth:** IndexedDB (via Dexie). Every write goes local first. The app must be fully usable with the network off, including history and export.
- **Service worker:** precache the app shell; the Home screen must render from cache in < 1 s. Do not rely on Background Sync (not supported on iOS; see https://edana.ch/en/2026/04/05/can-a-web-app-pwa-really-work-offline-like-a-native-app/). Instead replay `sync_queue` on app open and on `online` events.
- **Eviction risk on iOS:** WebKit can evict storage for sites not used for a while; installed PWAs fare better but Apple publishes no guarantee (https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide). Mitigations: call `navigator.storage.persist()`, nudge the user to install to Home Screen, sync to the server as soon as they create an account, and offer a one-tap local JSON backup.
- **Accounts:** optional. Anonymous local use works indefinitely. Signing in (magic link or passkey) enables multi-device sync and server backup. Supabase row-level security keys rows to `auth.uid()`.
- **Conflict rule:** last-writer-wins per field using `recorded_fields_at`; attacks are rarely edited on two devices at once.
- **Encryption:** at rest on Supabase (default); consider client-side encryption of `notes_text` in v2 since free text is where identifying detail leaks.

## 8. Exports for doctors

- **CSV:** one row per attack with derived duration, plus a second CSV of events. Matches what ClusterUck offers and what Minen 2020 reviewers call critical.
- **PDF summary (1–2 pages):** period, attacks per day chart, attack count, median duration, intensity distribution, side, % nocturnal, treatments used and % relief at 15 min, preventives, bout timeline, a note that end times marked "asleep" are approximate. Generated client-side (e.g. `@react-pdf/renderer` or print stylesheet + `window.print()`), so it works offline and no health data leaves the device for export.
- **Consultation view:** a read-only screen the user can hand over in clinic with the same summary (clinicians in Minen 2024 said they will look at a phone screen or a PDF; EMR integration is out of scope).

## 9. Visual design

Reuse the tokens already in `site/index.html`: white `#ffffff` / dark `#14121c` backgrounds, orange `#f85604` (dark: `#ff7a33`), purple `#4f2ac4` (dark: `#a98cff`), dark purple `#3b2a87`, light purple `#e5e7ff`, text `#1a202c` / `#4a5568`, gradient rule `linear-gradient(90deg,#ff5600,#d5c3e2,#a780fd)`, DM Mono for section titles and the timer, Manrope for body. Add a **night** theme: surface `#0e0d14`, orange toned down to `#e06a2b`, text `#d9d7e3`, and the START button drawn as an outlined-plus-fill at reduced luminance. Use the look, not the ClusterFree name or logo.

## 10. Tech stack (solo builder)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript**, deployed on **Vercel** | Tim knows it; static export of the app shell works well as a PWA; API routes for export/consent endpoints |
| PWA | `@serwist/next` (or `next-pwa`) for service worker + manifest | Precaching, offline shell, Android `shortcuts` |
| Local data | **Dexie** (IndexedDB) with `dexie-react-hooks` | Mature, simple, handles the queue |
| Backend | **Supabase** (Postgres, Auth, RLS, Storage) | Tim knows it; RLS makes per-user isolation cheap; EU region (Frankfurt) for GDPR |
| Sync | Hand-rolled queue replay to Supabase via PostgREST; evaluate PowerSync or ElectricSQL only if conflicts bite | Keep v1 simple |
| UI | Tailwind + a handful of hand-written components; no component library | Big custom buttons are the product |
| Charts | Tiny inline SVG bars; avoid heavy chart libs | Offline, fast, themeable |
| PDF | Print stylesheet first; `@react-pdf/renderer` if needed | Client-side, offline |
| Analytics | None in v1; later a privacy-respecting, self-hosted counter at most | Health data |
| Hosting alt. | Cloudflare Pages works too if Vercel cost becomes an issue | Static shell either way |

Native wrapper (Capacitor) is a **v2 option**, not a v1 requirement: it would add real haptics, reliable storage, lock-screen Live Activities and App Store presence, but doubles release overhead. Start web-only and measure whether iOS users actually install the PWA.

## 11. Roadmap

**MVP (v0.1, 3–4 weeks of part-time work)**
- Home start/stop with elapsed timer, "started earlier", stop strip incl. "ended in sleep / not sure" with approximate time.
- Enrichment chips (intensity, side, treatment with O2 sub-chips, worked?, symptoms, triggers), "same as last time".
- History list + week/month bars, edit/delete/duplicate.
- Local-only storage, installable PWA, dark/night themes.
- CSV export and print-to-PDF summary.
- No accounts, no server, no research pipeline. Tim uses it himself through a bout and fixes what hurts.

**v0.2 — accounts and sync**
- Supabase auth (magic link / passkey), RLS, sync queue, multi-device, server backup, delete-my-account.
- Bout auto-detection, preventive log, 3-hour "still going?" nudge.

**v1.0 — research donation**
- Optional profile (birth year/month, sex at birth, country, onset year, diagnosis status).
- Separate research consent screen, pseudonymised export pipeline, DPIA done, privacy notice published (see research-dataset.md).
- Public launch via patient groups (the signposting page already lists them).

**v2 — depth**
- Live intensity trace during attack; shadow tracking and bout prediction; Apple Watch / Wear OS via Capacitor; Live Activities; voice-first logging experiment; shared read-only link for a clinician; localisation (NL first, then the 10 languages on the signposting page); import from ClusterUck/MyClusters CSV.

## 12. Risks

- **iOS storage eviction** losing unsynced attacks: mitigate with persist(), early account creation, local backup.
- **Over-building the enrichment screen** and recreating Migraine Buddy's 1–2 minute log: hold the line at one scroll of chips.
- **Tim as the only tester:** recruit 5–10 testers from the Dutch and English patient groups before v1.0; watch them use it, do not survey them.
- **Scope creep from the research goal** into the daily app: keep the two codepaths separate so the app ships even if the dataset waits.
