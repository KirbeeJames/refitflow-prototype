import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DEPARTMENTS, DEPT_COLORS, VAT_TREATMENTS, priorityOf } from './data/model.js';
import { seed } from './data/seed.js';
import { useRefitStore } from './data/store.js';
import * as sel from './data/selectors.js';

const money = n => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const moneyShort = n => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 2 }).format(n);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const LEVEL_PILL = { red: 'pill-red', amber: 'pill-amber', blue: 'pill-blue' };
const STATUS_PILL = { Complete: 'pill-green', 'In progress': 'pill-blue', Approved: 'pill-green', Pending: 'pill-amber', Rejected: 'pill-red' };
const CONTRACT_PILL = { Signed: 'pill-green', 'Under Review': 'pill-amber', Draft: 'pill-blue' };
const TITLES = { fleet: 'Fleet overview', dashboard: 'Command center', work: 'Master work list', gantt: 'Live schedule', change: 'Change orders', class: 'Class & survey register', inbox: 'Inbox & imports', reports: 'Owner reporting' };
const NAV = [['fleet', '◈', 'Fleet overview'], ['dashboard', '⌂', 'Dashboard'], ['work', '≡', 'Work list'], ['gantt', '▥', 'Live Gantt'], ['change', '↗', 'Change orders'], ['class', '◇', 'Class & survey'], ['inbox', '✉', 'Inbox & imports'], ['reports', '▤', 'Reports']];

function Icon({ children }) { return <span aria-hidden="true" style={{ width: 18, display: 'inline-grid', placeItems: 'center', fontSize: 15 }}>{children}</span>; }
function Progress({ value, color = '#0d9488' }) { return <div className="progress"><span style={{ width: Math.min(100, Math.max(0, value)) + '%', background: color }} /></div>; }

function Sidebar({ state, today, view, setView, open }) {
  return (
    <aside className="sidebar">
      <div className="flex items-center gap-3 mb-12 px-2"><div className="brand-mark">R</div><div className="label"><div className="font-extrabold tracking-tight">RefitFlow</div><div className="text-[10px] text-slate-400 mt-0.5">YARD COMMAND CENTER</div></div></div>
      <div className="eyebrow px-3 mb-3">Workspace</div>
      {NAV.map(([id, ic, label]) => <button key={id} aria-label={label} className={'nav-item ' + (view === id ? 'active' : '')} onClick={() => setView(id)}><Icon>{ic}</Icon><span className="label">{label}</span></button>)}
      <div className="mt-10 pt-5 border-t border-slate-700/60">
        <div className="eyebrow px-3 mb-3">Active fleet</div>
        {state.vessels.map(v => {
          const urgent = sel.vesselAlerts(state, v, today).some(a => a.level === 'red');
          return <button className="nav-item fleet-mini" key={v.id} onClick={() => open(v.id)}><span className="w-2 h-2 rounded-full" style={{ background: urgent ? '#e28a31' : '#53b8ae' }}></span><span className="label truncate">{v.name}</span></button>;
        })}
      </div>
      <div className="absolute bottom-7 left-7 text-[11px] text-slate-500 label">v0.10 · prototype</div>
    </aside>
  );
}

function Topbar({ v, view }) {
  return (
    <header className="topbar">
      <div><div className="eyebrow">{view === 'fleet' ? 'All vessels' : `${v.name} / ${view === 'dashboard' ? 'project dashboard' : view}`}</div><div className="font-extrabold mt-1">{TITLES[view]}</div></div>
      <div className="flex items-center gap-3"><button className="btn no-print">⌕ <span className="hidden sm:inline">Search</span></button><div className="w-8 h-8 rounded-full bg-[#d9eceb] text-[#0d736c] grid place-items-center text-xs font-extrabold">JM</div></div>
    </header>
  );
}

function FleetView({ state, today, open }) {
  const rows = state.vessels.map(v => {
    const items = sel.vesselItems(state, v.id);
    return { v, items, contract: sel.vesselContract(state, v.id), prog: sel.programme(v, today), fin: sel.vesselFinance(state, v), progress: sel.progressPct(state, items), alerts: sel.vesselAlerts(state, v, today) };
  });
  const queue = rows.flatMap(r => r.alerts).sort((a, b) => a.days - b.days).slice(0, 5);
  const nameOf = id => state.vessels.find(v => v.id === id).name.replace('M/Y ', '');
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-7">
        <div><div className="eyebrow mb-2">Season · {today.slice(0, 4)}</div><h1 className="display text-4xl text-[#0b1f33]">Your fleet, in motion.</h1><p className="text-sm text-[#708394] mt-2">{rows.length} live refit programmes · {moneyShort(rows.reduce((a, r) => a + r.v.budget, 0))} under management</p></div>
        <button className="btn primary no-print" onClick={() => alert('New vessel setup would open here in the production build.')}>＋ Add vessel</button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {rows.map(({ v, items, contract, prog, fin, progress, alerts }, i) => {
          const top = alerts[0];
          return (
            <button key={v.id} onClick={() => open(v.id)} className="card vessel-card text-left animate-in" style={{ animationDelay: i * 80 + 'ms' }}>
              <div className="flex justify-between items-start"><div><div className="eyebrow">Week {prog.week} of {prog.totalWeeks}{v.stageNote ? ' · ' + v.stageNote : ''}</div><div className="display text-2xl mt-2">{v.name}</div><div className="text-xs text-[#7c8e9c] mt-1">{v.location} · {v.flag}</div></div><span className={'pill ' + (CONTRACT_PILL[contract?.status] ?? 'pill-red')}>{contract?.status ?? 'No contract'}</span></div>
              <div className="mt-7 flex justify-between text-xs"><span className="text-[#7890a4]">Refit progress</span><strong>{progress}%</strong></div>
              <div className="mt-2"><Progress value={progress} /></div>
              <div className="grid grid-cols-3 gap-3 mt-7 pt-4 border-t border-[#edf1f3]">
                <div><div className="eyebrow">Days left</div><strong className="text-lg">{prog.daysLeft}</strong></div>
                <div><div className="eyebrow">Committed</div><strong className="text-lg">{pct(fin.committed, fin.budget)}%</strong></div>
                <div><div className="eyebrow">Items</div><strong className="text-lg">{items.length}</strong></div>
              </div>
              <div className={'mt-5 rounded-lg px-3 py-2 text-[11px] font-bold ' + (top?.level === 'red' ? 'alert-card text-[#b64743]' : 'bg-[#f1f8f7] text-[#27786e]')}>● {top ? `${top.title} · ${top.detail}` : 'On track'}</div>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex justify-between mb-4"><div><div className="section-title">Season pulse</div><div className="text-xs text-[#8292a1] mt-1">Committed spend as a share of each refit budget</div></div></div>
          <div className="chart-bars">{rows.map(({ v, fin, alerts }) => <div key={v.id} className="flex-1" title={`${money(fin.committed)} of ${money(fin.budget)}`}><div className="chart-bar" style={{ height: Math.min(130, pct(fin.committed, fin.budget) * 1.15) + 'px', background: alerts.some(a => a.level === 'red') ? 'linear-gradient(#e0a24e,#c07b23)' : undefined }}></div><div className="chart-label">{v.name.replace('M/Y ', '')} · {pct(fin.committed, fin.budget)}%</div></div>)}</div>
        </div>
        <div className="card p-5">
          <div className="section-title">Attention queue</div>
          <div className="text-xs text-[#8292a1] mt-1 mb-4">Things worth opening today</div>
          {queue.length === 0 && <div className="text-xs text-[#8292a1]">Nothing needs attention today.</div>}
          {queue.map((a, i) => <button key={i} onClick={() => open(a.vesselId, a.view)} className="w-full flex items-center gap-3 py-3 border-b border-[#edf1f3] text-left"><span className={'pill ' + LEVEL_PILL[a.level]}>!</span><span className="flex-1"><strong className="block text-xs">{a.title} · {nameOf(a.vesselId)}</strong><small className="text-[#8292a1]">{a.detail}</small></span><span className="text-[#9aa9b5]">→</span></button>)}
        </div>
      </div>
    </div>
  );
}

function SummaryCards({ state, v, today }) {
  const fin = sel.vesselFinance(state, v);
  const contract = sel.vesselContract(state, v.id);
  const ta = sel.temporaryAdmission(v, today);
  const ipr = sel.iprStatus(state, v.id, today)[0];
  const deadline = [ta && { label: 'Temporary admission limit', days: ta.left }, ipr && { label: `IPR ${ipr.auth.reference}`, days: ipr.daysLeft }].filter(Boolean).sort((a, b) => a.days - b.days)[0];
  const cards = [
    ['Contract value', money(contract?.value ?? 0), contract ? `${contract.status} · ${contract.type}` : 'No contract yet', ''],
    ['Work list value', money(fin.workListValue), `${pct(fin.committed, fin.workListValue)}% committed · ${money(fin.invoiced)} invoiced`, ''],
    ['Change orders', money(sel.changeOrderImpact(state, v.id, today)), 'Approved this month', 'amber'],
    ['Customs deadline', deadline ? `${deadline.days} days` : '—', deadline ? deadline.label : 'No TA or IPR exposure', deadline && deadline.days <= 30 ? 'red' : ''],
  ];
  return <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5 metrics">{cards.map(x => <div className="card metric" key={x[0]}><div className="eyebrow">{x[0]}</div><div className="metric-value mt-3">{x[1]}</div><div className={'text-[11px] mt-2 ' + (x[3] === 'red' ? 'text-[#c15752]' : x[3] === 'amber' ? 'text-[#a36c22]' : 'text-[#8292a1]')}>{x[2]}</div></div>)}</div>;
}

function CustomsPanel({ state, v, today }) {
  const ta = sel.temporaryAdmission(v, today);
  const ipr = sel.iprStatus(state, v.id, today);
  return (
    <div>
      <div className="eyebrow mb-3">Temporary admission</div>
      {ta ? <>
        <div className="flex justify-between text-xs mb-2"><span>{ta.elapsed} days since entry ({sel.fmtDate(ta.entryDate)})</span><span>limit {sel.fmtDate(ta.limitDate)} · {ta.left} days left</span></div>
        <Progress value={pct(ta.elapsed, ta.limitDays)} color={ta.overrun || ta.left <= 90 ? '#dc5c58' : '#d28b25'} />
        {ta.overrun && <div className="text-[11px] text-[#c15752] mt-2">Refit ends {sel.fmtDate(v.refitEnd)}, after the 18-month limit.</div>}
      </> : <div className="text-xs text-[#8292a1]">Not under temporary admission ({v.flag} flag).</div>}
      <div className="eyebrow mt-6 mb-3">IPR authorisations</div>
      {ipr.length === 0 && <div className="text-xs text-[#8292a1]">No items under Inward Processing Relief.</div>}
      {ipr.map(r => <div key={r.auth.id} className="flex justify-between items-center text-xs py-2 border-b border-[#edf1f3]"><span><b className="mono">{r.auth.reference}</b> · {r.items.length} item{r.items.length === 1 ? '' : 's'} · {money(r.value)}</span><span className={'pill ' + (r.level === 'ok' ? 'pill-green' : r.level === 'warning' ? 'pill-amber' : 'pill-red')}>{sel.dueText(r.daysLeft)}</span></div>)}
    </div>
  );
}

function Dashboard({ state, v, today, setView }) {
  const items = sel.vesselItems(state, v.id);
  const progress = sel.progressPct(state, items);
  const prog = sel.programme(v, today);
  const cls = sel.classSummary(state, v.id, today);
  const depts = sel.deptSubtotals(state, items).filter(d => d.value > 0);
  const maxDept = Math.max(1, ...depts.map(d => d.value));
  const count = st => items.filter(x => x.status === st).length;
  const activity = items.flatMap(i => i.sources.map(src => ({ ...src, item: i.name }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return (
    <div className="animate-in">
      <SummaryCards state={state} v={v} today={today} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card p-5 xl:col-span-2">
          <div className="flex justify-between items-start mb-5"><div><div className="section-title">Programme overview</div><div className="text-xs text-[#8292a1] mt-1">Week {prog.week} of {prog.totalWeeks} · {sel.fmtDate(v.refitStart)} — {sel.fmtDate(v.refitEnd)}</div></div><button className="btn no-print" onClick={() => setView('gantt')}>Open Gantt →</button></div>
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-full grid place-items-center" style={{ background: `conic-gradient(#0d9488 ${progress}%, #e7edef 0)` }}><div className="w-16 h-16 rounded-full bg-white grid place-items-center font-extrabold text-xl">{progress}<span className="text-[10px]">%</span></div></div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-2"><span>Cost-weighted progress</span><strong>{count('Complete')} of {items.length} complete</strong></div>
              <Progress value={progress} />
              <div className="flex flex-wrap gap-6 mt-5 text-xs text-[#8292a1]">{['In progress', 'Approved', 'Quoted', 'Working list'].map(st => <span key={st}><b className="text-[#14263a]">{count(st)}</b> {st.toLowerCase()}</span>)}</div>
            </div>
          </div>
          <div className="mt-7 pt-5 border-t border-[#edf1f3]"><CustomsPanel state={state} v={v} today={today} /></div>
        </div>
        <div className="card p-5">
          <div className="section-title">Class status</div>
          <div className="text-xs text-[#8292a1] mt-1">Open survey obligations</div>
          <div className="mt-5 text-center"><div className="text-5xl display text-[#c15752]">{cls.open.length}</div><div className="text-xs text-[#8292a1] mt-1">open of {cls.items.length} tracked</div></div>
          <div className="mt-5 space-y-3">{Object.entries(cls.counts).map(([cat, n]) => <div className="flex justify-between items-center text-xs" key={cat}><span>{cat}</span><span className={'pill ' + (cat === 'Condition of Class' ? 'pill-red' : cat === 'Recommendation' ? 'pill-amber' : 'pill-blue')}>{n}</span></div>)}</div>
          {cls.nearest && <div className="text-[11px] text-[#8292a1] mt-4">Nearest: <b className="text-[#14263a]">{cls.nearest.item.classSurvey.reference}</b> · {sel.dueText(cls.nearest.daysLeft)}</div>}
          <button className="btn w-full mt-5 no-print" onClick={() => setView('class')}>View class register</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex justify-between mb-4"><div><div className="section-title">Department exposure</div><div className="text-xs text-[#8292a1] mt-1">Current cost incl. approved change orders</div></div><button className="btn no-print" onClick={() => setView('work')}>Open work list</button></div>
          {depts.map(d => <div className="flex items-center gap-3 mb-3" key={d.department}><div className="w-28 text-[11px] text-[#607688] truncate">{d.department}</div><div className="flex-1 progress"><span style={{ width: Math.max(4, (d.value / maxDept) * 100) + '%', background: DEPT_COLORS[d.department] }} /></div><div className="w-20 text-right text-[11px] font-bold">{money(d.value)}</div></div>)}
        </div>
        <div className="card p-5">
          <div className="section-title">Recent activity</div>
          {activity.length === 0 && <div className="text-xs text-[#8292a1] mt-3">No sourced updates yet.</div>}
          {activity.map((a, i) => <div className="py-3 border-b border-[#edf1f3] text-xs" key={i}><div className="font-bold">{a.label}</div><div className="text-[#8292a1] mt-1">{a.item} · {sel.fmtDate(a.date)}</div></div>)}
          <button className="btn w-full mt-4 no-print" onClick={() => setView('inbox')}>Open inbox</button>
        </div>
      </div>
    </div>
  );
}

function WorkList({ state, v, today, setView }) {
  const [filter, setFilter] = useState('All departments');
  const [tab, setTab] = useState('Working list');
  const [query, setQuery] = useState('');
  const all = sel.vesselItems(state, v.id);
  const rows = all.filter(x =>
    (filter === 'All departments' || x.department === filter)
    && (!query || `${x.name} ${x.description}`.toLowerCase().includes(query.toLowerCase()))
    && (tab === 'Working list' || (tab === 'Quoted list' ? x.quoted != null : x.vat === 'IPR')));
  const vat = sel.vatSubtotals(state, rows);
  const contractor = id => sel.contractorById(state, id)?.name ?? '—';
  const lastSource = x => x.sources.at(-1)?.label ?? 'manual entry';
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5">
        <div><div className="eyebrow mb-2">{v.name} · {all.length} items</div><h2 className="display text-3xl">The master work list</h2></div>
        <div className="flex gap-2 no-print"><button className="btn" onClick={() => alert('New work item form would open here.')}>＋ New item</button><button className="btn teal" onClick={() => setView('change')}>Change orders</button></div>
      </div>
      <div className="card">
        <div className="tabbar px-4">{['Working list', 'Quoted list', 'IPR tracker'].map(x => <button className={'tab ' + (tab === x ? 'active' : '')} onClick={() => setTab(x)} key={x}>{x}</button>)}</div>
        {tab === 'IPR tracker' && <div className="p-5 border-b border-[#edf1f3]"><CustomsPanel state={state} v={v} today={today} /></div>}
        <div className="p-4 flex flex-wrap gap-2 items-center no-print">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search work items..." aria-label="Search work items" className="border border-[#dbe4ea] rounded-lg px-3 py-2 text-xs w-52 outline-none" />
          <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Department" className="border border-[#dbe4ea] rounded-lg px-3 py-2 text-xs bg-white"><option>All departments</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select>
          <span className="ml-auto text-xs text-[#8292a1]">{rows.length} visible items · {money(rows.reduce((a, x) => a + sel.itemCost(state, x), 0))}</span>
        </div>
        <div className="px-4 pb-4 flex flex-wrap gap-2 text-[11px]">{VAT_TREATMENTS.filter(t => vat[t]).map(t => <span key={t} className="rounded-lg bg-[#f5f8fa] px-3 py-1.5"><span className="text-[#8292a1]">{t}</span> <b>{money(vat[t])}</b></span>)}</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Work item</th><th>Department</th><th>Priority</th><th>Status</th><th>Contractor</th>{tab === 'Quoted list' ? <><th>Estimate</th><th>Quoted</th><th>Variance</th></> : <><th>Estimate</th><th>Current cost</th></>}<th>VAT / customs</th><th>Timeline</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={10} className="text-center text-[#8292a1]">No items match.</td></tr>}
              {rows.map(x => {
                const cost = sel.itemCost(state, x);
                const priority = priorityOf(x);
                const ipr = x.iprAuthorizationId && sel.iprStatus(state, v.id, today).find(r => r.auth.id === x.iprAuthorizationId);
                return (
                  <tr key={x.id}>
                    <td><div className="font-extrabold">{x.name}</div><div className="text-[10px] text-[#8292a1] max-w-[260px] truncate">{x.description} · from {lastSource(x)}</div></td>
                    <td><span className="pill" style={{ background: DEPT_COLORS[x.department] + '18', color: DEPT_COLORS[x.department] }}>{x.department}</span></td>
                    <td><span className={'pill ' + (priority === 'Essential' ? 'pill-red' : priority === 'Desired' ? 'pill-blue' : 'pill-amber')}>{priority}</span></td>
                    <td><span className={'pill ' + (STATUS_PILL[x.status] ?? 'pill-amber')}>{x.status}</span></td>
                    <td>{contractor(x.contractorId)}</td>
                    <td>{money(x.estimate)}</td>
                    {tab === 'Quoted list'
                      ? <><td className="font-bold">{money(x.quoted)}</td><td className={x.quoted > x.estimate ? 'text-[#c15752] font-bold' : 'text-[#147653] font-bold'}>{x.quoted > x.estimate ? '+' : ''}{money(x.quoted - x.estimate)}</td></>
                      : <td className="font-bold">{money(cost)}{cost !== sel.baseCost(x) && <div className="text-[10px] text-[#a36c22]">incl. change orders</div>}</td>}
                    <td><span className="text-[11px]">{x.vat}</span>{ipr && <div className={'text-[10px] ' + (ipr.level === 'ok' ? 'text-[#8292a1]' : 'text-[#c15752]')}>{ipr.auth.reference} · discharge {sel.fmtDate(ipr.auth.dischargeDeadline, false)}</div>}</td>
                    <td className="mono text-[10px]">{sel.fmtDate(x.start, false)} → {sel.fmtDate(x.end, false)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Gantt({ state, v, today }) {
  const [mode, setMode] = useState('Department');
  const contract = sel.vesselContract(state, v.id);
  const winStart = contract?.startDate ?? v.refitStart;
  const winEnd = contract?.endDate ?? v.refitEnd;
  const span = Math.max(1, sel.daysBetween(winStart, winEnd));
  const pos = iso => Math.min(100, Math.max(0, (sel.daysBetween(winStart, iso) / span) * 100));
  const items = [...sel.vesselItems(state, v.id)].sort((a, b) => a.start.localeCompare(b.start));
  const ticks = Array.from({ length: 8 }, (_, i) => sel.addDays(winStart, Math.round((span * i) / 8)));
  const todayPos = today >= winStart && today <= winEnd ? pos(today) : null;
  const conflicts = sel.scheduleConflicts(state, items);
  const clashing = new Set(conflicts.flat().map(i => i.id));
  const milestones = sel.vesselMilestones(state, v.id);
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5">
        <div><div className="eyebrow mb-2">Contract window · {sel.fmtDate(winStart)} — {sel.fmtDate(winEnd)}</div><h2 className="display text-3xl">Live schedule</h2></div>
        <div className="flex gap-2 no-print"><button className={'btn ' + (mode === 'Department' ? 'primary' : '')} onClick={() => setMode('Department')}>By department</button><button className={'btn ' + (mode === 'Contractor' ? 'primary' : '')} onClick={() => setMode('Contractor')}>By contractor</button></div>
      </div>
      <div className="card p-5 overflow-auto">
        <div className="flex items-center gap-3 text-xs text-[#8292a1] mb-5"><span className="w-2 h-2 rounded-full bg-[#dc5c58]"></span>Today · {sel.fmtDate(today)}<span className="w-2 h-2 rounded-full ml-3" style={{ boxShadow: '0 0 0 2px #dc5c58' }}></span>Contractor overlap</div>
        <div className="gantt">
          <div className="gantt-head"><div></div><div className="grid grid-cols-8">{ticks.map(t => <span key={t}>{sel.fmtDate(t, false)}</span>)}</div></div>
          {items.map(x => {
            const c = sel.contractorById(state, x.contractorId);
            const left = pos(x.start);
            return (
              <div className="gantt-row" key={x.id}>
                <div className="pr-4 text-xs truncate"><strong className="block truncate">{x.name}</strong><small className="text-[#8292a1]">{mode === 'Department' ? x.department : c?.name ?? 'Unassigned'}</small></div>
                <div className="gantt-grid">
                  {todayPos != null && <div className="today-line" style={{ left: todayPos + '%' }} />}
                  <div className="bar" style={{ left: left + '%', width: Math.max(1, pos(x.end) - left) + '%', background: mode === 'Department' ? DEPT_COLORS[x.department] : c?.color ?? '#8292a1', boxShadow: clashing.has(x.id) ? '0 0 0 2px #dc5c58' : undefined, opacity: x.status === 'Complete' ? 0.55 : 1 }} title={`${x.name} · ${sel.fmtDate(x.start)} → ${sel.fmtDate(x.end)} · ${x.status}`}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className={'card p-5 lg:col-span-2 ' + (conflicts.length ? 'alert-card' : '')}>
          <div className="section-title">Schedule watch</div>
          {conflicts.length === 0 && <p className="text-xs text-[#6e7f8d] mt-2">No contractor overlaps detected.</p>}
          {conflicts.slice(0, 4).map(([a, b]) => <p key={a.id + b.id} className="text-xs text-[#6e7f8d] mt-2"><b>{sel.contractorById(state, a.contractorId).name}</b> is booked on {a.name} and {b.name} at the same time.</p>)}
        </div>
        <div className="card p-5">
          <div className="section-title">Milestones</div>
          {milestones.map(m => <div className="text-xs mt-3" key={m.id}><b>{m.name}</b><span className="float-right text-[#8292a1]">{sel.fmtDate(m.date)}</span></div>)}
        </div>
      </div>
    </div>
  );
}

function ChangeOrders({ state, actions, v }) {
  const orders = sel.vesselChangeOrders(state, v.id).sort((a, b) => b.dateRaised.localeCompare(a.dateRaised));
  const approved = orders.filter(o => o.status === 'Approved');
  const pending = orders.filter(o => o.status === 'Pending');
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5">
        <div><div className="eyebrow mb-2">Cost control · {v.name}</div><h2 className="display text-3xl">Change orders</h2></div>
        <button className="btn primary no-print" onClick={() => alert('New change order form would open here.')}>＋ Raise change order</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="card metric"><div className="eyebrow">Approved impact</div><div className="metric-value mt-3">{money(approved.reduce((a, o) => a + sel.coDelta(o), 0))}</div><div className="text-xs text-[#a36c22] mt-2">Rolls up to work list totals</div></div>
        <div className="card metric"><div className="eyebrow">Open approvals</div><div className="metric-value mt-3">{pending.length}</div><div className="text-xs text-[#8292a1] mt-2">{money(pending.reduce((a, o) => a + sel.coDelta(o), 0))} awaiting a decision</div></div>
        <div className="card metric"><div className="eyebrow">Cost basis coverage</div><div className="metric-value mt-3">{pct(orders.filter(o => o.costBasis).length, orders.length)}%</div><div className="text-xs text-[#27786e] mt-2">Orders with a documented basis</div></div>
      </div>
      <div className="card table-wrap">
        <table className="data-table">
          <thead><tr><th>Reference</th><th>Change</th><th>Work item</th><th>Original</th><th>Revised</th><th>Delta</th><th>Basis</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={9} className="text-center text-[#8292a1]">No change orders for this vessel.</td></tr>}
            {orders.map(o => {
              const d = sel.coDelta(o);
              return (
                <tr key={o.id}>
                  <td className="mono font-bold">{o.reference}</td>
                  <td><b>{o.title}</b><div className="text-[10px] text-[#8292a1]">{o.reason} · raised {sel.fmtDate(o.dateRaised, false)}</div></td>
                  <td>{sel.workItemById(state, o.workItemId)?.name}</td>
                  <td>{money(o.originalCost)}</td>
                  <td>{money(o.revisedCost)}</td>
                  <td className={'font-bold ' + (d > 0 ? 'text-[#c15752]' : 'text-[#147653]')}>{d > 0 ? '+' : ''}{money(d)}</td>
                  <td className="text-[11px]">{o.costBasis}</td>
                  <td><span className={'pill ' + STATUS_PILL[o.status]}>{o.status}</span></td>
                  <td>{o.status === 'Pending' && <button className="btn no-print" onClick={() => actions.approveChangeOrder(o.id)}>Approve</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClassView({ state, v, today }) {
  const cls = sel.classSummary(state, v.id, today);
  const urgent = cls.open.filter(i => sel.daysBetween(today, i.classSurvey.dueDate) <= 14).length;
  const groups = ['Condition of Class', 'Recommendation', 'Memo item', 'Outstanding item'].map(cat => [cat, cls.items.filter(i => i.classSurvey.category === cat)]).filter(([, xs]) => xs.length);
  const coc = cls.nearestCoc;
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5">
        <div><div className="eyebrow mb-2">Survey register · {v.name}</div><h2 className="display text-3xl">Class & survey</h2></div>
        {urgent > 0 && <span className="pill pill-red">{urgent} due within 14 days</span>}
      </div>
      <div className="card table-wrap">
        <table className="data-table">
          <thead><tr><th>Reference</th><th>Category</th><th>Society · survey</th><th>Work item / surveyor note</th><th>Due</th><th>Evidence</th></tr></thead>
          <tbody>
            {groups.length === 0 && <tr><td colSpan={6} className="text-center text-[#8292a1]">No class or survey items for this vessel.</td></tr>}
            {groups.map(([cat, xs]) => xs.map(x => {
              const c = x.classSurvey;
              const d = sel.daysBetween(today, c.dueDate);
              const hot = cat === 'Condition of Class' && sel.isClassOpen(x);
              return (
                <tr key={x.id}>
                  <td className="mono font-bold">{c.reference}</td>
                  <td><span className={'pill ' + (cat === 'Condition of Class' ? 'pill-red' : cat === 'Recommendation' ? 'pill-amber' : 'pill-blue')}>{cat}</span></td>
                  <td>{c.society}<div className="text-[10px] text-[#8292a1]">{c.surveyType} survey</div></td>
                  <td><b>{x.name}</b><div className="text-[10px] text-[#8292a1] max-w-[320px] truncate">{c.surveyorNotes}</div></td>
                  <td className={hot && d <= 14 ? 'font-bold text-[#c15752]' : ''}>{sel.fmtDate(c.dueDate)}{sel.isClassOpen(x) && <div className="text-[10px]">{sel.dueText(d)}</div>}</td>
                  <td><span className={'pill ' + (c.evidenceStatus === 'Accepted' ? 'pill-green' : c.evidenceStatus === 'Uploaded' ? 'pill-blue' : 'pill-amber')}>{c.evidenceStatus}</span></td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
      {coc && <div className="card p-5 mt-5 alert-card"><div className="section-title">Condition of Class · operational attention</div><p className="text-xs text-[#6e7f8d] mt-2">{coc.item.classSurvey.reference} ({coc.item.name}) on {v.name} is {sel.dueText(coc.daysLeft).toLowerCase()}. Closing evidence is {coc.item.classSurvey.evidenceStatus.toLowerCase()}; confirm surveyor attendance before the next owner update.</p></div>}
    </div>
  );
}

function Inbox() {
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5"><div><div className="eyebrow mb-2">Human-confirmed ingestion</div><h2 className="display text-3xl">Inbox & imports</h2></div><button className="btn primary no-print" onClick={() => alert('Production seam: connect Gmail/Outlook and OCR/document parsing here.')}>＋ Import item</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2"><div className="border-2 border-dashed border-[#cbd9df] rounded-xl p-12 text-center bg-[#fbfcfd]"><div className="text-4xl">⌁</div><div className="font-extrabold mt-3">Drop an email, invoice, PDF or chat export</div><div className="text-xs text-[#8292a1] mt-2">AI extraction is simulated · nothing commits without review</div><button className="btn mt-5 no-print" onClick={() => alert('Mock extraction complete: invoice from Aster Marine, €42,000, likely AV / IT.')}>Run simulated extraction</button></div></div>
        <div className="card p-5"><div className="section-title">Needs review</div>{[['Invoice · Aster Marine', '€42,000 · likely AV / IT', 'pill-amber'], ['WhatsApp · Yard Team', '3 photos · progress evidence', 'pill-blue'], ['Survey PDF · Haven', '4 class items detected', 'pill-red']].map(x => <div className="py-4 border-b border-[#edf1f3]" key={x[0]}><span className={'pill ' + x[2]}>{x[2] === 'pill-red' ? 'Urgent' : 'Review'}</span><div className="font-bold text-xs mt-2">{x[0]}</div><div className="text-[11px] text-[#8292a1] mt-1">{x[1]}</div><button className="btn mt-3 no-print">Review extraction</button></div>)}</div>
      </div>
    </div>
  );
}

function Reports({ state, v, today }) {
  const items = sel.vesselItems(state, v.id);
  const fin = sel.vesselFinance(state, v);
  const prog = sel.programme(v, today);
  const cls = sel.classSummary(state, v.id, today);
  const pending = sel.vesselChangeOrders(state, v.id).filter(o => o.status === 'Pending');
  const owner = items.filter(i => i.ownerRelevant || i.department === "Owner's Preferences");
  const complete = items.filter(i => i.status === 'Complete');
  const active = items.filter(i => i.status === 'In progress');
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5 no-print"><div><div className="eyebrow mb-2">Owner-facing reporting</div><h2 className="display text-3xl">Report builder</h2></div><button className="btn primary" onClick={() => window.print()}>Print / export PDF</button></div>
      <div className="card p-8 max-w-4xl print-report">
        <div className="flex justify-between border-b border-[#dbe4ea] pb-5"><div><div className="eyebrow">RefitFlow · Weekly owner report</div><div className="display text-3xl mt-2">{v.name}</div><div className="text-xs text-[#8292a1] mt-2">Week {prog.week} of {prog.totalWeeks} · issued {sel.fmtDate(today)}</div></div><div className="text-right"><div className="brand-mark ml-auto">R</div><div className="text-[10px] text-[#8292a1] mt-2">CONFIDENTIAL</div></div></div>
        <div className="grid grid-cols-3 gap-4 my-7">{[['Invoiced to date', money(fin.invoiced)], ['Committed vs budget', `${money(fin.committed)} / ${money(fin.budget)}`], ['Days remaining', prog.daysLeft]].map(x => <div className="bg-[#f5f8fa] rounded-xl p-4" key={x[0]}><div className="eyebrow">{x[0]}</div><div className="text-xl font-extrabold mt-2">{x[1]}</div></div>)}</div>
        <h3 className="font-extrabold text-lg">Executive summary</h3>
        <p className="text-sm leading-7 text-[#526879] mt-2">The refit is in week {prog.week} of {prog.totalWeeks}, {sel.progressPct(state, items)}% complete by value. {money(fin.committed)} is committed against a {money(fin.budget)} budget ({pct(fin.committed, fin.budget)}%), with {money(fin.invoiced)} invoiced so far.{pending.length ? ` ${pending.length} change order${pending.length === 1 ? '' : 's'} totalling ${money(pending.reduce((a, o) => a + sel.coDelta(o), 0))} await${pending.length === 1 ? 's' : ''} owner approval.` : ''}</p>
        <h3 className="font-extrabold text-lg mt-7">Class & flag status</h3>
        <div className={'rounded-xl p-4 mt-3 text-sm ' + (cls.nearestCoc ? 'alert-card' : 'bg-[#f5f8fa]')}>{cls.nearestCoc ? `Condition of Class ${cls.nearestCoc.item.classSurvey.reference} (${cls.nearestCoc.item.name}) is ${sel.dueText(cls.nearestCoc.daysLeft).toLowerCase()}. ${cls.open.length} class items remain open.` : cls.items.length ? `No open Condition of Class items. ${cls.open.length} other class items remain open.` : 'No class or survey items on this programme.'}</div>
        <h3 className="font-extrabold text-lg mt-7">Works status</h3>
        <ul className="text-sm leading-8 text-[#526879] mt-2">{[...complete.map(i => `Completed: ${i.name}`), ...active.map(i => `In progress: ${i.name}`)].slice(0, 6).map(t => <li key={t}>• {t}</li>)}</ul>
        {owner.length > 0 && <><h3 className="font-extrabold text-lg mt-7">Owner's interests</h3><ul className="text-sm leading-8 text-[#526879] mt-2">{owner.map(i => <li key={i.id}>• {i.name} — {i.status.toLowerCase()}, {money(sel.itemCost(state, i))}</li>)}</ul></>}
        <div className="mt-10 pt-4 border-t border-[#dbe4ea] text-[10px] text-[#8292a1]">Prepared from the live work list, schedule, change orders and confirmed source items. Human review required before distribution.</div>
      </div>
    </div>
  );
}

function ContractBanner({ state, v, setView }) {
  const c = sel.vesselContract(state, v.id);
  const yard = c && sel.contractorById(state, c.shipyardContractorId);
  const signed = c?.status === 'Signed';
  return (
    <div className="card p-7 mb-5 flex flex-col md:flex-row md:items-center gap-5 bg-[#102b42] text-white">
      <div className="w-12 h-12 rounded-2xl bg-[#24455d] grid place-items-center text-xl">{signed ? '✓' : '!'}</div>
      <div className="flex-1">
        <div className="eyebrow text-[#85c8c0]">{c ? `${c.type} · ${c.status}` : 'No contract'}</div>
        <div className="font-extrabold text-lg mt-1">{signed ? 'Shipyard modules unlocked' : 'Shipyard modules locked until the contract is signed'}</div>
        {c && <div className="text-xs text-[#a9bacb] mt-1">{yard?.name} · {money(c.value)} · {c.governingLaw} · warranty until {sel.fmtDate(c.warrantyUntil)}</div>}
      </div>
      <button className="btn bg-white text-[#0b1f33] border-white no-print" onClick={() => setView('work')}>Open work list →</button>
    </div>
  );
}

const VIEWS = { dashboard: Dashboard, work: WorkList, gantt: Gantt, change: ChangeOrders, class: ClassView, inbox: Inbox, reports: Reports };

function App() {
  const [state, actions] = useRefitStore(seed);
  const [view, setView] = useState('fleet');
  const [selected, setSelected] = useState(seed.vessels[0].id);
  const today = sel.todayISO();
  const v = state.vessels.find(x => x.id === selected) ?? state.vessels[0];
  const open = (id, next = 'dashboard') => { setSelected(id); setView(next); };
  const ctx = { state, actions, today, v, view, setView, open };
  const View = VIEWS[view];
  return (
    <div className="app-shell">
      <Sidebar {...ctx} />
      <main className="main">
        <Topbar {...ctx} />
        <div className="content">
          {view === 'fleet' ? <FleetView {...ctx} /> : <><ContractBanner {...ctx} /><View key={v.id} {...ctx} /></>}
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
