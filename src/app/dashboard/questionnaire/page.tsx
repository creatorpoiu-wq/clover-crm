'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Settings, AlignLeft, List, Calendar, Type, CheckSquare, FileText, Send } from 'lucide-react';

interface Field {
  Field_ID: number;
  Template_ID: number;
  Label: string;
  Type: string;
  Options: string;
  Is_Required: number;
  Order_Index: number;
}

interface QTemplate {
  Template_ID: number;
  Name: string;
}

export default function QuestionnaireBuilder() {
  const [qTemplates, setQTemplates] = useState<QTemplate[]>([]);
  const [selectedQTemplateId, setSelectedQTemplateId] = useState<number | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  
  const [cTemplates, setCTemplates] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [fieldFormData, setFieldFormData] = useState({ id: 0, label: '', fieldType: 'text', options: '', isRequired: true, orderIndex: 0 });

  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Send Proposal State
  const [contacts, setContacts] = useState<any[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendFormData, setSendFormData] = useState({ contactId: '', contractId: '', questionnaireId: '' });
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedQTemplateId) {
      fetchFields(selectedQTemplateId);
    } else {
      setFields([]);
    }
  }, [selectedQTemplateId]);

  const fetchInitialData = async () => {
    setLoading(true);
    const [qRes, tRes, sRes, cRes] = await Promise.all([
      fetch('/api/questionnaire?type=templates'),
      fetch('/api/contract-templates'),
      fetch('/api/questionnaire?type=settings'),
      fetch('/api/contacts')
    ]);
    const qData = await qRes.json();
    const tData = await tRes.json();
    const sData = await sRes.json();
    const cData = await cRes.json();
    
    if (qData.success) {
      setQTemplates(qData.templates);
      if (qData.templates.length > 0 && !selectedQTemplateId) {
        setSelectedQTemplateId(qData.templates[0].Template_ID);
      }
    }
    if (tData.success) setCTemplates(tData.templates);
    if (sData.success) {
      setSettings(sData.settings);
      setSendFormData(prev => ({ 
        ...prev, 
        contractId: sData.settings?.Contract_Template_ID?.toString() || '',
        questionnaireId: sData.settings?.Questionnaire_Template_ID?.toString() || ''
      }));
    }
    if (cData.success) setContacts(cData.contacts);
    
    setLoading(false);
  };

  const fetchFields = async (templateId: number) => {
    const res = await fetch(`/api/questionnaire?type=fields&templateId=${templateId}`);
    const data = await res.json();
    if (data.success) setFields(data.fields);
  };

  const createQTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    const res = await fetch('/api/questionnaire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'template', name: templateName })
    });
    const data = await res.json();
    if (data.success) {
      setShowTemplateForm(false);
      setTemplateName('');
      fetchInitialData();
      setSelectedQTemplateId(data.id);
    }
  };

  const deleteQTemplate = async () => {
    if (!selectedQTemplateId) return;
    
    if (confirmDeleteId !== 'qtmpl') {
      setConfirmDeleteId('qtmpl');
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setConfirmDeleteId(null);
    
    const res = await fetch(`/api/questionnaire?type=template&id=${selectedQTemplateId}`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedQTemplateId(null);
      fetchInitialData();
    }
  };

  const saveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQTemplateId) return;
    
    const isEdit = fieldFormData.id !== 0;
    const res = await fetch('/api/questionnaire', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'field', templateId: selectedQTemplateId, ...fieldFormData })
    });
    if (res.ok) {
      setShowFieldForm(false);
      fetchFields(selectedQTemplateId);
    }
  };

  const deleteField = async (id: number) => {
    const key = `field-${id}`;
    if (confirmDeleteId !== key) {
      setConfirmDeleteId(key);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setConfirmDeleteId(null);
    const res = await fetch(`/api/questionnaire?type=field&id=${id}`, { method: 'DELETE' });
    if (res.ok && selectedQTemplateId) fetchFields(selectedQTemplateId);
  };

  const editField = (f: Field) => {
    setFieldFormData({ id: f.Field_ID, label: f.Label, fieldType: f.Type, options: f.Options, isRequired: f.Is_Required === 1, orderIndex: f.Order_Index });
    setShowFieldForm(true);
  };

  const updateSetting = async (key: 'contractTemplateId' | 'questionnaireTemplateId', val: number | null) => {
    const res = await fetch('/api/questionnaire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'settings', [key]: val })
    });
    if (res.ok) fetchInitialData(); // Refresh settings state
  };

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendFormData.contactId || !sendFormData.contractId || !sendFormData.questionnaireId) {
      alert("Please select a Contact, Contract, and Questionnaire.");
      return;
    }

    setIsSending(true);
    const res = await fetch('/api/send-proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sendFormData)
    });

    setIsSending(false);
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      setShowSendModal(false);
      setToast({ message: 'Proposal sent successfully!', type: 'success' });
      setTimeout(() => setToast(null), 4000);
    } else {
      setToast({ message: `Failed to send proposal: ${data.error || 'Unknown error occurred.'}`, type: 'error' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'text': return <Type size={16} />;
      case 'textarea': return <AlignLeft size={16} />;
      case 'select': return <List size={16} />;
      case 'date': return <Calendar size={16} />;
      case 'checkbox': return <CheckSquare size={16} />;
    }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 16 };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Questionnaire</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Configure the active questionnaire and contract for your public booking funnel.</p>
        </div>
        <button 
          onClick={() => setShowSendModal(true)}
          style={{ background: '#111827', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          <Send size={18} /> Send Proposal
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</div>
      ) : (
        <>
          {/* Active Settings */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings size={18} /> Public Funnel Configuration
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={labelStyle}>Default Questionnaire (Step 2)</label>
                <select 
                  value={settings?.Questionnaire_Template_ID || ''} 
                  onChange={e => updateSetting('questionnaireTemplateId', e.target.value ? parseInt(e.target.value) : null)}
                  style={{ ...inputStyle, marginBottom: 0 }}
                >
                  <option value="">-- No Questionnaire Selected --</option>
                  {qTemplates.map(t => (
                    <option key={t.Template_ID} value={t.Template_ID}>{t.Name}</option>
                  ))}
                </select>
                {!settings?.Questionnaire_Template_ID && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4, fontWeight: 600 }}>Required for Step 2</p>}
              </div>
              
              <div>
                <label style={labelStyle}>Default Contract (Step 3)</label>
                <select 
                  value={settings?.Contract_Template_ID || ''} 
                  onChange={e => updateSetting('contractTemplateId', e.target.value ? parseInt(e.target.value) : null)}
                  style={{ ...inputStyle, marginBottom: 0 }}
                >
                  <option value="">-- No Contract Selected --</option>
                  {cTemplates.map(t => (
                    <option key={t.Template_ID} value={t.Template_ID}>{t.Name}</option>
                  ))}
                </select>
                {!settings?.Contract_Template_ID && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4, fontWeight: 600 }}>Required for Step 3</p>}
              </div>
            </div>
          </div>

          {/* Questionnaire Builder Manager */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <FileText size={20} color="#0d9488" />
                <select 
                  value={selectedQTemplateId || ''} 
                  onChange={e => setSelectedQTemplateId(parseInt(e.target.value))}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 15, fontWeight: 700 }}
                >
                  {qTemplates.length === 0 && <option value="">No templates found</option>}
                  {qTemplates.map(t => <option key={t.Template_ID} value={t.Template_ID}>{t.Name}</option>)}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowTemplateForm(true)} style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} /> New Template
                </button>
                {selectedQTemplateId && (
                  <button 
                    onClick={deleteQTemplate} 
                    style={{ 
                      background: confirmDeleteId === 'qtmpl' ? '#dc2626' : '#fee2e2', 
                      color: confirmDeleteId === 'qtmpl' ? '#fff' : '#ef4444', 
                      border: 'none', 
                      padding: '8px 12px', 
                      borderRadius: 6, 
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {confirmDeleteId === 'qtmpl' ? "Confirm?" : <Trash2 size={16} />}
                  </button>
                )}
              </div>
            </div>

            {!selectedQTemplateId ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>
                Please create or select a Questionnaire Template to manage its fields.
              </div>
            ) : (
              <div style={{ padding: 32, background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#111827' }}>Questions</h3>
                  <button 
                    onClick={() => { setFieldFormData({ id: 0, label: '', fieldType: 'text', options: '', isRequired: true, orderIndex: fields.length }); setShowFieldForm(true); }} 
                    style={{ background: '#fff', color: '#111827', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                  >
                    <Plus size={16} /> Add Question
                  </button>
                </div>
                
                {fields.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', border: '2px dashed #d1d5db', borderRadius: 12, background: '#fff' }}>
                    No questions added yet. Start building your form!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {fields.map((f, i) => (
                      <div key={f.Field_ID} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                          <div style={{ color: '#9ca3af', fontWeight: 800, width: 24, paddingTop: 2 }}>{i+1}.</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, color: '#111827', fontSize: 15, marginBottom: 4 }}>
                              {f.Label} {f.Is_Required === 1 && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                              {getIcon(f.Type)}
                              {f.Type === 'select' ? `Dropdown (${f.Options.split(',').length} options)` : f.Type === 'checkbox' ? 'Checkbox' : f.Type === 'textarea' ? 'Paragraph' : f.Type}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, paddingLeft: 16 }}>
                          <button onClick={() => editField(f)} style={{ background: '#f3f4f6', border: 'none', color: '#4b5563', padding: 8, borderRadius: 6, cursor: 'pointer', transition: 'background 0.2s' }}><Edit3 size={16} /></button>
                          <button 
                            onClick={() => deleteField(f.Field_ID)} 
                            style={{ 
                              background: confirmDeleteId === `field-${f.Field_ID}` ? '#dc2626' : '#fee2e2', 
                              border: 'none', 
                              color: confirmDeleteId === `field-${f.Field_ID}` ? '#fff' : '#ef4444', 
                              padding: confirmDeleteId === `field-${f.Field_ID}` ? '6px 10px' : '8px', 
                              borderRadius: 6, 
                              cursor: 'pointer', 
                              transition: 'background 0.2s',
                              fontWeight: 700,
                              fontSize: 12
                            }}
                          >
                            {confirmDeleteId === `field-${f.Field_ID}` ? "Confirm?" : <Trash2 size={16} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Template Modal */}
      {showTemplateForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 400, borderRadius: 12, padding: 28, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 20px', color: '#111827' }}>Create New Template</h2>
            <form onSubmit={createQTemplate}>
              <label style={labelStyle}>Template Name</label>
              <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g., Wedding Form" style={inputStyle} required autoFocus />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setShowTemplateForm(false)} style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#0d9488', border: 'none', borderRadius: 8, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Create Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showFieldForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 450, borderRadius: 16, padding: 32, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 24px', color: '#111827' }}>{fieldFormData.id ? 'Edit Question' : 'New Question'}</h2>
            <form onSubmit={saveField}>
              <label style={labelStyle}>Question Text</label>
              <input value={fieldFormData.label} onChange={e => setFieldFormData(p => ({ ...p, label: e.target.value }))} placeholder="e.g. What is your preferred photography style?" style={inputStyle} required />
              
              <label style={labelStyle}>Answer Type</label>
              <select value={fieldFormData.fieldType} onChange={e => setFieldFormData(p => ({ ...p, fieldType: e.target.value }))} style={inputStyle}>
                <option value="text">Short Answer</option>
                <option value="textarea">Paragraph</option>
                <option value="email">Email Address</option>
                <option value="tel">Phone Number</option>
                <option value="date">Date Picker</option>
                <option value="select">Dropdown Menu</option>
                <option value="checkbox">Checkbox (Yes/No)</option>
              </select>

              {fieldFormData.fieldType === 'select' && (
                <>
                  <label style={labelStyle}>Options (comma separated)</label>
                  <input value={fieldFormData.options} onChange={e => setFieldFormData(p => ({ ...p, options: e.target.value }))} placeholder="Option 1, Option 2, Option 3" style={inputStyle} required />
                </>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', background: '#f9fafb', padding: '12px 16px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <input type="checkbox" checked={fieldFormData.isRequired} onChange={e => setFieldFormData(p => ({ ...p, isRequired: e.target.checked }))} style={{ width: 16, height: 16 }} />
                Client must answer this question
              </label>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
                <button type="button" onClick={() => setShowFieldForm(false)} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 700, color: '#374151', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '12px 24px', background: '#111827', border: 'none', borderRadius: 8, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Send Proposal Modal */}
      {showSendModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 500, borderRadius: 16, padding: 32, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ background: '#f3f4f6', padding: 12, borderRadius: '50%' }}><Send size={24} color="#111827" /></div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#111827' }}>Send Booking Proposal</h2>
            </div>
            
            <form onSubmit={handleSendProposal}>
              <div style={{ background: '#f9fafb', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 24 }}>
                <label style={labelStyle}>Select Contact</label>
                <select 
                  value={sendFormData.contactId} 
                  onChange={e => setSendFormData(p => ({ ...p, contactId: e.target.value }))} 
                  style={inputStyle} 
                  required
                >
                  <option value="">-- Choose a Client --</option>
                  {contacts.map(c => (
                    <option key={c.Contact_ID} value={c.Contact_ID}>{c.Name} ({c.Email})</option>
                  ))}
                </select>

                <label style={{ ...labelStyle, marginTop: 16 }}>Select Contract</label>
                <select 
                  value={sendFormData.contractId} 
                  onChange={e => setSendFormData(p => ({ ...p, contractId: e.target.value }))} 
                  style={inputStyle} 
                  required
                >
                  <option value="">-- Choose a Contract --</option>
                  {cTemplates.map(t => (
                    <option key={t.Template_ID} value={t.Template_ID}>{t.Name}</option>
                  ))}
                </select>

                <label style={{ ...labelStyle, marginTop: 16 }}>Select Questionnaire</label>
                <select 
                  value={sendFormData.questionnaireId} 
                  onChange={e => setSendFormData(p => ({ ...p, questionnaireId: e.target.value }))} 
                  style={{ ...inputStyle, marginBottom: 0 }} 
                  required
                >
                  <option value="">-- Choose a Questionnaire --</option>
                  {qTemplates.map(t => (
                    <option key={t.Template_ID} value={t.Template_ID}>{t.Name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setShowSendModal(false)} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 700, color: '#374151', cursor: 'pointer' }} disabled={isSending}>Cancel</button>
                <button type="submit" style={{ padding: '12px 24px', background: '#0d9488', border: 'none', borderRadius: 8, fontWeight: 700, color: '#fff', cursor: isSending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} disabled={isSending}>
                  {isSending ? 'Sending...' : <><Send size={16} /> Send Email</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="animate-fade-in" style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: 8,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 1000,
          fontWeight: 700
        }}>
          {/* Using text fallback since X and Check icons aren't explicitly imported if not used elsewhere, but let's assume they are or just use standard emojis to be safe and sleek */}
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}
    </div>
  );
}
