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
const PRO_KEY = 'ctp-pro';

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

export async function loadPro(): Promise<boolean> {
  try {
    if (hasChromeStorage()) {
      const res = await chrome.storage.local.get(PRO_KEY);
      return Boolean(res?.[PRO_KEY]);
    }
    return localStorage.getItem(PRO_KEY) === 'true';
  } catch {
    return false;
  }
}

export async function savePro(isPro: boolean): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [PRO_KEY]: isPro });
    return;
  }
  localStorage.setItem(PRO_KEY, String(isPro));
}
