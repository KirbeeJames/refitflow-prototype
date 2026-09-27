# RefitFlow punch list

## Open — needs James
- [ ] Confirm Supabase as the backend. Data currently saves in the browser only (one device, one browser). `src/data/store.js` is the single swap point.
- [ ] Customs advisor sign-off on IPR + temporary admission logic.
- [ ] Department taxonomy: generic 8 vs Zulu categories (affects importing real worklists).
- [ ] Contractor-clash rule ignores shipyards (parallel crews) — confirm that's right.
- [ ] Switch GitHub repo back to private; delete the old locked Vercel project (`i-just-brainstormed-with-claude-what`).
- [ ] `gh` CLI not logged in on this machine — needed to open PRs from here.
- [ ] Strix gate skipped — Docker/API key not set up. Greptile not configured on this repo.

## Open — build work
- [ ] Phone navigation: below 650px the sidebar is hidden with no replacement (inherited from the original build; spec only asks for tablet).
- [ ] No delete/archive for work items, vessels or change orders.
- [ ] Multi-user: auth, per-company data isolation, roles (manager / shipyard / owner's rep), field-level change history.
- [ ] Contract PDF upload (text paste works; PDF needs parsing).
- [ ] Email/invoice mailbox connector, WhatsApp import, historical bulk import (roadmap phases 7–9).
- [ ] Emailing reports to the distribution list (archive + recipients work; sending needs a mail service).
- [ ] Gantt: resize bars from either end (drag moves the whole job only).

## Done
- [x] Normalized data model, seed per vessel, selectors, `npm run check` (2026-09-25)
- [x] Change-order roll-up, work list tabs, real-date Gantt, dept bars, class register, live owner report (2026-09-25)
- [x] Saves in the browser — refresh keeps changes; "reset demo data" in the sidebar (2026-09-27)
- [x] Forms: add vessel, add/edit work item (incl. class/survey fields, IPR authorisation, priority override, % complete), raise/approve/reject change order, add milestone (2026-09-27)
- [x] Validation: EU-flagged vessels can't be put under temporary admission; over-invoicing needs confirmation; report recipients checked (2026-09-27)
- [x] Contract screen: Draft → Under Review → Signed with both-party sign-off; terms read-only once signed (2026-09-27)
- [x] Contract gating: work list, Gantt and change orders are preview-only until signed (2026-09-27)
- [x] Pull terms from pasted contract text, reviewed before applying (2026-09-27)
- [x] "From contract" cost basis on change orders (2026-09-27)
- [x] Gantt: drag to reschedule, click to edit, zoom (week / month / full), pulsing clash flag, status icons (2026-09-27)
- [x] Dashboard: six-week mini Gantt and upcoming milestones (2026-09-27)
- [x] Inbox: log emails/invoices/chat updates against work items or as project notes; full evidence trail (2026-09-27)
- [x] Reports: weekly/monthly, key-moments commentary, distribution list, archive with history (2026-09-27)
- [x] Per-item % complete feeds progress (2026-09-27)
- [x] Dependencies pinned (2026-09-27)
- [x] Sidebar scrolls when the fleet list is long; footer no longer overlaps (2026-09-27)
- [x] Dev-only createRoot console errors on hot reload (2026-09-27)
- [x] Vercel builds with Vite (`vercel.json`); preview deployed from this branch (2026-09-27)
- [~] Gantt card scrolls sideways under ~1000px — kept: the chart scrolls inside its own card, the page doesn't
