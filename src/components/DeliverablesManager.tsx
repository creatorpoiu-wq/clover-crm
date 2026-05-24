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
    <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>Deliverables & Links</h3>
      
      {/* Deliverables List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {deliverables.length === 0 ? (
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>No deliverables added yet.</div>
        ) : (
          deliverables.map(d => (
            <div key={d.Deliverable_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: '#f8fafc' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{d.Title}</div>
                {d.Link_URL && <a href={d.Link_URL} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><LinkIcon size={12}/> {d.Link_URL}</a>}
              </div>
              <button onClick={() => deleteDeliverable(d.Deliverable_ID)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
            </div>
          ))
        )}
      </div>

      {/* Add New Deliverable */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
        <input type="text" placeholder="Title (e.g. Final Gallery)" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
        <input type="text" placeholder="URL Link (optional)" value={newLink} onChange={e => setNewLink(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
        <button onClick={addDeliverable} disabled={!newTitle || isAdding} style={{ padding: '0.5rem', background: '#0f172a', color: '#fff', borderRadius: '0.375rem', fontWeight: 600, cursor: (!newTitle || isAdding) ? 'not-allowed' : 'pointer' }}>
          {isAdding ? 'Adding...' : 'Add Deliverable'}
        </button>
      </div>

      {/* Milestones Tracker */}
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>Deliverables Timeline</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {milestones.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: m.status === 'completed' ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
              {m.status === 'completed' && <CheckCircle2 size={16} />}
              {m.name}
            </div>
            <select 
              value={m.status} 
              onChange={e => updateMilestone(i, e.target.value)}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }}
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
