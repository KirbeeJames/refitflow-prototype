// Entity shapes. Each array in the store maps 1:1 to a future database table; relations are by id.

export const DEPARTMENTS = ['Engineering', 'AV / IT', 'Bridge', 'Deck', 'Interior', 'Galley', "Owner's Preferences", 'Chase Boats'];
export const DEPT_COLORS = { Engineering: '#4778e8', 'AV / IT': '#8b5cf6', Bridge: '#0d9488', Deck: '#e28a31', Interior: '#db5c82', Galley: '#53a45b', "Owner's Preferences": '#bf8b28', 'Chase Boats': '#5d7893' };
export const STATUSES = ['Working list', 'Quoted', 'Approved', 'In progress', 'Complete'];
export const VAT_TREATMENTS = ['VAT applicable', 'VAT exempt', 'Reverse charge', 'IPR'];
export const CLASS_CATEGORIES = ['Condition of Class', 'Recommendation', 'Memo item', 'Outstanding item'];
export const CONTRACT_STATUSES = ['Draft', 'Under Review', 'Signed'];
export const CO_REASONS = ['Scope change', 'Price escalation', 'Discovered condition'];
export const TA_LIMIT_MONTHS = 18;
export const EVIDENCE_KINDS = ['email', 'invoice', 'whatsapp', 'manual'];
export const BUDGET_CATEGORIES = ['Shipyard works', 'Paint', 'Equipment', 'Interior', 'Owner discretionary'];
// EU temporary admission only applies to non-EU flagged yachts.
export const EU_FLAGS = ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'];

/**
 * @typedef {{id:string,name:string,imo:string,flag:string,loaMetres:number,location:string,refitStart:string,refitEnd:string,
 *   budget:number,stageNote?:string,temporaryAdmission:{entryDate:string}|null,onboardedVia:'new'|'historical-import'}} Vessel
 * @typedef {{id:string,vesselId:string,type:string,shipyardContractorId:string,clientParty:string,value:number,
 *   paymentSchedule:{label:string,pct:number}[],warranty:string,warrantyUntil:string,startDate:string,endDate:string,
 *   governingLaw:string,status:'Draft'|'Under Review'|'Signed',sourceDocument:string|null}} Contract
 * @typedef {{id:string,name:string,type:'shipyard'|'supplier'|'owners-preferred',contact:string,color:string}} Contractor
 * @typedef {{id:string,vesselId:string,reference:string,customsOffice:string,dischargeDeadline:string}} IprAuthorization
 * @typedef {{kind:'email'|'invoice'|'whatsapp'|'import'|'manual',label:string,date:string}} Source
 * @typedef {{surveyType:'Special'|'Intermediate'|'Annual'|'Docking',society:string,reference:string,category:string,
 *   dueDate:string,surveyorNotes:string,evidenceStatus:'Pending'|'Uploaded'|'Accepted'}} ClassSurvey
 * @typedef {{id:string,vesselId:string,name:string,description:string,department:string,priorityOverride:string|null,
 *   budgetCategory:string,vat:string,iprAuthorizationId:string|null,contractorId:string|null,status:string,
 *   estimate:number,quoted:number|null,committed:number|null,invoiced:number,start:string,end:string,notes:string,
 *   ownerRelevant:boolean,sources:Source[],classSurvey:ClassSurvey|null}} WorkItem
 * @typedef {{id:string,reference:string,workItemId:string,title:string,reason:string,originalCost:number,revisedCost:number,
 *   status:'Pending'|'Approved'|'Rejected',dateRaised:string,decidedAt:string|null,costBasis:string}} ChangeOrder
 * @typedef {{id:string,vesselId:string,name:string,date:string}} Milestone
 */

export const suggestPriority = text =>
  /class|flag|safety|fire|survey|lsa/i.test(text) ? 'Essential'
    : /comfort|finish|upgrade|owner|refresh/i.test(text) ? 'Desired'
      : 'Recommended';

export const priorityOf = item =>
  item.priorityOverride
  ?? (item.classSurvey?.category === 'Condition of Class' ? 'Essential' : suggestPriority(`${item.name} ${item.description}`));
