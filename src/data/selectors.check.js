import assert from 'node:assert/strict';
import { seed } from './seed.js';
import * as s from './selectors.js';

const st = structuredClone(seed);
const m4 = s.workItemById(st, 'm4');
assert.equal(s.itemCost(st, m4), 118000, 'pending change order must not count');
st.changeOrders.find(c => c.id === 'co-m014').status = 'Approved';
assert.equal(s.itemCost(st, m4), 136400, 'approved change order rolls into item cost');

for (const v of st.vessels) {
  const items = s.vesselItems(st, v.id);
  const vatTotal = Object.values(s.vatSubtotals(st, items)).reduce((a, b) => a + b, 0);
  const deptTotal = s.deptSubtotals(st, items).reduce((a, d) => a + d.value, 0);
  assert.equal(vatTotal, s.vesselFinance(st, v).workListValue, `${v.id}: every item has a known VAT treatment`);
  assert.equal(deptTotal, s.vesselFinance(st, v).workListValue, `${v.id}: every item has a known department`);
}

assert.equal(s.addMonths('2026-01-31', 1), '2026-02-28');
const ta = s.temporaryAdmission({ temporaryAdmission: { entryDate: '2025-12-25' }, refitEnd: '2027-01-04' }, '2026-09-25');
assert.deepEqual([ta.elapsed, ta.left, ta.overrun], [274, 273, false]);
assert.equal(s.temporaryAdmission(st.vessels.find(v => v.id === 'solstice'), '2026-09-25'), null, 'EU-flagged vessel has no TA clock');

const pairs = s.scheduleConflicts(st, s.vesselItems(st, 'meridian')).map(p => p.map(i => i.id).sort().join());
assert.ok(pairs.includes('m6,m7'), 'overlapping supplier jobs flagged');
assert.ok(!pairs.includes('m1,m2'), 'shipyard parallel work not flagged');

assert.equal(s.programme(st.vessels[0], '2026-09-25').week, 10);
assert.equal(s.classSummary(st, 'haven', '2026-09-25').nearestCoc.item.id, 'h4');

const terms = s.extractContractTerms('Shipyard: Northstar Shipyard\nContract price EUR 1.460.000 payable in stages.\nWorks from 2026-07-20 to 2027-01-04.\nThis contract is governed by the laws of England.\nWarranty: 6 months from redelivery.');
assert.deepEqual(terms, { value: 1460000, startDate: '2026-07-20', endDate: '2027-01-04', governingLaw: 'England law', warranty: '6 months from redelivery', shipyardName: 'Northstar Shipyard' });
assert.equal(s.suggestCostBasis(st.contracts[0], 'Price escalation'), 'Contract clause 6.1 (Price adjustment for materials)');
assert.equal(s.itemCompletion({ status: 'In progress', percentComplete: 80 }), 0.8);

console.log('selectors ok');
