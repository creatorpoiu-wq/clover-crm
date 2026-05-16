"use client";

import { useState, useEffect } from "react";
import { Copy, Check, MailOpen, Edit2, Save, Trash2, Plus, X, Send } from "lucide-react";

interface EmailTemplate {
  Template_ID: number;
  Title: string;
  Subject: string;
  Body: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{title: string, subject: string, body: string}>({title: "", subject: "", body: ""});
  
  // Create New State
  const [isCreating, setIsCreating] = useState(false);

  // Send Email State
  const [showSendModal, setShowSendModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [sendFormData, setSendFormData] = useState({ contactId: '', templateId: '' });
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      if (data.success) setContacts(data.contacts);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (tmpl: EmailTemplate) => {
    setEditingId(tmpl.Template_ID);
    setEditForm({ title: tmpl.Title, subject: tmpl.Subject, body: tmpl.Body });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
  };

  const saveTemplate = async (id: number) => {
    try {
      const res = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm })
      });
      if (res.ok) {
        setEditingId(null);
        fetchTemplates();
      }
    } catch (err) {
      console.error("Failed to save template", err);
    }
  };

  const createTemplate = async () => {
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setIsCreating(false);
        fetchTemplates();
      }
    } catch (err) {
      console.error("Failed to create template", err);
    }
  };

  const deleteTemplate = async (id: number) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error("Failed to delete template", err);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendFormData.contactId || !sendFormData.templateId) {
      alert("Please select a Contact and an Email Template.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendFormData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowSendModal(false);
        setSendFormData({ contactId: '', templateId: '' });
        setToast({ message: 'Email sent successfully!', type: 'success' });
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast({ message: `Failed to send email: ${data.error || 'Unknown error occurred.'}`, type: 'error' });
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Network error while sending email.', type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsSending(false);
    }
  };

  const handleAddNewClick = () => {
    setIsCreating(true);
    setEditingId(null);
    setEditForm({ title: "New Template", subject: "", body: "" });
  };

  if (loading) return <div className="empty-state">Loading templates...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title">Email Templates</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Create and manage canned responses.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button 
            onClick={() => setShowSendModal(true)} 
            className="btn btn-primary" 
            style={{ width: "auto", background: "#111827", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Send size={16} /> Send Email
          </button>
          <button onClick={handleAddNewClick} className="btn btn-primary" style={{ width: "auto" }}>
            <Plus size={18} /> New Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create New Form inline */}
        {isCreating && (
          <div className="glass-panel" style={{ padding: "1.5rem", border: "2px solid var(--primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ width: "70%" }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Template Title</label>
                <input 
                  type="text" 
                  className="input" 
                  value={editForm.title} 
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  style={{ fontSize: "1.125rem", fontWeight: 800, padding: "0.5rem", width: "100%", textAlign: "left" }}
                  placeholder="e.g. Initial Inquiry Reply"
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={cancelEdit} className="btn btn-outline" style={{ padding: "0.5rem", width: "auto" }} title="Cancel">
                  <X size={16} />
                </button>
                <button onClick={createTemplate} className="btn btn-primary" style={{ padding: "0.5rem", width: "auto" }} title="Save">
                  <Save size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Email Subject Line</label>
              <input 
                type="text" 
                className="input" 
                value={editForm.subject} 
                onChange={e => setEditForm({...editForm, subject: e.target.value})}
                style={{ fontSize: "0.875rem", padding: "0.5rem", textAlign: "left" }}
                placeholder="e.g. Following up on your inquiry"
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Email Body</label>
              <textarea 
                className="input" 
                value={editForm.body} 
                onChange={e => setEditForm({...editForm, body: e.target.value})}
                style={{ minHeight: "200px", fontSize: "0.875rem", resize: "vertical", textAlign: "left" }}
                placeholder="Hi [Name], ..."
              />
            </div>
          </div>
        )}

        {templates.map((tmpl) => {
          const isEditing = editingId === tmpl.Template_ID;

          return (
            <div key={tmpl.Template_ID} className="glass-panel" style={{ padding: "1.5rem" }}>
              
              {/* Header / Title */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                {isEditing ? (
                  <div style={{ width: "60%" }}>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Template Title</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={editForm.title} 
                      onChange={e => setEditForm({...editForm, title: e.target.value})}
                      style={{ fontSize: "1.125rem", fontWeight: 800, padding: "0.5rem", width: "100%", textAlign: "left" }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 section-header" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
                    <MailOpen size={20} className="text-[var(--primary)]" />
                    <h2 style={{ fontSize: "1.125rem" }}>{tmpl.Title}</h2>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {isEditing ? (
                    <>
                      <button onClick={cancelEdit} className="btn btn-outline" style={{ padding: "0.5rem", width: "auto" }} title="Cancel">
                        <X size={16} />
                      </button>
                      <button onClick={() => saveTemplate(tmpl.Template_ID)} className="btn btn-primary" style={{ padding: "0.5rem", width: "auto" }} title="Save">
                        <Save size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(tmpl)} className="btn btn-outline" style={{ padding: "0.5rem", width: "auto" }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteTemplate(tmpl.Template_ID)} 
                        className="btn btn-outline" 
                        style={{ 
                          padding: confirmDeleteId === tmpl.Template_ID ? "0.5rem 0.75rem" : "0.5rem", 
                          width: "auto", 
                          color: confirmDeleteId === tmpl.Template_ID ? "#fff" : "var(--status-red-fg)", 
                          borderColor: "var(--status-red)",
                          background: confirmDeleteId === tmpl.Template_ID ? "#dc2626" : "transparent"
                        }} 
                        title="Delete"
                      >
                        {confirmDeleteId === tmpl.Template_ID ? "Confirm?" : <Trash2 size={16} />}
                      </button>
                      <button 
                        onClick={() => copyToClipboard(`Subject: ${tmpl.Subject}\n\n${tmpl.Body}`, tmpl.Template_ID)}
                        className="btn btn-primary"
                        style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", width: "auto" }}
                      >
                        {copiedId === tmpl.Template_ID ? <Check size={16} /> : <Copy size={16} />}
                        {copiedId === tmpl.Template_ID ? "Copied" : "Copy"}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Subject */}
              <div style={{ marginBottom: "1rem" }}>
                {isEditing ? (
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Email Subject Line</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={editForm.subject} 
                      onChange={e => setEditForm({...editForm, subject: e.target.value})}
                      style={{ fontSize: "0.875rem", padding: "0.5rem", textAlign: "left" }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 600 }}>
                    Subject: {tmpl.Subject}
                  </div>
                )}
              </div>

              {/* Body */}
              <div>
                {isEditing ? (
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Email Body</label>
                    <textarea 
                      className="input" 
                      value={editForm.body} 
                      onChange={e => setEditForm({...editForm, body: e.target.value})}
                      style={{ minHeight: "200px", fontSize: "0.875rem", resize: "vertical", textAlign: "left" }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: "0.875rem", whiteSpace: "pre-line", color: "var(--foreground)", backgroundColor: "var(--background)", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid var(--border)", lineHeight: 1.6 }}>
                    {tmpl.Body}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Send Email Modal */}
      {showSendModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 500, borderRadius: 16, padding: 32, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ background: '#f3f4f6', padding: 12, borderRadius: '50%' }}><Send size={24} color="#111827" /></div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#111827' }}>Send Email</h2>
            </div>
            
            <form onSubmit={handleSendEmail}>
              <div style={{ background: '#f9fafb', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Select Contact</label>
                <select 
                  value={sendFormData.contactId} 
                  onChange={e => setSendFormData(p => ({ ...p, contactId: e.target.value }))} 
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} 
                  required
                >
                  <option value="">-- Choose a Client --</option>
                  {contacts.map(c => (
                    <option key={c.Contact_ID} value={c.Contact_ID}>{c.Name} ({c.Email || 'No Email'})</option>
                  ))}
                </select>

                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Select Template</label>
                <select 
                  value={sendFormData.templateId} 
                  onChange={e => setSendFormData(p => ({ ...p, templateId: e.target.value }))} 
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 0 }} 
                  required
                >
                  <option value="">-- Choose a Template --</option>
                  {templates.map(t => (
                    <option key={t.Template_ID} value={t.Template_ID}>{t.Title}</option>
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
          {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
