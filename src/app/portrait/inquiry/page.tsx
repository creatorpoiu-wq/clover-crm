'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, Calendar as CalendarIcon, DollarSign, Users, ChevronRight, User } from 'lucide-react';

function InquiryFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    sessionType: '',
    budget: '',
    timeline: '',
    referral: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hpValue, setHpValue] = useState('');
  const [vendorInfo, setVendorInfo] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      // Fetch basic vendor info to personalize the form
      fetch(`/api/public-booking?type=portrait_settings&userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.settings) {
            setVendorInfo(data.settings);
          }
        })
        .catch(console.error);
    }
  }, [userId]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-inter">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Invalid Link</h2>
          <p className="text-slate-600">This booking link is missing a vendor ID. Please contact the photographer for a valid link.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.sessionType) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/portrait/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          _hp: hpValue,
          ...formData
        })
      });

      const data = await res.json();
      
      if (data.success) {
        // Redirect to welcome guide with inquiryId and userId
        router.push(`/portrait/welcome?userId=${userId}&inquiryId=${data.inquiryId}`);
      } else {
        setError(data.error || 'Failed to submit inquiry. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred.');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sessionTypes = ['Family Portrait', 'Maternity', 'Newborn', 'Couples/Engagement', 'Solo/Editorial', 'Senior Portraits', 'Other'];
  const budgets = ['Under $500', '$500 - $1,000', '$1,000 - $2,500', '$2,500+'];
  const timelines = ['As soon as possible', 'Within 1-2 months', 'Within 3-6 months', 'Just browsing/No strict timeline'];

  const themeColor = vendorInfo?.Brand_Color || '#0f172a';
  const companyName = vendorInfo?.Company_Name || 'Portrait Sessions';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: '#f9fafb' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'row', borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
        
        {/* Left Column: Visual/Brand */}
        <div style={{ flex: 1, backgroundColor: themeColor, color: 'white', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'relative', zIndex: 10 }}>
            {vendorInfo?.Business_Logo ? (
              <img src={vendorInfo.Business_Logo} alt={companyName} style={{ height: '40px', marginBottom: '2rem', objectFit: 'contain' }} />
            ) : (
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem' }}>{companyName}</h1>
            )}
            
            <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1 }}>Let's create something beautiful.</h2>
            <p style={{ fontSize: '1.125rem', opacity: 0.9, lineHeight: 1.6, marginBottom: '2rem' }}>
              Every great portrait starts with a simple conversation. Tell me a bit about what you're looking for, and I'll send you all the details to get started.
            </p>
          </div>
        </div>

        {/* Right Column: Form */}
        <div style={{ flex: 1, backgroundColor: 'white', padding: '3rem' }}>
          <h3 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Start Your Inquiry</h3>
          <p className="page-subtitle" style={{ fontSize: '0.875rem', marginBottom: '2rem' }}>Takes less than 2 minutes to complete.</p>

          {error && (
            <div className="error-text" style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Honeypot Spam Protection */}
            <input 
              type="text" 
              name="website_url" 
              style={{ display: 'none', visibility: 'hidden', opacity: 0, position: 'absolute', left: '-9999px' }} 
              tabIndex={-1} 
              autoComplete="off" 
              value={hpValue} 
              onChange={(e) => setHpValue(e.target.value)} 
            />
            <div>
              <label className="label">Full Name *</label>
              <input required name="name" value={formData.name} onChange={handleChange} type="text" className="input" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input required name="email" value={formData.email} onChange={handleChange} type="email" className="input" placeholder="jane@example.com" />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input name="phone" value={formData.phone} onChange={handleChange} type="tel" className="input" placeholder="(555) 123-4567" />
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0' }}></div>

            <div>
              <label className="label">Session Type *</label>
              <select required name="sessionType" value={formData.sessionType} onChange={handleChange} className="input">
                <option value="" disabled>Select a session type...</option>
                {sessionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="label">Ideal Timeline</label>
              <select name="timeline" value={formData.timeline} onChange={handleChange} className="input">
                <option value="" disabled>When are you looking to shoot?</option>
                {timelines.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Investment Level</label>
              <select name="budget" value={formData.budget} onChange={handleChange} className="input">
                <option value="" disabled>Select your budget range...</option>
                {budgets.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1rem', backgroundColor: themeColor }}
            >
              {isSubmitting ? 'Submitting...' : 'View Pricing & Information'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default function PortraitInquiryPage() {
  return (
    <Suspense fallback={<div className="login-wrapper">Loading...</div>}>
      <InquiryFormContent />
    </Suspense>
  );
}
