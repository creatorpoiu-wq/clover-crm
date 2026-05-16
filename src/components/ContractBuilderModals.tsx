'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, FileText, Trash2, Check } from 'lucide-react';

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 99999,
  background: 'rgba(0,0,0,0.45)', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
};
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 28,
  width: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
};
const hdr: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: 20,
};
const closeBtn: React.CSSProperties = {
  border: 'none', background: 'none', cursor: 'pointer',
  color: '#9ca3af', padding: 4, borderRadius: 6,
};
const searchBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px',
  marginBottom: 16,
};
const inputStyle: React.CSSProperties = {
  flex: 1, border: 'none', outline: 'none',
  fontSize: 13, color: '#374151', background: 'transparent',
};
const listWrap: React.CSSProperties = {
  flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2,
};
const rowStyle = (selected: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
  borderRadius: 8, cursor: 'pointer',
  background: selected ? '#f0fdfa' : 'transparent',
  border: selected ? '1px solid #99f6e4' : '1px solid transparent',
});
const avatarStyle = (color: string, bg: string): React.CSSProperties => ({
  width: 36, height: 36, borderRadius: '50%',
  background: bg, color, fontWeight: 700, fontSize: 13,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
});
const primaryBtn: React.CSSProperties = {
  marginTop: 16, padding: '10px 20px', background: '#0d9488', color: '#fff',
  border: 'none', borderRadius: 8, cursor: 'pointer',
  fontSize: 13, fontWeight: 700, width: '100%',
};
const tagColors = [
  ['#166534', '#dcfce7'], ['#1e40af', '#dbeafe'], ['#6b21a8', '#f3e8ff'],
  ['#9a3412', '#ffedd5'], ['#c2185b', '#fdf2f4'],
];

interface Contact { Contact_ID: number; Name: string; Email: string; Phone?: string; }

export function ContactPickerModal({ onSelect, onClose }: {
  onSelect: (c: Contact) => void;
  onClose: () => void;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);

  useEffect(() => {
    fetch('/api/contacts').then(r => r.json()).then(d => {
      if (d.success) setContacts(d.contacts);
    });
  }, []);

  const filtered = contacts.filter(c =>
    c.Name?.toLowerCase().includes(q.toLowerCase()) ||
    c.Email?.toLowerCase().includes(q.toLowerCase())
  );

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <div style={hdr}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Add Signer from Contacts</span>
          <button style={closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={searchBox}>
          <Search size={15} style={{ color: '#9ca3af' }} />
          <input style={inputStyle} placeholder="Search contacts..." value={q} onChange={e => setQ(e.target.value)} autoFocus />
        </div>
        <div style={listWrap}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 24 }}>No contacts found</div>
          )}
          {filtered.map((c, i) => {
            const [col, bg] = tagColors[i % tagColors.length];
            const initials = c.Name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
            const isSel = selected?.Contact_ID === c.Contact_ID;
            return (
              <div key={c.Contact_ID} style={rowStyle(isSel)} onClick={() => setSelected(c)}
                onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = '#f9fafb'; }}
                onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <div style={avatarStyle(col, bg)}>{initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.Name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.Email}</div>
                </div>
                {isSel && <Check size={16} style={{ color: '#0d9488' }} />}
              </div>
            );
          })}
        </div>
        <button style={{ ...primaryBtn, opacity: selected ? 1 : 0.5 }}
          disabled={!selected}
          onClick={() => { if (selected) { onSelect(selected); onClose(); } }}
        >
          Add as Signer
        </button>
      </div>
    </div>,
    document.body
  );
}

export function SaveTemplateModal({ onSave, onClose }: {
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div style={overlay} onClick={onClose}>
      <div style={{ ...card, maxHeight: 'unset', width: 420 }} onClick={e => e.stopPropagation()}>
        <div style={hdr}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Save as Template</span>
          <button style={closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          This will save the current document content as a reusable contract template.
        </p>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
          Template Name *
        </label>
        <input
          style={{ ...inputStyle, border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', width: '100%', fontSize: 13 }}
          placeholder="e.g. Photography Services Agreement"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onSave(name.trim()); onClose(); } }}
          autoFocus
        />
        <button
          style={{ ...primaryBtn, opacity: name.trim() ? 1 : 0.5 }}
          disabled={!name.trim()}
          onClick={() => { if (name.trim()) { onSave(name.trim()); onClose(); } }}
        >
          Save Template
        </button>
      </div>
    </div>,
    document.body
  );
}

interface Template { Template_ID: number; Name: string; Content: string; Created_At: string; }

export function LoadTemplateModal({ onLoad, onClose }: {
  onLoad: (content: string) => void;
  onClose: () => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = () => {
    fetch('/api/contract-templates').then(r => r.json()).then(d => {
      if (d.success) setTemplates(d.templates);
      setLoading(false);
    });
  };

  useEffect(() => { fetchTemplates(); }, []);

  const deleteTemplate = async (id: number) => {
    await fetch(`/api/contract-templates?id=${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <div style={hdr}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Load a Template</span>
          <button style={closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={listWrap}>
          {loading && <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 24 }}>Loading…</div>}
          {!loading && templates.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <FileText size={36} style={{ color: '#d1d5db', marginBottom: 12 }} />
              <div style={{ fontSize: 13, color: '#9ca3af' }}>No saved templates yet.</div>
              <div style={{ fontSize: 12, color: '#d1d5db', marginTop: 4 }}>Use "Save as Template" in the builder to create one.</div>
            </div>
          )}
          {templates.map(t => (
            <div key={t.Template_ID} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', borderRadius: 8, border: '1px solid #f3f4f6', marginBottom: 4 }}>
              <FileText size={18} style={{ color: '#0d9488', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.Name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(t.Created_At).toLocaleDateString()}</div>
              </div>
              <button
                onClick={() => { onLoad(t.Content); onClose(); }}
                style={{ padding: '6px 14px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Use
              </button>
              <button onClick={() => deleteTemplate(t.Template_ID)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#fca5a5', padding: 4 }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
