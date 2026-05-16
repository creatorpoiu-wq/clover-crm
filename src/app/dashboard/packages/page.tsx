'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Camera, Video, Package as PackageIcon, LayoutList, ChevronDown, ChevronRight, Check } from 'lucide-react';

interface Session {
  Session_ID: number;
  Service_Type: string;
  Session_Type: string;
}

interface Package {
  Package_ID: number;
  Session_ID: number;
  Name: string;
  Duration: string;
  Items: string;
  Description: string;
  Price: number;
}

export default function PackagesPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Forms
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({ id: 0, serviceType: 'Photography', sessionType: '' });
  
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [packageForm, setPackageForm] = useState({ id: 0, sessionId: 0, name: '', duration: '', items: '', description: '', price: 0 });

  // UI State
  const [expandedSessions, setExpandedSessions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [sRes, pRes] = await Promise.all([
      fetch('/api/packages?type=sessions'),
      fetch('/api/packages?type=packages')
    ]);
    const sData = await sRes.json();
    const pData = await pRes.json();
    if (sData.success) setSessions(sData.sessions);
    if (pData.success) setPackages(pData.packages);
    setLoading(false);
  };

  const toggleSession = (id: number) => {
    setExpandedSessions(p => ({ ...p, [id]: !p[id] }));
  };

  // ── SESSIONS ────────────────────────────────────────────────────────────
  const saveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = sessionForm.id !== 0;
    const res = await fetch('/api/packages', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'session', ...sessionForm })
    });
    if (res.ok) {
      setShowSessionForm(false);
      setSessionForm({ id: 0, serviceType: 'Photography', sessionType: '' });
      fetchData();
    }
  };

  const deleteSession = async (id: number) => {
    const key = `sess-${id}`;
    if (confirmDeleteId !== key) {
      setConfirmDeleteId(key);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setConfirmDeleteId(null);
    const res = await fetch(`/api/packages?type=session&id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const editSession = (s: Session) => {
    setSessionForm({ id: s.Session_ID, serviceType: s.Service_Type, sessionType: s.Session_Type });
    setShowSessionForm(true);
  };

  // ── PACKAGES ────────────────────────────────────────────────────────────
  const savePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.sessionId) return alert('Please select a session');
    const isEdit = packageForm.id !== 0;
    const res = await fetch('/api/packages', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'package', ...packageForm })
    });
    if (res.ok) {
      setShowPackageForm(false);
      setPackageForm({ id: 0, sessionId: 0, name: '', duration: '', items: '', description: '', price: 0 });
      fetchData();
    }
  };

  const deletePackage = async (id: number) => {
    const key = `pkg-${id}`;
    if (confirmDeleteId !== key) {
      setConfirmDeleteId(key);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setConfirmDeleteId(null);
    const res = await fetch(`/api/packages?type=package&id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const editPackage = (p: Package) => {
    setPackageForm({
      id: p.Package_ID,
      sessionId: p.Session_ID,
      name: p.Name,
      duration: p.Duration,
      items: typeof p.Items === 'string' ? (() => { try { return JSON.parse(p.Items).join('\n') } catch { return p.Items }})() : p.Items,
      description: p.Description,
      price: p.Price
    });
    setShowPackageForm(true);
  };

  const parseItems = (itemsStr: string) => {
    if (!itemsStr) return [];
    if (itemsStr.startsWith('[')) {
      try { return JSON.parse(itemsStr); } catch { return []; }
    }
    return itemsStr.split('\n').filter(Boolean);
  };

  const inputStyle = { width:'100%', padding:'10px 14px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' as const, marginBottom:16 };
  const labelStyle = { fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Packages & Sessions</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Manage your photography and videography services and pricing tiers.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => { setSessionForm({ id: 0, serviceType: 'Photography', sessionType: '' }); setShowSessionForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#374151' }}>
            <LayoutList size={16} /> New Session
          </button>
          <button onClick={() => { setPackageForm({ id: 0, sessionId: 0, name: '', duration: '', items: '', description: '', price: 0 }); setShowPackageForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#0d9488', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff' }}>
            <PackageIcon size={16} /> New Package
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px dashed #e5e7eb' }}>
          <LayoutList size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>No Sessions Created</h3>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>Get started by creating a photography or videography session.</p>
          <button onClick={() => setShowSessionForm(true)} style={{ padding: '10px 20px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Create Session</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sessions.map(session => {
            const sessionPackages = packages.filter(p => p.Session_ID === session.Session_ID);
            const isExpanded = expandedSessions[session.Session_ID] !== false; // Default true
            const Icon = session.Service_Type === 'Videography' ? Video : Camera;

            return (
              <div key={session.Session_ID} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Session Header */}
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none', cursor: 'pointer' }} onClick={() => toggleSession(session.Session_ID)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0fdfa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{session.Session_Type}</h2>
                      <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>{session.Service_Type} &middot; {sessionPackages.length} Packages</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={(e) => { e.stopPropagation(); editSession(session); }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><Edit3 size={16} /></button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteSession(session.Session_ID); }} 
                      style={{ 
                        background: confirmDeleteId === `sess-${session.Session_ID}` ? '#dc2626' : 'none', 
                        border: 'none', 
                        color: confirmDeleteId === `sess-${session.Session_ID}` ? '#fff' : '#f87171', 
                        cursor: 'pointer',
                        padding: confirmDeleteId === `sess-${session.Session_ID}` ? '4px 8px' : '0',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      {confirmDeleteId === `sess-${session.Session_ID}` ? "Confirm?" : <Trash2 size={16} />}
                    </button>
                    <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />
                    {isExpanded ? <ChevronDown size={20} color="#9ca3af" /> : <ChevronRight size={20} color="#9ca3af" />}
                  </div>
                </div>

                {/* Session Packages */}
                {isExpanded && (
                  <div style={{ padding: 24, background: '#f8fafc' }}>
                    {sessionPackages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 20, color: '#6b7280', fontSize: 14 }}>No packages added to this session yet.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {sessionPackages.map(pkg => (
                          <div key={pkg.Package_ID} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                              <div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{pkg.Name}</h3>
                                {pkg.Duration && <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, background: '#f1f5f9', padding: '2px 8px', borderRadius: 12, display: 'inline-block', marginTop: 8 }}>⏱ {pkg.Duration}</span>}
                              </div>
                              <div style={{ fontSize: 20, fontWeight: 900, color: '#0d9488' }}>${pkg.Price.toLocaleString()}</div>
                            </div>
                            {pkg.Description && <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5, margin: '0 0 16px' }}>{pkg.Description}</p>}
                            
                            <div style={{ flex: 1 }}>
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {parseItems(pkg.Items).map((item: string, i: number) => (
                                  <li key={i} style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <Check size={14} color="#0d9488" style={{ marginTop: 2, flexShrink: 0 }} /> {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                              <button onClick={() => editPackage(pkg)} style={{ padding: '6px 12px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', display:'flex', alignItems:'center', gap:4 }}><Edit3 size={12}/> Edit</button>
                              <button 
                                onClick={() => deletePackage(pkg.Package_ID)} 
                                style={{ 
                                  padding: '6px 12px', 
                                  background: confirmDeleteId === `pkg-${pkg.Package_ID}` ? '#dc2626' : '#fef2f2', 
                                  border: confirmDeleteId === `pkg-${pkg.Package_ID}` ? '1px solid #dc2626' : '1px solid #fca5a5', 
                                  borderRadius: 6, 
                                  fontSize: 12, 
                                  fontWeight: 600, 
                                  color: confirmDeleteId === `pkg-${pkg.Package_ID}` ? '#fff' : '#dc2626', 
                                  cursor: 'pointer', 
                                  display:'flex', 
                                  alignItems:'center', 
                                  gap:4 
                                }}
                              >
                                {confirmDeleteId === `pkg-${pkg.Package_ID}` ? "Confirm?" : <><Trash2 size={12}/> Delete</>}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SESSION MODAL */}
      {showSessionForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 400, borderRadius: 12, padding: 28, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 20px', color: '#111827' }}>{sessionForm.id ? 'Edit Session' : 'New Session'}</h2>
            <form onSubmit={saveSession}>
              <label style={labelStyle}>Service Type</label>
              <select value={sessionForm.serviceType} onChange={e => setSessionForm(p => ({ ...p, serviceType: e.target.value }))} style={inputStyle}>
                <option value="Photography">Photography</option>
                <option value="Videography">Videography</option>
              </select>
              
              <label style={labelStyle}>Session Type</label>
              <input value={sessionForm.sessionType} onChange={e => setSessionForm(p => ({ ...p, sessionType: e.target.value }))} placeholder="e.g. Family, Maternity, Wedding..." style={inputStyle} required />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowSessionForm(false)} style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#0d9488', border: 'none', borderRadius: 8, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PACKAGE MODAL */}
      {showPackageForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 500, borderRadius: 12, padding: 28, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 20px', color: '#111827' }}>{packageForm.id ? 'Edit Package' : 'New Package'}</h2>
            <form onSubmit={savePackage}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Linked Session</label>
                  <select value={packageForm.sessionId} onChange={e => setPackageForm(p => ({ ...p, sessionId: parseInt(e.target.value) }))} style={inputStyle} required>
                    <option value={0} disabled>-- Select Session --</option>
                    {sessions.map(s => <option key={s.Session_ID} value={s.Session_ID}>{s.Session_Type} ({s.Service_Type})</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Package Name</label>
                  <input value={packageForm.name} onChange={e => setPackageForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Silver Package" style={inputStyle} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Duration</label>
                  <input value={packageForm.duration} onChange={e => setPackageForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 2 Hours" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Price ($)</label>
                  <input type="number" step="0.01" value={packageForm.price || ''} onChange={e => setPackageForm(p => ({ ...p, price: parseFloat(e.target.value) }))} placeholder="0.00" style={inputStyle} required />
                </div>
              </div>

              <label style={labelStyle}>Description (Optional)</label>
              <textarea value={packageForm.description} onChange={e => setPackageForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Brief summary of the package..." style={{ ...inputStyle, resize: 'vertical' as const }} />

              <label style={labelStyle}>Included Items (One per line)</label>
              <textarea value={packageForm.items} onChange={e => setPackageForm(p => ({ ...p, items: e.target.value }))} rows={4} placeholder="50 Edited Photos&#10;Online Gallery&#10;Print Release..." style={{ ...inputStyle, resize: 'vertical' as const }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowPackageForm(false)} style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#0d9488', border: 'none', borderRadius: 8, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save Package</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
