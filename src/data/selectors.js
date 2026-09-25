import { CLASS_CATEGORIES, DEPARTMENTS, TA_LIMIT_MONTHS, VAT_TREATMENTS } from './model.js';

const DAY = 86400000;
const sum = (xs, f) => xs.reduce((a, x) => a + f(x), 0);

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
export const addDays = (iso, n) => new Date(Date.parse(iso) + n * DAY).toISOString().slice(0, 10);
export const addMonths = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + n, Math.min(d, lastDay))).toISOString().slice(0, 10);
};
export const fmtDate = (iso, year = true) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', ...(year && { year: 'numeric' }), timeZone: 'UTC' });
export const dueText = d => (d < 0 ? `${-d} days overdue` : d === 0 ? 'Due today' : `Due in ${d} days`);

export const vesselContract = (s, vesselId) => s.contracts.find(c => c.vesselId === vesselId) ?? null;
export const vesselItems = (s, vesselId) => s.workItems.filter(i => i.vesselId === vesselId);
export const contractorById = (s, id) => s.contractors.find(c => c.id === id) ?? null;
export const workItemById = (s, id) => s.workItems.find(i => i.id === id) ?? null;
export const itemChangeOrders = (s, itemId) => s.changeOrders.filter(c => c.workItemId === itemId);
export const vesselChangeOrders = (s, vesselId) => {
  const ids = new Set(vesselItems(s, vesselId).map(i => i.id));
  return s.changeOrders.filter(c => ids.has(c.workItemId));
};
export const vesselMilestones = (s, vesselId) =>
  s.milestones.filter(m => m.vesselId === vesselId).sort((a, b) => a.date.localeCompare(b.date));

export const coDelta = co => co.revisedCost - co.originalCost;
export const baseCost = i => i.committed ?? i.quoted ?? i.estimate;
export const itemCost = (s, i) => baseCost(i) + sum(itemChangeOrders(s, i.id).filter(c => c.status === 'Approved'), coDelta);

export function vesselFinance(s, v) {
  const items = vesselItems(s, v.id);
  return {
    budget: v.budget,
    contractValue: vesselContract(s, v.id)?.value ?? 0,
    workListValue: sum(items, i => itemCost(s, i)),
    estimated: sum(items, i => i.estimate),
    quoted: sum(items.filter(i => i.quoted != null), i => i.quoted),
    committed: sum(items.filter(i => i.committed != null), i => itemCost(s, i)),
    invoiced: sum(items, i => i.invoiced),
  };
}

// ponytail: cost-weighted completion with in-progress counted as half; replace with per-item % complete once tracked
export function progressPct(s, items) {
  const total = sum(items, i => itemCost(s, i));
  if (!total) return 0;
  const done = sum(items, i => itemCost(s, i) * (i.status === 'Complete' ? 1 : i.status === 'In progress' ? 0.5 : 0));
  return Math.round((done / total) * 100);
}

export function programme(v, today) {
  const totalWeeks = Math.max(1, Math.ceil(daysBetween(v.refitStart, v.refitEnd) / 7));
  const week = Math.min(totalWeeks, Math.max(0, Math.floor(daysBetween(v.refitStart, today) / 7) + 1));
  return { week, totalWeeks, daysLeft: Math.max(0, daysBetween(today, v.refitEnd)) };
}

export function temporaryAdmission(v, today) {
  if (!v.temporaryAdmission) return null;
  const { entryDate } = v.temporaryAdmission;
  const limitDate = addMonths(entryDate, TA_LIMIT_MONTHS);
  return {
    entryDate, limitDate,
    elapsed: daysBetween(entryDate, today),
    limitDays: daysBetween(entryDate, limitDate),
    left: daysBetween(today, limitDate),
    overrun: v.refitEnd > limitDate,
  };
}

export function iprStatus(s, vesselId, today) {
  return s.iprAuthorizations
    .filter(a => a.vesselId === vesselId)
    .map(auth => {
      const items = s.workItems.filter(i => i.iprAuthorizationId === auth.id);
      const daysLeft = daysBetween(today, auth.dischargeDeadline);
      return { auth, items, value: sum(items, i => itemCost(s, i)), daysLeft, level: daysLeft < 0 ? 'overdue' : daysLeft <= 30 ? 'warning' : 'ok' };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export const isClassOpen = i => i.classSurvey.evidenceStatus !== 'Accepted';
const byDue = (a, b) => a.classSurvey.dueDate.localeCompare(b.classSurvey.dueDate);

export function classSummary(s, vesselId, today) {
  const items = vesselItems(s, vesselId).filter(i => i.classSurvey).sort(byDue);
  const open = items.filter(isClassOpen);
  const counts = Object.fromEntries(CLASS_CATEGORIES.map(c => [c, open.filter(i => i.classSurvey.category === c).length]));
  const nearest = open[0] ? { item: open[0], daysLeft: daysBetween(today, open[0].classSurvey.dueDate) } : null;
  const coc = open.find(i => i.classSurvey.category === 'Condition of Class');
  const nearestCoc = coc ? { item: coc, daysLeft: daysBetween(today, coc.classSurvey.dueDate) } : null;
  return { items, open, counts, nearest, nearestCoc };
}

export const vatSubtotals = (s, items) =>
  Object.fromEntries(VAT_TREATMENTS.map(t => [t, sum(items.filter(i => i.vat === t), i => itemCost(s, i))]));
export const deptSubtotals = (s, items) =>
  DEPARTMENTS.map(d => ({ department: d, value: sum(items.filter(i => i.department === d), i => itemCost(s, i)) }));

// ponytail: O(n²) pair scan, fine for a vessel's worth of items. Shipyards run parallel crews, so only smaller contractors can clash.
export function scheduleConflicts(s, items) {
  const out = [];
  items.forEach((a, n) => items.slice(n + 1).forEach(b => {
    if (!a.contractorId || a.contractorId !== b.contractorId) return;
    if (contractorById(s, a.contractorId)?.type === 'shipyard') return;
    if (a.start < b.end && b.start < a.end) out.push([a, b]);
  }));
  return out;
}

export function changeOrderImpact(s, vesselId, today) {
  const month = today.slice(0, 7);
  return sum(
    vesselChangeOrders(s, vesselId).filter(c => c.status === 'Approved' && (c.decidedAt ?? c.dateRaised).startsWith(month)),
    coDelta,
  );
}

export function vesselAlerts(s, v, today) {
  const alerts = [];
  const add = (level, title, detail, days, view) => alerts.push({ vesselId: v.id, level, title, detail, days, view });

  const { nearestCoc } = classSummary(s, v.id, today);
  if (nearestCoc && nearestCoc.daysLeft <= 30)
    add(nearestCoc.daysLeft <= 14 ? 'red' : 'amber', 'Condition of Class', dueText(nearestCoc.daysLeft), nearestCoc.daysLeft, 'class');

  const ipr = iprStatus(s, v.id, today)[0];
  if (ipr && ipr.daysLeft <= 30)
    add(ipr.daysLeft <= 14 ? 'red' : 'amber', 'IPR discharge', `${ipr.auth.reference} · ${dueText(ipr.daysLeft)}`, ipr.daysLeft, 'work');

  const ta = temporaryAdmission(v, today);
  if (ta && (ta.left <= 90 || ta.overrun))
    add('red', 'Temporary admission', ta.overrun ? 'Refit ends after the 18-month limit' : dueText(ta.left), ta.left, 'dashboard');

  vesselMilestones(s, v.id).forEach(m => {
    const d = daysBetween(today, m.date);
    if (d >= 0 && d <= 7) add('blue', m.name, fmtDate(m.date), d, 'gantt');
  });

  const pending = vesselChangeOrders(s, v.id).filter(c => c.status === 'Pending').length;
  if (pending) add('amber', 'Change orders', `${pending} awaiting approval`, 999, 'change');

  return alerts.sort((a, b) => a.days - b.days);
}
