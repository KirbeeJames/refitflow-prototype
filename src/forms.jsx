import React, { useState } from 'react';
import { BUDGET_CATEGORIES, CLASS_CATEGORIES, CO_REASONS, DEPARTMENTS, EU_FLAGS, EVIDENCE_KINDS, STATUSES, VAT_TREATMENTS, suggestPriority } from './data/model.js';
import * as sel from './data/selectors.js';
import { Field, FormActions, Modal, binder, money } from './ui.jsx';

function useForm(initial) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  return { form, setForm, bind: binder(form, setForm), error, setError };
}

export function VesselForm({ state, actions, onClose, onCreated }) {
  const today = sel.todayISO();
  const { form, bind, error, setError } = useForm({
    name: 'M/Y ', imo: '', flag: '', loaMetres: null, location: '', refitStart: today, refitEnd: sel.addDays(today, 84),
    budget: null, stageNote: '', underTA: false, taEntry: today, shipyardContractorId: '', newShipyard: '', contractType: 'ICOMIA Refit Contract', contractValue: null, clientParty: '',
  });
  const yards = state.contractors.filter(c => c.type === 'shipyard');
  const submit = e => {
    e.preventDefault();
    if (form.name.trim().length < 4) return setError('Give the vessel a name.');
    if (form.refitEnd <= form.refitStart) return setError('Refit end must be after the start.');
    if (form.underTA && EU_FLAGS.includes(form.flag.trim())) return setError(`${form.flag} is an EU flag, so temporary admission doesn't apply.`);
    if (!form.shipyardContractorId && !form.newShipyard.trim()) return setError('Choose or name the shipyard.');
    const yardId = form.shipyardContractorId || actions.addContractor({ name: form.newShipyard.trim(), type: 'shipyard', contact: '', color: '#0d9488' });
    const id = actions.addVessel(
      { name: form.name.trim(), imo: form.imo, flag: form.flag.trim(), loaMetres: form.loaMetres, location: form.location, refitStart: form.refitStart, refitEnd: form.refitEnd, budget: form.budget ?? 0, stageNote: form.stageNote, temporaryAdmission: form.underTA ? { entryDate: form.taEntry } : null, onboardedVia: 'new' },
      { type: form.contractType, shipyardContractorId: yardId, clientParty: form.clientParty, value: form.contractValue ?? 0, paymentSchedule: [], warranty: '', warrantyUntil: form.refitEnd, startDate: form.refitStart, endDate: form.refitEnd, governingLaw: '' },
    );
    onCreated(id);
  };
  return (
    <Modal title="Add vessel" onClose={onClose} wide>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Vessel name"><input id="v-name" {...bind('name')} required /></Field>
        <Field label="IMO / registration"><input id="v-imo" {...bind('imo')} /></Field>
        <Field label="Flag state"><input id="v-flag" {...bind('flag')} placeholder="e.g. Cayman Islands" /></Field>
        <Field label="LOA (m)"><input id="v-loa" {...bind('loaMetres', 'number')} /></Field>
        <Field label="Current location" span><input id="v-loc" {...bind('location')} /></Field>
        <Field label="Refit start" hint="Onboarding mid-refit? Use the real start date — progress picks up from there."><input id="v-start" type="date" {...bind('refitStart')} /></Field>
        <Field label="Refit end"><input id="v-end" type="date" {...bind('refitEnd')} /></Field>
        <Field label="Refit budget (€)"><input id="v-budget" {...bind('budget', 'number')} /></Field>
        <Field label="Stage note"><input id="v-stage" {...bind('stageNote')} placeholder="e.g. Special Survey" /></Field>
        <label className="check-row span-2"><input id="v-ta" type="checkbox" {...bind('underTA', 'check')} /> Under EU temporary admission (non-EU flag)</label>
        {form.underTA && <Field label="Temporary admission entry date"><input id="v-ta-entry" type="date" {...bind('taEntry')} /></Field>}
        <div className="span-2 eyebrow mt-2">Contract (starts as Draft)</div>
        <Field label="Shipyard"><select id="v-yard" {...bind('shipyardContractorId')}><option value="">New shipyard…</option>{yards.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select></Field>
        {!form.shipyardContractorId ? <Field label="New shipyard name"><input id="v-newyard" {...bind('newShipyard')} /></Field> : <div />}
        <Field label="Contract value (€)"><input id="v-cvalue" {...bind('contractValue', 'number')} /></Field>
        <Field label="Client party"><input id="v-client" {...bind('clientParty')} /></Field>
        <FormActions onCancel={onClose} submitLabel="Add vessel" error={error} />
      </form>
    </Modal>
  );
}

const blankSurvey = { surveyType: 'Special', society: '', reference: '', category: 'Condition of Class', dueDate: '', surveyorNotes: '', evidenceStatus: 'Pending' };

export function WorkItemForm({ state, v, item, classItem, actions, onClose }) {
  const today = sel.todayISO();
  const { form, setForm, bind, error, setError } = useForm(item ?? {
    vesselId: v.id, name: '', description: '', department: DEPARTMENTS[0], priorityOverride: null, budgetCategory: BUDGET_CATEGORIES[0],
    vat: 'VAT applicable', iprAuthorizationId: null, contractorId: '', status: 'Working list', estimate: null, quoted: null, committed: null,
    invoiced: 0, percentComplete: null, start: today, end: sel.addDays(today, 14), notes: '', ownerRelevant: false, classSurvey: classItem ? blankSurvey : null,
  });
  const [newIpr, setNewIpr] = useState({ reference: '', dischargeDeadline: '' });
  const auths = state.iprAuthorizations.filter(a => a.vesselId === v.id);
  const cs = form.classSurvey;
  const setCs = patch => setForm(f => ({ ...f, classSurvey: { ...f.classSurvey, ...patch } }));
  const suggested = suggestPriority(`${form.name} ${form.description}`);

  const submit = e => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name the job.');
    if (form.end < form.start) return setError('End date is before the start date.');
    if (form.estimate == null) return setError('Add an estimate (0 is fine).');
    if (form.percentComplete != null && (form.percentComplete < 0 || form.percentComplete > 100)) return setError('% complete must be 0–100.');
    let iprAuthorizationId = form.vat === 'IPR' ? form.iprAuthorizationId : null;
    if (form.vat === 'IPR' && iprAuthorizationId === '__new') {
      if (!newIpr.reference || !newIpr.dischargeDeadline) return setError('New IPR authorisation needs a reference and discharge deadline.');
      iprAuthorizationId = actions.addIprAuthorization({ vesselId: v.id, customsOffice: '', ...newIpr });
    }
    if (form.vat === 'IPR' && !iprAuthorizationId) return setError('Pick the IPR authorisation this item falls under.');
    if (cs && (!cs.reference || !cs.dueDate)) return setError('Class items need a reference and due date.');
    actions.saveWorkItem({ ...form, name: form.name.trim(), iprAuthorizationId, contractorId: form.contractorId || null, priorityOverride: form.priorityOverride || null });
    onClose();
  };

  return (
    <Modal title={item ? 'Edit work item' : 'New work item'} onClose={onClose} wide>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Job name" span><input id="wi-name" {...bind('name')} required /></Field>
        <Field label="Scope / description" span><textarea id="wi-desc" {...bind('description')} /></Field>
        <Field label="Department"><select id="wi-dept" {...bind('department')}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Priority" hint={`Suggested from keywords: ${suggested}`}><select id="wi-priority" {...bind('priorityOverride')}><option value="">Auto ({suggested})</option>{['Essential', 'Recommended', 'Desired'].map(p => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Status"><select id="wi-status" {...bind('status')}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Contractor"><select id="wi-contractor" {...bind('contractorId')}><option value="">Unassigned</option>{state.contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Budget category"><select id="wi-budget" {...bind('budgetCategory')}>{BUDGET_CATEGORIES.map(b => <option key={b}>{b}</option>)}</select></Field>
        <Field label="VAT / customs"><select id="wi-vat" {...bind('vat')}>{VAT_TREATMENTS.map(t => <option key={t}>{t}</option>)}</select></Field>
        {form.vat === 'IPR' && <>
          <Field label="IPR authorisation"><select id="wi-ipr" {...bind('iprAuthorizationId')}><option value="">Choose…</option>{auths.map(a => <option key={a.id} value={a.id}>{a.reference} · discharge {sel.fmtDate(a.dischargeDeadline)}</option>)}<option value="__new">New authorisation…</option></select></Field>
          {form.iprAuthorizationId === '__new' ? <div className="grid grid-cols-2 gap-2"><Field label="Reference"><input id="wi-ipr-ref" value={newIpr.reference} onChange={e => setNewIpr({ ...newIpr, reference: e.target.value })} /></Field><Field label="Discharge by"><input id="wi-ipr-date" type="date" value={newIpr.dischargeDeadline} onChange={e => setNewIpr({ ...newIpr, dischargeDeadline: e.target.value })} /></Field></div> : <div />}
        </>}
        <Field label="Estimate (€)"><input id="wi-est" {...bind('estimate', 'number')} /></Field>
        <Field label="Quoted (€)" hint="Leave blank until a quote arrives"><input id="wi-quoted" {...bind('quoted', 'number')} /></Field>
        <Field label="Committed (€)" hint="Blank until approved"><input id="wi-committed" {...bind('committed', 'number')} /></Field>
        <Field label="Invoiced to date (€)"><input id="wi-invoiced" {...bind('invoiced', 'number')} /></Field>
        <Field label="Start"><input id="wi-start" type="date" {...bind('start')} /></Field>
        <Field label="End"><input id="wi-end" type="date" {...bind('end')} /></Field>
        <Field label="% complete" hint="Optional; overrides the status estimate"><input id="wi-pct" {...bind('percentComplete', 'number')} max={100} /></Field>
        <label className="check-row self-end pb-2"><input id="wi-owner" type="checkbox" {...bind('ownerRelevant', 'check')} /> Owner-relevant (shows in owner report)</label>
        <Field label="Notes" span><textarea id="wi-notes" {...bind('notes')} /></Field>
        <label className="check-row span-2"><input id="wi-class" type="checkbox" checked={!!cs} onChange={e => setForm(f => ({ ...f, classSurvey: e.target.checked ? blankSurvey : null }))} /> Class / survey item</label>
        {cs && <>
          <Field label="Category"><select id="cs-cat" value={cs.category} onChange={e => setCs({ category: e.target.value })}>{CLASS_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Survey type"><select id="cs-type" value={cs.surveyType} onChange={e => setCs({ surveyType: e.target.value })}>{['Special', 'Intermediate', 'Annual', 'Docking'].map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Classification society"><input id="cs-soc" value={cs.society} onChange={e => setCs({ society: e.target.value })} /></Field>
          <Field label="Item reference"><input id="cs-ref" value={cs.reference} onChange={e => setCs({ reference: e.target.value })} /></Field>
          <Field label="Due date"><input id="cs-due" type="date" value={cs.dueDate} onChange={e => setCs({ dueDate: e.target.value })} /></Field>
          <Field label="Closing evidence"><select id="cs-ev" value={cs.evidenceStatus} onChange={e => setCs({ evidenceStatus: e.target.value })}>{['Pending', 'Uploaded', 'Accepted'].map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Surveyor notes" span><textarea id="cs-notes" value={cs.surveyorNotes} onChange={e => setCs({ surveyorNotes: e.target.value })} /></Field>
        </>}
        {item?.sources?.length > 0 && <div className="span-2 text-xs"><div className="eyebrow mb-2">Sourced from</div>{item.sources.map((src, i) => <div key={i} className="py-1 text-[#526879]">{src.kind} · {src.label} · {sel.fmtDate(src.date)}</div>)}</div>}
        <FormActions onCancel={onClose} submitLabel={item ? 'Save changes' : 'Add to work list'} error={error} />
      </form>
    </Modal>
  );
}

export function ChangeOrderForm({ state, v, actions, onClose, workItemId }) {
  const items = sel.vesselItems(state, v.id);
  const contract = sel.vesselContract(state, v.id);
  const { form, setForm, bind, error, setError } = useForm({ workItemId: workItemId ?? items[0]?.id ?? '', title: '', reason: CO_REASONS[0], revisedCost: null, costBasis: '' });
  const item = items.find(i => i.id === form.workItemId);
  const current = item ? sel.itemCost(state, item) : 0;
  const submit = e => {
    e.preventDefault();
    if (!item) return setError('Pick the work item this changes.');
    if (!form.title.trim()) return setError('Describe the change.');
    if (form.revisedCost == null || form.revisedCost === current) return setError('Enter a revised cost different from the current one.');
    actions.raiseChangeOrder({ workItemId: item.id, title: form.title.trim(), reason: form.reason, revisedCost: form.revisedCost, costBasis: form.costBasis.trim() });
    onClose();
  };
  const delta = form.revisedCost != null ? form.revisedCost - current : 0;
  return (
    <Modal title="Raise change order" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Work item" span><select id="co-item" {...bind('workItemId')}>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field>
        <Field label="Change" span><input id="co-title" {...bind('title')} placeholder="e.g. Additional bridge cabling" /></Field>
        <Field label="Reason"><select id="co-reason" {...bind('reason')}>{CO_REASONS.map(r => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Revised cost (€)" hint={`Current cost ${money(current)}${form.revisedCost != null ? ` · delta ${delta > 0 ? '+' : ''}${money(delta)}` : ''}`}><input id="co-revised" {...bind('revisedCost', 'number')} /></Field>
        <Field label="Cost basis" span hint="Where the price comes from — contract clause, T&M rate or quote reference">
          <div className="flex gap-2"><input id="co-basis" className="flex-1" {...bind('costBasis')} /><button type="button" className="btn" disabled={!contract?.clauses?.length} onClick={() => setForm(f => ({ ...f, costBasis: sel.suggestCostBasis(contract, f.reason) || f.costBasis }))}>From contract</button></div>
        </Field>
        <FormActions onCancel={onClose} submitLabel="Raise for approval" error={error} />
      </form>
    </Modal>
  );
}

export function EvidenceForm({ state, v, actions, onClose }) {
  const items = sel.vesselItems(state, v.id);
  const { form, bind, error, setError } = useForm({ target: items[0]?.id ?? 'note', kind: 'email', label: '', date: sel.todayISO(), amount: null, status: '', text: '', overInvoiceOk: false });
  const item = items.find(i => i.id === form.target);
  const newInvoiced = item ? item.invoiced + (form.amount ?? 0) : 0;
  const overInvoiced = item && form.kind === 'invoice' && newInvoiced > sel.itemCost(state, item);
  const submit = e => {
    e.preventDefault();
    if (!form.label.trim()) return setError('Say what it is — sender and subject, or invoice number.');
    if (overInvoiced && !form.overInvoiceOk) return setError('Confirm the over-invoice before logging it.');
    const source = { kind: form.kind, label: form.label.trim(), date: form.date };
    if (form.target === 'note') actions.addNote({ vesselId: v.id, ...source, text: form.text });
    else actions.logEvidence({ workItemId: form.target, source, invoicedAmount: form.kind === 'invoice' ? form.amount : 0, status: form.status || null });
    onClose();
  };
  return (
    <Modal title="Log an update" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Applies to" span><select id="ev-target" {...bind('target')}>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}<option value="note">General project note (not a work item)</option></select></Field>
        <Field label="Source"><select id="ev-kind" {...bind('kind')}>{EVIDENCE_KINDS.map(k => <option key={k}>{k}</option>)}</select></Field>
        <Field label="Date"><input id="ev-date" type="date" {...bind('date')} /></Field>
        <Field label="Label" span><input id="ev-label" {...bind('label')} placeholder="e.g. Aster Marine invoice #2231" /></Field>
        {form.kind === 'invoice' && item && <Field label="Invoiced amount (€)" span hint={`Invoiced so far ${money(item.invoiced)} of ${money(sel.itemCost(state, item))}`}><input id="ev-amount" {...bind('amount', 'number')} /></Field>}
        {overInvoiced && <label className="check-row span-2 text-[#b64743]"><input id="ev-over" type="checkbox" {...bind('overInvoiceOk', 'check')} /> This takes invoiced to {money(newInvoiced)}, above the current cost. Log it anyway.</label>}
        {item && <Field label="Update status" span><select id="ev-status" {...bind('status')}><option value="">Leave as {item.status}</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>}
        {form.target === 'note' && <Field label="Note" span><textarea id="ev-text" {...bind('text')} /></Field>}
        <FormActions onCancel={onClose} submitLabel="Log update" error={error} />
      </form>
    </Modal>
  );
}

export function MilestoneForm({ v, actions, onClose }) {
  const { form, bind, error, setError } = useForm({ name: '', date: sel.todayISO() });
  const submit = e => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name the milestone.');
    actions.addMilestone({ vesselId: v.id, name: form.name.trim(), date: form.date });
    onClose();
  };
  return (
    <Modal title="Add milestone" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Milestone"><input id="ms-name" {...bind('name')} placeholder="e.g. Haul-out" /></Field>
        <Field label="Date"><input id="ms-date" type="date" {...bind('date')} /></Field>
        <FormActions onCancel={onClose} submitLabel="Add milestone" error={error} />
      </form>
    </Modal>
  );
}
