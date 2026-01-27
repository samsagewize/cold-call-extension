import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Lead, LeadStatus } from './types';
import { loadLeads, loadPro, saveLeads, savePro } from './storage';
import { CheckCircle, Phone, Plus, Search, TrendingUp, Users, XCircle } from './icons';
import { leadsToCsv, downloadCsv } from './csv';
import { openUpgrade } from './billing';
import { verifyLicense } from './licenseApi';

const STATUS: Array<{ key: LeadStatus; label: string; icon: React.ReactNode; cls: string }> = [
  { key: 'not-called', label: 'Not called', icon: <Phone className="w-4 h-4" />, cls: 'bg-white/5 text-white/80 border-white/10' },
  { key: 'called', label: 'Called', icon: <Phone className="w-4 h-4" />, cls: 'bg-blue-500/15 text-blue-100 border-blue-500/20' },
  { key: 'interested', label: 'Interested', icon: <TrendingUp className="w-4 h-4" />, cls: 'bg-amber-500/15 text-amber-100 border-amber-500/20' },
  { key: 'not-interested', label: 'No', icon: <XCircle className="w-4 h-4" />, cls: 'bg-rose-500/15 text-rose-100 border-rose-500/20' },
  { key: 'converted', label: 'Won', icon: <CheckCircle className="w-4 h-4" />, cls: 'bg-[#B6FF4D]/15 text-[#E8FFD0] border-[#B6FF4D]/25' }
];

function canUseChromeTabs(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.tabs?.create;
}

export default function Popup() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [q, setQ] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  useEffect(() => {
    if (isPro) setShowPro(false);
  }, [isPro]);
  const [licenseStatus, setLicenseStatus] = useState<'idle'|'checking'|'valid'|'invalid'|'error'>('idle');

  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<LeadStatus>('not-called');

  const businessRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.classList.add('ctp-popup');
    loadLeads().then(setLeads);
    loadPro().then(setIsPro);
    // focus first field
    setTimeout(() => businessRef.current?.focus(), 50);
    return () => document.body.classList.remove('ctp-popup');
  }, []);

  useEffect(() => {
    saveLeads(leads);
  }, [leads]);

  useEffect(() => {
    savePro(isPro);
  }, [isPro]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return leads.slice().reverse().slice(0, 6);
    return leads
      .filter((l) =>
        l.businessName.toLowerCase().includes(t) ||
        l.contactName.toLowerCase().includes(t) ||
        l.phone.includes(t)
      )
      .slice()
      .reverse()
      .slice(0, 6);
  }, [leads, q]);

  const attempted = useMemo(() => leads.filter((l) => l.status !== 'not-called').length, [leads]);
  const won = useMemo(() => leads.filter((l) => l.status === 'converted').length, [leads]);
  const conversion = attempted > 0 ? Math.round((won / attempted) * 100) : 0;

  const reset = () => {
    setBusinessName('');
    setContactName('');
    setPhone('');
    setStatus('not-called');
    businessRef.current?.focus();
  };

  const add = () => {
    if (!businessName.trim() || !contactName.trim() || !phone.trim()) return;
    const next: Lead = {
      id: Date.now(),
      date: new Date().toISOString(),
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      status
    };
    setLeads((prev) => [...prev, next]);
    reset();
  };

  const exportCsv = () => {
    if (!isPro) {
      setShowPro(true);
      return;
    }
    const csv = leadsToCsv(leads);
    downloadCsv(`calltrack-pro-leads-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const openDashboard = () => {
    // open a full tab view (same build output)
    if (canUseChromeTabs()) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
      return;
    }
    window.open('/', '_blank');
  };

  return (
    <div className="w-[380px] max-w-[100vw] text-white relative">
      {showPro && (
        <div className="absolute inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPro(false)} />
          <div className="relative p-4">
            <div className="rounded-3xl border border-white/10 bg-[#0B1020]/95 shadow-[0_30px_90px_rgba(0,0,0,0.55)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-[0.16em] uppercase text-white/60">CallTrack Pro</div>
                  <div className="mt-1 font-display text-2xl leading-tight">Lifetime Pro — $5</div>
                  <div className="mt-1 text-sm text-white/70">
                    Unlock CSV export + Teams mode (sync coming next).
                  </div>
                </div>
                <button
                  onClick={() => setShowPro(false)}
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 transition"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-3">
                <div className="text-xs font-semibold text-white/80">What you get</div>
                <ul className="mt-2 text-sm text-white/70 space-y-1">
                  <li>• Export leads to CSV (Pro)</li>
                  <li>• Teams workspace (Pro — sync coming next)</li>
                  <li>• Pro badge + premium UI</li>
                </ul>
              </div>

              <div className="mt-4 rounded-2xl bg-black/30 border border-white/10 p-3">
                <div className="text-xs font-semibold text-white/80">Already purchased?</div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <input
                    value={licenseKey}
                    onChange={(e) => {
                      setLicenseKey(e.target.value);
                      setLicenseStatus('idle');
                    }}
                    placeholder="Enter license key (CTP-XXXX-XXXX-XXXX)"
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#B6FF4D]/35"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openUpgrade()}
                      className="rounded-xl bg-[#B6FF4D] text-[#070A13] px-3 py-2.5 text-sm font-semibold shadow-[0_16px_40px_rgba(182,255,77,0.18)] hover:shadow-[0_18px_55px_rgba(182,255,77,0.22)] transition"
                    >
                      Purchase ($5)
                    </button>
                    <button
                      onClick={async () => {
                        setLicenseStatus('checking');
                        try {
                          const ok = await verifyLicense(licenseKey.trim());
                          if (ok) {
                            setIsPro(true);
                            setLicenseStatus('valid');
                          } else {
                            setLicenseStatus('invalid');
                          }
                        } catch {
                          setLicenseStatus('error');
                        }
                      }}
                      className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm font-semibold hover:bg-white/10 transition disabled:opacity-50"
                      disabled={!licenseKey.trim() || licenseStatus === 'checking'}
                    >
                      {licenseStatus === 'checking' ? 'Verifying…' : 'Verify key'}
                    </button>
                  </div>
                  {licenseStatus === 'valid' && (
                    <div className="text-xs text-[#B6FF4D]">Verified. Pro unlocked.</div>
                  )}
                  {licenseStatus === 'invalid' && (
                    <div className="text-xs text-rose-200">Invalid key.</div>
                  )}
                  {licenseStatus === 'error' && (
                    <div className="text-xs text-amber-200">Couldn’t verify right now (API not configured yet).</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase text-white/70">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#B6FF4D] shadow-[0_0_0_4px_rgba(182,255,77,0.18)]" />
              CallTrack Pro
            </div>
            <div className="mt-2 font-display text-[24px] leading-[1.05]">
              Quick capture
            </div>
            <div className="mt-1 text-sm text-white/70">Add a lead in seconds. No fluff.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPro(true)}
              className="rounded-xl bg-[#B6FF4D] text-[#070A13] px-3 py-2 text-xs font-semibold shadow-[0_12px_28px_rgba(182,255,77,0.18)] hover:shadow-[0_18px_55px_rgba(182,255,77,0.22)] transition"
              title="Unlock Pro"
            >
              {isPro ? 'PRO' : 'Upgrade $5'}
            </button>
            <button
              onClick={openDashboard}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 transition"
            >
              Dashboard
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/60">Leads</div>
            <div className="mt-1 text-xl font-semibold">{leads.length}</div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/60">Attempted</div>
            <div className="mt-1 text-xl font-semibold">{attempted}</div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 relative overflow-hidden">
            <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(240px 120px at 20% 20%, rgba(182,255,77,0.35), transparent 55%), radial-gradient(300px 160px at 95% 45%, rgba(82,168,255,0.35), transparent 60%)' }} />
            <div className="relative">
              <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/60">Conv.</div>
              <div className="mt-1 text-xl font-semibold">{conversion}%</div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-3">
          <div className="grid grid-cols-1 gap-2">
            <input
              ref={businessRef}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add();
              }}
              placeholder="Business *"
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#B6FF4D]/35"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') add();
                }}
                placeholder="Contact *"
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#B6FF4D]/35"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') add();
                }}
                placeholder="Phone *"
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#B6FF4D]/35"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${s.cls} ${status === s.key ? 'ring-2 ring-[#B6FF4D]/25' : 'opacity-80 hover:opacity-100'}`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>

            <button
              onClick={add}
              className="mt-1 rounded-xl bg-[#B6FF4D] text-[#070A13] font-semibold px-4 py-2.5 shadow-[0_16px_40px_rgba(182,255,77,0.18)] hover:shadow-[0_18px_55px_rgba(182,255,77,0.22)] transition inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add lead
            </button>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={exportCsv}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 transition"
              >
                Export CSV {isPro ? '' : '• Pro'}
              </button>
              <button
                onClick={() => setShowPro(true)}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 transition"
              >
                Teams {isPro ? '' : '• Pro'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/60">Recent</div>
            <div className="relative">
              <Search className="w-4 h-4 text-white/35 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="w-[140px] rounded-xl bg-black/30 border border-white/10 pl-8 pr-2 py-1.5 text-xs placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#B6FF4D]/35"
              />
            </div>
          </div>

          <div className="space-y-2 pb-4">
            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-sm text-white/65">
                No leads yet. Add your first one.
              </div>
            ) : (
              filtered.map((l) => (
                <div key={l.id} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{l.businessName}</div>
                      <div className="mt-0.5 text-xs text-white/65 truncate">{l.contactName} • {l.phone}</div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-white/10 ${STATUS.find(s => s.key === l.status)?.cls ?? 'bg-white/5 text-white/70'}`}>
                      {getIconFor(l.status)}
                      {shortLabel(l.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function shortLabel(s: LeadStatus) {
  switch (s) {
    case 'not-called':
      return 'New';
    case 'called':
      return 'Called';
    case 'interested':
      return 'Hot';
    case 'not-interested':
      return 'No';
    case 'converted':
      return 'Won';
  }
}

function getIconFor(s: LeadStatus) {
  switch (s) {
    case 'converted':
      return <CheckCircle className="w-3.5 h-3.5" />;
    case 'not-interested':
      return <XCircle className="w-3.5 h-3.5" />;
    case 'interested':
      return <TrendingUp className="w-3.5 h-3.5" />;
    case 'called':
    case 'not-called':
    default:
      return <Phone className="w-3.5 h-3.5" />;
  }
}
