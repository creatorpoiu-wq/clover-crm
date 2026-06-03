'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Code, Copy, Check, X, GripVertical, Settings, Type, AlignLeft, ChevronDown, Hash, CheckSquare, CircleDot, User, Mail, Phone, Calendar, Clock, MapPin, Link2 } from 'lucide-react';

interface FormField {
  id: string;
  type: string;
  label: string;
  description?: string;
  required: boolean;
  width?: 'full' | 'half';
  options?: string[]; // for select/radio/checkbox
  // Style properties for the _style_config special field
  inputBgColor?: string;
  fieldBorderRadius?: string;
  buttonBorderRadius?: string;
  scheduleLink?: string;
  scheduleButtonText?: string;
}

interface Form {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  theme_color: string;
  submit_text: string;
  success_message: string;
  auto_reply_message?: string;
  questionnaire_link?: string;
  questionnaire_button_text?: string;
  created_at: string;
}

const FIELD_TYPES = [
  { type: 'text', label: 'Single Line Text', icon: Type },
  { type: 'textarea', label: 'Paragraph Text', icon: AlignLeft },
  { type: 'select', label: 'Drop Down', icon: ChevronDown },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
  { type: 'radio', label: 'Radio Buttons', icon: CircleDot },
  { type: 'name', label: 'Name', icon: User },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'time', label: 'Time', icon: Clock },
  { type: 'address', label: 'Address', icon: MapPin },
  { type: 'website', label: 'Website', icon: Link2 },
];

export default function FormsDashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingForm, setEditingForm] = useState<Partial<Form> | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [embedModalOpen, setEmbedModalOpen] = useState<string | null>(null);
  
  // UI Overhaul State
  const [activeTab, setActiveTab] = useState<'add' | 'settings' | 'form'>('add');
  const [selectedFieldIdx, setSelectedFieldIdx] = useState<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

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
        setActiveTab('add');
        setSelectedFieldIdx(null);
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

  // ----------------------------------------------------
  // Form Builder Logic
  // ----------------------------------------------------

  const createField = (type: string): FormField => {
    const defaultLabel = FIELD_TYPES.find(f => f.type === type)?.label || 'New Field';
    return {
      id: `field_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      type,
      label: defaultLabel,
      required: false,
      width: 'full',
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined
    };
  };

  const handleSidebarClickAdd = (type: string) => {
    if (!editingForm) return;
    const newField = createField(type);
    setEditingForm({ ...editingForm, fields: [...(editingForm.fields || []), newField] });
    setSelectedFieldIdx((editingForm.fields || []).length);
    setActiveTab('settings');
  };

  const updateSelectedField = (updates: Partial<FormField>) => {
    if (!editingForm || !editingForm.fields || selectedFieldIdx === null) return;
    const newFields = [...editingForm.fields];
    newFields[selectedFieldIdx] = { ...newFields[selectedFieldIdx], ...updates };
    setEditingForm({ ...editingForm, fields: newFields });
  };

  const removeField = (index: number) => {
    if (!editingForm || !editingForm.fields) return;
    const newFields = [...editingForm.fields];
    newFields.splice(index, 1);
    setEditingForm({ ...editingForm, fields: newFields });
    if (selectedFieldIdx === index) {
      setSelectedFieldIdx(null);
      setActiveTab('add');
    } else if (selectedFieldIdx !== null && selectedFieldIdx > index) {
      setSelectedFieldIdx(selectedFieldIdx - 1);
    }
  };

  // Drag and Drop implementation
  const handleDragStartSidebar = (e: React.DragEvent, type: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify({ action: 'add', type }));
  };

  const handleDragStartCanvas = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ action: 'move', index }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropCanvas = (e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();
    if (!editingForm) return;
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const newFields = [...(editingForm.fields || [])];

      if (data.action === 'add') {
        const newField = createField(data.type);
        if (dropIndex !== undefined) {
          newFields.splice(dropIndex, 0, newField);
          setSelectedFieldIdx(dropIndex);
        } else {
          newFields.push(newField);
          setSelectedFieldIdx(newFields.length - 1);
        }
        setEditingForm({ ...editingForm, fields: newFields });
        setActiveTab('settings');
      } else if (data.action === 'move') {
        if (data.index === dropIndex || dropIndex === undefined) return;
        const draggedItem = newFields[data.index];
        newFields.splice(data.index, 1);
        newFields.splice(dropIndex, 0, draggedItem);
        setEditingForm({ ...editingForm, fields: newFields });
        
        // Update selection index if moving the selected item
        if (selectedFieldIdx === data.index) {
          setSelectedFieldIdx(dropIndex);
        }
      }
    } catch (err) {
      console.error("Drop error", err);
    }
    setDraggedIdx(null);
  };

  if (loading && view === 'list') return <div style={{ padding: '2rem' }}>Loading forms...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: view === 'edit' ? '1400px' : '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
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
                setActiveTab('add');
                setSelectedFieldIdx(null);
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

      {/* EDIT VIEW */}
      {view === 'edit' && editingForm && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
          
          {/* Header */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card-bg)', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {editingForm.id ? 'Edit Form' : 'Build New Form'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setView('list')} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: 'var(--text)' }}>Cancel</button>
              <button onClick={saveForm} disabled={saving} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Saving...' : 'Save Form'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            
            {/* LEFT COLUMN: LIVE CANVAS */}
            <div 
              style={{ flex: 1, backgroundColor: 'var(--muted-bg)', padding: '2rem', overflowY: 'auto' }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropCanvas(e)}
            >
              <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '2.5rem' }}>
                
                {/* Form Header (Click to edit Form Settings) */}
                <div 
                  onClick={() => setActiveTab('form')}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '1rem', 
                    margin: '-1rem -1rem 1.5rem -1rem', 
                    borderRadius: 8,
                    border: activeTab === 'form' ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'border 0.2s'
                  }}
                >
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem', marginTop: 0 }}>
                    {editingForm.title || 'Untitled Form'}
                  </h2>
                  {editingForm.description && (
                    <p style={{ color: '#64748b', margin: 0, lineHeight: 1.5 }}>{editingForm.description}</p>
                  )}
                </div>

                {/* Fields Canvas */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', minHeight: '100px', alignItems: 'flex-start' }}>
                  {(editingForm.fields || []).filter(f => f.type !== '_style_config').map((field, idx) => {
                    const isSelected = selectedFieldIdx === idx;
                    const isHalf = field.width === 'half';
                    const styleConfig = editingForm.fields?.find(f => f.type === '_style_config') || {
                      inputBgColor: '#ffffff',
                      fieldBorderRadius: '0.5rem',
                      buttonBorderRadius: '0.5rem'
                    };
                    return (
                      <div 
                        key={field.id}
                        draggable
                        onDragStart={(e) => handleDragStartCanvas(e, idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => { e.stopPropagation(); handleDropCanvas(e, idx); }}
                        onDragEnd={() => setDraggedIdx(null)}
                        onClick={(e) => { e.stopPropagation(); setSelectedFieldIdx(idx); setActiveTab('settings'); }}
                        style={{
                          position: 'relative',
                          padding: '1rem',
                          borderRadius: 8,
                          border: isSelected ? '2px solid var(--primary)' : '1px solid transparent',
                          backgroundColor: isSelected ? '#f8fafc' : 'transparent',
                          cursor: 'pointer',
                          opacity: draggedIdx === idx ? 0.5 : 1,
                          transition: 'all 0.2s',
                          flex: isHalf ? '1 1 calc(50% - 0.5rem)' : '1 1 100%',
                          minWidth: isHalf ? '200px' : '100%'
                        }}
                      >
                        {/* Drag Handle Indicator */}
                        <div style={{ position: 'absolute', top: '50%', left: '-10px', transform: 'translateY(-50%)', color: '#cbd5e1', cursor: 'grab', opacity: isSelected ? 1 : 0, transition: 'opacity 0.2s' }}>
                          <GripVertical size={20} />
                        </div>
                        
                        {/* Delete Button */}
                        {isSelected && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeField(idx); }}
                            style={{ position: 'absolute', top: -10, right: -10, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}

                        {/* Field Render Preview */}
                        <div style={{ pointerEvents: 'none' }}> {/* Prevent interaction with preview inputs */}
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                            {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                          </label>
                          {field.description && (
                            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>{field.description}</p>
                          )}

                          {/* Dummy UI for preview */}
                          {field.type === 'textarea' ? (
                            <div style={{ width: '100%', height: '80px', borderRadius: styleConfig.fieldBorderRadius || '0.5rem', border: '1px solid #cbd5e1', backgroundColor: styleConfig.inputBgColor || '#ffffff' }} />
                          ) : field.type === 'select' ? (
                            <div style={{ width: '100%', padding: '0.75rem', borderRadius: styleConfig.fieldBorderRadius || '0.5rem', border: '1px solid #cbd5e1', backgroundColor: styleConfig.inputBgColor || '#ffffff', color: '#94a3b8', fontSize: '0.875rem' }}>Select an option...</div>
                          ) : field.type === 'radio' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {(field.options || []).map((opt, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>
                                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #cbd5e1' }} />
                                  {opt}
                                </div>
                              ))}
                            </div>
                          ) : field.type === 'checkbox' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {(field.options || []).map((opt, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>
                                  <div style={{ width: 14, height: 14, borderRadius: 4, border: '1px solid #cbd5e1' }} />
                                  {opt}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ width: '100%', height: '42px', borderRadius: styleConfig.fieldBorderRadius || '0.5rem', border: '1px solid #cbd5e1', backgroundColor: styleConfig.inputBgColor || '#ffffff' }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty State */}
                  {(editingForm.fields || []).length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 8, color: 'var(--muted)' }}>
                      Drag and drop fields here
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: (editingForm.fields?.find(f => f.type === '_style_config')?.buttonBorderRadius) || '0.5rem',
                      backgroundColor: editingForm.theme_color || '#0f172a',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '1rem',
                      border: 'none',
                      opacity: 0.9
                    }}
                  >
                    {editingForm.submit_text || 'Submit'}
                  </button>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: SIDEBAR */}
            <div style={{ width: '360px', borderLeft: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', display: 'flex', flexDirection: 'column' }}>
              
              {/* Sidebar Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                <button 
                  onClick={() => setActiveTab('add')}
                  style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'add' ? '2px solid var(--primary)' : '2px solid transparent', fontWeight: 600, color: activeTab === 'add' ? 'var(--primary)' : 'var(--muted)', cursor: 'pointer' }}
                >
                  Add Fields
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'settings' ? '2px solid var(--primary)' : '2px solid transparent', fontWeight: 600, color: activeTab === 'settings' ? 'var(--primary)' : 'var(--muted)', cursor: 'pointer' }}
                >
                  Field Settings
                </button>
                <button 
                  onClick={() => setActiveTab('form')}
                  style={{ padding: '1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'form' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'form' ? 'var(--primary)' : 'var(--muted)', cursor: 'pointer' }}
                  title="Form Settings"
                >
                  <Settings size={20} />
                </button>
              </div>

              {/* Sidebar Content Area */}
              <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                
                {/* TAB: ADD FIELDS */}
                {activeTab === 'add' && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>Drag a field to the left to add it, or click to append.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {FIELD_TYPES.map((field) => (
                        <div
                          key={field.type}
                          draggable
                          onDragStart={(e) => handleDragStartSidebar(e, field.type)}
                          onClick={() => handleSidebarClickAdd(field.type)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '1.25rem 0.5rem',
                            backgroundColor: 'var(--muted-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            cursor: 'grab',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <field.icon size={24} color="#475569" strokeWidth={1.5} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', textAlign: 'center' }}>{field.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB: FIELD SETTINGS */}
                {activeTab === 'settings' && (
                  <div>
                    {selectedFieldIdx === null || !editingForm.fields || !editingForm.fields[selectedFieldIdx] ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                        <p>Select a field on the left to edit its settings.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Field Label</label>
                          <input
                            type="text"
                            value={editingForm.fields[selectedFieldIdx].label}
                            onChange={e => updateSelectedField({ label: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Field Description</label>
                          <input
                            type="text"
                            placeholder="Optional subtext..."
                            value={editingForm.fields[selectedFieldIdx].description || ''}
                            onChange={e => updateSelectedField({ description: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
                          />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editingForm.fields[selectedFieldIdx].required}
                            onChange={e => updateSelectedField({ required: e.target.checked })}
                            style={{ width: 16, height: 16 }}
                          />
                          Required Field
                        </label>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Field Width</label>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => updateSelectedField({ width: 'full' })}
                              style={{ flex: 1, padding: '8px', border: editingForm.fields[selectedFieldIdx].width !== 'half' ? '2px solid var(--primary)' : '1px solid var(--border)', backgroundColor: 'transparent', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                            >
                              Full Width
                            </button>
                            <button 
                              onClick={() => updateSelectedField({ width: 'half' })}
                              style={{ flex: 1, padding: '8px', border: editingForm.fields[selectedFieldIdx].width === 'half' ? '2px solid var(--primary)' : '1px solid var(--border)', backgroundColor: 'transparent', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                            >
                              Half Width
                            </button>
                          </div>
                        </div>

                        {['select', 'radio', 'checkbox'].includes(editingForm.fields[selectedFieldIdx].type) && (
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Options (Choices)</label>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Enter options separated by commas.</p>
                            <textarea
                              rows={4}
                              value={(editingForm.fields[selectedFieldIdx].options || []).join(', ')}
                              onChange={e => updateSelectedField({ options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                              style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent', resize: 'vertical' }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: FORM SETTINGS */}
                {activeTab === 'form' && (() => {
                  const styleConfigIndex = (editingForm.fields || []).findIndex(f => f.type === '_style_config');
                  const styleConfig = styleConfigIndex >= 0 ? editingForm.fields![styleConfigIndex] : {
                    id: 'style_config',
                    type: '_style_config',
                    label: 'Style Config',
                    required: false,
                    inputBgColor: '#ffffff',
                    fieldBorderRadius: '0.5rem',
                    buttonBorderRadius: '0.5rem',
                    scheduleLink: '',
                    scheduleButtonText: 'Schedule a Call'
                  };
                  
                  const updateStyleConfig = (updates: any) => {
                    const newFields = [...(editingForm.fields || [])];
                    if (styleConfigIndex >= 0) {
                      newFields[styleConfigIndex] = { ...newFields[styleConfigIndex], ...updates };
                    } else {
                      newFields.push({ ...styleConfig, ...updates });
                    }
                    setEditingForm({ ...editingForm, fields: newFields });
                  };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Form Title</label>
                      <input
                        type="text"
                        value={editingForm.title || ''}
                        onChange={e => setEditingForm({ ...editingForm, title: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Form Description</label>
                      <textarea
                        value={editingForm.description || ''}
                        onChange={e => setEditingForm({ ...editingForm, description: e.target.value })}
                        rows={3}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent', resize: 'vertical' }}
                      />
                    </div>
                    
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Submit Button Text</label>
                      <input
                        type="text"
                        value={editingForm.submit_text || ''}
                        onChange={e => setEditingForm({ ...editingForm, submit_text: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent', marginBottom: '1rem' }}
                      />

                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Theme Color</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
                        <input
                          type="color"
                          value={editingForm.theme_color || '#0f172a'}
                          onChange={e => setEditingForm({ ...editingForm, theme_color: e.target.value })}
                          style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{editingForm.theme_color || '#0f172a'}</span>
                      </div>
                      
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Input Field Background</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
                        <input
                          type="color"
                          value={styleConfig.inputBgColor || '#ffffff'}
                          onChange={e => updateStyleConfig({ inputBgColor: e.target.value })}
                          style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{styleConfig.inputBgColor || '#ffffff'}</span>
                      </div>

                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Field Border Radius</label>
                      <select
                        value={styleConfig.fieldBorderRadius || '0.5rem'}
                        onChange={e => updateStyleConfig({ fieldBorderRadius: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent', marginBottom: '1.5rem' }}
                      >
                        <option value="0">Square</option>
                        <option value="0.25rem">Small (4px)</option>
                        <option value="0.5rem">Medium (8px)</option>
                        <option value="0.75rem">Large (12px)</option>
                        <option value="9999px">Pill</option>
                      </select>

                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Button Shape (Border Radius)</label>
                      <select
                        value={styleConfig.buttonBorderRadius || '0.5rem'}
                        onChange={e => updateStyleConfig({ buttonBorderRadius: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
                      >
                        <option value="0">Square</option>
                        <option value="0.25rem">Small (4px)</option>
                        <option value="0.5rem">Medium (8px)</option>
                        <option value="0.75rem">Large (12px)</option>
                        <option value="9999px">Pill</option>
                      </select>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Success Message</label>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Shown after submission.</p>
                      <textarea
                        value={editingForm.success_message || ''}
                        onChange={e => setEditingForm({ ...editingForm, success_message: e.target.value })}
                        rows={3}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Auto-Reply Email Message</label>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Sent instantly to the client after they submit the form. If left blank, a generic thank you message is sent.</p>
                      <textarea
                        value={editingForm.auto_reply_message || ''}
                        onChange={e => setEditingForm({ ...editingForm, auto_reply_message: e.target.value })}
                        rows={4}
                        placeholder="e.g., Thanks for reaching out! We typically respond within 24 hours..."
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Intake Questionnaire Link (Optional)</label>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Include a button in the auto-reply email linking to another form or questionnaire.</p>
                      <input
                        type="url"
                        value={editingForm.questionnaire_link || ''}
                        onChange={e => setEditingForm({ ...editingForm, questionnaire_link: e.target.value })}
                        placeholder="https://..."
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent', marginBottom: '1rem' }}
                      />
                      
                      {editingForm.questionnaire_link && (
                        <>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Questionnaire Button Text</label>
                          <input
                            type="text"
                            value={editingForm.questionnaire_button_text || ''}
                            onChange={e => setEditingForm({ ...editingForm, questionnaire_button_text: e.target.value })}
                            placeholder="Complete Intake Questionnaire"
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
                          />
                        </>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Schedule Call Link (Optional)</label>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Include a button in the auto-reply email linking to your public booking page.</p>
                      <input
                        type="url"
                        value={styleConfig.scheduleLink || ''}
                        onChange={e => updateStyleConfig({ scheduleLink: e.target.value })}
                        placeholder="https://..."
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent', marginBottom: '1rem' }}
                      />
                      
                      {styleConfig.scheduleLink && (
                        <>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Schedule Button Text</label>
                          <input
                            type="text"
                            value={styleConfig.scheduleButtonText || ''}
                            onChange={e => updateStyleConfig({ scheduleButtonText: e.target.value })}
                            placeholder="Schedule a Call"
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  );
                })()}
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
