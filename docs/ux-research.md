# UX research: recording a cluster headache attack

*Planning document, 2026-10-08. Evidence gathered by web search; every claim carries its source. Where the evidence is thin or missing, it says so.*

## Takeaway

The person using this app is, at the moment that matters most, in the worst pain a human reports (mean 9.7/10 in a 1,604-person survey; 72% rate it 10/10), cannot sit still, has one eye streaming or shut, is probably in the dark between 21:00 and 03:00, and may be holding an oxygen mask with the other hand. Every published diary app, including the two cluster-specific ones, solves this the same way: **one button to start, fill in details later**. Users praise exactly that feature and complain about everything that gets in its way. So the design brief reduces to three rules:

1. **Start = one tap, zero navigation, zero questions.** Timestamp captured automatically.
2. **Stop = one tap, with "it ended while I was asleep / don't know" as a first-class answer** and an approximate end time, never a required exact one.
3. **Everything else is optional, later, and answered with big chips, not keyboards.**

Clinicians need surprisingly little: attack count per day, duration, side, intensity, what was taken and whether it worked. That maps onto ICHD-3 and onto what trial diaries collect. A 0–10 numeric scale with KIP-style behavioural anchors as hints is the best compromise between patient language and research comparability.

---

## 1. What the moment of recording looks like

**The pain.** In the Clusterbusters-run international survey (Burish et al., *Headache* 2021, n = 1,604), cluster headache attacks were rated 9.7 ± 0.6 on a 0–10 scale, above labour pain (7.2), pancreatitis (7.0) and kidney stones (6.9); 72.1% of respondents rated attacks at the maximum 10. Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC7898696/

**Restlessness is diagnostic, not incidental.** ICHD-3 criterion C for 3.1 Cluster headache is satisfied by *either* ipsilateral autonomic signs (conjunctival injection/lacrimation, nasal congestion/rhinorrhoea, eyelid oedema, forehead/facial sweating, miosis/ptosis) *or* "a sense of restlessness or agitation". Attacks last 15–180 minutes untreated and occur between once every other day and eight per day. Sources: IHS pocket version https://ihs-headache.org/wp-content/uploads/2020/05/ICHD-3-Pocket-version.pdf ; https://pmc.ncbi.nlm.nih.gov/articles/PMC6709915 . Design consequence: the user is pacing, rocking or pressing on the eye. They will not sit and read a form.

**Night.** A meta-analysis of 16 studies found a circadian pattern in 71% of attacks (3,490/4,953) with a clear peak between 21:00 and 03:00. Source (secondary report): https://hcplive.com/view/cluster-headache-remains-an-enigma-despite-clinical-clues . In Barloese et al. (*Cephalalgia* 2015, 275 patients, 145 controls), sleep was the most frequently reported trigger (80%), 82% described a daily rhythm and 56% a yearly rhythm. Sources: https://pubmed.ncbi.nlm.nih.gov/26289164 ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4542772/ . In Fourier et al. (*Neurology* 2023, n = 874, Sweden) women's attacks clustered at night and early morning; men's were spread across the day; 73.6% of women and 63.3% of men reported diurnal rhythmicity. Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC10033163/ . Design consequence: the app will often be opened in a dark bedroom by someone who was asleep 60 seconds ago. Dark mode is not a nicety.

**Ends in sleep.** Nocturnal attacks are frequently followed by sleep, so the end time is unknown. Tim's brief says this directly and the ClusterUck reviews corroborate: one user asked for a "copy / repeat" function specifically for frequent night attacks. Source: https://apps.apple.com/app/id1072769448 . No published study quantifies how often the end goes unrecorded; treat it as a known-unknown the app should measure (the dataset will tell us).

**Oxygen.** First-line abortive is 100% oxygen via non-rebreather mask: 78% relief at 15 minutes at 12 L/min vs 20% on room air (RCT, n = 109); 15 L/min is common practice but trial evidence is for 12. Sources: https://www.aafp.org/pubs/afp/issues/2010/0801/p284.pdf ; https://practicalneurology.com/diseases-diagnoses/headache-pain/cluster-headache-acute-therapies/31521/ . Design consequence: one hand is holding a mask against the face. Assume **one-thumb** use for the whole start and stop flow.

## 2. Recording during severe pain: what diary users say

- A Migraine Buddy user review: "trying to record in the midst of a migraine is essentially impossible... even when photophobic, I can usually click 'record an attack' and fill in the details later." Their main complaint was that symptoms and triggers go on a separate notes page rather than being timestamped as they are logged. Source: https://migraine.com/stories/migraine-buddy-app-review
- A clinical review of Migraine Buddy notes that logging a full headache takes about 1–2 minutes because of the number of questions. Source: https://healthify.nz/migraine-buddy-app
- ClusterUck (cluster-specific, iOS, 4.8/5 from 38 ratings): users praise that you "just press a button to start" and the timer runs until stopped; a 2018 reviewer said that when attacks come on fast, even opening the app was "next to impossible", mitigated by editable start/end times. Source: https://apps.apple.com/app/id1072769448
- MyClusters (cluster-specific, iOS, by a sufferer; 4.4/5 from 5 ratings): uses iOS Live Activities so the running attack sits on the lock screen and Dynamic Island; "Trace Logs" record pain changes, meds and oxygen with timestamps, "live or reconstructed afterward". Pro tier $9.99/month. Source: https://apps.apple.com/app/id6745556184
- Qualitative analysis of 945 app-store reviews of 15 headache diary apps (Minen et al., *Headache* 2020): four themes were tracking characteristics/triggers/treatments, app usability (technical difficulties limit use; users want to view and edit existing records), personalisation and trend features as motivators, and ease of exporting and viewing data, which the authors call "critical". Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC8640611
- Of 38 headache diary apps reviewed in 2014, none met all seven quality criteria and only 18% were built with clinical headache expertise. Source: https://oalib-perpustakaan.upi.edu/Record/doaj_4cfacf71792f40dabc5f57bc5fc63d6f/Description?print=1 (Hundert et al., JMIR mHealth 2014)
- A 2022 cross-sectional assessment of headache, insomnia and pain apps found shared weaknesses: limited privacy, limited accessibility, little tailoring. Source: https://mhealth.jmir.org/article/export/bib/mhealth_v10i6e36761 (Minen et al., JMIR mHealth 2022)

**Lesson:** "log now, detail later" is table stakes; the differentiators are (a) how few taps the start needs, (b) whether details are timestamped in-line rather than on a separate notes page, (c) editability, (d) export.

## 3. One-handed, low-vision, eyes-closed use

- Hoober's 2013 observation of 1,333 phone users: 49% held one-handed, 36% cradled, 15% two-thumbed. His 2014 tap study found the **centre of the screen** is the fastest and most accurate target; people shift grip to reach everything else. Osmani's later guidance: put primary actions in the centre, secondary on the edges, and stop relying on the classic "thumb zone" heat-map. Sources: https://smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users ; https://addyosmani.com/blog/touch-friendly-design/
- Nobody has published a study of eyes-closed phone use by headache patients. Reasonable inferences: the start button should occupy most of the screen so it cannot be missed; the stop button should be in the same place so muscle memory works; confirmation should be multimodal (colour change + large text + haptic/sound where available).
- Watering/closed eye on one side reduces depth perception and acuity; use high-contrast text at or above 20 px for anything that must be read mid-attack, and keep everything else off that screen.

## 4. Night use and screen brightness

- Evidence for dark mode is modest and mostly about comfort in dim rooms and OLED battery; the melatonin claim is weaker and contested. Design guides advise dark grey (not pure black) with off-white text to avoid halation, which some users experience with true black. Sources: https://icons8.com/blog/articles/dark-mode-guide ; https://www.androidauthority.com/dark-mode-1046425/ ; https://blog.superhuman.com/why-do-people-use-dark-mode/
- Photophobia is listed as a headache-specific barrier by clinicians when recommending apps. Source: https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2023.1270555/full
- Practical rule for this app: follow the OS theme by default, offer a manual override, and add a **"night" variant** that uses the dark palette at lower luminance (near-black surface, muted orange, no pure white). Avoid white flashes on load (set `color-scheme` and `background` on `<html>` so there is no white frame before CSS loads).

## 5. Accessibility specifics

- **Target size.** WCAG 2.2 SC 2.5.8 Target Size (Minimum), level AA: at least 24×24 CSS px, with spacing/inline/essential exceptions. The older AAA SC 2.5.5 asks for 44×44 CSS px. Sources: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22 ; https://dequeuniversity.com/rules/axe/4.8/target-size . This app should far exceed both: the start/stop control should be a full-width button at least 120 px tall; chips at least 56 px tall.
- **Haptics.** `navigator.vibrate()` is not supported in Safari on iPhone or iPad (and therefore not in any iOS browser, since all use WebKit). A hidden-switch workaround existed from iOS 17.4 but is reported broken in iOS 26.5 (unverified). Android Chrome supports the API. Sources: https://bugnet.io/blog/fix-web-game-vibrate-api-not-available-ios-safari ; https://www.mintlify.com/lochie/web-haptics/advanced/browser-support ; https://rapidtoolset.com/en/tool/ios-haptics-tester . Design consequence: feature-detect, use vibration on Android, and give a visible + optional audible confirmation everywhere.
- **Voice.** No cluster- or headache-specific evidence found on voice input. Notes can use the OS keyboard's dictation button, which costs nothing to support; a custom speech pipeline is not justified for v1.
- **Reduced motion / large text.** Respect `prefers-reduced-motion`; use `rem` units so OS text scaling works; the start/stop screen must still fit without scrolling at 200% text size.

## 6. Cluster-specific diaries: prior art

| App | Platform | Start/stop | Notable | Source |
|---|---|---|---|---|
| ClusterUck | iOS + Apple Watch, free, EN/NL/FR/DE | One-button timer | Duration, location, triggers, symptoms, meds+effectiveness, weather; PDF/CSV export; no data collected by developer | https://apps.apple.com/app/id1072769448 |
| MyClusters | iOS, free + Pro $9.99/mo | Live Activities on lock screen | Trace logs live or reconstructed; cycle stats; preventive reminders; PDF export | https://apps.apple.com/app/id6745556184 |
| Migraine Buddy | iOS/Android | "Record an attack" then details | Market leader, migraine-centric, 1–2 min per full log | https://healthify.nz/migraine-buddy-app |

- No peer-reviewed validation of any cluster-specific diary app was found. The Leiden e-diary study (Cephalalgia 2021, n = 596) explicitly excluded patients screening positive for cluster headache. Source: https://pubmed.ncbi.nlm.nih.gov/33938248/
- A Clusterbusters forum thread shows patients resorting to ChatGPT to find tracking tools, which suggests the market is under-served. Source: https://clusterbusters.org/forums/topic/24216-exploring-ai-tools-for-managing-cluster-headache-triggers/
- The KIP scale page on clusterbusters.org now redirects to clusterheadachealttreatments.org, so that resource has moved.

**Gap this app can fill:** cross-platform (Android users have nothing cluster-specific in these results), web-based, free, with an explicit "ended in sleep" state and an opt-in research dataset.

## 7. What clinicians want from a cluster diary

- Minen et al. (*Frontiers in Neurology* 2024; 20 US headache providers interviewed): core wants are **frequency, severity, acute medication use and whether it worked**; trends over 1, 3 and 12 months; auto-generated graphs; simple colour coding is fine. Frustrations: complex diaries get abandoned, cost, light sensitivity, and over-tracking making some patients fixate. 85% recommend smartphone tracking. Source: https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2023.1270555/full
- Trial e-diaries define the research-grade minimum: a galcanezumab chronic CH trial collected attacks per day, abortive medication use, attack duration and pain severity daily; an eptinezumab trial scaled reported attacks to 28 days to handle missing days. Sources: https://cdn.clinicaltrials.gov/large-docs/26/NCT02438826/SAP_001.pdf ; https://cdn.clinicaltrials.gov/large-docs/97/NCT05064397/Prot_000.pdf
- ICHD-3 fields that make the data diagnostically useful: duration (untreated), side, autonomic features, restlessness, attacks per day, and bout structure (episodic: bouts 7 days–1 year separated by ≥3 months remission; chronic: ≥1 year without ≥3-month remission). Source: https://ihs-headache.org/wp-content/uploads/2020/05/ICHD-3-Pocket-version.pdf
- Abortives and time-to-relief: oxygen (flow rate, mask type, minutes to relief; the trial endpoint is relief at 15 min), subcutaneous sumatriptan 6 mg (max two per 24 h, at least 1 h apart; 74% response at 15 min), and nasal triptans. Sources: https://www.aafp.org/pubs/afp/issues/2010/0801/p284.pdf ; https://niformulary.hscni.net/formulary/4-0-central-nervous-system/4-7-analgesics/4-7-4-antimigraine-drugs/review-copy-of-4-7-4-3-drug-treatment-of-cluster-headache-2
- Triggers worth offering as chips: alcohol (reported by 31–50% depending on survey), sleep/nap, lack of sleep, weather change, bright light, lying flat. Sources: https://pmc.ncbi.nlm.nih.gov/articles/PMC6771706 ; https://ouchuk.org/sites/default/files/downloads/cluster_headache_survey.pdf

## 8. Recall bias: why timestamps beat memory

- Leiden Headache Center data: retrospectively self-reported vs diary-measured monthly migraine days differed by 4.7 days/month on average, in both directions. A 48-hour time-lock on diary entries is used to limit backfilling; median compliance was 96.4%. Source: https://books.ipskampprinting.nl/thesis/56016-vdArend/47 ; https://books.ipskampprinting.nl/thesis/56016-vdArend/54
- A 20-week migraine study (n = 182) found recall questionnaires underestimated headache days vs diary in every period. Source: https://thejournalofheadacheandpain.biomedcentral.com/track/pdf/10.1007/s10194-012-0473-2
- Peak-end effects: recalled pain is weighted toward peak and end moments; recall bias grows with pain variability. Effects are modest but systematic. Sources: https://pmc.ncbi.nlm.nih.gov/articles/PMC2796846 ; https://researchconnect.stonybrook.edu/en/publications/peak-and-end-effects-in-patients-daily-recall-of-pain-and-fatigue ; https://pmc.ncbi.nlm.nih.gov/articles/PMC9924980
- Only about 50–65% of variance is shared between one-week recall and averaged momentary ratings. Source: https://c-path.org//wp-content/uploads/2013/09/2011IdentifyingOptimalRecallPeriod.pdf

**Design consequences.** (1) Capture start time automatically at the tap; this is the single most valuable datum. (2) Record *when* each field was entered (`recorded_at` vs `occurred_at`) so researchers can weight live vs reconstructed entries. (3) Allow backfilling but flag it; consider a soft time-lock (entries older than 48 h are marked "reconstructed"). (4) Never ask for an average over a week; ask per attack.

## 9. Intensity scale: recommendation

- **KIP scale** (Bob Kipple, patient-devised, 0–10): behavioural anchors from "shadows come and go" (1) through "restless, need space, not yet pacing" (5) to "screaming, head banging, ER" (10). Widely used by patients, "no KIP 11". Not scientifically validated and therefore rarely used in research; patients themselves say the low end is weak and it means little to non-sufferers. Sources: https://flexikon.doccheck.com/de/KIP-Skala ; https://mail.ouchuk.org/downloads ; https://clusterbusters.org/forums/topic/4702-pain-level-scale/
- **NRS 0–10** is what the survey literature and trials use (the 9.7 figure above is NRS).

**Recommend:** store a 0–10 integer, present it as a row of large chips with KIP-style one-line anchors as hint text (e.g. "7 – pacing, can't sit"). Patients get the vocabulary they already use; researchers get NRS-comparable integers. Also offer **"shadow"** as a distinct event type (sub-attack pain), since patients track it and it may predict bouts.

## 10. Open evidence gaps

- No study on eyes-closed or mask-in-hand phone interaction.
- No data on what fraction of nocturnal attacks have unknown end times.
- No validated cluster-specific diary app; this app could be the first to publish its instrument.
- Voice-first logging is unstudied in headache; worth a v2 experiment.
