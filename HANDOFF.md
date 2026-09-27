# RefitFlow — Status & Handoff

_Last updated: 2026-09-27_

## What it is
A SaaS tool for yacht management companies to run a vessel refit from contract signature to redelivery: contract, master work list, contractor quotes, live Gantt, change orders, class/survey items, customs (IPR + temporary admission) and owner reporting, across several vessels at once.

## Where things live
| Thing | Location |
|---|---|
| Code (canonical) | `Dropbox/AI/APPs/RefitFlow` — clone of GitHub `KirbeeJames/refitflow-prototype` |
| Original Codex build folder | `Documents/Codex/2026-09-18/i-just-brainstormed-with-claude-what` (not a git repo; superseded) |
| Live URL (public) | https://refitflow-canonical-i28agowbb-jameskirbys-projects.vercel.app/ |
| Latest preview (this branch) | https://refitflow-canonical-n9w6m2w0y-jameskirbys-projects.vercel.app/ |
| Vercel project | `refitflow-canonical` (`prj_ymdJ8jFlCENWVbODtVffRywVMhL8`), SSO protection off |
| Old Vercel project | `i-just-brainstormed-with-claude-what` — protection setting locked, can't be made public. Delete once canonical is confirmed. |
| Original spec | Codex prompt (11 modules) — see chat history / `AGENTS.md` |

## Current state
The deployed app is a **polished visual prototype, not a working tool**. The design is approved and will be kept.

- One 34-line React file (`src/app.jsx`), all data hardcoded, nothing saves (refresh = reset).
- Most buttons are `alert()` stubs (add vessel, new item, raise change order, import).
- Work list tabs (Working / Quoted / IPR tracker) don't filter — known bug.
- Gantt bars are placed by index math, not real dates. No drag, no zoom.
- Change-order approval flips one hardcoded row; doesn't roll into totals.
- Department cost bars all render full width (scaling bug).
- All three vessels share the same 10 cloned work items.
- Domain error: M/Y Solstice (Malta flag, EU) is shown under temporary admission — EU-flagged yachts aren't.
- Email/invoice ingestion, WhatsApp, historical import: UI placeholders only.

Rough coverage of the original spec: ~15%.

## Built so far (branch `feat/data-model-rebuild`, not yet merged or deployed)
**2026-09-25 — data model:** normalized entities, one place for all calculations (`src/data/selectors.js`, checked by `npm run check`), every screen on live data.

**2026-09-27 — punch list pass:**
- Saves in the browser (refresh keeps changes); reset button in the sidebar
- Real forms: add vessel, add/edit work items (class/survey, IPR, priority override, % complete), change orders (raise/approve/reject, cost basis from contract clauses), milestones
- Contract screen with Draft → Under Review → Signed; shipyard modules locked until signed; terms pulled from pasted text for review
- Gantt drag-to-reschedule, click-to-edit, zoom, clash flags
- Dashboard six-week view and milestones
- Inbox logs evidence against work items; over-invoicing needs confirmation
- Weekly/monthly reports with commentary, distribution list and archive

Still open: shared database (needs your go-ahead on Supabase), phone navigation, delete/archive, multi-user. See `PUNCH_LIST.md`.

## Roadmap (commercial product)
Build in this order — each layer depends on the one below.

| Phase | Scope | Why |
|---|---|---|
| 1. System of record | Data model (above) → persistence (Supabase) → real add/edit forms for vessels, items, contractors, change orders | Nothing is usable until data is real and saves |
| 2. Domain maths | VAT/IPR subtotals, TA countdown, CO roll-ups — **signed off by a customs/VAT advisor** | These are the numbers owners judge the manager on; the differentiator vs. a spreadsheet |
| 3. Manual evidence trail | "Sourced from" on every cost/status change, entered by hand | 80% of ingestion value without the hard engineering |
| 4. Reporting | Weekly/monthly owner PDF from live data, human review before export, report history | Strong sales demo, no integrations needed |
| 5. Gantt | Real dates → drag to reschedule → conflict flagging → zoom | In that order |
| 6. Contract gating | Draft → Under Review → Signed unlocks shipyard modules | |
| 7. Email/invoice ingestion | Gmail/Outlook connector + extraction + review queue | First real integration; multi-week |
| 8. Historical import | Same parser as #7; duplicate & "GRAND TOTAL row" detection | Onboarding/sales feature |
| 9. WhatsApp | Manual export/forward for v1; live sync is a v2+ bet | No clean read API |

Commercial prerequisites not in the original spec: multi-tenancy (per-company data isolation, RLS), roles (manager / shipyard / owner's rep), field-level audit history, GDPR (EU hosting, DPA).

## Open decisions for James
- Department list: generic 8 vs. real Zulu taxonomy (Hull & Deck, Painting, Shipyard Logistics, LSA/Class/Flag, Canvas, Props & shafts). Affects importing real worklists.
- Class-society terminology to standardise on (RINA / LR / ABS differ).
- Customs advisor review of IPR + temporary admission logic before real use.
- Backend: Supabase (matches other projects) — confirm.
- Repo is public temporarily for access; switch back to private when convenient.
- Delete the old locked Vercel project.

## Housekeeping
- Strix pentest gate: not run — Docker/API key not set up on this machine.
- Greptile: not configured on this repo.
- `package.json` pins every dependency to `latest` — pin versions before production.
