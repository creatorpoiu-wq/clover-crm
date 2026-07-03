'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Clock, MapPin, ChevronLeft, ChevronRight, Check, CheckCircle, CheckCircle2, CreditCard, PenTool, Building2, Smartphone, Lock, ArrowRight, Star, Calendar, FileSignature } from 'lucide-react';
import SignaturePad from 'signature_pad';
import { getEmbedUrl } from '@/utils/embed';
import PaymentInstruction from '@/components/PaymentInstruction';
import PayPalCheckoutButton from '@/components/PayPalCheckoutButton';
import { processContractVariables, syncContractFormDOM } from '@/lib/processContract';

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
  { id: 'card',   name: 'Credit Card',   icon: 'card',   details: '' },
  { id: 'bank',   name: 'Bank Transfer', icon: 'bank',   details: 'Bank: Chase\nAccount: 123456789\nRouting: 987654321' },
  { id: 'zelle',  name: 'Zelle',         icon: 'zelle',  details: 'payments@studio.com' },
  { id: 'paypal', name: 'PayPal',        icon: 'paypal', details: 'paypal.me/studio' },
  { id: 'venmo',  name: 'Venmo',         icon: 'venmo',  details: 'venmo.com/studio' },
  { id: 'square', name: 'Square',        icon: 'square', details: 'square.link/studio' },
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

  type StepType = 'welcome' | 'datetime' | 'details' | 'packages' | 'contract' | 'payment' | 'confirm';
  const [step, setStep] = useState<StepType>('datetime');
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [signature, setSignature] = useState('');
  const [showSigPad, setShowSigPad] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [hpValue, setHpValue] = useState('');

  const contractContainerRef = useRef<HTMLDivElement>(null);
  const [syncedContractHtml, setSyncedContractHtml] = useState<string | null>(null);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<any>(null);

  useEffect(() => {
    fetch(`/api/sessions?businessSlug=${resolvedParams.businessSlug}&slug=${resolvedParams.slug}`)
      .then(r => r.json())
      .then(async d => {
        if (d.success && d.session) {
          setSession(d.session);
          const _isWedding = d.session.Service_Type?.toLowerCase().includes('wedding') || d.session.Session_Type?.toLowerCase().includes('wedding');
          if (_isWedding) {
            setStep('welcome');
          }
          
          const avFetch = fetch(`/api/availability?userId=${d.session.user_id}`).then(r => r.json());
          const fsFetch = fetch(`/api/public-booking?type=settings&userId=${d.session.user_id}`).then(r => r.json());

          try {
            const [avData, fData] = await Promise.all([avFetch, fsFetch]);
            if (avData.success) setBlockedDates(avData.blockedDates || []);
            if (fData.success) {
              setFunnelSettings(fData.settings);
              if (!d.session.Contract_Template && fData.settings.contractTemplateId) {
                const ctFetch = await fetch(`/api/public-booking?type=contract_template&templateId=${fData.settings.contractTemplateId}`).then(r => r.json());
                if (ctFetch.success && ctFetch.template) {
                  setSession(prev => prev ? { ...prev, Contract_Template: ctFetch.template.Content } : prev);
                }
              }
            }
          } catch (e) {
            console.error('Error fetching supplementary data:', e);
          }
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [resolvedParams.businessSlug, resolvedParams.slug]);

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

  const isWedding = session?.Service_Type?.toLowerCase().includes('wedding') || session?.Session_Type?.toLowerCase().includes('wedding');

  const isDayAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0,0,0,0);
    if (date < today) return false;
    if (blockedDates.includes(dateStr)) return false;
    if (!session) return false;
    if (isWedding) return true;
    return (session.Session_Time_Slots || []).some(s => s.Day_Of_Week === dayOfWeek);
  };

  const handleDateClick = (dateStr: string, date: Date) => {
    if (!isDayAvailable(date)) return;
    setSelectedDate(dateStr);
    setSelectedTime(null);
  };

  const proceedFromDetails = () => {
    const addonsTotal = selectedAddons.reduce((sum, id) => {
      const addon = funnelSettings?.addons?.find((a: any) => a.id === id);
      return sum + (addon ? Number(addon.price) : 0);
    }, 0);
    const basePrice = selectedPackage?.Price || session?.Price || 0;
    const total = basePrice + addonsTotal;

    if (isWedding) {
      if (session?.Contract_Template) {
        setStep('contract');
      } else if (total > 0) {
        setStep('payment');
      } else {
        handleSubmit();
      }
    } else {
      if (session?.Packages && session.Packages.length > 0) {
        setStep('packages');
      } else if (session?.Contract_Template) {
        setStep('contract');
      } else if (total > 0) {
        setStep('payment');
      } else {
        handleSubmit();
      }
    }
  };

  const proceedFromPackages = () => {
    if (!selectedPackage) return;
    const addonsTotal = selectedAddons.reduce((sum, id) => {
      const addon = funnelSettings?.addons?.find((a: any) => a.id === id);
      return sum + (addon ? Number(addon.price) : 0);
    }, 0);
    const total = selectedPackage.Price + addonsTotal;

    if (isWedding) {
      setStep('datetime');
    } else {
      if (session?.Contract_Template) {
        setStep('contract');
      } else if (total > 0) {
        setStep('payment');
      } else {
        handleSubmit();
      }
    }
  };

  const syncAndSaveDOM = () => {
    if (!contractContainerRef.current) return;
    syncContractFormDOM(contractContainerRef.current);
    const html = contractContainerRef.current.innerHTML;
    if (session && session.Contract_Template) {
      setSession((prev: any) => prev ? { ...prev, Contract_Template: html } : prev);
    }
  };

  const proceedFromContract = () => {
    if (!signature) {
      alert("Please sign the contract.");
      return;
    }
    syncAndSaveDOM();
    const finalHtml = contractContainerRef.current ? contractContainerRef.current.innerHTML : getProcessedContractHtml();
    setSyncedContractHtml(finalHtml);

    const addonsTotal = selectedAddons.reduce((sum, id) => {
      const addon = funnelSettings?.addons?.find((a: any) => a.id === id);
      return sum + (addon ? Number(addon.price) : 0);
    }, 0);
    const total = (selectedPackage ? selectedPackage.Price : (session?.Price || 0)) + addonsTotal;

    if (total > 0) {
      setStep('payment');
    } else {
      handleSubmit(undefined, finalHtml);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, overrideContractHtml?: string | null) => {
    if (e) e.preventDefault();
    if (!session || !selectedDate || !selectedTime) return;
    
    setSubmitting(true);
    const addonsTotal = selectedAddons.reduce((sum, id) => {
      const addon = funnelSettings?.addons?.find((a: any) => a.id === id);
      return sum + (addon ? Number(addon.price) : 0);
    }, 0);
    const priceToPay = (selectedPackage ? selectedPackage.Price : (session.Price || 0)) + addonsTotal;
    
    const addonNames = selectedAddons.map(id => funnelSettings?.addons?.find((a: any) => a.id === id)?.name).filter(Boolean);
    const finalNotes = addonNames.length > 0 
      ? `${form.notes}\n\nSelected Add-ons: ${addonNames.join(', ')}` 
      : form.notes;

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
        notes: finalNotes,
        packageId: selectedPackage ? selectedPackage.Package_ID : null,
        contractHtml: session.Contract_Template ? (overrideContractHtml || syncedContractHtml || getProcessedContractHtml()) : null,
        signature: signature || null,
        amountPaid: priceToPay,
        endTime: isWedding && selectedPackage ? getEndTime(selectedTime, parseDurationHours(selectedPackage.Duration), false) : null
      })
    });
    
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      if (d && d.portalLink) setPortalLink(d.portalLink);
      setStep('confirm');
    } else {
      const d = await res.json();
      alert(`Failed to submit: ${d.error || 'Unknown error'}`);
    }
    setSubmitting(false);
  };

  const getProcessedContractHtml = () => {
    if (!session || !session.Contract_Template) return '';
    const addonsTotal = selectedAddons.reduce((sum, id) => {
      const addon = funnelSettings?.addons?.find((a: any) => a.id === id);
      return sum + (addon ? Number(addon.price) : 0);
    }, 0);
    const priceToPay = (selectedPackage ? selectedPackage.Price : (session.Price || 0)) + addonsTotal;
    
    const addonNames = selectedAddons.map(id => funnelSettings?.addons?.find((a: any) => a.id === id)?.name).filter(Boolean);
    let pkgName = selectedPackage ? selectedPackage.Name : session.Session_Type;
    if (addonNames.length > 0) pkgName += ` + ${addonNames.join(', ')}`;
    
    const clientName = form.name || '[Client Name]';
    const displayDate = selectedDate ? formatDisplayDate(selectedDate) : '[Date]';
    const displayTime = isWedding && selectedTime ? getStartTimeFormatted(selectedTime) : (selectedTime || '[Time]');

    return processContractVariables(session.Contract_Template, {
      clientName,
      clientEmail: form.email,
      clientPhone: form.phone,
      eventDate: displayDate,
      eventTime: displayTime,
      packageName: pkgName,
      totalAmount: priceToPay,
      retainerAmount: priceToPay * 0.5,
      todayDate: new Date().toLocaleDateString(),
      customAnswers: { ...form }
    });
  };

  const parseDurationHours = (durationStr: string) => {
    if (!durationStr) return 0;
    const match = durationStr.match(/([\d.]+)/);
    if (match) return parseFloat(match[1]);
    return 0;
  };

  const getEndTime = (startTime: string, durationHours: number, formatted = true) => {
    if (!startTime) return '';
    let hStr = '0', mStr = '0';
    if (startTime.includes(':') && startTime.includes(' ')) {
      // standard 12-hour
      const [time, period] = startTime.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      hStr = h.toString(); mStr = m.toString();
    } else {
      // 24-hour input type="time"
      [hStr, mStr] = startTime.split(':');
    }
    
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const totalMinutes = h * 60 + m + durationHours * 60;
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    
    if (!formatted) {
      return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}:00`;
    }

    const period = newH >= 12 && newH < 24 ? 'PM' : 'AM';
    const displayH = newH % 12 === 0 ? 12 : newH % 12;
    const displayM = newM.toString().padStart(2, '0');
    return `${displayH}:${displayM} ${period}`;
  };

  const getStartTimeFormatted = (startTime: string) => {
    if (!startTime) return '';
    if (startTime.includes(' ')) return startTime; // already formatted
    const [hStr, mStr] = startTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const period = h >= 12 && h < 24 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m.toString().padStart(2, '0');
    return `${displayH}:${displayM} ${period}`;
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
        {step !== 'welcome' && (
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            {session.Cover_Image && (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem', border: '4px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                {session.Cover_Image.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={session.Cover_Image} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={session.Cover_Image} alt={session.Session_Type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            )}
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{session.Session_Type}</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
              {!isWedding && `${session.Duration_Minutes} Minutes `}
              {session.Location ? (!isWedding ? `· ${session.Location}` : session.Location) : ''}
            </p>
            {session.Description && <p style={{ margin: '1rem auto 0', color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: '400px' }}>{session.Description}</p>}
          </div>
        )}

        {/* ── STEP 0: Welcome ── */}
        {step === 'welcome' && (
          <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', margin: '-3rem -1rem', width: 'calc(100% + 2rem)' }}>
            <header style={{
              position: 'relative',
              width: '100%',
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              zIndex: 50
            }}>
              {session.Cover_Image && (
                <img
                  src={session.Cover_Image}
                  alt="Hero"
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center',
                  }}
                />
              )}
              <div style={{
                position: 'absolute', inset: 0,
                background: session.Cover_Image
                  ? 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.65) 100%)'
                  : 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
              }} />
              <div style={{
                position: 'relative', zIndex: 10, textAlign: 'center',
                padding: '8rem 1.5rem 5rem', maxWidth: '800px', margin: '0 auto',
              }}>
                <h1 style={{
                  fontWeight: 900, letterSpacing: '-0.04em', color: 'white',
                  marginBottom: '1.5rem', fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1.1,
                }}>
                  {funnelSettings?.welcomeHeroHeadline || `Welcome to your ${session.Session_Type} Booking`}
                </h1>
                <p style={{
                  fontSize: '1.25rem', color: 'rgba(255,255,255,0.75)',
                  fontWeight: 400, lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem',
                }}>
                  {funnelSettings?.welcomeHeroSubheadline || session.Description || 'We are thrilled to be part of your special day. Please proceed to select your package and secure your date.'}
                </p>
                <button
                  onClick={() => {
                    const hero = document.getElementById('funnel-scroll-target');
                    if (hero) hero.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '1rem', fontWeight: 700, padding: '1rem 2rem',
                    borderRadius: '9999px', backgroundColor: 'white', color: '#0f172a',
                    textDecoration: 'none', boxShadow: '0 10px 30px -5px rgba(255,255,255,0.3)',
                    border: 'none', cursor: 'pointer'
                  }}
                >
                  Explore Details <ArrowRight size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '0.5rem' }} />
                </button>
              </div>
              <div style={{
                position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', zIndex: 10
              }}>
                <span>Scroll to explore</span>
                <div style={{
                  width: '1px', height: '2rem',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                }} />
              </div>
            </header>

            <div id="funnel-scroll-target"></div>

            {/* Feature / Style Section */}
            <section style={{ backgroundColor: 'white', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '6rem 1.5rem' }}>
              <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
                {funnelSettings?.styleMediaType === 'video' ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', marginBottom: '1rem' }}>Our Signature Style</div>
                      <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '1.5rem' }}>
                        {funnelSettings?.styleHeading || 'Candid. Timeless. Authentic.'}
                      </h2>
                      <p style={{ color: '#475569', fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '48rem', margin: '0 auto 2rem' }}>
                        {funnelSettings?.styleDescription || 'We specialize in capturing raw, authentic moments rather than stiff poses. Our editing style relies on true-to-life colors with a subtle cinematic warmth, ensuring your photos look beautiful decades from now.'}
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', maxWidth: '56rem' }}>
                        {(funnelSettings?.styleBullets || [
                          'Natural light prioritization',
                          'Guided, movement-based posing',
                          'True-to-color editing aesthetic',
                          'Focus on genuine emotion'
                        ]).map((item: string, idx: number) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle2 size={18} style={{ color: '#0f172a' }} />
                            <span style={{ color: '#334155', fontWeight: 500 }}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                      {funnelSettings?.styleVideo1Url && (
                        <div style={{ borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                          <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
                            <iframe 
                              src={getEmbedUrl(funnelSettings.styleVideo1Url)} 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}
                      {funnelSettings?.styleVideo2Url && (
                        <div style={{ borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                          <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
                            <iframe 
                              src={getEmbedUrl(funnelSettings.styleVideo2Url)} 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 400px', borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                      <div style={{ height: '600px', width: '100%', position: 'relative' }}>
                        <img 
                          src={funnelSettings?.stylePhotoUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop"}
                          alt="Signature Style" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                        />
                      </div>
                    </div>
                    <div style={{ flex: '1 1 400px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', marginBottom: '1rem' }}>Our Signature Style</div>
                      <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '1.5rem' }}>
                        {funnelSettings?.styleHeading || 'Candid. Timeless. Authentic.'}
                      </h2>
                      <p style={{ color: '#475569', fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                        {funnelSettings?.styleDescription || 'We specialize in capturing raw, authentic moments rather than stiff poses. Our editing style relies on true-to-life colors with a subtle cinematic warmth, ensuring your photos look beautiful decades from now.'}
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(funnelSettings?.styleBullets || [
                          'Natural light prioritization',
                          'Guided, movement-based posing',
                          'True-to-color editing aesthetic',
                          'Focus on genuine emotion'
                        ]).map((item: string, idx: number) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <CheckCircle2 size={20} style={{ color: '#0f172a', marginTop: '0.25rem' }} />
                            <span style={{ color: '#334155', fontWeight: 500 }}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Pricing Transparency */}
            {isWedding && session.Packages && session.Packages.length > 0 && (
              <section style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center', padding: '6rem 1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', marginBottom: '1rem' }}>The Investment</div>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '1.5rem' }}>
                  {funnelSettings?.investmentHeadline || 'Transparent, all-inclusive pricing.'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '4rem', maxWidth: '42rem', margin: '0 auto 4rem' }}>
                  {funnelSettings?.investmentDescription || 'No hidden fees. Select the collection that best suits your vision for the big day.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ textAlign: 'left' }}>
                  {session.Packages.map((pkg, idx) => {
                    const isSelected = selectedPackage?.Package_ID === pkg.Package_ID;
                    // Auto-feature the middle package if there are 3, otherwise the first one if there are 2, etc. (Just a visual heuristic)
                    const isFeatured = idx === Math.floor(session.Packages.length / 2) && session.Packages.length > 1;
                    return (
                      <div 
                        key={pkg.Package_ID} 
                        onClick={() => setSelectedPackage(pkg)}
                        style={{ 
                          backgroundColor: isFeatured ? '#0f172a' : 'white', 
                          color: isFeatured ? 'white' : '#1e293b', 
                          padding: '2rem', 
                          borderRadius: '1.5rem', 
                          position: 'relative', 
                          boxShadow: isSelected ? `0 0 0 4px #0f172a` : isFeatured ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none', 
                          border: isSelected ? `2px solid #0f172a` : '1px solid #e2e8f0',
                          transform: isFeatured ? 'translateY(-1rem)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        {isFeatured && (
                          <div style={{ position: 'absolute', top: 0, right: '2rem', transform: 'translateY(-50%)', backgroundColor: '#facc15', color: '#713f12', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.75rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Star size={12}/> Most Popular
                          </div>
                        )}
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '-0.75rem', left: '2rem', backgroundColor: '#0ea5e9', color: 'white', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.75rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <CheckCircle2 size={12}/> Selected
                          </div>
                        )}
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: isFeatured ? 'white' : '#1e293b' }}>{pkg.Name}</h3>
                        <div style={{ fontSize: '1.875rem', fontWeight: 900, marginBottom: '0.5rem', color: isFeatured ? 'white' : '#0f172a' }}>${pkg.Price}</div>
                        <p style={{ color: isFeatured ? '#cbd5e1' : '#64748b', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 700 }}>{pkg.Duration}</p>
                        
                        {pkg.Items && (
                          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: isFeatured ? 'rgba(255,255,255,0.9)' : '#334155', marginBottom: '2rem' }}>
                            {pkg.Items.split('\n').filter(Boolean).map((feature: string, fIdx: number) => (
                              <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: 1.4 }}>
                                <CheckCircle2 size={16} color={isFeatured ? "rgba(255,255,255,0.3)" : "#cbd5e1"} style={{ flexShrink: 0, marginTop: '0.1rem' }}/> 
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>

                {funnelSettings?.addons?.length > 0 && selectedPackage && (
                  <div style={{ marginTop: '3rem', textAlign: 'left', maxWidth: '600px', margin: '3rem auto 0' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a', textAlign: 'center' }}>Enhance Your Collection (Optional)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {funnelSettings.addons.map((addon: any) => (
                        <div 
                          key={addon.id}
                          onClick={() => {
                            setSelectedAddons(prev => prev.includes(addon.id) ? prev.filter(id => id !== addon.id) : [...prev, addon.id]);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '1rem',
                            cursor: 'pointer', transition: 'all 0.15s',
                            backgroundColor: selectedAddons.includes(addon.id) ? '#f0fdf4' : 'white',
                            borderColor: selectedAddons.includes(addon.id) ? '#22c55e' : '#e2e8f0',
                            boxShadow: selectedAddons.includes(addon.id) ? '0 10px 15px -3px rgba(34, 197, 94, 0.1)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: 6,
                              border: selectedAddons.includes(addon.id) ? 'none' : '2px solid #cbd5e1',
                              backgroundColor: selectedAddons.includes(addon.id) ? '#22c55e' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {selectedAddons.includes(addon.id) && <Check size={16} color="white" />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>{addon.name}</div>
                              {addon.desc && <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>{addon.desc}</div>}
                            </div>
                          </div>
                          <div style={{ fontWeight: 800, color: '#0d9488', fontSize: '1.1rem' }}>+${addon.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* How It Works / The Triple Threat */}
            <section style={{ backgroundColor: '#0f172a', color: 'white', padding: '6rem 1.5rem' }}>
              <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                  <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '1rem' }}>
                    {funnelSettings?.whatsNextHeading || "What happens next?"}
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
                    {funnelSettings?.whatsNextSub || 'Booking your session is a seamless, 3-step process.'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                  {(funnelSettings?.whatsNextSteps || [
                    { title: 'Tell Us About Your Day', description: 'Fill out your contact and event details to start the process.' },
                    { title: 'Sign Digitally', description: 'Review and sign your digital contract instantly to secure the legalities.' },
                    { title: 'Pay Retainer', description: 'Submit your non-refundable retainer securely. Your date is officially locked in!' },
                  ]).map((stepItem: any, idx: number) => {
                    const icons = [<Calendar key={0} size={100} />, <FileSignature key={1} size={100} />, <CreditCard key={2} size={100} />];
                    return (
                      <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, padding: '2rem', opacity: 0.1 }}>
                          {icons[idx % 3]}
                        </div>
                        <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1.5rem', fontWeight: 900, fontSize: '1.25rem', position: 'relative', zIndex: 10 }}>{idx + 1}</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', position: 'relative', zIndex: 10 }}>{stepItem.title}</h3>
                        <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.875rem', position: 'relative', zIndex: 10 }}>{stepItem.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Final CTA */}
            <section style={{ backgroundColor: '#f8fafc', padding: '6rem 1.5rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '1.5rem' }}>
                Ready to make it official?
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '2.5rem' }}>
                Click below to continue and secure your session immediately.
              </p>
              <button 
                onClick={() => {
                  if (isWedding && session.Packages && session.Packages.length > 0 && !selectedPackage) {
                    const hero = document.getElementById('funnel-scroll-target');
                    if (hero) hero.scrollIntoView({ behavior: 'smooth' });
                    alert("Please select a package first.");
                  } else if (!isWedding && session.Packages && session.Packages.length > 0) {
                    setStep('packages');
                  } else {
                    setStep('datetime');
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800, padding: '1.25rem 2.5rem', borderRadius: '9999px', backgroundColor: '#0f172a', color: 'white', textDecoration: 'none', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(15, 23, 42, 0.4)' }}
              >
                Book Your Session Now
              </button>
            </section>
          </div>
        )}

        {/* ── STEP 1: Date & Time ── */}
        {step === 'datetime' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => setStep('welcome')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={18} /></button>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Select Date & Time</h3>
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
                    {isWedding ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>Start Time</label>
                          <input 
                            type="time" 
                            value={selectedTime || ''} 
                            onChange={(e) => setSelectedTime(e.target.value)} 
                            style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>
                        {selectedTime && selectedPackage && (
                          <div style={{ backgroundColor: '#e0e7ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #c7d2fe' }}>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#4338ca', fontWeight: 600 }}>Booking Duration</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#3730a3' }}>
                              Your package includes {selectedPackage.Duration}. Your event will be scheduled from <strong>{getStartTimeFormatted(selectedTime)}</strong> to <strong>{getEndTime(selectedTime, parseDurationHours(selectedPackage.Duration))}</strong>.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : availableTimesForSelected.length > 0 ? (
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
              <button onClick={() => isWedding ? setStep('welcome') : setStep('details')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={18} /></button>
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
            
            {funnelSettings?.addons?.length > 0 && selectedPackage && (
              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Add-ons (Optional)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {funnelSettings.addons.map((addon: any) => (
                    <div 
                      key={addon.id}
                      onClick={() => {
                        setSelectedAddons(prev => prev.includes(addon.id) ? prev.filter(id => id !== addon.id) : [...prev, addon.id]);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
                        cursor: 'pointer', transition: 'all 0.15s',
                        backgroundColor: selectedAddons.includes(addon.id) ? '#f0fdf4' : 'white',
                        borderColor: selectedAddons.includes(addon.id) ? '#22c55e' : '#e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 4,
                          border: selectedAddons.includes(addon.id) ? 'none' : '2px solid #cbd5e1',
                          backgroundColor: selectedAddons.includes(addon.id) ? '#22c55e' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {selectedAddons.includes(addon.id) && <Check size={14} color="white" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{addon.name}</div>
                          {addon.desc && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{addon.desc}</div>}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#0d9488' }}>+${addon.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>
                Total: ${((selectedPackage ? selectedPackage.Price : 0) + selectedAddons.reduce((sum, id) => {
                  const addon = funnelSettings?.addons?.find((a: any) => a.id === id);
                  return sum + (addon ? Number(addon.price) : 0);
                }, 0)).toLocaleString()}
              </div>
              <button
                onClick={proceedFromPackages}
                disabled={!selectedPackage}
                style={{ padding: '0.85rem 2rem', border: 'none', borderRadius: '0.5rem', backgroundColor: selectedPackage ? '#0f172a' : '#cbd5e1', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: selectedPackage ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: '0.05em' }}
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
                if (isWedding) setStep('details');
                else if (session.Packages && session.Packages.length > 0) setStep('packages');
                else setStep('details');
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={18} /></button>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Digital Contract</h3>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div 
                ref={contractContainerRef}
                onChange={() => syncContractFormDOM(contractContainerRef.current)}
                onInput={() => syncContractFormDOM(contractContainerRef.current)}
                style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}
                dangerouslySetInnerHTML={{ __html: getProcessedContractHtml() }}
              />
              
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.5rem' }}>Your Signature</label>
                {!showSigPad ? (
                  <button 
                    onClick={() => {
                      syncContractFormDOM(contractContainerRef.current);
                      setShowSigPad(true);
                    }} 
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
                    <button onClick={() => { syncContractFormDOM(contractContainerRef.current); setSignature(''); setShowSigPad(true); }} style={{ display: 'block', margin: '0.5rem auto 0', background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.8rem', cursor: 'pointer' }}>Edit Signature</button>
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
                else if (isWedding) setStep('details');
                else if (session.Packages && session.Packages.length > 0) setStep('packages');
                else setStep('details');
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={18} /></button>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Payment</h3>
            </div>
            
            <div style={{ padding: '2rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: '#0f172a' }}>
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
                      <div key={i} style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, marginBottom: '0.25rem' }}>
                        <PaymentInstruction text={line} color="#0f172a" />
                      </div>
                    ))}
                  </div>
                )}
                
                {activeMethodId === 'paypal' ? (
                  <div style={{ marginTop: '1.5rem', minWidth: 300 }}>
                    <PayPalCheckoutButton 
                      clientId={funnelSettings?.paypalClientId} 
                      amount={(selectedPackage ? selectedPackage.Price : (session.Price || 0)) + selectedAddons.reduce((sum, id) => {
                        const addon = funnelSettings?.addons?.find((a: any) => a.id === id);
                        return sum + (addon ? Number(addon.price) : 0);
                      }, 0)} 
                      description={`Payment for ${selectedPackage ? selectedPackage.Name : session.Session_Type}`}
                      onSuccess={(details) => {
                        handleSubmit();
                      }}
                      onError={(err) => alert("PayPal payment failed. Please try again or use another method.")}
                    />
                  </div>
                ) : (
                  <div style={{ marginTop: '1.5rem' }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{ width: '100%', padding: '0.85rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#0f172a', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      {submitting ? 'Processing...' : isCardMethod ? `Pay $${((selectedPackage ? selectedPackage.Price : (session.Price || 0)) + selectedAddons.reduce((sum, id) => {
                        const addon = funnelSettings?.addons?.find((a: any) => a.id === id);
                        return sum + (addon ? Number(addon.price) : 0);
                      }, 0)).toFixed(2)}` : 'I Have Sent Payment'}
                      {!submitting && <Lock size={16} />}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      <Lock size={12} /> Secure encrypted checkout
                    </p>
                  </div>
                )}
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
            {portalLink && (
              <div style={{ margin: '0 0 1.5rem' }}>
                <a
                  href={portalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '0.95rem'
                  }}
                >
                  Access Your Client Portal
                </a>
              </div>
            )}
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              A confirmation receipt {session.Contract_Template ? 'and copy of your contract ' : ''}has been sent to <strong>{form.email}</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
