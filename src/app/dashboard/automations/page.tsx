"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Zap, ArrowRight, PlayCircle } from 'lucide-react';

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newAction, setNewAction] = useState({ trigger: 'contract_signed', templateId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [autoRes, tempRes] = await Promise.all([
        fetch('/api/automations').then(r => r.json()),
        fetch('/api/templates').then(r => r.json())
      ]);
      if (autoRes.success && autoRes.automations) setAutomations(autoRes.automations);
      if (tempRes.success && tempRes.templates) setTemplates(tempRes.templates);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAction.templateId) return alert('Select an email template');
    
    setCreating(true);
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Trigger_Event: newAction.trigger,
        Action: 'send_email',
        Template_ID: newAction.templateId
      })
    }).then(r => r.json());

    if (res.success) {
      await fetchData();
      setNewAction({ trigger: 'contract_signed', templateId: '' });
    } else {
      alert(res.message || 'Error creating automation. Ensure you ran the Automations SQL script in Supabase.');
    }
    setCreating(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    await fetch('/api/automations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, Is_Active: !current })
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    await fetch(`/api/automations?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  if (loading) return <div className="empty-state">Loading automations...</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem', maxWidth: 900 }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#0f172a', marginBottom: '0.5rem' }}>
        Automations
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '3rem' }}>Set up "If This, Then That" rules to put your studio on autopilot.</p>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={20} color="#f59e0b" /> Active Rules
        </h2>
        
        {automations.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 0', textAlign: 'center' }}>
            <p style={{ color: '#64748b' }}>No automations configured yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {automations.map(auto => (
              <div key={auto.Automation_ID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', background: auto.Is_Active ? '#fff' : '#f8fafc', opacity: auto.Is_Active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#fef3c7', padding: '0.5rem', borderRadius: '0.5rem' }}>
                    <PlayCircle size={20} color="#d97706" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                      When <span style={{ color: '#0d9488' }}>Contract is Signed</span>
                      <ArrowRight size={14} color="#94a3b8" />
                      Send <span style={{ color: '#4f46e5' }}>{auto.EmailTemplates?.Title || 'Template'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={auto.Is_Active} onChange={() => handleToggle(auto.Automation_ID, auto.Is_Active)} style={{ marginRight: 6 }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: auto.Is_Active ? '#059669' : '#64748b' }}>
                      {auto.Is_Active ? 'ON' : 'OFF'}
                    </span>
                  </label>
                  <button onClick={() => handleDelete(auto.Automation_ID)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={20} /> Create New Automation
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 500 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trigger</label>
            <select 
              className="input-field"
              value={newAction.trigger}
              onChange={(e) => setNewAction({...newAction, trigger: e.target.value})}
              disabled
            >
              <option value="contract_signed">When Contract is Signed</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action: Send Email</label>
            <select 
              className="input-field"
              value={newAction.templateId}
              onChange={(e) => setNewAction({...newAction, templateId: e.target.value})}
            >
              <option value="">-- Select Template --</option>
              {templates.map(t => (
                <option key={t.Template_ID} value={t.Template_ID}>{t.Title} (Subject: {t.Subject})</option>
              ))}
            </select>
          </div>

          <button onClick={handleCreate} disabled={creating || !newAction.templateId} className="btn btn-primary" style={{ marginTop: '0.5rem', width: 'auto', alignSelf: 'flex-start' }}>
            {creating ? 'Saving...' : 'Add Automation'}
          </button>
        </div>
      </div>
    </div>
  );
}
