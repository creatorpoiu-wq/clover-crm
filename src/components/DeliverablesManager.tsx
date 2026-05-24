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
      
      {/* Add New Deliverable Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', background: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input type="text" placeholder="Title (e.g. Final Gallery)" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', width: '100%' }} />
        <input type="text" placeholder="Description (Optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', width: '100%' }} />
        <input type="text" placeholder="URL Link (Optional)" value={newLink} onChange={e => setNewLink(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', width: '100%' }} />
        <button onClick={addDeliverable} disabled={!newTitle || isAdding} style={{ padding: '0.5rem 1rem', background: '#0f172a', color: '#fff', borderRadius: '0.375rem', fontWeight: 600, cursor: (!newTitle || isAdding) ? 'not-allowed' : 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> {isAdding ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Deliverables Table */}
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        {deliverables.length === 0 ? (
          <div style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>No deliverables added yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 600 }}>Title</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 600 }}>Description</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 600 }}>Link</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {deliverables.map(d => (
                <tr key={d.Deliverable_ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{d.Title}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{d.Description || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {d.Link_URL ? (
                      <a href={d.Link_URL} target="_blank" rel="noreferrer" style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                        <LinkIcon size={14}/> Open Link
                      </a>
                    ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button onClick={() => deleteDeliverable(d.Deliverable_ID)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
