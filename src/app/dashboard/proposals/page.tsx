'use client';
import { useState, useEffect } from 'react';
import { Plus, Send, Eye, Trash2, CheckCircle, Clock, XCircle, FileText, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  Draft:    { label: 'Draft',    color: '#64748b', bg: '#f1f5f9', icon: FileText },
  Sent:     { label: 'Sent',     color: '#0891b2', bg: '#e0f2fe', icon: Send },
  Accepted: { label: 'Accepted', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
  Declined: { label: 'Declined', color: '#dc2626', bg: '#fee2e2', icon: XCircle },
};

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/proposals')
      .then(r => r.json())
      .then(d => { if (d.success) setProposals(d.proposals); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = proposals.filter(p => {
    const matchSearch = !search || p.Title?.toLowerCase().includes(search.toLowerCase()) || p.Contacts?.Name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.Status === filter;
    return matchSearch && matchFilter;
  });

  const handleNew = async () => {
    setCreating(true);
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Wedding Proposal', contactId: null }),
    });
    const data = await res.json();
    if (data.success) router.push(`/dashboard/proposals/${data.proposal.Proposal_ID}`);
    else setCreating(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this proposal?')) return;
    await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
    setProposals(p => p.filter(x => x.Proposal_ID !== id));
  };

  const counts = { All: proposals.length, Draft: 0, Sent: 0, Accepted: 0, Declined: 0 };
  proposals.forEach(p => { if (p.Status in counts) counts[p.Status as keyof typeof counts]++; });

  return (
    <div style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Proposals</h1>
          <p style={{ color: '#64748b', marginTop: '0.35rem', fontSize: '0.9rem' }}>Create and send personalized proposals to clients</p>
        </div>
        <button
          onClick={handleNew}
          disabled={creating}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.25)' }}
        >
          <Plus size={18} /> {creating ? 'Creating…' : 'New Proposal'}
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
        {(['All', 'Draft', 'Sent', 'Accepted', 'Declined'] as const).map(s => {
          const cfg = s === 'All' ? { color: '#0f172a', bg: '#f1f5f9' } : STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                background: filter === s ? cfg.bg : 'white',
                border: filter === s ? `2px solid ${cfg.color}` : '1px solid #e2e8f0',
                borderRadius: '0.875rem', padding: '1rem', textAlign: 'left', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: cfg.color }}>{counts[s]}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginTop: '0.2rem' }}>{s}</div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or client name…"
          style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading proposals…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '1.25rem', border: '2px dashed #e2e8f0' }}>
          <FileText size={40} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>No proposals yet</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Create your first personalized proposal to get started.</p>
          <button onClick={handleNew} style={{ background: '#0f172a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />New Proposal
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(p => {
            const cfg = STATUS_CONFIG[p.Status] || STATUS_CONFIG.Draft;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={p.Proposal_ID}
                style={{ background: 'white', borderRadius: '1rem', border: '1px solid #f1f5f9', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                onClick={() => router.push(`/dashboard/proposals/${p.Proposal_ID}`)}
                onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
                onMouseOut={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)')}
              >
                {/* Status icon */}
                <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <StatusIcon size={20} color={cfg.color} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.Title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {p.Contacts?.Name && <span>👤 {p.Contacts.Name}</span>}
                    {p.Packages?.Name && <span>📦 {p.Packages.Name}</span>}
                    {p.Packages?.Price && <span>💰 ${Number(p.Packages.Price).toLocaleString()}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} />{new Date(p.Created_At).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Status badge */}
                <span style={{ flexShrink: 0, padding: '0.3rem 0.75rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700, background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <Link href={`/proposal/${p.Proposal_ID}`} target="_blank" title="Preview client view">
                    <button style={{ width: 34, height: 34, borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Eye size={15} color="#64748b" />
                    </button>
                  </Link>
                  <button onClick={() => handleDelete(p.Proposal_ID)} title="Delete" style={{ width: 34, height: 34, borderRadius: '0.5rem', border: '1px solid #fee2e2', background: '#fff5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={15} color="#ef4444" />
                  </button>
                </div>

                <ChevronRight size={18} color="#cbd5e1" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
