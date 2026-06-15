"use client";

import React, { useState, useEffect, use } from 'react';
import { DatePicker } from '@/components/ui/DatePicker';
import { Calendar, Clock, Video, User, CheckCircle2, MapPin } from 'lucide-react';

export default function PublicSchedulingPage({ params }: { params: Promise<{ userId: string }> }) {
  const unwrappedParams = use(params);
  const { userId } = unwrappedParams;

  const [vendorInfo, setVendorInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hpValue, setHpValue] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    durationMinutes: 30,
    meetingType: 'Google Meet',
    title: 'Consultation',
    notes: ''
  });

  useEffect(() => {
    if (userId) {
      fetch(`/api/public-booking?type=portrait_settings&userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.settings) {
            setVendorInfo(data.settings);
            document.title = `Schedule with ${data.settings.companyName || 'Us'}`;
          } else {
            setError('Could not load scheduling information.');
          }
        })
        .catch(() => setError('Failed to load scheduling information.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setError('Invalid Link: Missing Vendor ID');
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.date || !formData.time) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/meetings/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...formData, _hp: hpValue })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        alert(data.error || 'Failed to schedule meeting.');
      }
    } catch (err) {
      alert('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading scheduler...</p>
        </div>
      </div>
    );
  }

  if (error || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h2>
          <p className="text-slate-600">{error || 'This booking link is incomplete.'}</p>
        </div>
      </div>
    );
  }

  const themeColor = vendorInfo?.brandColor || '#0f172a';
  const companyName = vendorInfo?.companyName || 'Our Team';
  const logo = vendorInfo?.businessLogo;

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="glass-panel" style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '1.5rem', textAlign: 'center', maxWidth: '500px', width: '100%', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: `${themeColor}15`, color: themeColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={40} />
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Meeting Scheduled!</h2>
          <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '2rem' }}>
            Thanks for booking time with {companyName}. We've sent a calendar invitation to {formData.email}.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ backgroundColor: themeColor, color: 'white', padding: '0.875rem 2rem', borderRadius: '999px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Schedule Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'inherit', display: 'flex', flexDirection: 'column' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .schedule-main { padding: 1.5rem 1rem; flex: 1; display: flex; justify-content: center; align-items: flex-start; }
        .schedule-panel { display: flex; flex-direction: column; width: 100%; max-width: 900px; background-color: white; border-radius: 1.5rem; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); border: 1px solid #f1f5f9; }
        .schedule-left { flex: 1; padding: 2rem; border-bottom: 1px solid #f1f5f9; border-right: none; }
        .schedule-right { flex: 1.5; padding: 2rem; }
        .schedule-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        
        @media (min-width: 768px) {
          .schedule-main { padding: 3rem 2rem; }
          .schedule-panel { flex-direction: row; }
          .schedule-left { padding: 3rem; border-bottom: none; border-right: 1px solid #f1f5f9; }
          .schedule-right { padding: 3rem; }
          .schedule-grid { grid-template-columns: 1fr 1fr; }
        }
      `}} />

      {/* Header */}
      <header style={{ backgroundColor: 'white', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
        {logo ? (
          <img src={logo} alt={companyName} style={{ height: '40px', objectFit: 'contain' }} />
        ) : (
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{companyName}</h1>
        )}
      </header>

      <main className="schedule-main">
        <div className="glass-panel schedule-panel">
          
          {/* Left Side: Info */}
          <div className="schedule-left" style={{ backgroundColor: `${themeColor}05` }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Book a Meeting</h2>
            <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: '1.5rem' }}>
              Schedule Time with {companyName}
            </h1>
            <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '2rem' }}>
              Please select a date and time that works best for you. If you have any specific topics to cover, let us know!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#475569', fontWeight: 500 }}>
                <Clock size={20} color={themeColor} />
                <span>{formData.durationMinutes} Minutes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#475569', fontWeight: 500 }}>
                <Video size={20} color={themeColor} />
                <span>{formData.meetingType}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="schedule-right">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Honeypot Spam Protection */}
              <input 
                type="text" 
                name="url" 
                style={{ display: 'none' }} 
                tabIndex={-1} 
                autoComplete="off" 
                value={hpValue} 
                onChange={(e) => setHpValue(e.target.value)} 
              />

              <div className="schedule-grid">
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Date *</label>
                  <DatePicker 
                    value={formData.date}
                    onChange={(val) => setFormData({ ...formData, date: val })}
                    userId={userId}
                    className="input-field"
                    style={{ fontSize: '1rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Time *</label>
                  <input 
                    type="time" 
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="input-field" 
                    style={{ fontSize: '1rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div className="schedule-grid">
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Full Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="input-field" 
                    style={{ fontSize: '1rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', width: '100%' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Meeting Method *</label>
                  <select 
                    name="meetingType"
                    value={formData.meetingType}
                    onChange={handleChange}
                    className="input-field" 
                    style={{ fontSize: '1rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', width: '100%' }}
                    required
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="FaceTime">FaceTime</option>
                    <option value="Whatsapp">Whatsapp</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="In Person">In Person</option>
                  </select>
                </div>
              </div>

              <div className="schedule-grid">
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Email *</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    className="input-field" 
                    style={{ fontSize: '1rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', width: '100%' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Phone</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className="input-field" 
                    style={{ fontSize: '1rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Meeting Topic</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Consultation, Check-in"
                  className="input-field" 
                  style={{ fontSize: '1rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>Additional Notes</label>
                <textarea 
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Anything we should know beforehand?"
                  className="input-field" 
                  style={{ fontSize: '1rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', width: '100%', minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                style={{ 
                  marginTop: '1rem',
                  backgroundColor: themeColor, 
                  color: 'white', 
                  padding: '1rem', 
                  borderRadius: '0.75rem', 
                  fontSize: '1.125rem', 
                  fontWeight: 700, 
                  border: 'none', 
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: `0 10px 20px -10px ${themeColor}80`
                }}
              >
                {isSubmitting ? 'Scheduling...' : 'Confirm Meeting'}
              </button>

            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
