'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { DatePicker } from '@/components/ui/DatePicker';

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
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

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
          { name: "Sneak Peeks Delivered", status: "pending", dueDate: null },
          { name: "Final Gallery Delivered", status: "pending", dueDate: null },
          { name: "Album Design Approved", status: "pending", dueDate: null },
          { name: "Physical Products Shipped", status: "pending", dueDate: null }
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

  const updateMilestone = async (index: number, newStatus?: string, newDueDate?: string, newName?: string) => {
    const newMilestones = [...milestones];
    if (newStatus !== undefined) newMilestones[index].status = newStatus;
    if (newDueDate !== undefined) newMilestones[index].dueDate = newDueDate;
    if (newName !== undefined) newMilestones[index].name = newName;
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

  const addMilestone = async () => {
    if (!newMilestoneName) return;
    const newMilestones = [...milestones, { name: newMilestoneName, status: 'pending', dueDate: newMilestoneDate || null }];
    setMilestones(newMilestones);
    setNewMilestoneName('');
    setNewMilestoneDate('');
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

  const deleteMilestone = async (index: number) => {
    const newMilestones = milestones.filter((_, i) => i !== index);
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
    <div style={{ marginTop: '2rem', borderTop: '1px solid #f0efe9', paddingTop: '2rem', boxSizing: 'border-box' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Deliverables & Links</h3>
      
      {/* Add New Deliverable Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid #f1f5f9', boxSizing: 'border-box' }}>
        <input type="text" placeholder="Deliverable Title (e.g. Final Gallery)" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
        <input type="text" placeholder="Description (Optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
          <input type="text" placeholder="URL Link (Optional)" value={newLink} onChange={e => setNewLink(e.target.value)} style={{ padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', flex: 1, minWidth: 0, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={addDeliverable} disabled={!newTitle || isAdding} style={{ padding: '0.875rem 1.5rem', background: 'var(--primary)', color: '#fff', borderRadius: '0.5rem', fontWeight: 700, cursor: (!newTitle || isAdding) ? 'not-allowed' : 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', flexShrink: 0, boxSizing: 'border-box' }}>
            <Plus size={18} /> {isAdding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Deliverables List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem', boxSizing: 'border-box' }}>
        {deliverables.length === 0 ? (
          <div style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1', boxSizing: 'border-box' }}>No deliverables added yet.</div>
        ) : (
          deliverables.map(d => (
            <div key={d.Deliverable_ID} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', border: '1px solid #f1f5f9', borderRadius: '0.75rem', backgroundColor: '#fff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 200, boxSizing: 'border-box' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem', wordBreak: 'break-word' }}>
                  {d.Title}
                  {d.Client_Status === 'approved' && <span style={{ marginLeft: 8, padding: '2px 6px', fontSize: 10, background: '#10b981', color: '#fff', borderRadius: 4 }}>Approved</span>}
                  {d.Client_Status === 'revision' && <span style={{ marginLeft: 8, padding: '2px 6px', fontSize: 10, background: '#f59e0b', color: '#fff', borderRadius: 4 }}>Revision Requested</span>}
                </div>
                {d.Description && <div style={{ fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-word' }}>{d.Description}</div>}
                {d.Client_Notes && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderLeft: '3px solid #cbd5e1', fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
                    <strong>Client Note:</strong> {d.Client_Notes}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, boxSizing: 'border-box' }}>
                {d.Link_URL && (
                  <a href={d.Link_URL} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', backgroundColor: 'rgba(15, 118, 110, 0.1)', borderRadius: '0.375rem', textDecoration: 'none', transition: 'background-color 0.2s', boxSizing: 'border-box' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 118, 110, 0.2)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 118, 110, 0.1)'}>
                    <LinkIcon size={14}/> Open Link
                  </a>
                )}
                <button onClick={() => deleteDeliverable(d.Deliverable_ID)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.25rem', transition: 'background-color 0.2s', boxSizing: 'border-box' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Milestones Tracker */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Deliverables Timeline</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {milestones.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', border: '1px solid #f1f5f9', borderRadius: '0.75rem', backgroundColor: '#fff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 150 }}>
              {m.status === 'completed' && <CheckCircle2 size={18} color="#059669" />}
              <input 
                type="text" 
                value={m.name} 
                onChange={e => updateMilestone(i, undefined, undefined, e.target.value)} 
                style={{ fontSize: '0.875rem', fontWeight: 700, color: m.status === 'completed' ? '#059669' : '#0f172a', border: 'none', background: 'transparent', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <DatePicker 
                value={m.dueDate || ''} 
                onChange={val => updateMilestone(i, undefined, val, undefined)}
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', color: '#475569', outline: 'none', boxSizing: 'border-box' }}
              />
              <select 
                value={m.status} 
                onChange={e => updateMilestone(i, e.target.value, undefined, undefined)}
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontWeight: 600, color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <button onClick={() => deleteMilestone(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.375rem', boxSizing: 'border-box' }} title="Remove Step">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Timeline Step */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px dashed #cbd5e1', boxSizing: 'border-box' }}>
        <input type="text" placeholder="New Step Name (e.g. Teasers)" value={newMilestoneName} onChange={e => setNewMilestoneName(e.target.value)} style={{ padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', flex: 1, minWidth: 150, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
        <DatePicker value={newMilestoneDate} onChange={val => setNewMilestoneDate(val)} style={{ padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
        <button onClick={addMilestone} disabled={!newMilestoneName} style={{ padding: '0.625rem 1rem', background: '#e2e8f0', color: '#334155', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: newMilestoneName ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.25rem', boxSizing: 'border-box' }}>
          <Plus size={16} /> Add Step
        </button>
      </div>
    </div>
  );
}
