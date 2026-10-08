# Research dataset: a public-good cluster headache attack database

*Planning document, 2026-10-08. This is not legal advice; it is a map of the terrain so Tim can brief a lawyer or data-protection officer efficiently.*

## Takeaway

Treat the research dataset as a **second product with its own consent, its own pseudonym, its own storage and its own governance**, bolted onto the app only through an explicit opt-in. Collect **year and month of birth, not full date**; sex at birth; country (not postcode); year of onset; diagnosis status. Keep identity (email/auth) in one place and diary data in another, joined only by a random pseudonym that the research store never sees alongside identity. Release **aggregate statistics openly** and **row-level data under controlled access** with a data access agreement, not as open data. Do a DPIA before the first donated record. Find a university partner for ethics review if the goal is publishable science; it is not legally required for this kind of questionnaire-style data collection in the Netherlands, but it makes the data usable.

The app must be fully functional for a user who never donates anything.

---

## 1. Legal frame (Netherlands)

- **Health data is special-category data** under GDPR Art. 9. Processing is prohibited unless a condition in Art. 9(2) applies; for a patient-run, voluntary project the realistic condition is **explicit consent (Art. 9(2)(a))**, alongside a lawful basis under Art. 6 (also consent, or legitimate interest for the app's own functioning). Sources: https://casrai.org/dictionary/term/special-category-data-gdpr-article-9 ; https://www.legiscope.com/blog/health-data-article-9-gdpr.html ; EDPB 2021 note on GDPR and health research https://www.ejprarediseases.org/wp-content/uploads/2021/10/edpb_application-of-the-GDPR-on-health-research_2021.pdf
- **Art. 89(1)** requires safeguards for research processing, "in particular" data minimisation, and names pseudonymisation; where the purpose can be achieved without identifying people, it must be. Source: https://dev2.bbmri-eric.eu/wp-content/uploads/The-GDPR-and-Health-Research-presentation.pdf
- **Pseudonymised data is still personal data** (Art. 4(5), Recital 26). Only truly anonymised data falls outside GDPR, and row-level health diaries with demographics are very hard to anonymise. Sources: https://www.thomashelbing.com/en/wissen/dsgvo-hub/begriffe-und-definitionen/1.2.5-pseudonymisierung ; https://rdm.vu.nl/topics/gdpr.html
- **DPIA.** The Dutch Autoriteit Persoonsgegevens list makes a DPIA mandatory for large-scale processing of health data; even below that threshold Art. 35 requires one where risk is high, and a Dutch compliance source cites a standard fine of €310,000 for skipping it. Do the DPIA. Sources: https://business.gov.nl/regulation/data-protection-impact-assesment-dpia ; https://privacy-web.nl/en/artikelen/verwerkingen-van-persoonsgegevens-waarvoor-een-dpia-moet-plaatsvinden/ ; https://www.aaff.nl/artikelen/dpia-en-de-avg-dit-moet-je-als-ondernemer-weten
- **Dutch UAVG** implements GDPR; the **WMO** (medical research with human subjects act) covers research that subjects people to procedures or imposes rules of behaviour. A diary/questionnaire study generally falls **outside** the WMO unless questions are intimate or burdensome; CCMO says to ask an MREC in doubtful cases. Non-WMO research still needs an institution's own ethics route if a university is involved. Sources: https://english.ccmo.nl/investigators/additional-requirements-for-certain-types-of-research/other-types-of-research/questionnaire-research ; https://english.ccmo.nl/investigators/additional-requirements-for-certain-types-of-research/non-wmo-research ; https://english.ccmo.nl/investigators/guide-to-the-review-procedure/does-my-research-fall-within-the-scope-of-the-wmo
- **Controller.** Someone must be the data controller. If Tim runs it personally he is the controller; a foundation (stichting) is the normal Dutch vehicle for a public-good dataset and limits personal liability. Decision for Tim (see open-questions.md).

## 2. What to collect about the person (minimisation)

**Recommendation: do not store full date of birth.**

- Sweeney's classic result: ZIP code + sex + full date of birth uniquely identify ~87% of the US population; replacing date with **year** of birth drops that to ~0.04% (with ZIP). At county or city level the risk falls further. Sources: https://www.eff.org/deeplinks/2009/09/what-information-personally-identifiable ; https://www.magicmirrorsecurity.com/blog/simple-demographics-often-identify-people-uniquely ; https://www.census.gov/content/dam/Census/library/working-papers/2012/adrm/rrs2012-13.pdf
- Cluster headache is rare (the commonly cited lifetime prevalence is about 1 in 1,000; not separately verified in this research pass), so even coarse demographics narrow the field fast; a full birth date plus country plus "chronic CH" plus an attack timeline is likely unique.

| Field | Store | Why |
|---|---|---|
| Date of birth | **Year + month** (month optional) | Age to ±1 year is all epidemiology needs; onset-age analyses use years |
| Sex at birth | Yes (M / F / intersex / prefer not) | Sex differences in CH are a live research topic (Fourier 2023, https://pmc.ncbi.nlm.nih.gov/articles/PMC10033163/) |
| Gender | Optional, separate | Not needed for most analyses |
| Country | Yes (ISO code) | Treatment access varies by country (clusterfree's whole thesis) |
| Region/postcode | **No** | Quasi-identifier with little research value |
| Age at onset / onset year | Yes | Core CH epidemiology (Burish 2021 collected it, https://pmc.ncbi.nlm.nih.gov/articles/PMC7898696/) |
| Diagnosis status + year | Yes (self-reported) | Time-to-diagnosis is a known problem; needed to filter undiagnosed |
| Episodic / chronic | Derived from bouts + self-report | ICHD-3 subtype |
| Smoking, family history | Optional v2 | Classic CH covariates; add only if a research partner asks |
| Name, email, IP, device IDs | **Never in the research store** | Identity stays in the app's auth system only |
| Free-text notes | **Excluded by default** from donation | Free text leaks identity (names of clinics, employers) |

## 3. Separation of identity and diary data

```
 App account (Supabase Auth)            Research store (separate schema/project)
 ┌────────────────────────┐             ┌──────────────────────────────┐
 │ auth.users: email, id  │             │ participant: pseudonym_id,   │
 │ app tables: user_id FK │   one-way   │   birth_year, birth_month,   │
 │ research_consent:      │ ─────────▶  │   sex, country, onset_year…  │
 │   user_id, pseudonym_id│  export job │ attack: pseudonym_id, times  │
 │   (the ONLY link)      │             │   shifted/rounded, fields…   │
 └────────────────────────┘             └──────────────────────────────┘
```

- `pseudonym_id` is a random UUID generated at consent, stored in the app DB only. The research store never holds `user_id` or email.
- The export job (scheduled, server-side) copies consented rows, drops free text, **rounds timestamps to 15 minutes** and keeps local time-of-day and weekday but can shift absolute dates by a per-participant random offset if a reviewer wants it (keeps intervals, hides calendar identity). Decide per release tier.
- Withdrawal: consent row gets `withdrawn_at`; the next job deletes that pseudonym's rows from the research store. Data already in a frozen, released dataset version cannot be recalled; the consent text must say so (standard practice; see Open Humans' revocable-consent model, https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6593360/).
- Keep the two stores in different Supabase projects (or at minimum different schemas with different service keys) so a leak of one is not a leak of both.

## 4. Consent design

- A **separate screen**, never part of onboarding, reachable from Settings. The app works 100% without it. No nagging; at most one invitation after the user's 10th logged attack.
- Plain-language, layered: a one-paragraph summary, then details. State: what is collected, what is not (no name, no exact birth date, no notes), who the controller is, where it is stored (EU), who can get it (controlled access with agreement), that aggregate statistics are published openly, that withdrawal stops future sharing but cannot recall published versions, and contact for questions.
- **Granular toggles:** (a) share attack/treatment data; (b) share demographic profile; (c) allow contact about future studies (requires keeping email in the app store only). Each independently revocable.
- Consent version is stored; a material change re-prompts.
- Age gate: 16+ (Dutch UAVG age of digital consent) or parental consent; simplest is 18+ for donation.

## 5. Open vs controlled access

Recommendation: **tiered**.

| Tier | What | Who |
|---|---|---|
| Open | Aggregate statistics and charts (attacks by hour of day, duration distributions, % relief at 15 min by treatment, by country), updated monthly; a public data dictionary and the consent text | Anyone |
| Registered | Row-level pseudonymised dataset with rounded times and no free text | Researchers and patient organisations who accept a data access agreement (no re-identification, no onward sharing, cite the dataset) |
| Never | Free text, exact timestamps, anything below country | — |

Why not fully open: an Australian government-commissioned analysis concluded that open publication of de-identified unit-record health data "is not a secure solution" and recommends controlled access plus differential privacy for published outputs (https://arxiv.org/pdf/1712.05627). AI-assisted re-identification is making this worse (https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12803850/). The NASEM view is that controlled access is a spectrum, from click-through agreements to full review (https://www.ncbi.nlm.nih.gov/books/NBK285996/). Governance precedents: data access committees with patient members, e.g. UCLH's Data Trust Committee (https://www.uclhospitals.brc.nihr.ac.uk/data-and-research/data-trust-committee); Critical Path Institute's tiered model (https://c-path.org/wp-content/uploads/data-governance-.pdf).

## 6. Ethics review

- Legally: a questionnaire/diary study by a private person or foundation is typically non-WMO and needs no MREC approval (see §1). GDPR obligations still apply in full.
- Practically: **journals and university co-authors will require ethics review** of some kind. A Dutch academic partner (Leiden's LUCA programme is the obvious one; see §7) would route it through their non-WMO advice committee. Leiden's own non-WMO advice form exists for this purpose (https://staff.universiteitleiden.nl/binaries/content/assets/sociale-wetenschappen/faculteitsbureau/solo/research-support-website/nwmo-advice-form.pdf).
- Recommendation: build the pipeline so that the consent text, data dictionary and DPIA are ready; approach a partner before public launch of the donation feature, not after.

## 7. Prior art

| Effort | What it is | Lesson |
|---|---|---|
| Clusterbusters patient registry (US, worldwide sign-up) | Contact registry: sign up to be invited to studies; "all information… will remain completely private"; administered by the charity and its medical advisory board | Contact-registry model works; patients trust a patient organisation. https://clusterbusters.org/patient-registry-2/ |
| International Cluster Headache Questionnaire (Burish, Pearson, Shapiro, Zhang, Schor; *Headache* 2021) | 152-item survey, 1,604 included from 3,251 who agreed; 10 languages; pain, demographics, onset, diagnosis | A one-shot survey; no longitudinal attack data. Our dataset's unique value is **per-attack timestamps over months**. https://pmc.ncbi.nlm.nih.gov/articles/PMC7898696/ ; https://clusterbusters.org/international-cluster-headache-questionnaire-results/ |
| LUCA, Leiden University Cluster headache Analysis programme | Web-recruited Dutch cohort (1,698 patients in an older summary), validated screening questionnaire (QATCH), DNA, QoL and comorbidity studies; Fronczek and Terwindt among authors | Natural academic partner in Tim's own country; their questionnaire could validate self-reported diagnosis in our profile. https://scholarlypublications.universiteitleiden.nl/access/item%3A2910101/download ; https://link.springer.com/10.1007/s10072-023-07088-x |
| EUROLIGHT cluster headache survey | Internet survey across 12 European languages on burden and management satisfaction | Multilingual recruitment via patient groups is feasible. https://clusterbusters.org/forums/topic/1900-european-cluster-headache-survey/ |
| Swedish CH cohort (Fourier et al., *Neurology* 2023, n = 874) | ICHD-3-verified, questionnaire on chronobiology, triggers, treatment, lifestyle | Shows what sex-difference and rhythm analyses need: time-of-day per attack, sleep hours, chronotype. https://pmc.ncbi.nlm.nih.gov/articles/PMC10033163/ |
| Korea Cluster Headache Registry | Prospective multicentre (16 hospitals) clinical registry | Clinician-entered; complementary, not competing. https://scholar.korea.ac.kr/handle/2021.sw.korea/57423?mode=full |
| Italian Headache Registry (RICe) / CHIQ validation | Clinical registry used to validate the Cluster Headache Impact Questionnaire | A validated impact questionnaire exists; consider adding CHIQ as an optional monthly check-in in v2. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10345064/ |
| gammaCore patient registry (2017–18) | Industry-run observational registry of episodic CH | Treatment registries exist; ours is treatment-agnostic. https://www.iasp-pain.org/publications/pain-research-forum/papers-of-the-week/paper/135280-patient-experience-non-invasive-vagus-nerve-stimulator-gammacore-patient-registry/ |
| Open Humans | Participant-centred data platform; granular, per-project, revocable consent; supports patient-led projects | A ready-made consent and governance pattern; could even host the donated data rather than building our own. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6593360/ |
| MyClusters app | Lists "sensitive data linked to user" in its privacy label; a reviewer complained account deletion was missing (since fixed) | Deletion must work from day one. https://apps.apple.com/app/id6745556184 |

Nothing found resembles a **prospective, timestamped, per-attack, patient-donated, multi-country CH dataset with open aggregates**. That is the gap.

## 8. Minimum dataset researchers would value

Per participant (pseudonymised): birth year(/month), sex at birth, country, onset year, diagnosis status/year, episodic/chronic, treatment list (catalogue codes), preventives in use.

Per attack: start time (rounded, local + weekday + UTC offset), end time + `end_confidence` (exact/approx/unknown/asleep), `start_source`/`end_source` (live vs reconstructed), max intensity 0–10, side, woke-from-sleep flag, shadow flag, symptom codes, trigger codes, treatment events with minutes-to-relief and relief grade, oxygen flow/mask, bout id.

Per bout: start/end dates, type.

Derived, published openly: attacks per day and per bout; duration distribution by treatment; time-of-day histograms by sex and subtype; % attacks with unknown end (an honest metric nobody has); relief-at-15-min by treatment and flow rate; nocturnal share; seasonal bout onsets by country.

## 9. Practical safeguards checklist

- EU-region hosting (Supabase Frankfurt or equivalent); DPA signed with every processor.
- Separate projects/keys for app vs research store; export job is the only bridge.
- No analytics SDKs that see health data. No third-party fonts loaded at runtime if that leaks IPs to Google (self-host DM Mono and Manrope).
- Privacy notice, consent text, data dictionary and DPIA published on the site.
- Deletion: "delete my account" removes app data within 30 days and triggers research-store deletion for the pseudonym.
- Breach plan: who notifies the AP within 72 h.
- Data access agreement template and a two-person review (Tim + one patient-organisation or clinician reviewer) for registered-tier requests; publish the list of approved projects.
- Annual review of the DPIA and of whether rounding/shifting still suffices as the dataset grows.
