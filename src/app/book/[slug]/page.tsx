'use client';
import React, { useEffect, useState } from 'react';
import { Clock, MapPin, ChevronLeft, ChevronRight, Check, Camera } from 'lucide-react';

interface TimeSlot {
  Slot_ID: number;
  Day_Of_Week: number;
  Start_Time: string;
  End_Time: string;
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
  Session_Time_Slots: TimeSlot[];
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

export default function BookSessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const [step, setStep] = useState<'datetime' | 'details' | 'confirm'>('datetime');
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions?slug=${resolvedParams.slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.session) {
          setSession(d.session);
          // Fetch blocked dates for this user
          fetch(`/api/availability?userId=${d.session.user_id}`)
            .then(r => r.json())
            .then(av => { if (av.success) setBlockedDates(av.blockedDates || []); });
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [resolvedParams.slug]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedDate || !selectedTime) return;
    setSubmitting(true);
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
        notes: form.notes
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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ color: '#64748b', fontSize: '1rem' }}>Loading...</div>
    </div>
  );

  if (notFound) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', gap: '1rem' }}>
      <Camera size={48} style={{ color: '#cbd5e1' }} />
      <h1 style={{ margin: 0, color: '#334155' }}>Session Not Found</h1>
      <p style={{ color: '#64748b' }}>This booking page doesn't exist or is no longer available.</p>
    </div>
  );

  if (!session) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      {/* Hero Banner */}
      <div style={{
        height: '280px',
        backgroundColor: '#1e293b',
        backgroundImage: session.Cover_Image ? `url(${session.Cover_Image})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, margin: 0, textAlign: 'center', letterSpacing: '-0.01em' }}>
            {step === 'datetime' ? 'Select a date and time' : step === 'details' ? 'Your Details' : ''}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1rem 4rem' }}>

        {/* Session Info Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', marginTop: '-2rem', position: 'relative', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{session.Session_Type}</h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: '#475569' }}>
              <Clock size={16} />{session.Duration_Minutes || 60} minutes
            </span>
            {session.Location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: '#475569' }}>
                <MapPin size={16} />{session.Location}
              </span>
            )}
          </div>
          {session.Description && <p style={{ margin: '0.75rem 0 0', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{session.Description}</p>}
        </div>

        {/* ── STEP 1: DateTime Picker ── */}
        {step === 'datetime' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '400px' }}>

              {/* Calendar */}
              <div style={{ padding: '1.5rem', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    {MONTHS[month]} {year}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', padding: '0.3rem', display: 'flex', alignItems: 'center' }}><ChevronLeft size={16} /></button>
                    <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', padding: '0.3rem', display: 'flex', alignItems: 'center' }}><ChevronRight size={16} /></button>
                  </div>
                </div>

                {/* Day names */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.1rem', marginBottom: '0.5rem' }}>
                  {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', padding: '0.25rem 0' }}>{d}</div>)}
                </div>

                {/* Days grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.1rem' }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const date = new Date(dateStr + 'T00:00:00');
                    const available = isDayAvailable(date);
                    const isSelected = selectedDate === dateStr;
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    return (
                      <button
                        key={d}
                        onClick={() => handleDateClick(dateStr, date)}
                        disabled={!available}
                        style={{
                          aspectRatio: '1',
                          border: 'none',
                          borderRadius: '50%',
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? 800 : isToday ? 700 : 400,
                          cursor: available ? 'pointer' : 'default',
                          backgroundColor: isSelected ? '#0f172a' : 'transparent',
                          color: isSelected ? 'white' : available ? '#0f172a' : '#cbd5e1',
                          textDecoration: isToday && !isSelected ? 'underline' : 'none',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { if (available && !isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div style={{ padding: '1.5rem' }}>
                {selectedDate ? (
                  <>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                      {formatDisplayDate(selectedDate)}
                    </h3>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>
                    {availableTimesForSelected.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {availableTimesForSelected.map(time => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            style={{
                              padding: '0.65rem 1rem',
                              border: selectedTime === time ? '2px solid #0f172a' : '1px solid #e2e8f0',
                              borderRadius: '0.5rem',
                              backgroundColor: selectedTime === time ? '#0f172a' : 'white',
                              color: selectedTime === time ? 'white' : '#334155',
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

            {/* Continue button */}
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
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s'
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
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                <button onClick={() => setStep('datetime')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}><ChevronLeft size={18} /></button>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Your Details</h3>
              </div>
              <div style={{ marginLeft: '2rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                <strong>{session.Session_Type}</strong> · {formatDisplayDate(selectedDate!)} at {selectedTime}
              </div>
            </div>
            <form onSubmit={handleSubmit}>
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
                  type="submit"
                  disabled={submitting}
                  style={{ width: '100%', padding: '0.85rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#0f172a', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {submitting ? 'Submitting...' : 'Confirm Booking Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 3: Confirmation ── */}
        {step === 'confirm' && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Check size={32} style={{ color: '#15803d' }} />
            </div>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Booking Request Received!</h2>
            <p style={{ margin: '0 0 2rem', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Thank you, <strong>{form.name}</strong>! We've received your request for <strong>{session.Session_Type}</strong> on <strong>{formatDisplayDate(selectedDate!)} at {selectedTime}</strong>.
            </p>
            <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'inline-block', textAlign: 'left', minWidth: '280px', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Booking Summary</p>
              <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#0f172a' }}>{session.Session_Type}</p>
              <p style={{ margin: '0 0 0.25rem', color: '#475569', fontSize: '0.875rem' }}>{formatDisplayDate(selectedDate!)}</p>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.875rem' }}>{selectedTime}</p>
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              A confirmation email has been sent to <strong>{form.email}</strong>. We'll be in touch shortly to confirm your booking and send your contract.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
