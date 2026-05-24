'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

interface Props {
  inquiryId: number;
}

export default function DeliverablesManager({ inquiryId }: Props) {
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newTitle, setNewTitle] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchDeliverables = async () => {
    try {
      const res = await fetch(`/api/deliverables?inquiryId=${inquiryId}`);
      const data = await res.json();
      if (data.success) {
        setDeliverables(data.deliverables || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMilestones = async () => {
    try {
      const res = await fetch(`/api/portal?inquiryId=${inquiryId}`);
      const data = await res.json();
      if (data.success && data.portal.event.deliverableMilestones) {
        setMilestones(data.portal.event.deliverableMilestones);
      } else {
        // Defaults
        setMilestones([
          { name: "Sneak Peeks Delivered", status: "pending" },
          { name: "Final Gallery Delivered", status: "pending" },
          { name: "Album Design Approved", status: "pending" },
          { name: "Physical Products Shipped", status: "pending" }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverables();
    fetchMilestones();
  }, [inquiryId]);

  const addDeliverable = async () => {
    if (!newTitle) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, title: newTitle, linkUrl: newLink, description: newDesc })
      });
      if (res.ok) {
        setNewTitle(''); setNewLink(''); setNewDesc('');
        fetchDeliverables();
      }
    } finally {
      setIsAdding(false);
    }
  };

  const deleteDeliverable = async (id: number) => {
    if (!confirm('Delete this deliverable?')) return;
    try {
      await fetch(`/api/deliverables?id=${id}`, { method: 'DELETE' });
      fetchDeliverables();
    } catch (err) {
      console.error(err);
    }
  };

  const updateMilestone = async (index: number, newStatus: string) => {
    const newMilestones = [...milestones];
    newMilestones[index].status = newStatus;
    setMilestones(newMilestones);

    try {
      await fetch('/api/inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inquiryId, Deliverable_Milestones: newMilestones })
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: 20, color: '#6b7280' }}>Loading Deliverables...</div>;

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #f0efe9', paddingTop: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Deliverables & Links</h3>
      
      {/* Add New Deliverable Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid #f1f5f9' }}>
        <input type="text" placeholder="Deliverable Title (e.g. Final Gallery)" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.875rem', outline: 'none' }} />
        <input type="text" placeholder="Description (Optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.875rem', outline: 'none' }} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input type="text" placeholder="URL Link (Optional)" value={newLink} onChange={e => setNewLink(e.target.value)} style={{ padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.875rem', outline: 'none' }} />
          <button onClick={addDeliverable} disabled={!newTitle || isAdding} style={{ padding: '0.875rem 1.5rem', background: 'var(--primary)', color: '#fff', borderRadius: '0.5rem', fontWeight: 700, cursor: (!newTitle || isAdding) ? 'not-allowed' : 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            <Plus size={18} /> {isAdding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Deliverables List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem' }}>
        {deliverables.length === 0 ? (
          <div style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>No deliverables added yet.</div>
        ) : (
          deliverables.map(d => (
            <div key={d.Deliverable_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', border: '1px solid #f1f5f9', borderRadius: '0.75rem', backgroundColor: '#fff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{d.Title}</div>
                {d.Description && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.Description}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {d.Link_URL && (
                  <a href={d.Link_URL} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', backgroundColor: 'rgba(15, 118, 110, 0.1)', borderRadius: '0.375rem', textDecoration: 'none', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 118, 110, 0.2)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 118, 110, 0.1)'}>
                    <LinkIcon size={14}/> Open Link
                  </a>
                )}
                <button onClick={() => deleteDeliverable(d.Deliverable_ID)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.25rem', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Milestones Tracker */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Deliverables Timeline</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {milestones.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', border: '1px solid #f1f5f9', borderRadius: '0.75rem', backgroundColor: '#fff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: m.status === 'completed' ? '#059669' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {m.status === 'completed' && <CheckCircle2 size={18} color="#059669" />}
              {m.name}
            </div>
            <select 
              value={m.status} 
              onChange={e => updateMilestone(i, e.target.value)}
              style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontWeight: 600, color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer' }}
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
