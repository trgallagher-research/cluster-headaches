# Open questions for Tim

*2026-10-08. Each decision has a recommendation; none is blocking for the MVP unless marked.*

## Product

1. **Name and identity.** The app must not use the ClusterFree name or logo. Pick a name before the MVP so the PWA manifest and home-screen icon are right from the first install. *Recommendation:* a short, non-medical word that reads well as a home-screen label (≤ 12 characters), and reuse the signposting page's visual tokens.

2. **Intensity scale.** 0–10 NRS with KIP-style behavioural hints, KIP labels only, or no scale at all? *Recommendation:* NRS 0–10 chips with one-line KIP-style hints; store the integer. Researchers can compare it with survey data; patients keep their vocabulary.

3. **Shadows.** Track shadows as a separate event type on the Home screen, or ignore in v1? *Recommendation:* a secondary "Shadow" chip under START in v1; it costs little and may predict bouts.

4. **Live intensity trace during an attack.** MyClusters-style trace logs vs a single max intensity. *Recommendation:* single max in v1, optional quick-add events (O2 on, triptan, intensity) in the running state, full trace in v2.

5. **Bout handling.** Auto-detect bouts from gaps (default 14 days) with manual override, or ask the user to mark bout start/end? *Recommendation:* auto-detect with a "merge/split" tool in Settings; ask nothing during attacks.

6. **"Still going?" nudge at 3 hours.** Notification, in-app only, or none? *Recommendation:* in-app prompt on next open in MVP; local notification once accounts/installed-PWA push exist.

7. **Accounts in MVP?** *Recommendation:* no. Local-only for v0.1 while Tim uses it himself; add Supabase auth and sync in v0.2.

8. **Native wrapper (Capacitor) ever?** Gains haptics, Live Activities, Watch, App Store. *Recommendation:* defer; decide after seeing whether iOS testers actually install the PWA and whether storage eviction bites.

9. **Languages.** English only at launch, or English + Dutch? *Recommendation:* build with i18n from day one (strings in one file), ship English + Dutch at v1.0, then the 10 languages on the signposting page as volunteers appear.

10. **Treatment catalogue scope.** Include illegal-in-many-countries substances (psilocybin, LSD, as discussed on clusterbusters.org) as selectable treatments? They are widely used by patients and are research-relevant, but listing them has reputational and legal optics. *Recommendation:* include as neutral catalogue codes ("psilocybin", "LSD/analogues") with no dosing guidance, and let the user hide categories; flag this for the research consent text.

## Research dataset (see research-dataset.md)

11. **Who is the controller?** Tim personally, or a Dutch stichting (foundation)? *Recommendation (blocking before any donation goes live):* a stichting with a two- or three-person board including at least one clinician and one other patient. Limits liability and makes a data access agreement credible.

12. **Birth date granularity.** Full date, year + month, or year only? *Recommendation:* year + month, month optional. Full date adds nothing to the science and much to re-identification risk.

13. **Location granularity.** Country only, or region? *Recommendation:* country only.

14. **Open data vs controlled access.** *Recommendation:* tiered: open aggregates, registered row-level access under agreement, free text never. Revisit if a trusted-research-environment partner (e.g. a university) can host the row-level tier.

15. **Time shifting in the shared dataset.** Round to 15 minutes only, or also shift calendar dates per participant? *Recommendation:* round to 15 minutes and keep real dates in the registered tier (seasonality needs them); apply date shifting only if a reviewer requires it.

16. **Academic partner.** Approach Leiden's LUCA programme (Fronczek/Terwindt), another Dutch centre, or an international group (e.g. Burish/Clusterbusters)? *Recommendation:* LUCA first (same country, same legal frame, validated diagnostic questionnaire they could lend), Clusterbusters second for international reach.

17. **Ethics review.** Pursue a formal non-WMO ethics opinion before launch, or launch on GDPR consent alone and seek review when a partner joins? *Recommendation:* draft the DPIA, consent and data dictionary now; seek a university's non-WMO committee opinion before public launch of the donation feature.

18. **Age gate for donation.** 16+ (UAVG consent age) or 18+? *Recommendation:* 18+ for donation; app use itself unrestricted.

19. **Contact-for-studies toggle.** Keep an email link for inviting participants to future studies (useful, but means identity must be retained)? *Recommendation:* yes, as a separate opt-in; store only in the app auth store, never in the research store.

20. **Free text.** Exclude notes from donation entirely, or allow a reviewed/opt-in path? *Recommendation:* exclude entirely in v1.

21. **Hosting location.** Supabase EU region plus Vercel: confirm acceptable processors and sign DPAs; or Cloudflare Pages + an EU Postgres. *Recommendation:* Supabase (Frankfurt) + Vercel for speed; review processor list in the DPIA.

22. **Funding and sustainability.** Free forever (donations), or a paid tier for extras (as MyClusters does)? *Recommendation:* free, no ads, no paid tier; costs are small and a research dataset funded by selling features sends the wrong signal. Accept donations and apply for small patient-organisation grants.

## Process

23. **Testers.** Recruit 5–10 people from the Dutch and English CH groups for v0.2, watch them use it mid-bout (remotely, with consent). *Recommendation:* yes, before any public launch.

24. **Publishing the plan.** Make these docs public (repo or site) to invite comment from patient groups and clinicians? *Recommendation:* yes, once names and the controller question are settled.
