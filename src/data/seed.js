// Demo data. Production seam: replaced by rows loaded from the database per tenant.

const imported = [{ kind: 'import', label: 'Historical import · LR survey pack', date: '2026-09-24' }];

const item = (o) => ({
  priorityOverride: null, budgetCategory: 'Shipyard works', vat: 'VAT applicable', iprAuthorizationId: null,
  quoted: null, committed: null, invoiced: 0, notes: '', ownerRelevant: false, sources: [], classSurvey: null, ...o,
});

const lr = (reference, category, dueDate, surveyorNotes, evidenceStatus = 'Pending') =>
  ({ surveyType: 'Special', society: "Lloyd's Register", reference, category, dueDate, surveyorNotes, evidenceStatus });

export const seed = {
  vessels: [
    { id: 'meridian', name: 'M/Y Meridian', imo: 'IMO 9821140', flag: 'Cayman Islands', loaMetres: 62.4, location: 'Palma de Mallorca',
      refitStart: '2026-07-20', refitEnd: '2027-01-04', budget: 650000, stageNote: 'Winter refit',
      temporaryAdmission: { entryDate: '2025-12-25' }, onboardedVia: 'new' },
    { id: 'solstice', name: 'M/Y Solstice', imo: 'IMO 9784201', flag: 'Malta', loaMetres: 38.0, location: 'Viareggio, Italy',
      refitStart: '2026-08-17', refitEnd: '2026-10-12', budget: 160000, stageNote: 'Yard period',
      temporaryAdmission: null, onboardedVia: 'new' },
    { id: 'haven', name: 'M/Y Haven', imo: 'IMO 9705528', flag: 'Marshall Islands', loaMetres: 54.2, location: 'Genoa, Italy',
      refitStart: '2026-09-04', refitEnd: '2026-11-27', budget: 260000, stageNote: 'Special Survey',
      temporaryAdmission: { entryDate: '2026-03-13' }, onboardedVia: 'historical-import' },
  ],

  contractors: [
    { id: 'c-northstar', name: 'Northstar Shipyard', type: 'shipyard', contact: 'projects@northstar-shipyard.example', color: '#0d9488' },
    { id: 'c-viareggio', name: 'Cantiere Darsena Viareggio', type: 'shipyard', contact: 'refit@darsena.example', color: '#4778e8' },
    { id: 'c-liguria', name: 'Officine Navali Liguri', type: 'shipyard', contact: 'commesse@onliguri.example', color: '#53a45b' },
    { id: 'c-bluewater', name: 'Bluewater Interiors', type: 'owners-preferred', contact: 'studio@bluewater.example', color: '#db5c82' },
    { id: 'c-aster', name: 'Aster Marine Systems', type: 'supplier', contact: 'service@astermarine.example', color: '#8b5cf6' },
    { id: 'c-harbour', name: 'Harbour Paint Co.', type: 'supplier', contact: 'ops@harbourpaint.example', color: '#e28a31' },
    { id: 'c-frigomar', name: 'Frigomar Refrigeration', type: 'supplier', contact: 'info@frigomar.example', color: '#bf8b28' },
    { id: 'c-tenderworks', name: 'Tenderworks Mallorca', type: 'owners-preferred', contact: 'service@tenderworks.example', color: '#5d7893' },
  ],

  contracts: [
    { id: 'k-meridian', vesselId: 'meridian', type: 'ICOMIA Refit Contract', shipyardContractorId: 'c-northstar', clientParty: 'Meridian Marine Ltd',
      value: 420000, paymentSchedule: [{ label: 'Signature', pct: 30 }, { label: 'Haul-out', pct: 30 }, { label: 'Relaunch', pct: 30 }, { label: 'Redelivery', pct: 10 }],
      warranty: '6 months from redelivery', warrantyUntil: '2027-07-04', startDate: '2026-07-20', endDate: '2027-01-04',
      governingLaw: 'English law', status: 'Signed', sourceDocument: null },
    { id: 'k-solstice', vesselId: 'solstice', type: 'ICOMIA Refit Contract', shipyardContractorId: 'c-viareggio', clientParty: 'Solstice Yachting Ltd',
      value: 120000, paymentSchedule: [{ label: 'Signature', pct: 40 }, { label: 'Mid-point', pct: 40 }, { label: 'Redelivery', pct: 20 }],
      warranty: '3 months from redelivery', warrantyUntil: '2027-01-12', startDate: '2026-08-17', endDate: '2026-10-12',
      governingLaw: 'Italian law', status: 'Signed', sourceDocument: null },
    { id: 'k-haven', vesselId: 'haven', type: 'ICOMIA Refit Contract', shipyardContractorId: 'c-liguria', clientParty: 'Haven Maritime Inc.',
      value: 180000, paymentSchedule: [{ label: 'Signature', pct: 30 }, { label: 'Docking', pct: 40 }, { label: 'Class endorsement', pct: 30 }],
      warranty: '6 months from redelivery', warrantyUntil: '2027-05-27', startDate: '2026-09-04', endDate: '2026-11-27',
      governingLaw: 'English law', status: 'Signed', sourceDocument: null },
  ],

  iprAuthorizations: [
    { id: 'ipr-m1', vesselId: 'meridian', reference: 'IPR-ES-2026-0412', customsOffice: 'Aduana de Palma', dischargeDeadline: '2026-10-13' },
    { id: 'ipr-m2', vesselId: 'meridian', reference: 'IPR-ES-2026-0588', customsOffice: 'Aduana de Palma', dischargeDeadline: '2027-02-28' },
  ],

  workItems: [
    item({ id: 'm1', vesselId: 'meridian', name: 'Main engine 12,000h service', description: 'Top-end overhaul of both main engines with class-witnessed alignment check', department: 'Engineering', contractorId: 'c-northstar', status: 'In progress', vat: 'VAT exempt', estimate: 38000, quoted: 41500, committed: 41500, invoiced: 20000, start: '2026-08-10', end: '2026-10-02', sources: [{ kind: 'invoice', label: 'Northstar interim invoice #1041', date: '2026-09-10' }] }),
    item({ id: 'm2', vesselId: 'meridian', name: 'Fire damper survey close-out', description: 'Close outstanding fire damper recommendation from flag inspection', department: 'Engineering', contractorId: 'c-northstar', status: 'Approved', estimate: 7600, quoted: 8200, committed: 8200, start: '2026-09-28', end: '2026-10-06' }),
    item({ id: 'm3', vesselId: 'meridian', name: 'Shaft seal replacement', description: 'Replace port and starboard shaft seals during haul-out', department: 'Engineering', contractorId: 'c-northstar', status: 'Complete', estimate: 22000, quoted: 21400, committed: 21400, invoiced: 21400, start: '2026-07-27', end: '2026-08-21' }),
    item({ id: 'm4', vesselId: 'meridian', name: 'Hull coating and topsides paint', description: 'Full topsides paint system, fairing and underwater coating', department: 'Deck', contractorId: 'c-harbour', status: 'In progress', vat: 'VAT exempt', budgetCategory: 'Paint', estimate: 110000, quoted: 118000, committed: 118000, invoiced: 59000, start: '2026-08-24', end: '2026-10-30', sources: [{ kind: 'whatsapp', label: 'Yard Team · 3 progress photos', date: '2026-09-22' }] }),
    item({ id: 'm5', vesselId: 'meridian', name: 'Teak cockpit caulking', description: 'Renew teak caulking and repair damaged planks', department: 'Deck', contractorId: 'c-northstar', status: 'Complete', estimate: 34500, quoted: 34500, committed: 34500, invoiced: 34500, start: '2026-07-28', end: '2026-08-28' }),
    item({ id: 'm6', vesselId: 'meridian', name: 'AV rack and satellite TV', description: 'Replace AV rack, upgrade satellite TV and owner cabin connectivity', department: 'AV / IT', contractorId: 'c-aster', status: 'Quoted', vat: 'IPR', iprAuthorizationId: 'ipr-m2', budgetCategory: 'Equipment', estimate: 38000, quoted: 42000, start: '2026-10-05', end: '2026-10-30', ownerRelevant: true, sources: [{ kind: 'email', label: 'Aster Marine quote Q-2291', date: '2026-09-12' }] }),
    item({ id: 'm7', vesselId: 'meridian', name: 'Bridge navigation software update', description: 'Flag-required ECDIS software update with sea trial', department: 'Bridge', contractorId: 'c-aster', status: 'Approved', vat: 'Reverse charge', estimate: 23800, quoted: 23800, committed: 23800, start: '2026-09-21', end: '2026-10-09' }),
    item({ id: 'm8', vesselId: 'meridian', name: 'Stabiliser actuator overhaul', description: 'Overhaul stabiliser actuators; replacement parts imported under IPR', department: 'Engineering', contractorId: 'c-northstar', status: 'In progress', vat: 'IPR', iprAuthorizationId: 'ipr-m1', estimate: 46000, quoted: 44800, committed: 44800, invoiced: 22400, start: '2026-08-31', end: '2026-10-16' }),
    item({ id: 'm9', vesselId: 'meridian', name: 'Owner cabin joinery refresh', description: 'New veneer, lighting and soft furnishings for owner spaces', department: 'Interior', contractorId: 'c-bluewater', status: 'Working list', budgetCategory: 'Interior', estimate: 56000, start: '2026-10-19', end: '2026-12-04', ownerRelevant: true }),
    item({ id: 'm10', vesselId: 'meridian', name: 'Guest head re-plumbing', description: 'Replace guest head black water lines and fittings', department: 'Interior', contractorId: 'c-bluewater', status: 'Quoted', budgetCategory: 'Interior', estimate: 18000, quoted: 19600, start: '2026-10-12', end: '2026-11-06' }),
    item({ id: 'm11', vesselId: 'meridian', name: 'Galley refrigeration replacement', description: 'Replace refrigeration compressors and controls', department: 'Galley', contractorId: 'c-frigomar', status: 'Approved', budgetCategory: 'Equipment', estimate: 27500, quoted: 27500, committed: 27500, start: '2026-10-05', end: '2026-10-23' }),
    item({ id: 'm12', vesselId: 'meridian', name: 'Saloon lighting scenes', description: 'Add dimmable lighting scenes in main saloon for owner', department: "Owner's Preferences", contractorId: 'c-bluewater', status: 'Working list', budgetCategory: 'Owner discretionary', estimate: 18400, start: '2026-11-09', end: '2026-11-27', ownerRelevant: true }),
    item({ id: 'm13', vesselId: 'meridian', name: 'Tender outboard service', description: 'Annual service for tender outboards and safety check', department: 'Chase Boats', contractorId: 'c-tenderworks', status: 'Complete', estimate: 9200, quoted: 9200, committed: 9200, invoiced: 9200, start: '2026-08-03', end: '2026-08-14' }),
    item({ id: 'm14', vesselId: 'meridian', name: 'Liferaft and LSA annual service', description: 'Annual liferaft service and LSA inspection for flag', department: 'Deck', contractorId: 'c-northstar', status: 'Approved', estimate: 6400, quoted: 6400, committed: 6400, start: '2026-11-16', end: '2026-11-20' }),
    item({ id: 'm15', vesselId: 'meridian', name: 'Chase tender hull repair', description: 'Repair gelcoat damage on chase tender and renew fendering', department: 'Chase Boats', contractorId: 'c-tenderworks', status: 'Working list', estimate: 12500, start: '2026-11-23', end: '2026-12-11' }),

    item({ id: 's1', vesselId: 'solstice', name: 'Annual engine service', description: 'Annual engine service and class inspection of machinery', department: 'Engineering', contractorId: 'c-viareggio', status: 'Complete', estimate: 16800, quoted: 16800, committed: 16800, invoiced: 16800, start: '2026-08-17', end: '2026-08-28' }),
    item({ id: 's2', vesselId: 'solstice', name: 'Anchor windlass overhaul', description: 'Overhaul anchor windlass gearbox and brake', department: 'Deck', contractorId: 'c-viareggio', status: 'In progress', estimate: 14200, quoted: 15100, committed: 15100, invoiced: 7500, start: '2026-09-07', end: '2026-10-02' }),
    item({ id: 's3', vesselId: 'solstice', name: 'Topsides polish and touch-up', description: 'Machine polish topsides and touch up paint damage', department: 'Deck', contractorId: 'c-viareggio', status: 'In progress', budgetCategory: 'Paint', estimate: 24500, quoted: 24500, committed: 24500, invoiced: 12000, start: '2026-09-14', end: '2026-10-05' }),
    item({ id: 's4', vesselId: 'solstice', name: 'Saloon upholstery', description: 'Reupholster saloon seating with owner-selected fabric', department: 'Interior', contractorId: 'c-bluewater', status: 'Approved', budgetCategory: 'Interior', estimate: 11600, quoted: 11600, committed: 11600, start: '2026-09-28', end: '2026-10-09', ownerRelevant: true }),
    item({ id: 's5', vesselId: 'solstice', name: 'X-band radar replacement', description: 'Replace X-band radar; flag inspection on completion', department: 'Bridge', contractorId: 'c-aster', status: 'In progress', vat: 'Reverse charge', budgetCategory: 'Equipment', estimate: 31000, quoted: 31000, committed: 31000, invoiced: 15500, start: '2026-09-14', end: '2026-09-30' }),
    item({ id: 's6', vesselId: 'solstice', name: 'Galley extraction fan', description: 'Replace galley extraction fan motor', department: 'Galley', contractorId: 'c-viareggio', status: 'Complete', estimate: 4800, quoted: 4800, committed: 4800, invoiced: 4800, start: '2026-08-24', end: '2026-09-04' }),
    item({ id: 's7', vesselId: 'solstice', name: 'Wi-Fi mesh upgrade', description: 'Upgrade guest Wi-Fi to mesh network', department: 'AV / IT', contractorId: 'c-aster', status: 'Quoted', budgetCategory: 'Equipment', estimate: 8500, quoted: 9400, start: '2026-10-01', end: '2026-10-08' }),
    item({ id: 's8', vesselId: 'solstice', name: 'Tender davit service', description: 'Service tender davit and load test for safety', department: 'Chase Boats', contractorId: 'c-viareggio', status: 'Working list', estimate: 5200, start: '2026-10-05', end: '2026-10-09' }),

    item({ id: 'h1', vesselId: 'haven', name: 'Hull thickness gauging', description: 'Special Survey ultrasonic thickness gauging of hull plating', department: 'Deck', contractorId: 'c-liguria', status: 'Complete', estimate: 18500, quoted: 18500, committed: 18500, invoiced: 18500, start: '2026-09-04', end: '2026-09-15', sources: imported, classSurvey: lr('LR-SS-4471', 'Memo item', '2026-11-27', 'Readings within tolerance; report issued', 'Accepted') }),
    item({ id: 'h2', vesselId: 'haven', name: 'Tailshaft withdrawal and inspection', description: 'Withdraw tailshafts for Special Survey inspection', department: 'Engineering', contractorId: 'c-liguria', status: 'Complete', estimate: 26400, quoted: 26400, committed: 26400, invoiced: 26400, start: '2026-09-04', end: '2026-09-18', sources: imported, classSurvey: lr('LR-SS-4472', 'Outstanding item', '2026-11-27', 'Survey complete; certificate pending issue', 'Uploaded') }),
    item({ id: 'h3', vesselId: 'haven', name: 'Sea valve overhaul', description: 'Open up and overhaul all sea valves for survey', department: 'Engineering', contractorId: 'c-liguria', status: 'Complete', estimate: 14800, quoted: 14800, committed: 14800, invoiced: 14800, start: '2026-09-07', end: '2026-09-19', sources: imported, classSurvey: lr('LR-SS-4475', 'Memo item', '2026-11-27', 'All sea valves opened and sighted', 'Accepted') }),
    item({ id: 'h4', vesselId: 'haven', name: 'Steering gear bearing renewal', description: 'Renew rudder stock bearings to clear Condition of Class', department: 'Engineering', contractorId: 'c-liguria', status: 'In progress', estimate: 21000, quoted: 21000, committed: 21000, invoiced: 8000, start: '2026-09-14', end: '2026-10-03', sources: imported, classSurvey: lr('LR-CC-0193', 'Condition of Class', '2026-10-04', 'Bearing clearance exceeds limit; renew before class endorsement') }),
    item({ id: 'h5', vesselId: 'haven', name: 'Engine room fire detection loop', description: 'Replace defective fire detection loop in engine room', department: 'Engineering', contractorId: 'c-aster', status: 'Approved', estimate: 17600, quoted: 17600, committed: 17600, start: '2026-09-28', end: '2026-10-16', sources: imported, classSurvey: lr('LR-CC-0194', 'Condition of Class', '2026-10-24', 'Loop faults recorded on test; replace and retest') }),
    item({ id: 'h6', vesselId: 'haven', name: 'Emergency generator load test', description: 'Load test emergency generator and record results', department: 'Engineering', contractorId: 'c-liguria', status: 'Working list', estimate: 4200, start: '2026-10-12', end: '2026-10-14', sources: imported, classSurvey: lr('LR-RC-0311', 'Recommendation', '2026-12-15', 'Carry out load test and submit record') }),
    item({ id: 'h7', vesselId: 'haven', name: 'Deck drain renewal', description: 'Renew corroded scupper and drain pipework', department: 'Deck', contractorId: 'c-liguria', status: 'Quoted', estimate: 9800, quoted: 11200, start: '2026-10-05', end: '2026-10-23', sources: imported, classSurvey: lr('LR-RC-0312', 'Recommendation', '2027-01-15', 'Wastage noted on aft scuppers') }),
    item({ id: 'h8', vesselId: 'haven', name: 'Bridge wing console refurbishment', description: 'Refinish bridge wing consoles and renew switch panels', department: 'Bridge', contractorId: 'c-aster', status: 'Working list', estimate: 14500, start: '2026-10-19', end: '2026-11-06' }),
    item({ id: 'h9', vesselId: 'haven', name: 'Crew mess refurbishment', description: 'New seating, flooring and lighting in crew mess', department: 'Interior', contractorId: 'c-bluewater', status: 'Quoted', budgetCategory: 'Interior', estimate: 22000, quoted: 24500, start: '2026-10-26', end: '2026-11-20' }),
    item({ id: 'h10', vesselId: 'haven', name: 'Galley deck tiling', description: 'Replace cracked galley deck tiles', department: 'Galley', contractorId: 'c-liguria', status: 'Working list', estimate: 8900, start: '2026-10-19', end: '2026-10-30' }),
    item({ id: 'h11', vesselId: 'haven', name: "Owner's gym equipment", description: 'Supply and install new gym equipment for owner', department: "Owner's Preferences", contractorId: 'c-bluewater', status: 'Working list', budgetCategory: 'Owner discretionary', estimate: 12800, start: '2026-11-09', end: '2026-11-20', ownerRelevant: true }),
  ],

  changeOrders: [
    { id: 'co-m014', reference: 'CO-014', workItemId: 'm4', title: 'Hull coating material escalation', reason: 'Price escalation', originalCost: 118000, revisedCost: 136400, status: 'Pending', dateRaised: '2026-09-19', decidedAt: null, costBasis: 'Shipyard T&M rate' },
    { id: 'co-m015', reference: 'CO-015', workItemId: 'm6', title: 'Owner cabin connectivity extension', reason: 'Scope change', originalCost: 42000, revisedCost: 48800, status: 'Pending', dateRaised: '2026-09-23', decidedAt: null, costBasis: 'Supplier quote Q-2291' },
    { id: 'co-m011', reference: 'CO-011', workItemId: 'm7', title: 'Additional bridge cabling', reason: 'Discovered condition', originalCost: 23800, revisedCost: 33000, status: 'Approved', dateRaised: '2026-09-08', decidedAt: '2026-09-10', costBasis: 'Contract clause 4.2' },
    { id: 'co-m009', reference: 'CO-009', workItemId: 'm1', title: 'Replacement turbocharger bearings', reason: 'Discovered condition', originalCost: 41500, revisedCost: 47300, status: 'Approved', dateRaised: '2026-09-02', decidedAt: '2026-09-03', costBasis: 'Contract clause 7.1' },
    { id: 'co-s002', reference: 'CO-002', workItemId: 's2', title: 'Windlass brake band renewal', reason: 'Discovered condition', originalCost: 15100, revisedCost: 18300, status: 'Approved', dateRaised: '2026-09-15', decidedAt: '2026-09-16', costBasis: 'Contract clause 5.3' },
    { id: 'co-h001', reference: 'CO-001', workItemId: 'h4', title: 'Rudder stock machining', reason: 'Discovered condition', originalCost: 21000, revisedCost: 24750, status: 'Approved', dateRaised: '2026-09-17', decidedAt: '2026-09-18', costBasis: 'Contract clause 4.2' },
  ],

  milestones: [
    { id: 'ms-m1', vesselId: 'meridian', name: 'Bridge sea trial', date: '2026-10-09' },
    { id: 'ms-m2', vesselId: 'meridian', name: 'Paint handover', date: '2026-10-30' },
    { id: 'ms-m3', vesselId: 'meridian', name: 'Owner walk-through', date: '2026-12-18' },
    { id: 'ms-m4', vesselId: 'meridian', name: 'Redelivery', date: '2027-01-04' },
    { id: 'ms-s1', vesselId: 'solstice', name: 'Sea trial', date: '2026-10-01' },
    { id: 'ms-s2', vesselId: 'solstice', name: 'Redelivery', date: '2026-10-12' },
    { id: 'ms-h1', vesselId: 'haven', name: 'Class surveyor attendance', date: '2026-10-02' },
    { id: 'ms-h2', vesselId: 'haven', name: 'Undocking', date: '2026-10-30' },
    { id: 'ms-h3', vesselId: 'haven', name: 'Special Survey completion', date: '2026-11-27' },
  ],
};
