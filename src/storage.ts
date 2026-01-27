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

const KEY = 'crm-leads';

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

export async function loadLeads(): Promise<Lead[]> {
  try {
    if (hasChromeStorage()) {
      const res = await chrome.storage.local.get(KEY);
      return (res?.[KEY] as Lead[]) ?? [];
    }
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Lead[]) : [];
  } catch {
    return [];
  }
}

export async function saveLeads(leads: Lead[]): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [KEY]: leads });
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(leads));
}
