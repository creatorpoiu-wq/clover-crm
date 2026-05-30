'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Camera, Calendar, MapPin, Users, CheckCircle2, ChevronRight, DollarSign } from 'lucide-react';

function PortraitBookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  const [vendorInfo, setVendorInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    sessionType: '',
    preferredDates: '',
    locationPreference: '',
    numberOfPeople: '',
    name: '',
    email: '',
    phone: '',
    budget: '',
    timeline: '',
    message: '',
    referral: '',
    customAnswers: {} as Record<string, any>
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userId) {
      fetch(`/api/public-booking?type=portrait_settings&userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.settings) {
            setVendorInfo(data.settings);
            // Update page title and description
            document.title = `${data.settings.companyName || 'Portrait Studio'} | Booking Process`;
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.setAttribute('name', 'description');
              document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', 'Booking Process');

            // Initialize custom questions in form data
            if (data.settings.customQuestions && Array.isArray(data.settings.customQuestions)) {
              const initialCustomAnswers: Record<string, any> = {};
              data.settings.customQuestions.forEach((q: any) => {
                initialCustomAnswers[q.label] = '';
              });
              setFormData(prev => ({ ...prev, customAnswers: initialCustomAnswers }));
            }
          } else {
            setError('Could not load booking settings.');
          }
        })
        .catch(() => setError('Failed to load booking settings.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setError('Invalid Link: Missing Vendor ID');
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomChange = (label: string, value: string) => {
    setFormData({
      ...formData,
      customAnswers: {
        ...formData.customAnswers,
        [label]: value
      }
    });
  };

  const handleNext = () => {
    if (step === 1 && !formData.sessionType) {
      alert("Please select a session type to continue.");
      return;
    }
    // Simple validation for required custom questions in step 2 (assuming they are in step 2)
    if (step === 2 && vendorInfo?.customQuestions) {
        const requiredQuestions = vendorInfo.customQuestions.filter((q: any) => q.required);
        const missing = requiredQuestions.find((q: any) => !formData.customAnswers[q.label]);
        if (missing) {
            alert(`Please answer the required question: "${missing.label}"`);
            return;
        }
    }
    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.sessionType) {
      alert('Please fill in your name and email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/portrait/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData
        })
      });

      const data = await res.json();
      if (data.success) {
        // Redirect to welcome guide with inquiryId
        router.push(`/portrait/welcome?userId=${userId}&inquiryId=${data.inquiryId}`);
      } else {
        alert(data.error || 'Failed to submit booking inquiry.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert('Network error occurred.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading booking page...</p>
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
  const companyName = vendorInfo?.companyName || 'Portrait Sessions';
  const logo = vendorInfo?.businessLogo;
  const headline = vendorInfo?.heroHeadline || "Let's plan your perfect session.";
  const subheadline = vendorInfo?.heroSubheadline || "Fill out the details below to start the booking process.";
  const availableSessionTypes = vendorInfo?.sessionTypes || [
    'Family Portrait', 'Maternity', 'Newborn', 'Couples/Engagement', 'Senior Portraits', 'Headshots/Branding'
  ];
  const customQuestions = vendorInfo?.customQuestions || [];

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'inherit', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
        {logo ? (
          <img src={logo} alt={companyName} style={{ height: '40px', objectFit: 'contain' }} />
        ) : (
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{companyName}</h1>
        )}
      </header>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0' }}>
        <div style={{ width: `${progress}%`, height: '100%', backgroundColor: themeColor, transition: 'width 0.3s ease' }}></div>
      </div>

      <main style={{ flex: 1, padding: '3rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '700px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: '1rem', lineHeight: 1.1 }}>
              {step === 1 ? headline : step === 2 ? "Tell us about the session." : "Let's get your details."}
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#64748b' }}>
              {step === 1 ? subheadline : step === 2 ? "We'd love to know what you have in mind." : "Just a few more details so we can reach you."}
            </p>
          </div>

          <div className="glass-panel" style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
            
            {/* STEP 1: Session Type */}
            {step === 1 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>What kind of session are you looking for?</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {availableSessionTypes.map((type: string) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, sessionType: type })}
                      style={{
                        padding: '1.25rem 1rem',
                        borderRadius: '1rem',
                        border: `2px solid ${formData.sessionType === type ? themeColor : '#e2e8f0'}`,
                        backgroundColor: formData.sessionType === type ? `${themeColor}0a` : 'white',
                        color: formData.sessionType === type ? themeColor : '#475569',
                        fontWeight: formData.sessionType === type ? 700 : 500,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                  <button
                    onClick={() => setFormData({ ...formData, sessionType: 'Other' })}
                    style={{
                      padding: '1.25rem 1rem',
                      borderRadius: '1rem',
                      border: `2px solid ${formData.sessionType === 'Other' ? themeColor : '#e2e8f0'}`,
                      backgroundColor: formData.sessionType === 'Other' ? `${themeColor}0a` : 'white',
                      color: formData.sessionType === 'Other' ? themeColor : '#475569',
                      fontWeight: formData.sessionType === 'Other' ? 700 : 500,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Other / Custom
                  </button>
                </div>
                {formData.sessionType === 'Other' && (
                  <div style={{ marginTop: '1rem' }}>
                    <input 
                      type="text" 
                      placeholder="Please specify..." 
                      className="input-field" 
                      style={{ fontSize: '1rem', padding: '1rem' }}
                      onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Session Details */}
            {step === 2 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Calendar size={16} /> Preferred Dates
                  </label>
                  <input 
                    name="preferredDates" 
                    value={formData.preferredDates} 
                    onChange={handleChange} 
                    type="date" 
                    className="input-field" 
                    style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem', fontFamily: 'inherit', WebkitAppearance: 'none' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <MapPin size={16} /> Location Preference
                  </label>
                  <input 
                    name="locationPreference" 
                    value={formData.locationPreference} 
                    onChange={handleChange} 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Studio, Beach, In-home, Undecided" 
                    style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Users size={16} /> Number of People
                  </label>
                  <input 
                    name="numberOfPeople" 
                    value={formData.numberOfPeople} 
                    onChange={handleChange} 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Just me, Family of 4, etc." 
                    style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <DollarSign size={16} /> Budget Range
                  </label>
                  <select 
                    name="budget" 
                    value={formData.budget} 
                    onChange={handleChange} 
                    className="input-field"
                    style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem', height: 'auto' }}
                  >
                    <option value="" disabled>Select a range...</option>
                    {(vendorInfo?.budgetRanges || ['Under $500', '$500 - $1,000', '$1,000 - $2,000', '$2,000+']).map((range: string) => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
                
                {/* Dynamic Custom Questions */}
                {customQuestions.map((q: any, i: number) => (
                    <div key={i}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                           {q.label} {q.required && '*'}
                        </label>
                        {q.type === 'textarea' ? (
                             <textarea 
                             value={formData.customAnswers[q.label] || ''} 
                             onChange={(e) => handleCustomChange(q.label, e.target.value)} 
                             className="input-field" 
                             style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem', minHeight: '120px', resize: 'vertical' }}
                           />
                        ) : q.type === 'select' ? (
                             <select 
                             value={formData.customAnswers[q.label] || ''} 
                             onChange={(e) => handleCustomChange(q.label, e.target.value)} 
                             className="input-field"
                             style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem', height: 'auto' }}
                           >
                             <option value="" disabled>Select an option...</option>
                             {q.options?.map((opt: string) => (
                                 <option key={opt} value={opt}>{opt}</option>
                             ))}
                           </select>
                        ) : (
                             <input 
                             type="text"
                             value={formData.customAnswers[q.label] || ''} 
                             onChange={(e) => handleCustomChange(q.label, e.target.value)} 
                             className="input-field" 
                             style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem' }}
                           />
                        )}
                    </div>
                ))}
              </div>
            )}

            {/* STEP 3: Client Info */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Full Name *</label>
                    <input required name="name" value={formData.name} onChange={handleChange} type="text" className="input-field" placeholder="Jane Doe" style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem' }} />
                  </div>
                  <div style={{ gridColumn: window.innerWidth < 640 ? '1 / -1' : '1' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Email Address *</label>
                    <input required name="email" value={formData.email} onChange={handleChange} type="email" className="input-field" placeholder="jane@example.com" style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem' }} />
                  </div>
                  <div style={{ gridColumn: window.innerWidth < 640 ? '1 / -1' : '2' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Phone Number</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} type="tel" className="input-field" placeholder="(555) 123-4567" style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Tell us more about your vision</label>
                  <textarea 
                    name="message" 
                    value={formData.message} 
                    onChange={handleChange} 
                    className="input-field" 
                    placeholder="Any specific ideas, props, or vibes you're going for?"
                    style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem', minHeight: '120px', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', display: 'block' }}>How did you hear about us?</label>
                  <input name="referral" value={formData.referral} onChange={handleChange} type="text" className="input-field" placeholder="Google, Instagram, Friend..." style={{ fontSize: '1rem', padding: '1rem', borderRadius: '0.75rem' }} />
                </div>
              </form>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
              {step > 1 ? (
                <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                  <ArrowLeft size={18} /> Back
                </button>
              ) : <div></div>}

              {step < totalSteps ? (
                <button 
                  onClick={handleNext} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: themeColor, color: 'white', fontWeight: 700, padding: '0.75rem 2rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontSize: '1rem', boxShadow: `0 4px 14px 0 ${themeColor}40` }}
                >
                  Next <ArrowRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: themeColor, color: 'white', fontWeight: 700, padding: '1rem 2.5rem', borderRadius: '9999px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '1.125rem', boxShadow: `0 4px 14px 0 ${themeColor}40`, opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'} <CheckCircle2 size={20} />
                </button>
              )}
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}

export default function PortraitBookingIndexPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>}>
      <PortraitBookingContent />
    </Suspense>
  );
}
