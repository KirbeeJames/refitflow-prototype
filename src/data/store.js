import { useEffect, useReducer } from 'react';
import { itemCost, todayISO } from './selectors.js';

// Production seam: swap localStorage for Supabase; the tables mirror these arrays.
const STORAGE_KEY = 'refitflow:v2';
const newId = prefix => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

function load(seed) {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? seed; } catch { return seed; }
}

function reducer(state, a) {
  switch (a.type) {
    case 'insert': return { ...state, [a.table]: [...state[a.table], a.row] };
    case 'update': return { ...state, [a.table]: state[a.table].map(r => (r.id === a.id ? { ...r, ...a.patch } : r)) };
    case 'replace': return a.state;
    default: return state;
  }
}

export function useRefitStore(seed) {
  const [state, dispatch] = useReducer(reducer, seed, load);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable: session-only */ } }, [state]);

  const insert = (table, row) => dispatch({ type: 'insert', table, row });
  const update = (table, id, patch) => dispatch({ type: 'update', table, id, patch });

  const actions = {
    reset: () => dispatch({ type: 'replace', state: seed }),

    addVessel(vessel, contract) {
      const id = newId('v');
      insert('vessels', { ...vessel, id, distribution: [] });
      insert('contracts', { ...contract, id: newId('k'), vesselId: id, status: 'Draft', signedByShipyard: false, signedByClient: false, clauses: seed.contracts[0].clauses, sourceDocument: null });
      return id;
    },
    updateVessel: (id, patch) => update('vessels', id, patch),
    updateContract: (id, patch) => update('contracts', id, patch),
    addContractor: c => { const id = newId('c'); insert('contractors', { ...c, id }); return id; },
    addIprAuthorization: a => { const id = newId('ipr'); insert('iprAuthorizations', { ...a, id }); return id; },

    saveWorkItem(item) {
      if (item.id) update('workItems', item.id, item);
      else insert('workItems', { sources: [], ...item, id: newId('wi') });
    },
    rescheduleItem: (id, start, end) => update('workItems', id, { start, end }),

    raiseChangeOrder(co) {
      const item = state.workItems.find(i => i.id === co.workItemId);
      const n = Math.max(0, ...state.changeOrders.map(c => Number(c.reference.slice(3)) || 0)) + 1;
      insert('changeOrders', { ...co, id: newId('co'), reference: `CO-${String(n).padStart(3, '0')}`, originalCost: itemCost(state, item), status: 'Pending', dateRaised: todayISO(), decidedAt: null });
    },
    approveChangeOrder: id => update('changeOrders', id, { status: 'Approved', decidedAt: todayISO() }),
    rejectChangeOrder: id => update('changeOrders', id, { status: 'Rejected', decidedAt: todayISO() }),

    logEvidence({ workItemId, source, invoicedAmount, status }) {
      const item = state.workItems.find(i => i.id === workItemId);
      update('workItems', workItemId, {
        sources: [...item.sources, source],
        invoiced: item.invoiced + (invoicedAmount || 0),
        ...(status && { status }),
      });
    },
    addNote: note => insert('notes', { ...note, id: newId('n') }),
    addMilestone: m => insert('milestones', { ...m, id: newId('ms') }),
    saveReport: r => insert('reports', { ...r, id: newId('r'), issuedAt: todayISO() }),
  };
  return [state, actions];
}
