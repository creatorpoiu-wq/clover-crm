"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Copy, Check, Edit2, Save, Trash2, Plus, X, Send, LayoutGrid, List as ListIcon, MoreVertical, FileText, FileSignature, Mail } from "lucide-react";
import { useRouter } from 'next/navigation';

interface EmailTemplate {
  Template_ID: number;
  Title: string;
  Subject: string;
  Body: string;
}

interface GalleryItem {
  id: number;
  type: 'email' | 'contract' | 'invoice';
  title: string;
  subtitle: string;
  image: string;
  original: any;
  date: Date | null;
}

export default function TemplatesPage() {
  const router = useRouter();
  
  // Data State
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [contractTemplates, setContractTemplates] = useState<any[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [filter, setFilter] = useState<'All' | 'Email' | 'Contract' | 'Invoice'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
  
  // Email Editor Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{title: string, subject: string, body: string}>({title: "", subject: "", body: ""});

  // Send Email State
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendFormData, setSendFormData] = useState({ contactId: '', templateId: '' });
  const [isSending, setIsSending] = useState(false);

  // Kebab Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchTemplates(),
      fetchContractTemplates(),
      fetchInvoiceTemplates(),
      fetchContacts()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      if (data.success) setContacts(data.contacts);
    } catch (err) { console.error(err); }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.success) setTemplates(data.templates);
    } catch (err) { console.error(err); }
  };

  const fetchContractTemplates = async () => {
    try {
      const res = await fetch("/api/contract-templates");
      const data = await res.json();
      if (data.success) setContractTemplates(data.templates);
    } catch (err) { console.error(err); }
  };

  const fetchInvoiceTemplates = async () => {
    try {
      const res = await fetch("/api/invoice-actions?type=templates");
      const data = await res.json();
      if (data.success) setInvoiceTemplates(data.templates);
    } catch (err) { console.error(err); }
  };

  // Gallery Normalization
  const galleryItems = useMemo<GalleryItem[]>(() => {
    const items: GalleryItem[] = [
      ...templates.map(t => ({
        id: t.Template_ID,
        type: 'email' as const,
        title: t.Title,
        subtitle: 'Email Template',
        image: '/templates/email.png',
        original: t,
        date: null
      })),
      ...contractTemplates.map(t => ({
        id: t.Template_ID,
        type: 'contract' as const,
        title: t.Name,
        subtitle: 'Contract Template',
        image: '/templates/contract.png',
        original: t,
        date: new Date(t.Created_At)
      })),
      ...invoiceTemplates.map(t => ({
        id: t.Template_ID,
        type: 'invoice' as const,
        title: t.Name,
        subtitle: 'Invoice Template',
        image: '/templates/invoice.png',
        original: t,
        date: new Date(t.Created_At)
      }))
    ];
    return items.sort((a, b) => {
      if (a.date && b.date) return b.date.getTime() - a.date.getTime();
      return 0;
    });
  }, [templates, contractTemplates, invoiceTemplates]);

  const filteredItems = filter === 'All' ? galleryItems : galleryItems.filter(i => i.type.toLowerCase() === filter.toLowerCase());

  // Email Actions
  const openNewEmailModal = () => {
    setShowCreateDropdown(false);
    setEditingId(null);
    setEditForm({ title: "New Email Template", subject: "", body: "" });
    setIsEmailModalOpen(true);
  };

  const openEditEmailModal = (tmpl: EmailTemplate) => {
    setEditingId(tmpl.Template_ID);
    setEditForm({ title: tmpl.Title, subject: tmpl.Subject, body: tmpl.Body });
    setIsEmailModalOpen(true);
  };

  const saveEmailTemplate = async () => {
    if (!editForm.title || !editForm.subject || !editForm.body) {
      alert("Please fill in all fields.");
      return;
    }
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...editForm } : editForm;
      const res = await fetch("/api/templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsEmailModalOpen(false);
        fetchTemplates();
        showToast(`Template ${editingId ? 'updated' : 'created'} successfully!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save template.", "error");
    }
  };

  // Delete Actions
  const handleDelete = async (id: number, type: 'email'|'contract'|'invoice') => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setConfirmDeleteId(null);
    setActiveMenuId(null);

    try {
      let res;
      if (type === 'email') {
        res = await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      } else if (type === 'contract') {
        res = await fetch(`/api/contract-templates?id=${id}`, { method: "DELETE" });
      } else if (type === 'invoice') {
        res = await fetch(`/api/invoice-actions?id=${id}&type=template`, { method: "DELETE" });
      }

      if (res?.ok) {
        if (type === 'email') fetchTemplates();
        else if (type === 'contract') fetchContractTemplates();
        else if (type === 'invoice') fetchInvoiceTemplates();
        showToast("Template deleted.", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete.", "error");
    }
  };

  // Helpers
  const showToast = (message: string, type: 'success'|'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setActiveMenuId(null);
    setTimeout(() => setCopiedId(null), 2000);
    showToast("Copied to clipboard!", "success");
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
        showToast('Email sent successfully!', 'success');
      } else {
        showToast(`Failed: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast('Network error while sending.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const toggleMenu = (uid: string) => {
    setActiveMenuId(prev => prev === uid ? null : uid);
  };

  if (loading) return <div className="p-8 text-slate-500">Loading gallery...</div>;

  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="page-title">Template Gallery</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage your beautifully designed smart file templates.</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', marginRight: '0.5rem' }}>Filter:</span>
          {['All', 'Invoice', 'Contract', 'Email'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '999px',
                border: 'none',
                background: filter === f ? '#e2e8f0' : '#f1f5f9',
                color: filter === f ? '#0f172a' : '#64748b',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
            <button onClick={() => setViewMode('grid')} style={{ padding: '0.4rem', border: 'none', background: viewMode === 'grid' ? 'white' : 'transparent', borderRadius: '0.25rem', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: viewMode === 'grid' ? '#0f172a' : '#94a3b8' }}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} style={{ padding: '0.4rem', border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', borderRadius: '0.25rem', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: viewMode === 'list' ? '#0f172a' : '#94a3b8' }}>
              <ListIcon size={18} />
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              style={{ background: '#0f172a', color: 'white', padding: '0.6rem 1.25rem', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Create new
            </button>
            {showCreateDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '200px', zIndex: 50, overflow: 'hidden' }}>
                <button onClick={openNewEmailModal} style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16}/> Email Template</button>
                <button onClick={() => router.push('/dashboard/pipeline')} style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileSignature size={16}/> Contract Template</button>
                <button onClick={() => router.push('/dashboard/finance')} style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={16}/> Invoice Template</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', fontWeight: 500 }}>
        {filteredItems.length} smart file templates.
      </p>

      {/* Gallery */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredItems.map(item => {
            const uid = `${item.type}-${item.id}`;
            return (
              <div key={uid} style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative' }} className="hover:shadow-lg hover:-translate-y-1">
                {/* Thumbnail */}
                <div style={{ height: '180px', width: '100%', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                  <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                
                {/* Content */}
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>
                    {item.type === 'email' && <Mail size={14} />}
                    {item.type === 'contract' && <FileSignature size={14} />}
                    {item.type === 'invoice' && <FileText size={14} />}
                    {item.subtitle}
                  </div>
                </div>

                {/* Kebab Menu */}
                <div style={{ position: 'absolute', top: '190px', right: '1rem' }}>
                  <button onClick={() => toggleMenu(uid)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}>
                    <MoreVertical size={20} />
                  </button>
                  {activeMenuId === uid && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: '150px', overflow: 'hidden' }}>
                      {item.type === 'email' && (
                        <>
                          <button onClick={() => { setActiveMenuId(null); openEditEmailModal(item.original); }} style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>Edit</button>
                          <button onClick={() => copyToClipboard(`Subject: ${item.original.Subject}\n\n${item.original.Body}`, item.id)} style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>Copy Body</button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDelete(item.id, item.type)} 
                        style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer', color: confirmDeleteId === item.id ? 'white' : '#ef4444', backgroundColor: confirmDeleteId === item.id ? '#ef4444' : 'transparent' }}
                      >
                        {confirmDeleteId === item.id ? 'Confirm?' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Template Name</th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={`${item.type}-${item.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#0f172a' }}>{item.title}</td>
                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.type === 'email' && <Mail size={14} />}
                      {item.type === 'contract' && <FileSignature size={14} />}
                      {item.type === 'invoice' && <FileText size={14} />}
                      {item.subtitle}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                       {item.type === 'email' && (
                          <button onClick={() => openEditEmailModal(item.original)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Edit2 size={16} /></button>
                       )}
                       <button onClick={() => handleDelete(item.id, item.type)} style={{ background: 'none', border: 'none', color: confirmDeleteId === item.id ? '#ef4444' : '#64748b', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No templates found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Action Button for Sending Email (if in Email filter) */}
      {filter === 'Email' && (
        <button 
          onClick={() => setShowSendModal(true)}
          style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#0d9488', color: 'white', padding: '1rem 1.5rem', borderRadius: '999px', border: 'none', boxShadow: '0 10px 25px rgba(13, 148, 136, 0.4)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', zIndex: 100 }}
        >
          <Send size={18} /> Send an Email
        </button>
      )}

      {/* Modals */}
      
      {/* Email Editor Modal */}
      {isEmailModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '700px', borderRadius: '1rem', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{editingId ? 'Edit Email Template' : 'New Email Template'}</h2>
              <button onClick={() => setIsEmailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Template Title</label>
                <input 
                  type="text" 
                  value={editForm.title} 
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
                  placeholder="e.g. Initial Inquiry Reply"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Email Subject</label>
                <input 
                  type="text" 
                  value={editForm.subject} 
                  onChange={e => setEditForm({...editForm, subject: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
                  placeholder="e.g. Following up on your inquiry"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Email Body</label>
                <textarea 
                  value={editForm.body} 
                  onChange={e => setEditForm({...editForm, body: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.95rem", minHeight: "250px", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  placeholder="Hi [Name], ..."
                />
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#f8fafc', borderRadius: '0 0 1rem 1rem' }}>
              <button onClick={() => setIsEmailModalOpen(false)} style={{ padding: '0.6rem 1.25rem', border: '1px solid #cbd5e1', background: 'white', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
              <button onClick={saveEmailTemplate} style={{ padding: '0.6rem 1.5rem', border: 'none', background: '#0d9488', color: 'white', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} /> {editingId ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showSendModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '1rem', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '50%' }}><Send size={24} color="#0f172a" /></div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Send Email</h2>
            </div>
            
            <form onSubmit={handleSendEmail}>
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Select Contact</label>
                <select 
                  value={sendFormData.contactId} 
                  onChange={e => setSendFormData(p => ({ ...p, contactId: e.target.value }))} 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', marginBottom: '1rem', background: 'white', boxSizing: 'border-box' }} 
                  required
                >
                  <option value="">-- Choose a Client --</option>
                  {contacts.map(c => (
                    <option key={c.Contact_ID} value={c.Contact_ID}>{c.Name} ({c.Email || 'No Email'})</option>
                  ))}
                </select>

                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Select Template</label>
                <select 
                  value={sendFormData.templateId} 
                  onChange={e => setSendFormData(p => ({ ...p, templateId: e.target.value }))} 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', background: 'white', boxSizing: 'border-box' }} 
                  required
                >
                  <option value="">-- Choose a Template --</option>
                  {templates.map(t => (
                    <option key={t.Template_ID} value={t.Template_ID}>{t.Title}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowSendModal(false)} style={{ padding: '0.75rem 1.25rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }} disabled={isSending}>Cancel</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#0d9488', border: 'none', borderRadius: '0.5rem', fontWeight: 600, color: '#fff', cursor: isSending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={isSending}>
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
          bottom: '2rem',
          right: '2rem',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 10000,
          fontWeight: 700
        }}>
          {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
