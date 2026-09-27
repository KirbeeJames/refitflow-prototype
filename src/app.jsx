import React, { useRef, useState } from 'react';
import { DEPARTMENTS, DEPT_COLORS, VAT_TREATMENTS, priorityOf } from './data/model.js';
import { seed } from './data/seed.js';
import { useRefitStore } from './data/store.js';
import * as sel from './data/selectors.js';
import { CONTRACT_PILL, Field, Icon, LEVEL_PILL, Progress, STATUS_PILL, money, moneyShort, pct } from './ui.jsx';
import { ChangeOrderForm, EvidenceForm, MilestoneForm, VesselForm, WorkItemForm } from './forms.jsx';

const TITLES = { fleet: 'Fleet overview', dashboard: 'Command center', contract: 'Contract', work: 'Master work list', gantt: 'Live schedule', change: 'Change orders', class: 'Class & survey register', inbox: 'Inbox & updates', reports: 'Owner reporting' };
const NAV = [['fleet', '◈', 'Fleet overview'], ['dashboard', '⌂', 'Dashboard'], ['contract', '§', 'Contract'], ['work', '≡', 'Work list'], ['gantt', '▥', 'Live Gantt'], ['change', '↗', 'Change orders'], ['class', '◇', 'Class & survey'], ['inbox', '✉', 'Inbox & updates'], ['reports', '▤', 'Reports']];
const GATED = ['work', 'gantt', 'change'];

function Sidebar({ state, today, view, setView, open, actions }) {
  return (
    <aside className="sidebar">
      <div className="flex items-center gap-3 mb-10 px-2"><div className="brand-mark">R</div><div className="label"><div className="font-extrabold tracking-tight">RefitFlow</div><div className="text-[10px] text-slate-400 mt-0.5">YARD COMMAND CENTER</div></div></div>
      <div className="eyebrow px-3 mb-3">Workspace</div>
      {NAV.map(([id, ic, label]) => <button key={id} aria-label={label} className={'nav-item ' + (view === id ? 'active' : '')} onClick={() => setView(id)}><Icon>{ic}</Icon><span className="label">{label}</span></button>)}
      <div className="mt-8 pt-5 border-t border-slate-700/60">
        <div className="eyebrow px-3 mb-3">Active fleet</div>
        {state.vessels.map(v => {
          const urgent = sel.vesselAlerts(state, v, today).some(a => a.level === 'red');
          return <button className="nav-item fleet-mini" key={v.id} onClick={() => open(v.id)}><span className="w-2 h-2 rounded-full" style={{ background: urgent ? '#e28a31' : '#53b8ae' }}></span><span className="label truncate">{v.name}</span></button>;
        })}
      </div>
      <div className="mt-8 px-3 text-[11px] text-slate-500 label">v0.11 · <button className="underline" onClick={() => window.confirm('Reset all data to the demo fleet? Your changes will be lost.') && actions.reset()}>reset demo data</button></div>
    </aside>
  );
}

function Topbar({ v, view, setView }) {
  return (
    <header className="topbar">
      <div><div className="eyebrow">{view === 'fleet' ? 'All vessels' : `${v.name} / ${view === 'dashboard' ? 'project dashboard' : view}`}</div><div className="font-extrabold mt-1">{TITLES[view]}</div></div>
      <div className="flex items-center gap-3"><button className="btn no-print" onClick={() => setView('work')}>⌕ <span className="hidden sm:inline">Search work list</span></button><div className="w-8 h-8 rounded-full bg-[#d9eceb] text-[#0d736c] grid place-items-center text-xs font-extrabold">JM</div></div>
    </header>
  );
}

function FleetView({ state, today, open, openModal }) {
  const rows = state.vessels.map(v => {
    const items = sel.vesselItems(state, v.id);
    return { v, items, contract: sel.vesselContract(state, v.id), prog: sel.programme(v, today), fin: sel.vesselFinance(state, v), progress: sel.progressPct(state, items), alerts: sel.vesselAlerts(state, v, today) };
  });
  const queue = rows.flatMap(r => r.alerts).sort((a, b) => a.days - b.days).slice(0, 6);
  const nameOf = id => state.vessels.find(v => v.id === id).name.replace('M/Y ', '');
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-7 gap-4">
        <div><div className="eyebrow mb-2">Season · {today.slice(0, 4)}</div><h1 className="display text-4xl text-[#0b1f33]">Your fleet, in motion.</h1><p className="text-sm text-[#708394] mt-2">{rows.length} live refit programmes · {moneyShort(rows.reduce((a, r) => a + r.v.budget, 0))} under management</p></div>
        <button className="btn primary no-print" onClick={() => openModal('vessel')}>＋ Add vessel</button>
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
          <div className="section-title">Season pulse</div><div className="text-xs text-[#8292a1] mt-1 mb-4">Committed spend as a share of each refit budget</div>
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
    ['Contract value', money(contract?.value), contract ? `${contract.status} · ${contract.type}` : 'No contract yet', ''],
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
        <div className="flex justify-between flex-wrap gap-2 text-xs mb-2"><span>{ta.elapsed} days since entry ({sel.fmtDate(ta.entryDate)})</span><span>limit {sel.fmtDate(ta.limitDate)} · {ta.left} days left</span></div>
        <Progress value={pct(ta.elapsed, ta.limitDays)} color={ta.overrun || ta.left <= 90 ? '#dc5c58' : '#d28b25'} />
        {ta.overrun && <div className="text-[11px] text-[#c15752] mt-2">Refit ends {sel.fmtDate(v.refitEnd)}, after the 18-month limit.</div>}
      </> : <div className="text-xs text-[#8292a1]">Not under temporary admission{v.flag ? ` (${v.flag} flag)` : ''}.</div>}
      <div className="eyebrow mt-6 mb-3">IPR authorisations</div>
      {ipr.length === 0 && <div className="text-xs text-[#8292a1]">No items under Inward Processing Relief.</div>}
      {ipr.map(r => <div key={r.auth.id} className="flex justify-between items-center gap-2 text-xs py-2 border-b border-[#edf1f3]"><span><b className="mono">{r.auth.reference}</b> · {r.items.length} item{r.items.length === 1 ? '' : 's'} · {money(r.value)}</span><span className={'pill ' + (r.level === 'ok' ? 'pill-green' : r.level === 'warning' ? 'pill-amber' : 'pill-red')}>{sel.dueText(r.daysLeft)}</span></div>)}
    </div>
  );
}

function MiniGantt({ state, v, today }) {
  const from = sel.addDays(today, -7), to = sel.addDays(today, 42);
  const span = sel.daysBetween(from, to);
  const pos = iso => Math.min(100, Math.max(0, (sel.daysBetween(from, iso) / span) * 100));
  const items = sel.vesselItems(state, v.id).filter(i => i.status !== 'Complete' && i.start <= to && i.end >= from).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 7);
  if (!items.length) return <div className="text-xs text-[#8292a1]">Nothing scheduled in the next six weeks.</div>;
  return items.map(x => (
    <div key={x.id} className="grid grid-cols-[140px_1fr] items-center gap-3 py-1.5 text-[11px]">
      <span className="truncate">{x.name}</span>
      <div className="relative h-4 rounded bg-[#f1f5f7]"><div className="today-line" style={{ left: pos(today) + '%', top: -3, bottom: -3 }} /><div className="absolute top-0.5 bottom-0.5 rounded" style={{ left: pos(x.start) + '%', width: Math.max(2, pos(x.end) - pos(x.start)) + '%', background: DEPT_COLORS[x.department] }} /></div>
    </div>
  ));
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
  const upcoming = sel.vesselMilestones(state, v.id).filter(m => m.date >= today).slice(0, 4);
  return (
    <div className="animate-in">
      <SummaryCards state={state} v={v} today={today} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card p-5 xl:col-span-2">
          <div className="flex justify-between items-start mb-5"><div><div className="section-title">Programme overview</div><div className="text-xs text-[#8292a1] mt-1">Week {prog.week} of {prog.totalWeeks} · {sel.fmtDate(v.refitStart)} — {sel.fmtDate(v.refitEnd)}</div></div><button className="btn no-print" onClick={() => setView('gantt')}>Open Gantt →</button></div>
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 shrink-0 rounded-full grid place-items-center" style={{ background: `conic-gradient(#0d9488 ${progress}%, #e7edef 0)` }}><div className="w-16 h-16 rounded-full bg-white grid place-items-center font-extrabold text-xl">{progress}<span className="text-[10px]">%</span></div></div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-2"><span>Cost-weighted progress</span><strong>{count('Complete')} of {items.length} complete</strong></div>
              <Progress value={progress} />
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-xs text-[#8292a1]">{['In progress', 'Approved', 'Quoted', 'Working list'].map(st => <span key={st}><b className="text-[#14263a]">{count(st)}</b> {st.toLowerCase()}</span>)}</div>
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
        <div className="card p-5 lg:col-span-2"><div className="flex justify-between mb-4"><div><div className="section-title">Next six weeks</div><div className="text-xs text-[#8292a1] mt-1">Open jobs around today</div></div><button className="btn no-print" onClick={() => setView('gantt')}>Full schedule</button></div><MiniGantt state={state} v={v} today={today} /></div>
        <div className="card p-5"><div className="section-title">Upcoming milestones</div>{upcoming.length === 0 && <div className="text-xs text-[#8292a1] mt-3">No milestones ahead.</div>}{upcoming.map(m => <div className="flex justify-between text-xs py-3 border-b border-[#edf1f3]" key={m.id}><b>{m.name}</b><span className="text-[#8292a1]">{sel.fmtDate(m.date)} · {sel.daysBetween(today, m.date)}d</span></div>)}</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex justify-between mb-4"><div><div className="section-title">Department exposure</div><div className="text-xs text-[#8292a1] mt-1">Current cost incl. approved change orders</div></div><button className="btn no-print" onClick={() => setView('work')}>Open work list</button></div>
          {depts.length === 0 && <div className="text-xs text-[#8292a1]">No work items yet.</div>}
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

function ContractView({ state, v, actions }) {
  const c = sel.vesselContract(state, v.id);
  const [terms, setTerms] = useState(c);
  const [text, setText] = useState('');
  const [found, setFound] = useState(null);
  if (!c) return <div className="card p-6 text-sm">No contract record for this vessel.</div>;
  const signed = c.status === 'Signed';
  const yards = state.contractors.filter(x => x.type === 'shipyard');
  const bind = key => ({ value: terms[key] ?? '', disabled: signed, onChange: e => setTerms({ ...terms, [key]: key === 'value' ? Number(e.target.value) : e.target.value }) });
  const dirty = JSON.stringify(terms) !== JSON.stringify(c);
  const save = () => actions.updateContract(c.id, terms);
  const setStatus = status => { actions.updateContract(c.id, { ...terms, status }); setTerms({ ...terms, status }); };
  const toggle = key => { const next = { ...terms, [key]: !terms[key] }; setTerms(next); actions.updateContract(c.id, { [key]: next[key] }); };
  const applyFound = () => {
    const { shipyardName, ...rest } = found;
    const yard = shipyardName && state.contractors.find(x => x.name.toLowerCase() === shipyardName.toLowerCase());
    setTerms({ ...terms, ...rest, ...(yard && { shipyardContractorId: yard.id }), sourceDocument: 'Pasted text' });
    setFound(null);
  };
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
        <div><div className="eyebrow mb-2">{v.name} · governing contract</div><h2 className="display text-3xl">{c.type}</h2></div>
        <div className="flex items-center gap-2">{['Draft', 'Under Review', 'Signed'].map((s, i) => <React.Fragment key={s}>{i > 0 && <span className="text-[#9aa9b5]">→</span>}<span className={'pill ' + (c.status === s ? CONTRACT_PILL[s] : 'bg-[#f1f5f7] text-[#8292a1]')}>{s}</span></React.Fragment>)}</div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card p-6 xl:col-span-2">
          <div className="flex justify-between items-center mb-4"><div className="section-title">Key terms</div>{signed ? <span className="pill pill-green">Read-only · signed</span> : <button className="btn primary" disabled={!dirty} onClick={save}>Save terms</button>}</div>
          <div className="form-grid">
            <Field label="Shipyard"><select id="k-yard" {...bind('shipyardContractorId')}>{yards.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select></Field>
            <Field label="Client party"><input id="k-client" {...bind('clientParty')} /></Field>
            <Field label="Contract value (€)"><input id="k-value" type="number" min="0" {...bind('value')} /></Field>
            <Field label="Governing law"><input id="k-law" {...bind('governingLaw')} /></Field>
            <Field label="Start"><input id="k-start" type="date" {...bind('startDate')} /></Field>
            <Field label="End"><input id="k-end" type="date" {...bind('endDate')} /></Field>
            <Field label="Warranty"><input id="k-warranty" {...bind('warranty')} /></Field>
            <Field label="Warranty until"><input id="k-warranty-until" type="date" {...bind('warrantyUntil')} /></Field>
          </div>
          {c.paymentSchedule?.length > 0 && <div className="mt-6"><div className="eyebrow mb-2">Payment schedule</div><div className="flex flex-wrap gap-2">{c.paymentSchedule.map(p => <span key={p.label} className="rounded-lg bg-[#f5f8fa] px-3 py-1.5 text-xs">{p.label} <b>{p.pct}%</b> · {money((c.value * p.pct) / 100)}</span>)}</div></div>}
          {c.clauses?.length > 0 && <div className="mt-6"><div className="eyebrow mb-2">Clauses used for cost basis</div>{c.clauses.map(k => <div key={k.ref} className="text-xs py-1.5"><b className="mono">{k.ref}</b> {k.title} <span className="text-[#8292a1]">· {k.topic}</span></div>)}</div>}
        </div>
        <div className="flex flex-col gap-5">
          <div className="card p-5">
            <div className="section-title">Signature</div>
            {signed ? <p className="text-xs text-[#6e7f8d] mt-2">Signed by both parties. Terms are locked and shipyard modules are active.</p> : <>
              <p className="text-xs text-[#6e7f8d] mt-2">Work list, Gantt and change orders unlock once both parties have signed.</p>
              <div className="flex flex-col gap-2 mt-4">
                <label className="check-row"><input id="k-sig-yard" type="checkbox" checked={!!terms.signedByShipyard} onChange={() => toggle('signedByShipyard')} disabled={c.status !== 'Under Review'} /> Signed by shipyard</label>
                <label className="check-row"><input id="k-sig-client" type="checkbox" checked={!!terms.signedByClient} onChange={() => toggle('signedByClient')} disabled={c.status !== 'Under Review'} /> Signed by owner / client</label>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {c.status === 'Draft' && <button className="btn primary" onClick={() => setStatus('Under Review')}>Send for review</button>}
                {c.status === 'Under Review' && <><button className="btn" onClick={() => setStatus('Draft')}>Back to draft</button><button className="btn primary" disabled={!terms.signedByShipyard || !terms.signedByClient || dirty} onClick={() => setStatus('Signed')}>Mark as signed</button></>}
              </div>
              {c.status === 'Under Review' && dirty && <p className="text-[11px] text-[#a36c22] mt-2">Save the edited terms before signing.</p>}
            </>}
          </div>
          {!signed && <div className="card p-5">
            <div className="section-title">Pull terms from text</div>
            <p className="text-xs text-[#6e7f8d] mt-2">Paste the contract text. Found terms are shown for review before anything changes.</p>
            <Field label="Contract text"><textarea id="k-text" value={text} onChange={e => setText(e.target.value)} placeholder="Paste clauses here…" /></Field>
            <button className="btn mt-3" disabled={!text.trim()} onClick={() => setFound(sel.extractContractTerms(text))}>Find terms</button>
            {found && <div className="mt-4 text-xs">{Object.keys(found).length === 0 ? <p className="text-[#a36c22]">No terms recognised — fill the fields by hand.</p> : <>
              {Object.entries(found).map(([k, val]) => <div key={k} className="flex justify-between py-1 border-b border-[#edf1f3]"><span className="text-[#8292a1]">{k}</span><b>{k === 'value' ? money(val) : val}</b></div>)}
              <div className="flex gap-2 mt-3"><button className="btn" onClick={() => setFound(null)}>Discard</button><button className="btn primary" onClick={applyFound}>Apply to form</button></div>
            </>}</div>}
          </div>}
        </div>
      </div>
    </div>
  );
}

function WorkList({ state, v, today, setView, openModal }) {
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
  const iprs = sel.iprStatus(state, v.id, today);
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
        <div><div className="eyebrow mb-2">{v.name} · {all.length} items</div><h2 className="display text-3xl">The master work list</h2></div>
        <div className="flex gap-2 no-print"><button className="btn" onClick={() => openModal('item')}>＋ New item</button><button className="btn teal" onClick={() => setView('change')}>Change orders</button></div>
      </div>
      <div className="card">
        <div className="tabbar px-4">{['Working list', 'Quoted list', 'IPR tracker'].map(x => <button className={'tab ' + (tab === x ? 'active' : '')} onClick={() => setTab(x)} key={x}>{x}</button>)}</div>
        {tab === 'IPR tracker' && <div className="p-5 border-b border-[#edf1f3]"><CustomsPanel state={state} v={v} today={today} /></div>}
        <div className="p-4 flex flex-wrap gap-2 items-center no-print">
          <input id="wl-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search work items..." aria-label="Search work items" className="border border-[#dbe4ea] rounded-lg px-3 py-2 text-xs w-52 outline-none" autoFocus />
          <select id="wl-dept" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Department" className="border border-[#dbe4ea] rounded-lg px-3 py-2 text-xs bg-white"><option>All departments</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select>
          <span className="ml-auto text-xs text-[#8292a1]">{rows.length} visible items · {money(rows.reduce((a, x) => a + sel.itemCost(state, x), 0))}</span>
        </div>
        <div className="px-4 pb-4 flex flex-wrap gap-2 text-[11px]">{VAT_TREATMENTS.filter(t => vat[t]).map(t => <span key={t} className="rounded-lg bg-[#f5f8fa] px-3 py-1.5"><span className="text-[#8292a1]">{t}</span> <b>{money(vat[t])}</b></span>)}</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Work item</th><th>Department</th><th>Priority</th><th>Status</th><th>Contractor</th><th>Estimate</th>{tab === 'Quoted list' ? <><th>Quoted</th><th>Variance</th></> : <th>Current cost</th>}<th>VAT / customs</th><th>Timeline</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={10} className="text-center text-[#8292a1]">{all.length ? 'No items match.' : 'No work items yet — add the first one.'}</td></tr>}
              {rows.map(x => {
                const cost = sel.itemCost(state, x);
                const priority = priorityOf(x);
                const ipr = x.iprAuthorizationId && iprs.find(r => r.auth.id === x.iprAuthorizationId);
                return (
                  <tr key={x.id} className="cursor-pointer" onClick={() => openModal('item', { item: x })}>
                    <td><div className="font-extrabold">{x.name}</div><div className="text-[10px] text-[#8292a1] max-w-[260px] truncate">{x.description} · from {lastSource(x)}</div></td>
                    <td><span className="pill" style={{ background: DEPT_COLORS[x.department] + '18', color: DEPT_COLORS[x.department] }}>{x.department}</span></td>
                    <td><span className={'pill ' + (priority === 'Essential' ? 'pill-red' : priority === 'Desired' ? 'pill-blue' : 'pill-amber')}>{priority}{x.priorityOverride ? ' ·set' : ''}</span></td>
                    <td><span className={'pill ' + (STATUS_PILL[x.status] ?? 'pill-amber')}>{x.status}{x.percentComplete != null && x.status !== 'Complete' ? ` ${x.percentComplete}%` : ''}</span></td>
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

const ZOOMS = { Full: null, Month: [-7, 35], Week: [-3, 11] };

function Gantt({ state, v, today, actions, openModal }) {
  const [mode, setMode] = useState('Department');
  const [zoom, setZoom] = useState('Full');
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const contract = sel.vesselContract(state, v.id);
  const [winStart, winEnd] = ZOOMS[zoom] ? ZOOMS[zoom].map(d => sel.addDays(today, d)) : [contract?.startDate ?? v.refitStart, contract?.endDate ?? v.refitEnd];
  const span = Math.max(1, sel.daysBetween(winStart, winEnd));
  const pos = iso => Math.min(100, Math.max(0, (sel.daysBetween(winStart, iso) / span) * 100));
  const shifted = x => (drag?.id === x.id && drag.shift ? { ...x, start: sel.addDays(x.start, drag.shift), end: sel.addDays(x.end, drag.shift) } : x);
  const items = sel.vesselItems(state, v.id).map(shifted).sort((a, b) => a.start.localeCompare(b.start));
  const visible = items.filter(x => x.end >= winStart && x.start <= winEnd);
  const ticks = Array.from({ length: 8 }, (_, i) => sel.addDays(winStart, Math.round((span * i) / 8)));
  const todayPos = today >= winStart && today <= winEnd ? pos(today) : null;
  const conflicts = sel.scheduleConflicts(state, items);
  const clashing = new Set(conflicts.flat().map(i => i.id));
  const milestones = sel.vesselMilestones(state, v.id);

  // Ref, not state: pointer events can outrun React renders.
  const onDown = (e, x) => {
    if (x.status === 'Complete') return openModal('item', { item: sel.workItemById(state, x.id) });
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* chart-level listeners still track it */ }
    dragRef.current = { id: x.id, x0: e.clientX, width: e.currentTarget.parentElement.getBoundingClientRect().width, shift: 0 };
    setDrag(dragRef.current);
  };
  const onMove = e => {
    const d = dragRef.current;
    if (!d) return;
    const shift = Math.round(((e.clientX - d.x0) / d.width) * span);
    if (shift !== d.shift) { dragRef.current = { ...d, shift }; setDrag(dragRef.current); }
  };
  const onUp = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setDrag(null);
    const original = sel.workItemById(state, d.id);
    if (d.shift) actions.rescheduleItem(d.id, sel.addDays(original.start, d.shift), sel.addDays(original.end, d.shift));
    else openModal('item', { item: original });
  };

  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
        <div><div className="eyebrow mb-2">{zoom === 'Full' ? 'Contract window' : `${zoom} view`} · {sel.fmtDate(winStart)} — {sel.fmtDate(winEnd)}</div><h2 className="display text-3xl">Live schedule</h2></div>
        <div className="flex flex-wrap gap-2 no-print">
          {Object.keys(ZOOMS).map(z => <button key={z} className={'btn ' + (zoom === z ? 'primary' : '')} onClick={() => setZoom(z)}>{z}</button>)}
          <span className="w-px bg-[#dbe4ea] mx-1" />
          <button className={'btn ' + (mode === 'Department' ? 'primary' : '')} onClick={() => setMode('Department')}>By department</button><button className={'btn ' + (mode === 'Contractor' ? 'primary' : '')} onClick={() => setMode('Contractor')}>By contractor</button>
        </div>
      </div>
      <div className="card p-5 overflow-auto">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#8292a1] mb-5"><span className="w-2 h-2 rounded-full bg-[#dc5c58]"></span>Today · {sel.fmtDate(today)}<span className="w-2 h-2 rounded-full ml-3" style={{ boxShadow: '0 0 0 2px #dc5c58' }}></span>Contractor overlap<span className="ml-auto">Drag a bar to reschedule · click to edit</span></div>
        <div className="gantt" onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onPointerCancel={() => { dragRef.current = null; setDrag(null); }}>
          <div className="gantt-head"><div></div><div className="grid grid-cols-8">{ticks.map(t => <span key={t}>{sel.fmtDate(t, false)}</span>)}</div></div>
          {visible.length === 0 && <div className="text-xs text-[#8292a1] py-6 text-center">Nothing scheduled in this window.</div>}
          {visible.map(x => {
            const c = sel.contractorById(state, x.contractorId);
            const left = pos(x.start);
            const cls = 'bar' + (x.status !== 'Complete' ? ' draggable' : '') + (drag?.id === x.id ? ' dragging' : '') + (clashing.has(x.id) ? ' clash' : '');
            return (
              <div className="gantt-row" key={x.id}>
                <div className="pr-4 text-xs truncate"><strong className="block truncate">{x.status === 'Complete' ? '✓ ' : x.status === 'In progress' ? '◐ ' : ''}{x.name}</strong><small className="text-[#8292a1]">{mode === 'Department' ? x.department : c?.name ?? 'Unassigned'}</small></div>
                <div className="gantt-grid">
                  {todayPos != null && <div className="today-line" style={{ left: todayPos + '%' }} />}
                  <div className={cls} role="button" aria-label={`${x.name}, ${sel.fmtDate(x.start)} to ${sel.fmtDate(x.end)}`} onPointerDown={e => onDown(e, x)}
                    style={{ left: left + '%', width: Math.max(1, pos(x.end) - left) + '%', background: mode === 'Department' ? DEPT_COLORS[x.department] : c?.color ?? '#8292a1', opacity: x.status === 'Complete' ? 0.55 : 1 }}
                    title={`${x.name} · ${sel.fmtDate(x.start)} → ${sel.fmtDate(x.end)} · ${x.status}`}></div>
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
          {conflicts.slice(0, 5).map(([a, b]) => <p key={a.id + b.id} className="text-xs text-[#6e7f8d] mt-2"><b>{sel.contractorById(state, a.contractorId).name}</b> is booked on {a.name} and {b.name} at the same time — drag one to reschedule.</p>)}
        </div>
        <div className="card p-5">
          <div className="flex justify-between items-center"><div className="section-title">Milestones</div><button className="btn no-print" onClick={() => openModal('milestone')}>＋ Add</button></div>
          {milestones.length === 0 && <div className="text-xs text-[#8292a1] mt-3">No milestones yet.</div>}
          {milestones.map(m => <div className="flex justify-between gap-2 text-xs mt-3" key={m.id}><b>{m.name}</b><span className="text-[#8292a1] shrink-0">{sel.fmtDate(m.date)}</span></div>)}
        </div>
      </div>
    </div>
  );
}

function ChangeOrders({ state, actions, v, openModal }) {
  const orders = sel.vesselChangeOrders(state, v.id).sort((a, b) => b.dateRaised.localeCompare(a.dateRaised));
  const approved = orders.filter(o => o.status === 'Approved');
  const pending = orders.filter(o => o.status === 'Pending');
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
        <div><div className="eyebrow mb-2">Cost control · {v.name}</div><h2 className="display text-3xl">Change orders</h2></div>
        <button className="btn primary no-print" onClick={() => openModal('co')}>＋ Raise change order</button>
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
                  <td className="text-[11px]">{o.costBasis || <span className="text-[#c15752]">Missing</span>}</td>
                  <td><span className={'pill ' + STATUS_PILL[o.status]}>{o.status}</span></td>
                  <td>{o.status === 'Pending' && <div className="flex gap-2"><button className="btn danger no-print" onClick={() => actions.rejectChangeOrder(o.id)}>Reject</button><button className="btn no-print" onClick={() => actions.approveChangeOrder(o.id)}>Approve</button></div>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClassView({ state, v, today, openModal }) {
  const cls = sel.classSummary(state, v.id, today);
  const urgent = cls.open.filter(i => sel.daysBetween(today, i.classSurvey.dueDate) <= 14).length;
  const groups = ['Condition of Class', 'Recommendation', 'Memo item', 'Outstanding item'].map(cat => [cat, cls.items.filter(i => i.classSurvey.category === cat)]).filter(([, xs]) => xs.length);
  const coc = cls.nearestCoc;
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
        <div><div className="eyebrow mb-2">Survey register · {v.name}</div><h2 className="display text-3xl">Class & survey</h2></div>
        <div className="flex items-center gap-2">{urgent > 0 && <span className="pill pill-red">{urgent} due within 14 days</span>}<button className="btn no-print" onClick={() => openModal('item', { classItem: true })}>＋ Class item</button></div>
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
                <tr key={x.id} className="cursor-pointer" onClick={() => openModal('item', { item: x })}>
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

function Inbox({ state, v, openModal }) {
  const trail = sel.vesselItems(state, v.id).flatMap(i => i.sources.map(src => ({ ...src, item: i }))).sort((a, b) => b.date.localeCompare(a.date));
  const notes = state.notes.filter(n => n.vesselId === v.id).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
        <div><div className="eyebrow mb-2">Evidence trail · {v.name}</div><h2 className="display text-3xl">Inbox & updates</h2></div>
        <button className="btn primary no-print" onClick={() => openModal('evidence')}>＋ Log update</button>
      </div>
      <div className="card p-4 mb-5 text-xs text-[#6e7f8d]">Mailbox and WhatsApp connections aren't set up yet. Log emails, invoices and chat updates here by hand — each one is attached to its work item so every cost and status change shows where it came from.</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2 table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Source</th><th>Update</th><th>Work item</th></tr></thead>
            <tbody>
              {trail.length === 0 && <tr><td colSpan={4} className="text-center text-[#8292a1]">No updates logged yet.</td></tr>}
              {trail.map((t, i) => <tr key={i} className="cursor-pointer" onClick={() => openModal('item', { item: t.item })}><td className="mono text-[11px]">{sel.fmtDate(t.date, false)}</td><td><span className={'pill ' + (t.kind === 'invoice' ? 'pill-amber' : t.kind === 'import' ? 'pill-blue' : 'pill-green')}>{t.kind}</span></td><td><b>{t.label}</b></td><td>{t.item.name}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="card p-5">
          <div className="section-title">Project notes</div>
          <div className="text-xs text-[#8292a1] mt-1 mb-3">Updates that aren't tied to a work item</div>
          {notes.length === 0 && <div className="text-xs text-[#8292a1]">No notes yet.</div>}
          {notes.map(n => <div key={n.id} className="py-3 border-b border-[#edf1f3] text-xs"><div className="font-bold">{n.label}</div>{n.text && <p className="text-[#526879] mt-1 whitespace-pre-wrap">{n.text}</p>}<div className="text-[#8292a1] mt-1">{n.kind} · {sel.fmtDate(n.date)}</div></div>)}
        </div>
      </div>
    </div>
  );
}

function breakdown(state, items, key) {
  const map = new Map();
  items.forEach(i => map.set(key(i), (map.get(key(i)) ?? 0) + sel.itemCost(state, i)));
  return [...map].sort((a, b) => b[1] - a[1]);
}

function Reports({ state, v, today, actions }) {
  const [type, setType] = useState('Weekly');
  const [commentary, setCommentary] = useState('');
  const [recipients, setRecipients] = useState(v.distribution.join(', '));
  const [viewing, setViewing] = useState(null);
  const [issued, setIssued] = useState('');
  const items = sel.vesselItems(state, v.id);
  const fin = sel.vesselFinance(state, v);
  const prog = sel.programme(v, today);
  const progress = sel.progressPct(state, items);
  const cls = sel.classSummary(state, v.id, today);
  const cos = sel.vesselChangeOrders(state, v.id);
  const pending = cos.filter(o => o.status === 'Pending');
  const owner = items.filter(i => i.ownerRelevant || i.department === "Owner's Preferences");
  const periodStart = sel.addDays(today, type === 'Weekly' ? -7 : -30);
  const nextEnd = sel.addDays(today, type === 'Weekly' ? 7 : 30);
  const complete = items.filter(i => i.status === 'Complete');
  const active = items.filter(i => i.status === 'In progress');
  const delayed = items.filter(i => i.status !== 'Complete' && i.end < today);
  const next = items.filter(i => i.status !== 'Complete' && i.start > today && i.start <= nextEnd);
  const periodCos = cos.filter(o => o.dateRaised >= periodStart);
  const history = state.reports.filter(r => r.vesselId === v.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const emails = recipients.split(/[,;\s]+/).filter(Boolean);
  const badEmail = emails.find(e => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));

  const issue = () => {
    actions.updateVessel(v.id, { distribution: emails });
    actions.saveReport({ vesselId: v.id, type, commentary, recipients: emails, summary: { week: prog.week, totalWeeks: prog.totalWeeks, progress, invoiced: fin.invoiced, committed: fin.committed, budget: fin.budget, openClass: cls.open.length, pendingCos: pending.length } });
    setIssued(`${type} report archived${emails.length ? ` with ${emails.length} recipient${emails.length === 1 ? '' : 's'} listed` : ''}. Export the PDF to send it.`);
    setCommentary('');
  };

  return (
    <div className="animate-in">
      <div className="flex justify-between items-end mb-5 no-print flex-wrap gap-3">
        <div><div className="eyebrow mb-2">Owner-facing reporting</div><h2 className="display text-3xl">Report builder</h2></div>
        <div className="flex gap-2">{['Weekly', 'Monthly'].map(t => <button key={t} className={'btn ' + (type === t ? 'primary' : '')} onClick={() => setType(t)}>{t}</button>)}<button className="btn teal" onClick={() => window.print()}>Print / export PDF</button></div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card p-8 xl:col-span-2 print-report">
          <div className="flex justify-between border-b border-[#dbe4ea] pb-5"><div><div className="eyebrow">RefitFlow · {type} owner report</div><div className="display text-3xl mt-2">{v.name}</div><div className="text-xs text-[#8292a1] mt-2">Week {prog.week} of {prog.totalWeeks} · issued {sel.fmtDate(today)}</div></div><div className="text-right"><div className="brand-mark ml-auto">R</div><div className="text-[10px] text-[#8292a1] mt-2">CONFIDENTIAL</div></div></div>
          <div className="grid grid-cols-3 gap-4 my-7">{[['Invoiced to date', money(fin.invoiced)], ['Committed / budget', `${pct(fin.committed, fin.budget)}%`], ['Days remaining', prog.daysLeft]].map(x => <div className="bg-[#f5f8fa] rounded-xl p-4" key={x[0]}><div className="eyebrow">{x[0]}</div><div className="text-xl font-extrabold mt-2">{x[1]}</div></div>)}</div>
          <h3 className="font-extrabold text-lg">Executive summary</h3>
          <p className="text-sm leading-7 text-[#526879] mt-2">The refit is in week {prog.week} of {prog.totalWeeks}, {progress}% complete by value. {money(fin.committed)} is committed against a {money(fin.budget)} budget, with {money(fin.invoiced)} invoiced so far.{pending.length ? ` ${pending.length} change order${pending.length === 1 ? '' : 's'} totalling ${money(pending.reduce((a, o) => a + sel.coDelta(o), 0))} await${pending.length === 1 ? 's' : ''} owner approval.` : ''}</p>
          {commentary.trim() && <><h3 className="font-extrabold text-lg mt-7">Key moments</h3><p className="text-sm leading-7 text-[#526879] mt-2 whitespace-pre-wrap">{commentary}</p></>}
          <h3 className="font-extrabold text-lg mt-7">Class & flag status</h3>
          <div className={'rounded-xl p-4 mt-3 text-sm ' + (cls.nearestCoc ? 'alert-card' : 'bg-[#f5f8fa]')}>{cls.nearestCoc ? `Condition of Class ${cls.nearestCoc.item.classSurvey.reference} (${cls.nearestCoc.item.name}) is ${sel.dueText(cls.nearestCoc.daysLeft).toLowerCase()}. ${cls.open.length} class items remain open.` : cls.items.length ? `No open Condition of Class items. ${cls.open.length} other class items remain open.` : 'No class or survey items on this programme.'}</div>
          <h3 className="font-extrabold text-lg mt-7">Works status</h3>
          <ul className="text-sm leading-8 text-[#526879] mt-2">{[...complete.map(i => `Completed: ${i.name}`), ...active.map(i => `In progress: ${i.name}${i.percentComplete != null ? ` (${i.percentComplete}%)` : ''}`)].slice(0, type === 'Weekly' ? 6 : 20).map(t => <li key={t}>• {t}</li>)}</ul>
          {delayed.length > 0 && <><h3 className="font-extrabold text-lg mt-7">Behind schedule</h3><ul className="text-sm leading-8 text-[#526879] mt-2">{delayed.map(i => <li key={i.id}>• {i.name} — planned finish {sel.fmtDate(i.end)}{i.notes ? ` · ${i.notes}` : ''}</li>)}</ul></>}
          {owner.length > 0 && <><h3 className="font-extrabold text-lg mt-7">Owner's interests</h3><ul className="text-sm leading-8 text-[#526879] mt-2">{owner.map(i => <li key={i.id}>• {i.name} — {i.status.toLowerCase()}, {money(sel.itemCost(state, i))}</li>)}</ul></>}
          {type === 'Monthly' && <>
            <h3 className="font-extrabold text-lg mt-7">Cost by department</h3>
            <table className="data-table mt-2"><tbody>{breakdown(state, items, i => i.department).map(([k, val]) => <tr key={k}><td>{k}</td><td className="text-right font-bold">{money(val)}</td></tr>)}</tbody></table>
            <h3 className="font-extrabold text-lg mt-7">Cost by contractor</h3>
            <table className="data-table mt-2"><tbody>{breakdown(state, items, i => sel.contractorById(state, i.contractorId)?.name ?? 'Unassigned').map(([k, val]) => <tr key={k}><td>{k}</td><td className="text-right font-bold">{money(val)}</td></tr>)}</tbody></table>
            <h3 className="font-extrabold text-lg mt-7">Change order log</h3>
            {periodCos.length === 0 ? <p className="text-sm text-[#526879] mt-2">No change orders raised this period.</p> : <table className="data-table mt-2"><tbody>{periodCos.map(o => <tr key={o.id}><td className="mono">{o.reference}</td><td>{o.title}</td><td>{o.status}</td><td className="text-right font-bold">{sel.coDelta(o) > 0 ? '+' : ''}{money(sel.coDelta(o))}</td></tr>)}</tbody></table>}
          </>}
          {next.length > 0 && <><h3 className="font-extrabold text-lg mt-7">Coming up</h3><ul className="text-sm leading-8 text-[#526879] mt-2">{next.map(i => <li key={i.id}>• {i.name} — starts {sel.fmtDate(i.start)}</li>)}</ul></>}
          <div className="mt-10 pt-4 border-t border-[#dbe4ea] text-[10px] text-[#8292a1]">Prepared from the live work list, schedule, change orders and logged updates. Human review required before distribution.</div>
        </div>
        <div className="flex flex-col gap-5 no-print">
          <div className="card p-5">
            <div className="section-title">Review & issue</div>
            <Field label="Key moments (optional)" hint="Your commentary — haul-out, inspections, decisions the owner should know about"><textarea id="rp-commentary" value={commentary} onChange={e => setCommentary(e.target.value)} /></Field>
            <div className="mt-3"><Field label="Distribution list" hint="Owner, owner's rep, captain — comma separated"><input id="rp-recipients" value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="owner@example.com, captain@example.com" /></Field></div>
            {badEmail && <p className="text-[11px] text-[#c15752] mt-2">"{badEmail}" isn't a valid email address.</p>}
            <button className="btn primary w-full mt-4" disabled={!!badEmail} onClick={issue}>Archive this report</button>
            {issued && <p className="text-[11px] text-[#147653] mt-2" role="status">{issued}</p>}
            <p className="text-[11px] text-[#8292a1] mt-2">Emailing isn't connected yet — export the PDF and send it from your mail client.</p>
          </div>
          <div className="card p-5">
            <div className="section-title">Report history</div>
            {history.length === 0 && <div className="text-xs text-[#8292a1] mt-3">No reports archived yet.</div>}
            {history.map(r => <button key={r.id} className="w-full text-left py-3 border-b border-[#edf1f3] text-xs" onClick={() => setViewing(viewing === r.id ? null : r.id)}>
              <div className="flex justify-between"><b>{r.type} · week {r.summary.week}</b><span className="text-[#8292a1]">{sel.fmtDate(r.issuedAt)}</span></div>
              {viewing === r.id && <div className="mt-2 text-[#526879] space-y-1"><div>Progress {r.summary.progress}% · committed {money(r.summary.committed)} of {money(r.summary.budget)} · invoiced {money(r.summary.invoiced)}</div><div>{r.summary.openClass} open class items · {r.summary.pendingCos} pending change orders</div>{r.commentary && <div className="whitespace-pre-wrap">"{r.commentary}"</div>}<div className="text-[#8292a1]">{r.recipients.length ? `Recipients: ${r.recipients.join(', ')}` : 'No recipients listed'}</div></div>}
            </button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractBanner({ state, v, setView }) {
  const c = sel.vesselContract(state, v.id);
  const yard = c && sel.contractorById(state, c.shipyardContractorId);
  const signed = c?.status === 'Signed';
  return (
    <div className="card p-6 mb-5 flex flex-col md:flex-row md:items-center gap-5 bg-[#102b42] text-white no-print">
      <div className="w-12 h-12 rounded-2xl bg-[#24455d] grid place-items-center text-xl">{signed ? '✓' : '!'}</div>
      <div className="flex-1">
        <div className="eyebrow text-[#85c8c0]">{c ? `${c.type} · ${c.status}` : 'No contract'}</div>
        <div className="font-extrabold text-lg mt-1">{signed ? 'Shipyard modules unlocked' : 'Shipyard modules locked until the contract is signed'}</div>
        {c && <div className="text-xs text-[#a9bacb] mt-1">{yard?.name} · {money(c.value)}{c.governingLaw ? ` · ${c.governingLaw}` : ''}{c.warrantyUntil ? ` · warranty until ${sel.fmtDate(c.warrantyUntil)}` : ''}</div>}
      </div>
      <button className="btn bg-white text-[#0b1f33] border-white" onClick={() => setView(signed ? 'work' : 'contract')}>{signed ? 'Open work list →' : 'Review contract →'}</button>
    </div>
  );
}

function Locked({ children, setView }) {
  return (
    <div className="locked">
      <div className="card p-5 mb-5 alert-card flex flex-wrap items-center justify-between gap-3"><div><div className="section-title">Preview only</div><p className="text-xs text-[#6e7f8d] mt-1">This module becomes editable once the contract is signed by both parties.</p></div><button className="btn primary" onClick={() => setView('contract')}>Go to contract</button></div>
      <div className="locked-body" aria-hidden="true">{children}</div>
    </div>
  );
}

const VIEWS = { dashboard: Dashboard, contract: ContractView, work: WorkList, gantt: Gantt, change: ChangeOrders, class: ClassView, inbox: Inbox, reports: Reports };

export default function App() {
  const [state, actions] = useRefitStore(seed);
  const [view, setView] = useState('fleet');
  const [selected, setSelected] = useState(seed.vessels[0].id);
  const [modal, setModal] = useState(null);
  const today = sel.todayISO();
  const v = state.vessels.find(x => x.id === selected) ?? state.vessels[0];
  const open = (id, next = 'dashboard') => { setSelected(id); setView(next); };
  const openModal = (type, props = {}) => setModal({ type, ...props });
  const close = () => setModal(null);
  const ctx = { state, actions, today, v, view, setView, open, openModal };
  const View = VIEWS[view];
  const locked = GATED.includes(view) && sel.vesselContract(state, v.id)?.status !== 'Signed';
  const body = view === 'fleet' ? <FleetView {...ctx} /> : <><ContractBanner {...ctx} /><View key={v.id} {...ctx} /></>;
  return (
    <div className="app-shell">
      <Sidebar {...ctx} />
      <main className="main">
        <Topbar {...ctx} />
        <div className="content">{locked ? <><ContractBanner {...ctx} /><Locked setView={setView}><View key={v.id} {...ctx} /></Locked></> : body}</div>
      </main>
      {modal?.type === 'vessel' && <VesselForm state={state} actions={actions} onClose={close} onCreated={id => { close(); open(id, 'contract'); }} />}
      {modal?.type === 'item' && <WorkItemForm state={state} v={v} actions={actions} onClose={close} item={modal.item} classItem={modal.classItem} />}
      {modal?.type === 'co' && <ChangeOrderForm state={state} v={v} actions={actions} onClose={close} />}
      {modal?.type === 'evidence' && <EvidenceForm state={state} v={v} actions={actions} onClose={close} />}
      {modal?.type === 'milestone' && <MilestoneForm v={v} actions={actions} onClose={close} />}
    </div>
  );
}

