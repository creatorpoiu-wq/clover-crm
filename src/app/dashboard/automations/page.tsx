"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Zap, ArrowRight, PlayCircle, Mail, CheckSquare } from 'lucide-react';

const TRIGGERS: Record<string, string> = {
  contract_signed: "When Contract is Signed",
  stage_proposal_sent: "When Stage is 'Proposal Sent'",
  stage_booked: "When Stage is 'Booked'",
  form_submitted: "When a Public Form is Submitted",
};

const ACTIONS: Record<string, string> = {
  send_email: "Send Email Template",
  create_reminder: "Create To-Do Reminder",
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newAction, setNewAction] = useState({ 
    trigger: 'contract_signed', 
    action: 'send_email',
    templateId: '',
    reminderText: 'Automated Reminder: Follow up with client'
  });

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
    if (newAction.action === 'send_email' && !newAction.templateId) return alert('Select an email template');
    if (newAction.action === 'create_reminder' && !newAction.reminderText) return alert('Enter reminder text');
    
    setCreating(true);

    const payload: any = {
      Trigger_Event: newAction.trigger,
      Action: newAction.action,
    };

    if (newAction.action === 'send_email') {
      payload.Template_ID = newAction.templateId;
    } else if (newAction.action === 'create_reminder') {
      payload.Action_Payload = { reminder_text: newAction.reminderText };
    }

    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      await fetchData();
      setNewAction({ trigger: 'contract_signed', action: 'send_email', templateId: '', reminderText: 'Automated Reminder' });
    } else {
      alert(res.error || res.message || 'Error creating automation.');
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
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 500, color: '#0f172a', marginBottom: '0.5rem' }}>
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
                      <span style={{ color: '#0d9488' }}>{TRIGGERS[auto.Trigger_Event] || auto.Trigger_Event}</span>
                      <ArrowRight size={14} color="#94a3b8" />
                      {auto.Action === 'send_email' ? (
                        <>Send <span style={{ color: '#4f46e5' }}>{auto.EmailTemplates?.Title || 'Template'}</span></>
                      ) : (
                        <>Create <span style={{ color: '#ea580c' }}>Task: {auto.Action_Payload?.reminder_text || 'Reminder'}</span></>
                      )}
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
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trigger (When this happens...)</label>
            <select 
              className="input-field"
              value={newAction.trigger}
              onChange={(e) => setNewAction({...newAction, trigger: e.target.value})}
            >
              {Object.entries(TRIGGERS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action (Do this...)</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setNewAction({...newAction, action: 'send_email'})}
                className="btn"
                style={{ flex: 1, padding: '0.75rem', border: newAction.action === 'send_email' ? '2px solid var(--primary)' : '1px solid var(--border)', background: newAction.action === 'send_email' ? 'rgba(77, 166, 133, 0.1)' : 'transparent', color: newAction.action === 'send_email' ? 'var(--primary)' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}
              >
                <Mail size={16} /> Send Email
              </button>
              <button 
                onClick={() => setNewAction({...newAction, action: 'create_reminder'})}
                className="btn"
                style={{ flex: 1, padding: '0.75rem', border: newAction.action === 'create_reminder' ? '2px solid var(--status-orange-fg)' : '1px solid var(--border)', background: newAction.action === 'create_reminder' ? 'rgba(234, 88, 12, 0.1)' : 'transparent', color: newAction.action === 'create_reminder' ? 'var(--status-orange-fg)' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}
              >
                <CheckSquare size={16} /> Create Task
              </button>
            </div>
          </div>

          {newAction.action === 'send_email' ? (
            <div className="animate-fade-in">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Email Template</label>
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
          ) : (
            <div className="animate-fade-in">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reminder / Task Note</label>
              <input 
                type="text"
                className="input-field"
                value={newAction.reminderText}
                onChange={(e) => setNewAction({...newAction, reminderText: e.target.value})}
                placeholder="e.g. Call client to say hi"
              />
            </div>
          )}

          <button onClick={handleCreate} disabled={creating} className="btn btn-primary" style={{ marginTop: '0.5rem', width: 'auto', alignSelf: 'flex-start' }}>
            {creating ? 'Saving...' : 'Add Automation'}
          </button>
        </div>
      </div>
    </div>
  );
}
