# RefitFlow punch list

## Open
- [ ] Persistence — state resets on refresh. Supabase tables mirroring `src/data/seed.js` arrays; swap the reducer in `store.js`.
- [ ] Real forms: add vessel, add/edit work item, raise change order, reject change order, priority override (all still `alert()` stubs).
- [ ] Contract gating: Draft/Under Review should actually lock Work list, Gantt and Change orders (banner only today).
- [ ] Gantt: drag to reschedule, zoom (week/month/full).
- [ ] Dashboard: mini Gantt preview and upcoming-milestones card (in spec, not built).
- [ ] Inbox & imports screen is still fully static.
- [ ] Report history/archive and "email to distribution list".
- [ ] Progress is cost-weighted with in-progress = 50%; replace with per-item % complete.
- [ ] Contractor-clash rule ignores shipyards (parallel crews) — confirm with James.
- [ ] Customs advisor sign-off on IPR + temporary admission logic.
- [ ] Decide department taxonomy (generic 8 vs Zulu categories).
- [ ] Pin dependency versions (all `latest`).
- [ ] Gantt card scrolls sideways under ~1000px wide.
- [ ] Switch GitHub repo back to private; delete the old locked Vercel project.
- [ ] Strix gate skipped — Docker/API key not set up. Greptile not configured on this repo.

## Done
- [x] Normalized data model: Vessel, Contract, Contractor, WorkItem (+ class survey), IPR authorisation, ChangeOrder, Milestone (2026-09-25)
- [x] Distinct seed data per vessel; Solstice (Malta/EU flag) no longer under temporary admission (2026-09-25)
- [x] All derived numbers in `src/data/selectors.js`, checked by `npm run check` (2026-09-25)
- [x] Change-order approval rolls into item, work list, dashboard and report totals (2026-09-25)
- [x] Work list tabs filter (Working / Quoted with variance / IPR tracker) + VAT subtotals (2026-09-25)
- [x] Gantt from real dates, today line, contractor overlap flags (2026-09-25)
- [x] Department bars scale correctly (2026-09-25)
- [x] Class register grouped by category, sorted by due date, live counts (2026-09-25)
- [x] Owner report built from live data incl. Owner's interests section (2026-09-25)
