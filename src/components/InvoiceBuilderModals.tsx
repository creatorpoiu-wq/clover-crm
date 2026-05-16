'use client';
import React, { useState, useEffect } from 'react';
import { X, FileText, Trash2 } from 'lucide-react';

const overlay: React.CSSProperties = { position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' };
const card: React.CSSProperties = { background:'#fff', borderRadius:12, padding:28, width:480, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' };

export function SaveTemplateModal({ onSave, onClose }: { onSave:(name:string)=>void; onClose:()=>void }) {
  const [name, setName] = useState('');
  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:700 }}>Save as Template</h3>
          <button onClick={onClose} style={{ border:'none', background:'none', cursor:'pointer', color:'#9ca3af' }}><X size={18}/></button>
        </div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Template name…" autoFocus
          style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:14, outline:'none', marginBottom:16, boxSizing:'border-box' as const }}
          onKeyDown={e=>{ if(e.key==='Enter'&&name.trim()){ onSave(name.trim()); onClose(); } }}
        />
        <button onClick={()=>{ if(name.trim()){ onSave(name.trim()); onClose(); } }}
          style={{ padding:'10px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13 }}>
          Save Template
        </button>
      </div>
    </div>
  );
}

export function LoadTemplateModal({ onLoad, onClose, apiPath, deleteApiPath }: { onLoad:(c:string)=>void; onClose:()=>void; apiPath:string; deleteApiPath:string }) {
  const [templates, setTemplates] = useState<{Template_ID:number;Name:string;Content:string}[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = () => {
    setLoading(true);
    fetch(apiPath).then(r=>r.json()).then(d=>{ if(d.success) setTemplates(d.templates||[]); }).finally(()=>setLoading(false));
  };

  useEffect(()=>{ fetch_(); }, []);

  const del = async (id:number) => {
    await fetch(`${deleteApiPath}&id=${id}`, { method:'DELETE' });
    fetch_();
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:700 }}>Load Template</h3>
          <button onClick={onClose} style={{ border:'none', background:'none', cursor:'pointer', color:'#9ca3af' }}><X size={18}/></button>
        </div>
        <div style={{ flex:1, overflowY:'auto' as const }}>
          {loading ? <p style={{ color:'#9ca3af', textAlign:'center' as const }}>Loading…</p>
          : templates.length === 0 ? <p style={{ color:'#9ca3af', textAlign:'center' as const }}>No templates saved yet.</p>
          : templates.map(t => (
            <div key={t.Template_ID} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', borderRadius:8, border:'1px solid #e5e7eb', marginBottom:8 }}>
              <FileText size={20} color="#1d4ed8"/>
              <span style={{ flex:1, fontWeight:600, fontSize:14, color:'#111827' }}>{t.Name}</span>
              <button onClick={()=>{ onLoad(t.Content); onClose(); }} style={{ padding:'6px 14px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700 }}>Use</button>
              <button onClick={()=>del(t.Template_ID)} style={{ border:'none', background:'none', cursor:'pointer', color:'#d1d5db', padding:4 }}><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
