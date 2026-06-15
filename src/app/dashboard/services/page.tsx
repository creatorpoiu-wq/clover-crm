'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Edit3, Camera, Video, Clock, MapPin, Globe, Lock, Copy, Check, ChevronRight, X, Link, Calendar, Package as PackageIcon, Users } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SERVICE_TYPES = ['Photography', 'Videography', 'Photo & Video', 'Headshots', 'Commercial', 'Events', 'Other'];
const WEDDING_SERVICE_TYPES = ['Wedding Photo', 'Wedding Video', 'Wedding Content Creation'];

interface TimeSlot {
  Slot_ID: number;
  Day_Of_Week: number;
  Start_Time: string;
  End_Time: string;
}

interface Package {
  Package_ID: number;
  Name: string;
  Price: number;
  Duration: string;
  Description: string;
  Items: string;
}

interface Session {
  Session_ID: number;
  Service_Type: string;
  Session_Type: string;
  Slug: string;
  Description: string;
  Cover_Image: string;
  Duration_Minutes: number;
  Location: string;
  Is_Public: boolean;
  Price: number;
  Contract_Template: string;
  Session_Time_Slots: TimeSlot[];
  Packages: Package[];
}

const defaultSessionForm = {
  id: 0,
  serviceType: 'Photography',
  sessionType: '',
  slug: '',
  slugDirty: false,
  description: '',
  coverImage: '',
  durationMinutes: 60,
  location: '',
  isPublic: true,
  price: 0,
  contractTemplate: ''
};

const defaultPackageForm = {
  id: 0,
  sessionId: 0,
  name: '',
  duration: '',
  items: '',
  description: '',
  price: 0
};

export default function ServicesPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [contractTemplates, setContractTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('');
  const [activePanel, setActivePanel] = useState<Session | null>(null);
  const [panelTab, setPanelTab] = useState<'general' | 'availability' | 'packages' | 'bookings'>('general');
  const [copied, setCopied] = useState(false);
  const [businessSlug, setBusinessSlug] = useState<string>('');
  const [customDomain, setCustomDomain] = useState<string>('');
  const [mainTab, setMainTab] = useState<'sessions' | 'weddings' | 'packages'>('sessions');

  // Session form
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({ ...defaultSessionForm });
  const [savingSession, setSavingSession] = useState(false);

  // Package form
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [packageForm, setPackageForm] = useState({ ...defaultPackageForm });

  // Time slot form
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotForm, setSlotForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });

  // Bookings for panel
  const [panelBookings, setPanelBookings] = useState<any[]>([]);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    // Fetch settings to get business slug
    const settingsRes = await fetch('/api/settings');
    const settingsData = await settingsRes.json();
    if (settingsData.success) {
      if (settingsData.config?.businessSlug) setBusinessSlug(settingsData.config.businessSlug);
      if (settingsData.config?.customDomain) setCustomDomain(settingsData.config.customDomain);
    }

    const res = await fetch('/api/sessions');
    const data = await res.json();
    if (data.success) {
      setSessions(data.sessions || []);
      if (!selectedService && data.sessions?.length > 0) {
        setSelectedService(data.sessions[0].Service_Type);
      }
    }

    const contractRes = await fetch('/api/contract-templates');
    const contractData = await contractRes.json();
    if (contractData.success) {
      setContractTemplates(contractData.templates);
    }
    if (showLoading) setLoading(false);
  };

  useEffect(() => { fetchData(true); }, []);

  // Refresh panel if active
  useEffect(() => {
    if (activePanel) {
      const updated = sessions.find(s => s.Session_ID === activePanel.Session_ID);
      if (updated) setActivePanel(updated);
    }
  }, [sessions]);

  // Fetch bookings when panel opens on bookings tab
  useEffect(() => {
    if (activePanel && panelTab === 'bookings') {
      fetch('/api/session-bookings')
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setPanelBookings(d.bookings.filter((b: any) => b.Session_ID === activePanel.Session_ID));
          }
        });
    }
  }, [panelTab, activePanel]);

  const visibleSessions = useMemo(() => {
    return sessions.filter(s => {
      const isWedding = s.Service_Type?.toLowerCase().includes('wedding') || s.Session_Type?.toLowerCase().includes('wedding');
      if (mainTab === 'weddings') return isWedding;
      if (mainTab === 'sessions') return !isWedding;
      return true;
    });
  }, [sessions, mainTab]);

  const serviceTypes = [...new Set(visibleSessions.map(s => s.Service_Type))];
  const filteredSessions = visibleSessions.filter(s => s.Service_Type === selectedService);

  useEffect(() => {
    if (serviceTypes.length > 0 && !serviceTypes.includes(selectedService)) {
      setSelectedService(serviceTypes[0]);
    } else if (serviceTypes.length === 0) {
      setSelectedService('');
    }
  }, [mainTab, serviceTypes, selectedService]);

  const allPackages = useMemo(() => {
    const pkgs: any[] = [];
    sessions.forEach(s => {
      if (s.Packages) {
        s.Packages.forEach(p => pkgs.push({ ...p, sessionName: s.Session_Type, sessionId: s.Session_ID }));
      }
    });
    return pkgs.sort((a, b) => b.Package_ID - a.Package_ID);
  }, [sessions]);

  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = customDomain ? `https://${customDomain}` : baseOrigin;

  const getBookingUrl = (slug: string) => {
    if (customDomain) return `https://${customDomain}/book/${slug}`;
    return `${baseOrigin}/book/${businessSlug || 'unconfigured-business'}/${slug}`;
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(getBookingUrl(slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── SESSION CRUD ─────────────────────────────────────────
  const openNewSession = (serviceType: string) => {
    setSessionForm({ 
      ...defaultSessionForm, 
      serviceType,
      sessionType: mainTab === 'weddings' ? serviceType : '',
      slugDirty: false
    });
    setShowSessionForm(true);
  };

  const openEditSession = (s: Session) => {
    setSessionForm({
      id: s.Session_ID,
      serviceType: s.Service_Type,
      sessionType: s.Session_Type,
      slug: s.Slug || '',
      slugDirty: true,
      description: s.Description || '',
      coverImage: s.Cover_Image || '',
      durationMinutes: s.Duration_Minutes || 60,
      location: s.Location || '',
      isPublic: s.Is_Public !== false,
      price: s.Price || 0,
      contractTemplate: s.Contract_Template || ''
    });
    setShowSessionForm(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setSessionForm(p => ({ ...p, coverImage: dataUrl }));
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const saveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSession(true);
    try {
      const isEdit = sessionForm.id !== 0;
      const res = await fetch('/api/sessions', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionForm.id,
          serviceType: sessionForm.serviceType,
          sessionType: mainTab === 'weddings' ? sessionForm.serviceType : sessionForm.sessionType,
          slug: sessionForm.slug || (mainTab === 'weddings' ? sessionForm.serviceType.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : sessionForm.sessionType.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')),
          description: sessionForm.description,
          coverImage: sessionForm.coverImage,
          durationMinutes: mainTab === 'weddings' ? 0 : sessionForm.durationMinutes,
          location: mainTab === 'weddings' ? '' : sessionForm.location,
          isPublic: sessionForm.isPublic,
          price: mainTab === 'weddings' ? 0 : sessionForm.price,
          contractTemplate: sessionForm.contractTemplate
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowSessionForm(false);
        setSessionForm({ ...defaultSessionForm });
        setSelectedService(sessionForm.serviceType);
        fetchData(false);
      } else {
        alert(`Failed to save session: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingSession(false);
    }
  };


  const deleteSession = async (id: number) => {
    const key = `sess-${id}`;
    if (confirmDelete !== key) {
      setConfirmDelete(key);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    setConfirmDelete(null);
    await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' });
    if (activePanel?.Session_ID === id) setActivePanel(null);
    fetchData(false);
  };

  // ── PACKAGE CRUD ─────────────────────────────────────────
  const savePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.sessionId) return;
    const isEdit = packageForm.id !== 0;
    const res = await fetch('/api/packages', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'package', ...packageForm })
    });
    if (res.ok) {
      setShowPackageForm(false);
      setPackageForm({ ...defaultPackageForm });
      fetchData(false);
    }
  };

  const deletePackage = async (id: number) => {
    const key = `pkg-${id}`;
    if (confirmDelete !== key) {
      setConfirmDelete(key);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    setConfirmDelete(null);
    await fetch(`/api/packages?type=package&id=${id}`, { method: 'DELETE' });
    fetchData(false);
  };

  // ── TIME SLOTS ──────────────────────────────────────────
  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePanel) return;
    const res = await fetch('/api/time-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: activePanel.Session_ID, ...slotForm })
    });
    if (res.ok) {
      setShowSlotForm(false);
      fetchData(false);
    }
  };

  const deleteSlot = async (id: number) => {
    await fetch(`/api/time-slots?id=${id}`, { method: 'DELETE' });
    fetchData(false);
  };

  const updateBookingStatus = async (bookingId: number, status: string) => {
    await fetch('/api/session-bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, status })
    });
    const res = await fetch('/api/session-bookings');
    const d = await res.json();
    if (d.success && activePanel) {
      setPanelBookings(d.bookings.filter((b: any) => b.Session_ID === activePanel.Session_ID));
    }
  };

  const getServiceIcon = (type: string) => {
    if (type === 'Videography') return <Video size={18} />;
    if (type === 'Headshots') return <Users size={18} />;
    return <Camera size={18} />;
  };

  if (loading) return <div className="empty-state">Loading services...</div>;

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">Manage your service offerings, sessions, and public booking pages.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {mainTab === 'packages' && (
            <button
              onClick={() => { setPackageForm({ ...defaultPackageForm }); setShowPackageForm(true); }}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer w-full md:w-auto justify-center"
            >
              <Plus size={16} /> New Package
            </button>
          )}
          <button
            onClick={() => openNewSession(selectedService || (mainTab === 'weddings' ? 'Wedding Photo' : 'Photography'))}
            className="flex items-center gap-2 bg-[var(--primary)] text-white border-none rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer w-full md:w-auto justify-center"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
          >
            <Plus size={16} /> New {mainTab === 'weddings' ? 'Wedding' : 'Session'}
          </button>
        </div>
      </div>

      <div className="glass-panel p-0 overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Main Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
          <button
            onClick={() => setMainTab('sessions')}
            style={{ padding: "1rem 1.5rem", fontWeight: 700, borderBottom: mainTab === "sessions" ? "2px solid var(--primary)" : "2px solid transparent", color: mainTab === "sessions" ? "var(--primary)" : "var(--muted)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}
          >
            Sessions
          </button>
          <button
            onClick={() => setMainTab('weddings')}
            style={{ padding: "1rem 1.5rem", fontWeight: 700, borderBottom: mainTab === "weddings" ? "2px solid var(--primary)" : "2px solid transparent", color: mainTab === "weddings" ? "var(--primary)" : "var(--muted)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}
          >
            Weddings
          </button>
          <button
            onClick={() => setMainTab('packages')}
            style={{ padding: "1rem 1.5rem", fontWeight: 700, borderBottom: mainTab === "packages" ? "2px solid var(--primary)" : "2px solid transparent", color: mainTab === "packages" ? "var(--primary)" : "var(--muted)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}
          >
            Packages
          </button>
        </div>

        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
      {(mainTab === 'sessions' || mainTab === 'weddings') && (
        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">

        {/* Left: Service Categories */}
        <div className="w-full md:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Types</p>
            </div>
            {serviceTypes.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No services yet</div>
            ) : (
              serviceTypes.map(st => {
                const count = sessions.filter(s => s.Service_Type === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setSelectedService(st)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.85rem 1rem', border: 'none', borderBottom: '1px solid #f1f5f9',
                      backgroundColor: selectedService === st ? '#f0fdf4' : 'white',
                      color: selectedService === st ? 'var(--primary)' : '#334155',
                      fontWeight: selectedService === st ? 700 : 500, cursor: 'pointer',
                      textAlign: 'left', fontSize: '0.875rem', transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ color: selectedService === st ? 'var(--primary)' : '#64748b' }}>{getServiceIcon(st)}</span>
                    <span style={{ flex: 1 }}>{st}</span>
                    <span style={{ fontSize: '0.7rem', backgroundColor: selectedService === st ? '#dcfce7' : '#f1f5f9', color: selectedService === st ? 'var(--primary)' : '#64748b', borderRadius: '9999px', padding: '0.15rem 0.5rem', fontWeight: 700 }}>{count}</span>
                  </button>
                );
              })
            )}
            {/* Add a brand new service type */}
            <button
              onClick={() => { setSessionForm({ ...defaultSessionForm }); setShowSessionForm(true); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: 'none', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              <Plus size={14} /> Add Service Type
            </button>
          </div>
        </div>

        {/* Right: Sessions for selected service */}
        <div className="flex-1 min-w-0">
          {!selectedService && sessions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <Camera size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
              <h3 style={{ margin: 0, color: '#334155', fontWeight: 700 }}>No sessions yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>Create your first session to set up a public booking page.</p>
              <button onClick={() => openNewSession('Photography')} style={{ marginTop: '1rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.6rem 1.2rem', fontWeight: 600, cursor: 'pointer' }}>
                Create Session
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSessions.map(session => (
                <div
                  key={session.Session_ID}
                  style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: activePanel?.Session_ID === session.Session_ID ? '2px solid var(--primary)' : '1px solid #e2e8f0', overflow: 'hidden', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  {/* Cover image strip */}
                  <div style={{ height: '80px', backgroundColor: session.Cover_Image ? 'transparent' : '#f1f5f9', backgroundImage: session.Cover_Image ? `url(${session.Cover_Image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    {!session.Cover_Image && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={28} style={{ color: '#cbd5e1' }} /></div>}
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: session.Is_Public ? '#dcfce7' : '#fee2e2', color: session.Is_Public ? '#15803d' : '#dc2626' }}>
                        {session.Is_Public ? '● Public' : '● Private'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{session.Session_Type}</h3>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>{session.Service_Type}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button onClick={() => openEditSession(session)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}><Edit3 size={14} /></button>
                        <button onClick={() => deleteSession(session.Session_ID)} style={{ background: confirmDelete === `sess-${session.Session_ID}` ? '#dc2626' : 'none', border: 'none', color: confirmDelete === `sess-${session.Session_ID}` ? 'white' : '#94a3b8', cursor: 'pointer', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                          {confirmDelete === `sess-${session.Session_ID}` ? 'Confirm?' : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>

                    {mainTab !== 'weddings' && (
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#475569' }}>
                          <Clock size={12} />{session.Duration_Minutes || 60} min
                        </span>
                        {session.Location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#475569' }}>
                            <MapPin size={12} />{session.Location}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      {mainTab !== 'weddings' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#475569' }}>
                          <Calendar size={12} />{(session.Session_Time_Slots || []).length} time slot{(session.Session_Time_Slots || []).length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#475569' }}>
                        <PackageIcon size={12} />{(session.Packages || []).length} package{(session.Packages || []).length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => { setActivePanel(session); setPanelTab('general'); }}
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '0.375rem', border: '1px solid #e2e8f0', backgroundColor: activePanel?.Session_ID === session.Session_ID ? 'var(--primary)' : 'white', color: activePanel?.Session_ID === session.Session_ID ? 'white' : '#334155', cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        Manage
                      </button>
                      {session.Slug && (
                        <button
                          onClick={() => copyLink(session.Slug)}
                          title="Copy public booking link"
                          style={{ padding: '0.45rem 0.7rem', fontSize: '0.8rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          {copied ? <Check size={14} style={{ color: 'var(--primary)' }} /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add session card */}
              <button
                onClick={() => openNewSession(selectedService)}
                style={{ backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '2px dashed #cbd5e1', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: '#94a3b8', minHeight: '200px', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <Plus size={28} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>New Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {mainTab === 'packages' && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          {allPackages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-72 bg-white rounded-xl border border-slate-200">
              <PackageIcon size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
              <h3 style={{ margin: 0, color: '#334155', fontWeight: 700 }}>No packages yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>Create pricing packages to attach to your sessions.</p>
              <button onClick={() => { setPackageForm({ ...defaultPackageForm }); setShowPackageForm(true); }} style={{ marginTop: '1rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.6rem 1.2rem', fontWeight: 600, cursor: 'pointer' }}>
                Add Package
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {allPackages.map(pkg => {
                let items: string[] = [];
                try { items = JSON.parse(pkg.Items || '[]'); } catch { items = (pkg.Items || '').split('\n').filter(Boolean); }
                return (
                  <div key={pkg.Package_ID} style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{pkg.sessionName}</div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{pkg.Name}</h3>
                        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem', marginTop: '0.25rem' }}>${pkg.Price}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button onClick={() => { setPackageForm({ id: pkg.Package_ID, sessionId: pkg.sessionId, name: pkg.Name, duration: pkg.Duration, items: items.join('\n'), description: pkg.Description, price: pkg.Price }); setShowPackageForm(true); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', color: '#64748b', cursor: 'pointer', padding: '0.35rem' }}><Edit3 size={14} /></button>
                        <button onClick={() => deletePackage(pkg.Package_ID)} style={{ background: confirmDelete === `pkg-${pkg.Package_ID}` ? '#dc2626' : '#f8fafc', border: confirmDelete === `pkg-${pkg.Package_ID}` ? 'none' : '1px solid #e2e8f0', color: confirmDelete === `pkg-${pkg.Package_ID}` ? 'white' : '#64748b', cursor: 'pointer', padding: '0.35rem', borderRadius: '0.375rem' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {pkg.Duration && <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> {pkg.Duration}</div>}
                    {pkg.Description && <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>{pkg.Description}</p>}
                    {items.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                        {items.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
      </div>

      {/* Slide-out Panel ── OVERLAY MANAGEMENT PANEL (Drawer) ─────────────────── */}
      {activePanel && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-900/45 flex justify-end animate-fade-in backdrop-blur-sm" style={{ zIndex: 1000 }}>
          <div className="w-full max-w-[480px] bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.15)] flex flex-col h-full animate-[slideInRight_0.25s_cubic-bezier(0.16,1,0.3,1)]">
          {/* Panel header */}
          <div className="p-5 border-b border-slate-200 flex justify-between items-center shrink-0">
            <div>
              <h2 className="m-0 text-lg font-bold text-slate-900">{activePanel.Session_Type}</h2>
              <p className="m-0 mt-1 text-xs text-slate-500">{activePanel.Service_Type}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {activePanel.Slug && (
                <a href={getBookingUrl(activePanel.Slug)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                  <Link size={13} /> View Page
                </a>
              )}
              <button onClick={() => setActivePanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
          </div>

          {/* Panel tabs */}
          <div className="flex border-b border-slate-200 shrink-0 overflow-x-auto whitespace-nowrap">
            {(['general', 'availability', 'packages', 'bookings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setPanelTab(tab)}
                style={{ flex: 1, padding: '0.75rem 0.5rem', border: 'none', borderBottom: panelTab === tab ? '2px solid var(--primary)' : '2px solid transparent', backgroundColor: 'transparent', color: panelTab === tab ? 'var(--primary)' : '#64748b', fontWeight: panelTab === tab ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">

            {/* ── GENERAL TAB ── */}
            {panelTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '0.4rem' }}>Session Name</label>
                  <div style={{ padding: '0.6rem 0.8rem', backgroundColor: '#f8fafc', borderRadius: '0.4rem', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '0.9rem' }}>{activePanel.Session_Type}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '0.4rem' }}>Public Booking Link</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', backgroundColor: '#f8fafc', borderRadius: '0.4rem', border: '1px solid #e2e8f0' }}>
                    <Globe size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', color: '#475569', flex: 1, wordBreak: 'break-all' }}>
                      {activePanel.Slug ? getBookingUrl(activePanel.Slug) : `${baseUrl}/book/...`}
                    </span>
                    {activePanel.Slug && (
                      <button onClick={() => copyLink(activePanel.Slug)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }}>
                        {copied ? <Check size={14} style={{ color: 'var(--primary)' }} /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '0.4rem' }}>Duration</label>
                    <div style={{ padding: '0.6rem 0.8rem', backgroundColor: '#f8fafc', borderRadius: '0.4rem', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>{activePanel.Duration_Minutes === 0 ? 'Full Day / Event Only' : `${activePanel.Duration_Minutes || 60} minutes`}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '0.4rem' }}>Status</label>
                    <div style={{ padding: '0.6rem 0.8rem', backgroundColor: '#f8fafc', borderRadius: '0.4rem', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: activePanel.Is_Public ? '#15803d' : '#dc2626' }}>
                      {activePanel.Is_Public ? '● Public' : '● Private'}
                    </div>
                  </div>
                </div>
                {activePanel.Location && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '0.4rem' }}>Location</label>
                    <div style={{ padding: '0.6rem 0.8rem', backgroundColor: '#f8fafc', borderRadius: '0.4rem', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>{activePanel.Location}</div>
                  </div>
                )}
                {activePanel.Description && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginBottom: '0.4rem' }}>Description</label>
                    <div style={{ padding: '0.6rem 0.8rem', backgroundColor: '#f8fafc', borderRadius: '0.4rem', border: '1px solid #e2e8f0', fontSize: '0.9rem', lineHeight: 1.5 }}>{activePanel.Description}</div>
                  </div>
                )}
                <button
                  onClick={() => openEditSession(activePanel)}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', backgroundColor: 'white', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Edit3 size={14} /> Edit Session Details
                </button>
              </div>
            )}

            {/* ── AVAILABILITY TAB ── */}
            {panelTab === 'availability' && (
              <div>
                {mainTab === 'weddings' ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <div style={{ width: '48px', height: '48px', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <Calendar size={24} />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Wedding Availability</h3>
                    <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                      Weddings do not use recurring time slots. To block off dates or manage your wedding schedule, please use your main CRM calendar.
                    </p>
                    <a href="/dashboard/calendar" style={{ display: 'inline-block', padding: '0.6rem 1.2rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                      Open Main Calendar
                    </a>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Weekly Time Slots</h3>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>Add the days and times clients can book this session.</p>
                      </div>
                      <button
                        onClick={() => setShowSlotForm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Plus size={14} /> Add Slot
                      </button>
                    </div>

                    {/* Slots grouped by day */}
                    {DAY_NAMES.map((day, dayIndex) => {
                      const daySlots = (activePanel.Session_Time_Slots || []).filter(s => s.Day_Of_Week === dayIndex);
                      if (daySlots.length === 0) return null;
                      return (
                        <div key={dayIndex} style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>{day}</div>
                          {daySlots.map(slot => (
                            <div key={slot.Slot_ID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.375rem', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#15803d' }}>
                                <Clock size={13} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
                                {slot.Start_Time} – {slot.End_Time}
                              </span>
                              <button onClick={() => deleteSlot(slot.Slot_ID)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={14} /></button>
                            </div>
                          ))}
                        </div>
                      );
                    })}

                    {(activePanel.Session_Time_Slots || []).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                        No time slots yet. Add your available days and hours.
                      </div>
                    )}

                    {/* Add slot inline form */}
                    {showSlotForm && (
                      <form onSubmit={addSlot} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ margin: '0 0 0.75rem', fontWeight: 700, fontSize: '0.85rem' }}>Add Time Slot</p>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Day of Week</label>
                          <select
                            value={slotForm.dayOfWeek}
                            onChange={e => setSlotForm(p => ({ ...p, dayOfWeek: parseInt(e.target.value) }))}
                            className="input" style={{ width: '100%' }}
                          >
                            {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Start Time</label>
                            <input type="time" value={slotForm.startTime} onChange={e => setSlotForm(p => ({ ...p, startTime: e.target.value }))} className="input" style={{ width: '100%' }} required />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>End Time</label>
                            <input type="time" value={slotForm.endTime} onChange={e => setSlotForm(p => ({ ...p, endTime: e.target.value }))} className="input" style={{ width: '100%' }} required />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" onClick={() => setShowSlotForm(false)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Cancel</button>
                          <button type="submit" style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '0.375rem', backgroundColor: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Save Slot</button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── PACKAGES TAB ── */}
            {panelTab === 'packages' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Pricing Packages</h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>Add pricing tiers for this session.</p>
                  </div>
                  <button
                    onClick={() => { setPackageForm({ ...defaultPackageForm, sessionId: activePanel.Session_ID }); setShowPackageForm(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Plus size={14} /> Add Package
                  </button>
                </div>

                {(activePanel.Packages || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>No packages yet.</div>
                ) : (
                  (activePanel.Packages || []).map(pkg => {
                    let items: string[] = [];
                    try { items = JSON.parse(pkg.Items || '[]'); } catch { items = (pkg.Items || '').split('\n').filter(Boolean); }
                    return (
                      <div key={pkg.Package_ID} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{pkg.Name}</div>
                            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>${pkg.Price}</div>
                            {pkg.Duration && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>⏱ {pkg.Duration}</div>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button onClick={() => { setPackageForm({ id: pkg.Package_ID, sessionId: activePanel.Session_ID, name: pkg.Name, duration: pkg.Duration, items: items.join('\n'), description: pkg.Description, price: pkg.Price }); setShowPackageForm(true); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Edit3 size={14} /></button>
                            <button onClick={() => deletePackage(pkg.Package_ID)} style={{ background: confirmDelete === `pkg-${pkg.Package_ID}` ? '#dc2626' : 'none', border: 'none', color: confirmDelete === `pkg-${pkg.Package_ID}` ? 'white' : '#94a3b8', cursor: 'pointer', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                              {confirmDelete === `pkg-${pkg.Package_ID}` ? 'Confirm?' : <Trash2 size={14} />}
                            </button>
                          </div>
                        </div>
                        {items.length > 0 && <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem', fontSize: '0.78rem', color: '#475569' }}>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── BOOKINGS TAB ── */}
            {panelTab === 'bookings' && (
              <div>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Session Bookings</h3>
                {panelBookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>No bookings yet for this session.</div>
                ) : (
                  panelBookings.map(b => (
                    <div key={b.Booking_ID} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.Client_Name}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: b.Status === 'Approved' ? '#dcfce7' : b.Status === 'Declined' ? '#fee2e2' : '#fef3c7', color: b.Status === 'Approved' ? '#15803d' : b.Status === 'Declined' ? '#dc2626' : '#b45309' }}>
                          {b.Status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.25rem' }}>{b.Client_Email} {b.Client_Phone ? `· ${b.Client_Phone}` : ''}</div>
                      <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                        📅 {b.Booked_Date} at {b.Booked_Time}
                      </div>
                      {b.Notes && <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.4rem', fontStyle: 'italic' }}>{b.Notes}</div>}
                      {b.Status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <button onClick={() => updateBookingStatus(b.Booking_ID, 'Approved')} style={{ flex: 1, padding: '0.4rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>✓ Approve</button>
                          <button onClick={() => updateBookingStatus(b.Booking_ID, 'Declined')} style={{ flex: 1, padding: '0.4rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>✕ Decline</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>, document.body)}

      {/* ── SESSION FORM MODAL ── */}
      {showSessionForm && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{sessionForm.id ? 'Edit Session' : 'New Session'}</h2>
              <button onClick={() => setShowSessionForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            <form onSubmit={saveSession}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Service Type</label>
                  <select value={sessionForm.serviceType} onChange={e => setSessionForm(p => ({ ...p, serviceType: e.target.value }))} className="input" style={{ width: '100%' }}>
                    {(mainTab === 'weddings' ? WEDDING_SERVICE_TYPES : SERVICE_TYPES).map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                {mainTab !== 'weddings' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Session Name *</label>
                    <input value={sessionForm.sessionType} onChange={e => { const v = e.target.value; setSessionForm(p => ({ ...p, sessionType: v, slug: p.slugDirty ? p.slug : v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })); }} className="input" style={{ width: '100%' }} placeholder="e.g. Portrait Session, Family Session" required />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Booking URL Slug *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.4rem', fontSize: '0.875rem', backgroundColor: '#f8fafc' }}>
                    <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {getBookingUrl('')}
                    </span>
                    <input value={sessionForm.slug} onChange={e => setSessionForm(p => ({ ...p, slugDirty: true, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: '0.875rem' }} placeholder="portrait-session" required />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                    {mainTab === 'weddings' && sessionForm.serviceType === 'Wedding Video' ? 'Cover Video URL' : 
                     mainTab === 'weddings' && sessionForm.serviceType === 'Wedding Content Creation' ? 'Cover Image / Video URL' : 
                     'Cover Image'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {sessionForm.coverImage && (
                      <div style={{ 
                        width: sessionForm.serviceType === 'Wedding Content Creation' ? '45px' : '80px', 
                        height: sessionForm.serviceType === 'Wedding Content Creation' ? '80px' : '45px', 
                        borderRadius: '0.4rem', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0', backgroundColor: '#000' 
                      }}>
                        {sessionForm.coverImage.startsWith('data:') || sessionForm.coverImage.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          <img src={sessionForm.coverImage} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6rem' }}>VIDEO</div>
                        )}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      {mainTab === 'weddings' && (sessionForm.serviceType === 'Wedding Video' || sessionForm.serviceType === 'Wedding Content Creation') ? (
                        <input 
                          type="url" 
                          value={sessionForm.coverImage.startsWith('data:') ? '' : sessionForm.coverImage} 
                          onChange={e => setSessionForm(p => ({ ...p, coverImage: e.target.value }))} 
                          className="input" 
                          style={{ width: '100%', fontSize: '0.875rem' }} 
                          placeholder="e.g. https://vimeo.com/..., https://youtube.com/..." 
                        />
                      ) : null}
                      
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', fontSize: '0.875rem', marginTop: mainTab === 'weddings' && (sessionForm.serviceType === 'Wedding Content Creation' || sessionForm.serviceType === 'Wedding Video') ? '0.5rem' : '0' }} />
                      
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>
                        {mainTab === 'weddings' && sessionForm.serviceType === 'Wedding Video' ? 'Required ratio 16:9.' : 
                         mainTab === 'weddings' && sessionForm.serviceType === 'Wedding Content Creation' ? 'Required ratio 9:16.' : 
                         'Optional. Recommended ratio 1:1 or 16:9.'}
                      </p>
                    </div>
                  </div>
                </div>
                {mainTab !== 'weddings' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Duration (minutes)</label>
                        <input type="number" value={sessionForm.durationMinutes} onChange={e => setSessionForm(p => ({ ...p, durationMinutes: parseInt(e.target.value) }))} className="input" style={{ width: '100%' }} min={0} max={960} />
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>(Set to 0 for full-day / event-date only bookings)</span>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Location</label>
                        <input value={sessionForm.location} onChange={e => setSessionForm(p => ({ ...p, location: e.target.value }))} className="input" style={{ width: '100%' }} placeholder="e.g. On Location, Studio" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Flat Price ($)</label>
                        <input type="number" value={sessionForm.price} onChange={e => setSessionForm(p => ({ ...p, price: parseFloat(e.target.value) }))} className="input" style={{ width: '100%' }} placeholder="0" min={0} step="0.01" />
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Used if no packages are attached</span>
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Description</label>
                  <textarea value={sessionForm.description} onChange={e => setSessionForm(p => ({ ...p, description: e.target.value }))} className="input" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} placeholder="Describe what this session includes..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Contract Template</label>
                  <select
                    className="input"
                    style={{ width: '100%' }}
                    value={
                      contractTemplates.find(t => t.Content === sessionForm.contractTemplate)
                        ? String(contractTemplates.find(t => t.Content === sessionForm.contractTemplate)!.Template_ID)
                        : sessionForm.contractTemplate ? 'custom' : ''
                    }
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setSessionForm(p => ({ ...p, contractTemplate: '' }));
                      } else if (val === 'custom') {
                        // DO NOTHING, keep legacy
                      } else {
                        const tmpl = contractTemplates.find(t => String(t.Template_ID) === val);
                        if (tmpl) {
                          setSessionForm(p => ({ ...p, contractTemplate: tmpl.Content }));
                        }
                      }
                    }}
                  >
                    <option value="">-- No Contract --</option>
                    {contractTemplates.map(t => (
                      <option key={t.Template_ID} value={String(t.Template_ID)}>{t.Name}</option>
                    ))}
                    {!contractTemplates.find(t => t.Content === sessionForm.contractTemplate) && sessionForm.contractTemplate && (
                      <option value="custom">Custom HTML (Legacy)</option>
                    )}
                  </select>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginTop: '0.4rem' }}>Select a contract created in the Pipeline Builder.</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Cover Image URL</label>
                  <input value={sessionForm.coverImage} onChange={e => setSessionForm(p => ({ ...p, coverImage: e.target.value }))} className="input" style={{ width: '100%' }} placeholder="https://..." />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input type="checkbox" id="isPublicCheck" checked={sessionForm.isPublic} onChange={e => setSessionForm(p => ({ ...p, isPublic: e.target.checked }))} style={{ width: '1rem', height: '1rem', accentColor: 'var(--primary)' }} />
                  <label htmlFor="isPublicCheck" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Make this session publicly bookable</label>
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowSessionForm(false)} style={{ padding: '0.6rem 1.2rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" disabled={savingSession} style={{ padding: '0.6rem 1.5rem', border: 'none', borderRadius: '0.5rem', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                  {savingSession ? 'Saving...' : sessionForm.id ? 'Save Changes' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* ── PACKAGE FORM MODAL ── */}
      {showPackageForm && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{packageForm.id ? 'Edit Package' : 'New Package'}</h2>
              <button onClick={() => setShowPackageForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            <form onSubmit={savePackage}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Session *</label>
                  <select value={packageForm.sessionId || ''} onChange={e => setPackageForm(p => ({ ...p, sessionId: parseInt(e.target.value) }))} className="input" style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', backgroundColor: 'white' }} required>
                    <option value="" disabled>Select a session</option>
                    {sessions.map(s => <option key={s.Session_ID} value={s.Session_ID}>{s.Session_Type} ({s.Service_Type})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Package Name *</label>
                  <input value={packageForm.name} onChange={e => setPackageForm(p => ({ ...p, name: e.target.value }))} className="input" style={{ width: '100%' }} placeholder="e.g. Essential, Premium, Deluxe" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Price ($) *</label>
                    <input type="number" value={packageForm.price} onChange={e => setPackageForm(p => ({ ...p, price: parseFloat(e.target.value) }))} className="input" style={{ width: '100%' }} min={0} step={0.01} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Duration</label>
                    <input value={packageForm.duration} onChange={e => setPackageForm(p => ({ ...p, duration: e.target.value }))} className="input" style={{ width: '100%' }} placeholder="e.g. 2 Hours" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Description</label>
                  <textarea value={packageForm.description} onChange={e => setPackageForm(p => ({ ...p, description: e.target.value }))} className="input" style={{ width: '100%', minHeight: '70px' }} placeholder="Optional description..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>Included Items (one per line)</label>
                  <textarea value={packageForm.items} onChange={e => setPackageForm(p => ({ ...p, items: e.target.value }))} className="input" style={{ width: '100%', minHeight: '80px' }} placeholder="Online gallery&#10;Edited images&#10;Print release" />
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPackageForm(false)} style={{ padding: '0.6rem 1.2rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.5rem', border: 'none', borderRadius: '0.5rem', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                  {packageForm.id ? 'Save Changes' : 'Add Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
