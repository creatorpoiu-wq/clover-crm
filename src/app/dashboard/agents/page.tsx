"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Bot, Save, X, Edit, Power, PowerOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ Name: '', Role: '', System_Instructions: '', Is_Active: true });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/agents').then(r => r.json());
      if (res.success && res.agents) setAgents(res.agents);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.Name || !form.Role || !form.System_Instructions) {
      return alert("Please fill out all fields.");
    }
    
    const method = editingId ? 'PUT' : 'POST';
    const payload = editingId ? { Agent_ID: editingId, ...form } : form;

    const res = await fetch('/api/agents', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      setEditingId(null);
      setForm({ Name: '', Role: '', System_Instructions: '', Is_Active: true });
      fetchData();
    } else {
      alert(res.error || 'Error saving agent');
    }
  };

  const handleEdit = (agent: any) => {
    setEditingId(agent.Agent_ID);
    setForm({
      Name: agent.Name,
      Role: agent.Role,
      System_Instructions: agent.System_Instructions,
      Is_Active: agent.Is_Active
    });
  };

  const handleToggle = async (agent: any) => {
    await fetch('/api/agents', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...agent, Is_Active: !agent.Is_Active })
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    await fetch(`/api/agents?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  if (loading) return <div className="p-8">Loading agents...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title">AI Team Agents</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Configure the autonomous personas that interact with your clients.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setForm({ Name: '', Role: '', System_Instructions: '', Is_Active: true }); }} 
          className="btn btn-primary" style={{ width: 'auto' }}
        >
          <Plus size={16} /> New Agent
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Editor Form */}
        <AnimatePresence>
          {(editingId !== null || (form.Name === '' && form.Role === '' && form.System_Instructions === '' && agents.length === 0) || form.Name !== '' || form.Role !== '') && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-panel" style={{ padding: "2rem", overflow: 'hidden' }}
            >
              <h2 className="text-xl font-bold mb-6 text-[var(--foreground)]" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot className="text-[var(--primary)]" />
                {editingId ? "Edit Agent Persona" : "Create Agent Persona"}
              </h2>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="block text-sm font-bold mb-2 text-[var(--muted)] uppercase tracking-wider">Agent Name</label>
                  <input 
                    type="text" 
                    value={form.Name} 
                    onChange={(e) => setForm({...form, Name: e.target.value})}
                    className="input-field w-full"
                    placeholder="e.g. Sarah"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="block text-sm font-bold mb-2 text-[var(--muted)] uppercase tracking-wider">Internal Role</label>
                  <input 
                    type="text" 
                    value={form.Role} 
                    onChange={(e) => setForm({...form, Role: e.target.value})}
                    className="input-field w-full"
                    placeholder="e.g. Onboarding Specialist"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="block text-sm font-bold mb-2 text-[var(--muted)] uppercase tracking-wider">System Instructions & Persona Guidelines</label>
                <textarea 
                  value={form.System_Instructions} 
                  onChange={(e) => setForm({...form, System_Instructions: e.target.value})}
                  className="input-field w-full"
                  rows={4}
                  placeholder="You are Sarah, the Onboarding Specialist. Your tone is warm, enthusiastic, and welcoming. You focus on building rapport with new leads..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleSave} className="btn btn-primary" style={{ width: 'auto' }}>
                  <Save size={16} /> Save Agent
                </button>
                {editingId && (
                  <button onClick={() => { setEditingId(null); setForm({ Name: '', Role: '', System_Instructions: '', Is_Active: true }); }} className="btn" style={{ width: 'auto', background: 'var(--muted-bg)' }}>
                    <X size={16} /> Cancel
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agents List */}
        {agents.map(agent => (
          <div key={agent.Agent_ID} className="glass-panel" style={{ padding: "1.5rem", display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', opacity: agent.Is_Active ? 1 : 0.6 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Bot size={20} color={agent.Is_Active ? "var(--primary)" : "var(--muted)"} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{agent.Name}</h3>
                <span className="badge" style={{ backgroundColor: 'var(--muted-bg)', color: 'var(--foreground)' }}>{agent.Role}</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', maxWidth: '800px', margin: 0, whiteSpace: 'pre-wrap' }}>
                {agent.System_Instructions}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => handleToggle(agent)} className="btn" style={{ width: 'auto', padding: '0.5rem', background: agent.Is_Active ? 'rgba(16, 185, 129, 0.1)' : 'var(--muted-bg)', color: agent.Is_Active ? '#10b981' : 'var(--muted)' }} title={agent.Is_Active ? "Deactivate" : "Activate"}>
                {agent.Is_Active ? <Power size={16} /> : <PowerOff size={16} />}
              </button>
              <button onClick={() => handleEdit(agent)} className="btn" style={{ width: 'auto', padding: '0.5rem', background: 'var(--status-blue)', color: 'var(--status-blue-fg)' }} title="Edit">
                <Edit size={16} />
              </button>
              <button onClick={() => handleDelete(agent.Agent_ID)} className="btn" style={{ width: 'auto', padding: '0.5rem', background: 'var(--status-red)', color: 'var(--status-red-fg)' }} title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        
        {agents.length === 0 && (
           <div className="empty-state" style={{ textAlign: "center", padding: "4rem 0" }}>
             <Bot size={48} color="var(--border)" style={{ margin: '0 auto 1rem auto' }} />
             <p style={{ color: "var(--muted)" }}>No AI Agents configured.</p>
           </div>
        )}
      </div>
    </div>
  );
}
