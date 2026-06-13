'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Clock, MapPin, ChevronLeft, ChevronRight, Check, CheckCircle, CreditCard, PenTool, Building2, Smartphone, Lock } from 'lucide-react';
import SignaturePad from 'signature_pad';

interface TimeSlot {
  Slot_ID: number;
  Day_Of_Week: number;
  Start_Time: string;
  End_Time: string;
}

interface Package {
  Package_ID: number;
  Name: string;
  Duration: string;
  Items: string;
  Description: string;
  Price: number;
}

interface Session {
  Session_ID: number;
  user_id: string;
  Session_Type: string;
  Service_Type: string;
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

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function generateTimeOptions(slots: TimeSlot[], dayOfWeek: number): string[] {
  const daySlots = slots.filter(s => s.Day_Of_Week === dayOfWeek);
  if (daySlots.length === 0) return [];
  const times: string[] = [];
  daySlots.forEach(slot => {
    const [startH, startM] = slot.Start_Time.split(':').map(Number);
    const [endH, endM] = slot.End_Time.split(':').map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;
    while (current < end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const label = `${h % 12 === 0 ? 12 : h % 12}:${m.toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
      times.push(label);
      current += 60; // 1-hour intervals
    }
  });
  return times;
}

const DEFAULT_PAYMENT_METHODS = [
  { id: 'card',  name: 'Credit Card',   icon: 'card',  details: '' },
  { id: 'bank',  name: 'Bank Transfer', icon: 'bank',  details: 'Bank: Chase\nAccount: 123456789\nRouting: 987654321' },
  { id: 'zelle', name: 'Zelle',         icon: 'zelle', details: 'payments@studio.com' },
];

function PaymentIcon({ iconId }: { iconId: string }) {
  if (iconId === 'card')  return <CreditCard size={20} />;
  if (iconId === 'bank')  return <Building2 size={20} />;
  if (iconId === 'zelle') return <Smartphone size={20} />;
  return <CreditCard size={20} />;
}

export default function BookSessionPage({ params }: { params: Promise<{ businessSlug: string, slug: string }> }) {
  const resolvedParams = React.use(params);
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [funnelSettings, setFunnelSettings] = useState<any>(null);

  type StepType = 'datetime' | 'details' | 'packages' | 'contract' | 'payment' | 'confirm';
  const [step, setStep] = useState<StepType>('datetime');
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [signature, setSignature] = useState('');
  const [showSigPad, setShowSigPad] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [hpValue, setHpValue] = useState('');

  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<any>(null);

  useEffect(() => {
    fetch(`/api/sessions?businessSlug=${resolvedParams.businessSlug}&slug=${resolvedParams.slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.session) {
          setSession(d.session);
          fetch(`/api/availability?userId=${d.session.user_id}`)
            .then(r => r.json())
            .then(av => { if (av.success) setBlockedDates(av.blockedDates || []); });
          
          fetch(`/api/public-booking?type=settings&userId=${d.session.user_id}`)
            .then(r => r.json())
            .then(fData => { if (fData.success) setFunnelSettings(fData.settings); })
            .catch(() => {});
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [resolvedParams.slug]);

  useEffect(() => {
    if (!showSigPad || !sigCanvasRef.current) return;
    const canvas = sigCanvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);
    
    if (sigPadRef.current) sigPadRef.current.off();
    sigPadRef.current = new SignaturePad(canvas, { penColor: '#0f172a' });
    
    return () => { if (sigPadRef.current) sigPadRef.current.off(); };
  }, [showSigPad]);

  const isDayAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0,0,0,0);
    if (date < today) return false;
    if (blockedDates.includes(dateStr)) return false;
    if (!session) return false;
    return (session.Session_Time_Slots || []).some(s => s.Day_Of_Week === dayOfWeek);
  };

  const handleDateClick = (dateStr: string, date: Date) => {
    if (!isDayAvailable(date)) return;
    setSelectedDate(dateStr);
    setSelectedTime(null);
  };

  const proceedFromDetails = () => {
    if (session?.Packages && session.Packages.length > 0) {
      setStep('packages');
    } else if (session?.Contract_Template) {
      setStep('contract');
    } else if (session?.Price && session.Price > 0) {
      setStep('payment');
    } else {
      handleSubmit(); // Direct submit if free and no contract
    }
  };

  const proceedFromPackages = () => {
    if (!selectedPackage) return;
    if (session?.Contract_Template) {
      setStep('contract');
    } else if (selectedPackage.Price > 0 || (session?.Price && session.Price > 0)) {
      setStep('payment');
    } else {
      handleSubmit();
    }
  };

  const proceedFromContract = () => {
    if (!signature) {
      alert("Please sign the contract.");
      return;
    }
    const price = selectedPackage ? selectedPackage.Price : (session?.Price || 0);
    if (price > 0) {
      setStep('payment');
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session || !selectedDate || !selectedTime) return;
    
    setSubmitting(true);
    const priceToPay = selectedPackage ? selectedPackage.Price : (session.Price || 0);
    
    const res = await fetch('/api/session-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.Session_ID,
        userId: session.user_id,
        clientName: form.name,
        clientEmail: form.email,
        clientPhone: form.phone,
        bookedDate: selectedDate,
        bookedTime: selectedTime,
        notes: form.notes,
        packageId: selectedPackage ? selectedPackage.Package_ID : null,
        contractHtml: session.Contract_Template ? getProcessedContractHtml() : null,
        signature: signature || null,
        amountPaid: priceToPay
      })
    });
    
    if (res.ok) {
      setStep('confirm');
    } else {
      const d = await res.json();
      alert(`Failed to submit: ${d.error || 'Unknown error'}`);
    }
    setSubmitting(false);
  };

  const getProcessedContractHtml = () => {
    if (!session || !session.Contract_Template) return '';
    let html = session.Contract_Template;
    const priceToPay = selectedPackage ? selectedPackage.Price : (session.Price || 0);
    const pkgName = selectedPackage ? selectedPackage.Name : session.Session_Type;
    
    html = html.replace(/\[CLIENT_NAME\]/g, form.name || '[Client Name]');
    html = html.replace(/\[DATE\]/g, selectedDate ? formatDisplayDate(selectedDate) : '[Date]');
    html = html.replace(/\[TIME\]/g, selectedTime || '[Time]');
    html = html.replace(/\[PACKAGE_NAME\]/g, pkgName);
    html = html.replace(/\[PRICE\]/g, `$${priceToPay.toFixed(2)}`);
    return html;
  };

  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const availableTimesForSelected = selectedDate
    ? generateTimeOptions(session?.Session_Time_Slots || [], new Date(selectedDate + 'T00:00:00').getDay())
    : [];

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const rawMethods: any[] = funnelSettings?.paymentMethods?.length > 0
    ? funnelSettings.paymentMethods.filter((m: any) => m.enabled !== false)
    : DEFAULT_PAYMENT_METHODS;
  const activeMethodId = selectedMethodId || rawMethods[0]?.id || '';
  const activeMethod = rawMethods.find(m => m.id === activeMethodId) || rawMethods[0];
  const isCardMethod = activeMethodId === 'card' || activeMethod?.type === 'card' || (!activeMethod?.details && activeMethodId !== 'zelle' && activeMethodId !== 'bank');

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}><p style={{ color: '#64748b', fontWeight: 600 }}>Loading session details...</p></div>;
  if (notFound || !session) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}><p style={{ color: '#ef4444', fontWeight: 600 }}>Session not found or unavailable.</p></div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '3rem 1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Header Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          {session.Cover_Image && (
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem', border: '4px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <img src={session.Cover_Image} alt={session.Session_Type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{session.Session_Type}</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>{session.Duration_Minutes} Minutes {session.Location ? `· ${session.Location}` : ''}</p>
          {session.Description && <p style={{ margin: '1rem auto 0', color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: '400px' }}>{session.Description}</p>}
        </div>

        {/* ── STEP 1: Date & Time ── */}
        {step === 'datetime' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Select Date & Time</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: typeof window !== 'undefined' && window.innerWidth > 600 ? 'row' : 'column' }}>
              {/* Calendar Column */}
              <div style={{ flex: 1, padding: '1.5rem', borderRight: typeof window !== 'undefined' && window.innerWidth > 600 ? '1px solid #e2e8f0' : 'none', borderBottom: typeof window !== 'undefined' && window.innerWidth <= 600 ? '1px solid #e2e8f0' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={20} /></button>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{MONTHS[month]} {year}</span>
                  <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronRight size={20} /></button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                  {DAYS.map(d => <div key={d} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{d[0]}</div>)}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const date = new Date(year, month, d);
                    const dateStr = `${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
                    const avail = isDayAvailable(date);
                    const selected = selectedDate === dateStr;
                    
                    return (
                      <button
                        key={d}
                        onClick={() => handleDateClick(dateStr, date)}
                        disabled={!avail}
                        style={{
                          aspectRatio: '1',
                          border: 'none',
                          borderRadius: '50%',
                          backgroundColor: selected ? '#0f172a' : avail ? '#f1f5f9' : 'transparent',
                          color: selected ? 'white' : avail ? '#0f172a' : '#cbd5e1',
                          fontWeight: selected || avail ? 700 : 400,
                          cursor: avail ? 'pointer' : 'not-allowed',
                          fontSize: '0.85rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Column */}
              <div style={{ width: typeof window !== 'undefined' && window.innerWidth > 600 ? '240px' : '100%', padding: '1.5rem', backgroundColor: '#fafaf9' }}>
                {selectedDate ? (
                  <>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{formatDisplayDate(selectedDate)}</h3>
                    {availableTimesForSelected.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {availableTimesForSelected.map(time => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            style={{
                              padding: '0.75rem 1rem',
                              backgroundColor: selectedTime === time ? '#0f172a' : 'white',
                              color: selectedTime === time ? 'white' : '#0f172a',
                              border: selectedTime === time ? '1px solid #0f172a' : '1px solid #cbd5e1',
                              borderRadius: '0.5rem',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s'
                            }}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No time slots available for this day.</p>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', textAlign: 'center', gap: '0.5rem' }}>
                    <Clock size={32} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Select a date to see available times</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setStep('details')}
                disabled={!selectedDate || !selectedTime}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  backgroundColor: selectedDate && selectedTime ? '#0f172a' : '#cbd5e1',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: selectedDate && selectedTime ? 'pointer' : 'not-allowed',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Details Form ── */}
        {step === 'details' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => setStep('datetime')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={18} /></button>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Your Details</h3>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>Full Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} placeholder="Jane Smith" required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>Email Address *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} placeholder="jane@example.com" required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>Phone Number</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} placeholder="(555) 000-0000" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>Notes / Special Requests</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }} placeholder="Anything we should know beforehand?" />
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={proceedFromDetails}
                disabled={!form.name || !form.email}
                style={{ width: '100%', padding: '0.85rem', border: 'none', borderRadius: '0.5rem', backgroundColor: form.name && form.email ? '#0f172a' : '#cbd5e1', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: form.name && form.email ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Packages ── */}
        {step === 'packages' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => setStep('details')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={18} /></button>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Select a Package</h3>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {session.Packages.map(pkg => (
                <div 
                  key={pkg.Package_ID}
                  onClick={() => setSelectedPackage(pkg)}
                  style={{
                    border: selectedPackage?.Package_ID === pkg.Package_ID ? '2px solid #0f172a' : '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: selectedPackage?.Package_ID === pkg.Package_ID ? '#f8fafc' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{pkg.Name}</h4>
                    <span style={{ fontWeight: 800, color: '#0d9488', fontSize: '1.1rem' }}>${pkg.Price}</span>
                  </div>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#64748b' }}>{pkg.Duration}</p>
                  
                  {pkg.Items && (
                    <ul style={{ margin: 0, padding: '0 0 0 1.25rem', color: '#475569', fontSize: '0.85rem' }}>
                      {pkg.Items.split('\n').filter(Boolean).map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={proceedFromPackages}
                disabled={!selectedPackage}
                style={{ width: '100%', padding: '0.85rem', border: 'none', borderRadius: '0.5rem', backgroundColor: selectedPackage ? '#0f172a' : '#cbd5e1', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: selectedPackage ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Contract ── */}
        {step === 'contract' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => {
                if (session.Packages && session.Packages.length > 0) setStep('packages');
                else setStep('details');
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={18} /></button>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Digital Contract</h3>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div 
                style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}
                dangerouslySetInnerHTML={{ __html: getProcessedContractHtml() }}
              />
              
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.5rem' }}>Your Signature</label>
                {!showSigPad ? (
                  <button 
                    onClick={() => setShowSigPad(true)} 
                    style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: 'white', border: '2px dashed #cbd5e1', borderRadius: '0.5rem', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <PenTool size={18} /> Click here to sign
                  </button>
                ) : (
                  <div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'white' }}>
                      <canvas ref={sigCanvasRef} style={{ width: '100%', height: '150px', display: 'block' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button 
                        onClick={() => {
                          if (sigPadRef.current) sigPadRef.current.clear();
                          setSignature('');
                        }} 
                        style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem', backgroundColor: 'white', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                      <button 
                        onClick={() => {
                          if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
                            setSignature(sigPadRef.current.toDataURL());
                            setShowSigPad(false);
                          }
                        }} 
                        style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '0.25rem', backgroundColor: '#0f172a', color: 'white', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Save Signature
                      </button>
                    </div>
                  </div>
                )}

                {signature && !showSigPad && (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Signature Saved:</p>
                    <img src={signature} alt="Signature" style={{ maxHeight: '60px', borderBottom: '1px solid #0f172a' }} />
                    <button onClick={() => { setSignature(''); setShowSigPad(true); }} style={{ display: 'block', margin: '0.5rem auto 0', background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.8rem', cursor: 'pointer' }}>Edit Signature</button>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={proceedFromContract}
                disabled={!signature}
                style={{ width: '100%', padding: '0.85rem', border: 'none', borderRadius: '0.5rem', backgroundColor: signature ? '#0f172a' : '#cbd5e1', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: signature ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Agree & Continue
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Payment ── */}
        {step === 'payment' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => {
                if (session.Contract_Template) setStep('contract');
                else if (session.Packages && session.Packages.length > 0) setStep('packages');
                else setStep('details');
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={18} /></button>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Payment</h3>
            </div>
            
            <div style={{ padding: '2rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                ${(selectedPackage ? selectedPackage.Price : (session.Price || 0)).toFixed(2)}
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Total due today for <strong>{selectedPackage ? selectedPackage.Name : session.Session_Type}</strong></p>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {rawMethods.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethodId(m.id)}
                    style={{
                      flex: 1, minWidth: '80px', padding: '12px 10px',
                      border: activeMethodId === m.id ? '2px solid #0f172a' : '1px solid #e2e8f0',
                      background: activeMethodId === m.id ? '#f8fafc' : '#fff',
                      borderRadius: '0.5rem', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      color: activeMethodId === m.id ? '#0f172a' : '#64748b',
                      transition: 'all 0.2s'
                    }}
                  >
                    <PaymentIcon iconId={m.icon || m.id} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{m.name}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <input 
                  type="text" 
                  name="website_url_payment" 
                  style={{ display: 'none', visibility: 'hidden', opacity: 0, position: 'absolute', left: '-9999px' }} 
                  tabIndex={-1} 
                  autoComplete="off" 
                  value={hpValue} 
                  onChange={(e) => setHpValue(e.target.value)} 
                />
                
                {isCardMethod ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>Cardholder Name</label>
                      <input required placeholder="Jordan Smith" style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>Card Number</label>
                      <div style={{ position: 'relative' }}>
                        <input required placeholder="0000 0000 0000 0000" style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} maxLength={19} />
                        <CreditCard size={16} color="#9ca3af" style={{ position: 'absolute', right: 14, top: 14 }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>Expiration</label>
                        <input required placeholder="MM/YY" style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} maxLength={5} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>CVC</label>
                        <input required placeholder="123" type="password" style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} maxLength={4} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1rem', lineHeight: 1.5 }}>
                      Please send your payment using the details below. Include your name in the reference.
                    </p>
                    {activeMethod?.details?.split('\n').map((line: string, i: number) => (
                      <div key={i} style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, marginBottom: '0.25rem' }}>{line}</div>
                    ))}
                  </div>
                )}
                
                <div style={{ marginTop: '1.5rem' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ width: '100%', padding: '0.85rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#0f172a', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {submitting ? 'Processing...' : isCardMethod ? `Pay $${(selectedPackage ? selectedPackage.Price : (session.Price || 0)).toFixed(2)}` : 'I Have Sent Payment'}
                    {!submitting && <Lock size={16} />}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Lock size={12} /> Secure encrypted checkout
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── STEP 6: Confirmation ── */}
        {step === 'confirm' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Check size={32} style={{ color: '#15803d' }} />
            </div>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Booking Confirmed!</h2>
            <p style={{ margin: '0 0 2rem', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Thank you, <strong>{form.name}</strong>! Your session is officially booked for <strong>{formatDisplayDate(selectedDate!)} at {selectedTime}</strong>.
            </p>
            <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'inline-block', textAlign: 'left', minWidth: '280px', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Booking Summary</p>
              <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>{selectedPackage ? selectedPackage.Name : session.Session_Type}</p>
              <p style={{ margin: '0 0 0.25rem', color: '#475569', fontSize: '0.875rem' }}>{formatDisplayDate(selectedDate!)}</p>
              <p style={{ margin: '0 0 0.5rem', color: '#475569', fontSize: '0.875rem' }}>{selectedTime}</p>
              
              <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0.75rem 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>Total Paid</span>
                <span style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 800 }}>
                  ${(selectedPackage ? selectedPackage.Price : (session.Price || 0)).toFixed(2)}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              A confirmation receipt and copy of your contract have been sent to <strong>{form.email}</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
