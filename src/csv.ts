import type { Lead } from './types';

function escapeCsv(v: unknown): string {
  const s = String(v ?? '');
  // wrap if needed
  if (/[",\n]/.test(s)) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

export function leadsToCsv(leads: Lead[]): string {
  const header = ['Business', 'Contact', 'Phone', 'Email', 'Status', 'Notes', 'CreatedAt'];
  const rows = leads.map((l) => [
    l.businessName,
    l.contactName,
    l.phone,
    l.email ?? '',
    l.status,
    l.notes ?? '',
    l.date
  ]);
  return [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
