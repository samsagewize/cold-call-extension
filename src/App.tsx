import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Clock,
  Download,
  Edit2,
  Phone,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
  XCircle
} from './icons';

type LeadStatus = 'not-called' | 'called' | 'interested' | 'not-interested' | 'converted';

type Lead = {
  id: number;
  date: string;
  businessName: string;
  contactName: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  notes?: string;
};

const STORAGE_KEY = 'crm-leads';

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [formData, setFormData] = useState<Omit<Lead, 'id' | 'date'>>({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    status: 'not-called',
    notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLeads(JSON.parse(saved));

    const onBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  const stats = useMemo(() => {
    const attempted = leads.filter((l) => l.status !== 'not-called');
    const converted = leads.filter((l) => l.status === 'converted');
    return {
      total: leads.length,
      called: attempted.length,
      interested: leads.filter((l) => l.status === 'interested').length,
      converted: converted.length,
      conversionRate: attempted.length > 0 ? ((converted.length / attempted.length) * 100).toFixed(1) : '0.0'
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesSearch =
        !t ||
        lead.businessName.toLowerCase().includes(t) ||
        lead.contactName.toLowerCase().includes(t) ||
        lead.phone.includes(t);
      const matchesFilter = filterStatus === 'all' || lead.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [leads, searchTerm, filterStatus]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'not-called':
        return 'bg-black/[0.04] text-ink-900/80';
      case 'called':
        return 'bg-blue-500/10 text-blue-800';
      case 'interested':
        return 'bg-amber-500/12 text-amber-900';
      case 'not-interested':
        return 'bg-rose-500/12 text-rose-900';
      case 'converted':
        return 'bg-neon-500/18 text-ink-900';
      default:
        return 'bg-black/[0.04] text-ink-900/80';
    }
  };

  const getStatusIcon = (status: LeadStatus) => {
    switch (status) {
      case 'converted':
        return <CheckCircle className="w-4 h-4" />;
      case 'not-interested':
        return <XCircle className="w-4 h-4" />;
      case 'interested':
        return <TrendingUp className="w-4 h-4" />;
      case 'called':
        return <Phone className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const openAdd = () => {
    setShowAddForm(true);
    setEditingLead(null);
    setFormData({
      businessName: '',
      contactName: '',
      phone: '',
      email: '',
      status: 'not-called',
      notes: ''
    });
  };

  const handleSubmit = () => {
    if (!formData.businessName || !formData.contactName || !formData.phone) return;

    if (editingLead) {
      setLeads(
        leads.map((l) =>
          l.id === editingLead.id
            ? { ...editingLead, ...formData, email: formData.email || undefined, notes: formData.notes || undefined }
            : l
        )
      );
      setEditingLead(null);
    } else {
      setLeads([
        ...leads,
        {
          ...(formData as any),
          email: formData.email || undefined,
          notes: formData.notes || undefined,
          id: Date.now(),
          date: new Date().toISOString()
        }
      ]);
    }

    setShowAddForm(false);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      businessName: lead.businessName,
      contactName: lead.contactName,
      phone: lead.phone,
      email: lead.email || '',
      status: lead.status,
      notes: lead.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this lead?')) {
      setLeads(leads.filter((l) => l.id !== id));
    }
  };

  return (
    <div className="grain min-h-screen p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        {showInstallPrompt && (
          <div className="rounded-2xl bg-ink-900 text-white p-4 shadow-card2 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5" />
              <div>
                <p className="font-semibold">Install CallTrack Pro</p>
                <p className="text-sm text-white/75">Offline-ready, fast access, and home-screen install.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="rounded-xl bg-white text-ink-900 px-4 py-2 hover:bg-white/90 transition font-semibold"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 hover:bg-white/15 transition"
              >
                Later
              </button>
            </div>
          </div>
        )}

        <div className="mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-ink-800/70">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-neon-500 shadow-[0_0_0_4px_rgba(182,255,77,0.25)]" />
                CallTrack Pro
              </p>
              <h1 className="mt-2 font-display text-4xl md:text-5xl leading-[1.05] text-ink-900">
                Cold calling, but{' '}
                <span className="underline decoration-neon-500/70 decoration-[6px] underline-offset-[10px]">calm</span>.
              </h1>
              <p className="mt-3 text-ink-800/70 max-w-2xl">
                Track leads, outcomes, and momentum in a single glance — optimized for fast entry and clean follow‑ups.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 shadow-card px-4 py-3">
                <div className="text-xs text-ink-800/60">Today’s focus</div>
                <div className="text-sm font-semibold text-ink-900">Add 5 leads • Call 10</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="rounded-2xl bg-white/75 backdrop-blur border border-white/70 shadow-card2 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-ink-800/60">Total</p>
                <p className="mt-2 text-3xl font-semibold text-ink-900">{stats.total}</p>
              </div>
              <div className="text-ink-800/70">
                <Users className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/75 backdrop-blur border border-white/70 shadow-card2 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-ink-800/60">Called</p>
                <p className="mt-2 text-3xl font-semibold text-ink-900">{stats.called}</p>
              </div>
              <div className="text-ink-800/70">
                <Phone className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/75 backdrop-blur border border-white/70 shadow-card2 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-ink-800/60">Interested</p>
                <p className="mt-2 text-3xl font-semibold text-ink-900">{stats.interested}</p>
              </div>
              <div className="text-ink-800/70">
                <TrendingUp className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/75 backdrop-blur border border-white/70 shadow-card2 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-ink-800/60">Converted</p>
                <p className="mt-2 text-3xl font-semibold text-ink-900">{stats.converted}</p>
              </div>
              <div className="text-ink-800/70">
                <CheckCircle className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-ink-900 text-white shadow-card2 p-6 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background:
                  'radial-gradient(700px 180px at 20% 20%, rgba(182,255,77,0.35), transparent 55%), radial-gradient(700px 220px at 90% 40%, rgba(82,168,255,0.35), transparent 60%)'
              }}
            />
            <div className="relative">
              <p className="text-xs font-semibold tracking-wide uppercase text-white/70">Conversion</p>
              <p className="mt-2 text-3xl font-semibold">{stats.conversionRate}%</p>
              <p className="mt-1 text-xs text-white/70">(converted / attempted)</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/75 backdrop-blur border border-white/70 shadow-card2 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1 w-full md:w-auto">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-800/45">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 bg-white/70 focus:outline-none focus:ring-2 focus:ring-neon-500/60 focus:border-black/20"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 focus:outline-none focus:ring-2 focus:ring-neon-500/60 focus:border-black/20"
              >
                <option value="all">All Status</option>
                <option value="not-called">Not Called</option>
                <option value="called">Called</option>
                <option value="interested">Interested</option>
                <option value="not-interested">Not Interested</option>
                <option value="converted">Converted</option>
              </select>
            </div>
            <button
              onClick={openAdd}
              className="group relative overflow-hidden rounded-xl bg-ink-900 text-white px-6 py-2.5 transition flex items-center gap-2 whitespace-nowrap shadow-card hover:shadow-[0_18px_55px_rgba(7,10,19,0.22)]"
            >
              <Plus className="w-5 h-5" />
              Add Lead
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="rounded-2xl bg-white/80 backdrop-blur border border-white/70 shadow-card2 p-6 mb-6">
            <h2 className="font-display text-2xl mb-4 text-ink-900">{editingLead ? 'Edit Lead' : 'Add New Lead'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Business Name *"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 focus:outline-none focus:ring-2 focus:ring-neon-500/60 focus:border-black/20"
              />
              <input
                type="text"
                placeholder="Contact Name *"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 focus:outline-none focus:ring-2 focus:ring-neon-500/60 focus:border-black/20"
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 focus:outline-none focus:ring-2 focus:ring-neon-500/60 focus:border-black/20"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 focus:outline-none focus:ring-2 focus:ring-neon-500/60 focus:border-black/20"
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                className="px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 focus:outline-none focus:ring-2 focus:ring-neon-500/60 focus:border-black/20"
              >
                <option value="not-called">Not Called</option>
                <option value="called">Called - No Answer</option>
                <option value="interested">Interested</option>
                <option value="not-interested">Not Interested</option>
                <option value="converted">Converted</option>
              </select>
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 focus:outline-none focus:ring-2 focus:ring-neon-500/60 focus:border-black/20 md:col-span-2"
                rows={3}
              />
              <div className="md:col-span-2 flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="rounded-xl bg-ink-900 text-white px-6 py-2.5 shadow-card hover:shadow-[0_18px_55px_rgba(7,10,19,0.22)] transition"
                >
                  {editingLead ? 'Update Lead' : 'Add Lead'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingLead(null);
                  }}
                  className="rounded-xl bg-white/70 border border-black/10 text-ink-900 px-6 py-2.5 hover:bg-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white/75 backdrop-blur border border-white/70 shadow-card2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/60 border-b border-black/10">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-ink-800/65 uppercase tracking-[0.16em]">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-ink-800/65 uppercase tracking-[0.16em]">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-ink-800/65 uppercase tracking-[0.16em]">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-ink-800/65 uppercase tracking-[0.16em]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-ink-800/65 uppercase tracking-[0.16em]">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-ink-800/65 uppercase tracking-[0.16em]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black/5">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="mx-auto max-w-md">
                        <div className="text-sm font-semibold text-ink-900">No leads yet.</div>
                        <div className="mt-1 text-sm text-ink-800/70">
                          Add your first lead and start tracking outcomes.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-black/[0.03]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-ink-900">{lead.businessName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-ink-900">{lead.contactName}</div>
                        {lead.email && <div className="text-sm text-ink-800/60">{lead.email}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-ink-900">{lead.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-black/5 ${getStatusColor(
                            lead.status
                          )}`}
                        >
                          {getStatusIcon(lead.status)}
                          {lead.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-ink-900 max-w-xs truncate">{lead.notes || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(lead)}
                            className="text-ink-900/70 hover:text-ink-900"
                            aria-label="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="text-rose-700/80 hover:text-rose-900"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
