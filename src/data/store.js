import { useReducer } from 'react';
import { todayISO } from './selectors.js';

// Production seam: swap this in-memory reducer for Supabase writes; the tables mirror these arrays.
const reducer = (state, { table, id, patch }) =>
  ({ ...state, [table]: state[table].map(row => (row.id === id ? { ...row, ...patch } : row)) });

export function useRefitStore(seed) {
  const [state, dispatch] = useReducer(reducer, seed);
  const actions = {
    approveChangeOrder: id => dispatch({ table: 'changeOrders', id, patch: { status: 'Approved', decidedAt: todayISO() } }),
  };
  return [state, actions];
}
