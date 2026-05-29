'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Code, Copy, Check, X, GripVertical, Settings } from 'lucide-react';

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[]; // for select type
}

interface Form {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  theme_color: string;
  submit_text: string;
  success_message: string;
  created_at: string;
}

export default function FormsDashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingForm, setEditingForm] = useState<Partial<Form> | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [embedModalOpen, setEmbedModalOpen] = useState<string | null>(null); // form id

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'https://clover-crm.vercel.app';

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/forms');
      const data = await res.json();
      if (data.success) {
        setForms(data.forms || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadFormToEdit = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${id}`);
      const data = await res.json();
      if (data.success) {
        setEditingForm(data.form);
        setView('edit');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveForm = async () => {
    if (!editingForm?.title) return alert("Title is required");
    setSaving(true);
    try {
      const isNew = !editingForm.id;
      const url = isNew ? '/api/forms' : `/api/forms/${editingForm.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingForm),
      });
      const data = await res.json();
      if (data.success) {
        setView('list');
        fetchForms();
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const deleteForm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form? This will break any embedded iframes.')) return;
    try {
      await fetch(`/api/forms/${id}`, { method: 'DELETE' });
      fetchForms();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyEmbed = (id: string) => {
    const code = `<iframe src="${hostUrl}/embed/form/${id}" width="100%" height="800px" frameborder="0" style="border:none; background:transparent;"></iframe>`;
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const addField = () => {
    if (!editingForm) return;
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
    };
    setEditingForm({ ...editingForm, fields: [...(editingForm.fields || []), newField] });
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    if (!editingForm || !editingForm.fields) return;
    const newFields = [...editingForm.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setEditingForm({ ...editingForm, fields: newFields });
  };

  const removeField = (index: number) => {
    if (!editingForm || !editingForm.fields) return;
    const newFields = [...editingForm.fields];
    newFields.splice(index, 1);
    setEditingForm({ ...editingForm, fields: newFields });
  };

  if (loading && view === 'list') return <div style={{ padding: '2rem' }}>Loading forms...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {view === 'list' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>Embeddable Forms</h1>
              <p style={{ color: 'var(--muted)', margin: 0 }}>Create custom contact forms to embed directly on your website.</p>
            </div>
            <button
              onClick={() => {
                setEditingForm({
                  title: 'New Contact Form',
                  description: 'Please fill out the form below to get in touch.',
                  theme_color: '#0f172a',
                  submit_text: 'Send Message',
                  success_message: 'Thank you! Your message has been received.',
                  fields: [
                    { id: 'name', type: 'text', label: 'Full Name', required: true },
                    { id: 'email', type: 'email', label: 'Email Address', required: true },
                    { id: 'message', type: 'textarea', label: 'How can we help you?', required: true }
                  ]
                });
                setView('edit');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={18} /> Create Form
            </button>
          </div>

          {forms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <Code size={48} color="var(--muted)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No forms yet</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>Build your first contact form and embed it anywhere.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {forms.map(form => (
                <div key={form.id} style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{form.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {form.description || 'No description'}
                  </p>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setEmbedModalOpen(form.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', backgroundColor: 'var(--muted-bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}>
                      <Code size={16} /> Embed
                    </button>
                    <button onClick={() => loadFormToEdit(form.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text)' }}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteForm(form.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', color: '#ef4444' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'edit' && editingForm && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {editingForm.id ? 'Edit Form' : 'Build New Form'}
            </h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setView('list')} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: 'var(--text)' }}>Cancel</button>
              <button onClick={saveForm} disabled={saving} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Saving...' : 'Save Form'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '1.5rem' }}>
            
            {/* Form Settings Left Col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Form Title (Internal & Public)</label>
                <input
                  type="text"
                  value={editingForm.title || ''}
                  onChange={e => setEditingForm({ ...editingForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Description (Public Subtext)</label>
                <textarea
                  value={editingForm.description || ''}
                  onChange={e => setEditingForm({ ...editingForm, description: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent', resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Submit Button Text</label>
                  <input
                    type="text"
                    value={editingForm.submit_text || ''}
                    onChange={e => setEditingForm({ ...editingForm, submit_text: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Button Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={editingForm.theme_color || '#0f172a'}
                      onChange={e => setEditingForm({ ...editingForm, theme_color: e.target.value })}
                      style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Success Message</label>
                <textarea
                  value={editingForm.success_message || ''}
                  onChange={e => setEditingForm({ ...editingForm, success_message: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Field Builder Right Col */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Form Fields</h3>
                <button onClick={addField} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'var(--muted-bg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  <Plus size={14} /> Add Field
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(editingForm.fields || []).map((field, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 8, backgroundColor: 'var(--muted-bg)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={field.label}
                            onChange={e => updateField(idx, { label: e.target.value })}
                            placeholder="Field Label"
                            style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid var(--border)' }}
                          />
                        </div>
                        <div style={{ width: '120px' }}>
                          <select
                            value={field.type}
                            onChange={e => updateField(idx, { type: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid var(--border)' }}
                          >
                            <option value="text">Short Text</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="textarea">Long Text</option>
                            <option value="date">Date</option>
                            <option value="select">Dropdown</option>
                          </select>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e => updateField(idx, { required: e.target.checked })}
                          />
                          Required Field
                        </label>
                        
                        {field.type === 'select' && (
                          <input
                            type="text"
                            placeholder="Options (comma separated)"
                            value={(field.options || []).join(', ')}
                            onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            style={{ padding: '6px', fontSize: '0.875rem', borderRadius: 4, border: '1px solid var(--border)', width: '200px' }}
                          />
                        )}
                      </div>
                    </div>
                    
                    <button onClick={() => removeField(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embed Modal */}
      {embedModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: 12, width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Embed Form</h3>
              <button onClick={() => setEmbedModalOpen(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Copy and paste this snippet into your website builder (WordPress, Squarespace, Wix) using an HTML or Custom Code block.
            </p>
            <div style={{ position: 'relative' }}>
              <pre style={{ backgroundColor: '#1e293b', color: '#e2e8f0', padding: '1rem', borderRadius: 8, overflowX: 'auto', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {`<iframe\n  src="${hostUrl}/embed/form/${embedModalOpen}"\n  width="100%"\n  height="800px"\n  frameborder="0"\n  style="border:none; background:transparent;"\n></iframe>`}
              </pre>
              <button
                onClick={() => handleCopyEmbed(embedModalOpen)}
                style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
              >
                {copiedCode === embedModalOpen ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
