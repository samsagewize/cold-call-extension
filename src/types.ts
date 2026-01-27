export type LeadStatus = 'not-called' | 'called' | 'interested' | 'not-interested' | 'converted';

export type Lead = {
  id: number;
  date: string;
  businessName: string;
  contactName: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  notes?: string;
};
