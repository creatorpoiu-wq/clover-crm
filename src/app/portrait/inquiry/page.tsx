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
  const [vendorInfo, setVendorInfo] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      // Fetch basic vendor info to personalize the form
      fetch(`/api/public-booking?type=settings&userId=${userId}`)
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      <div className="flex-1 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 shadow-2xl overflow-hidden md:my-12 rounded-none md:rounded-2xl">
        
        {/* Left Column: Visual/Brand */}
        <div className="bg-slate-900 text-white p-12 flex flex-col justify-between relative overflow-hidden" style={{ backgroundColor: themeColor }}>
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
          <div className="relative z-10">
            {vendorInfo?.Business_Logo ? (
              <img src={vendorInfo.Business_Logo} alt={companyName} className="h-12 mb-12 object-contain" />
            ) : (
              <h1 className="text-2xl font-black mb-12 tracking-tight">{companyName}</h1>
            )}
            
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight">Let's create something beautiful.</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8">
              Every great portrait starts with a simple conversation. Tell me a bit about what you're looking for, and I'll send you all the details to get started.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 space-y-6">
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Camera size={18} />
              </div>
              <span className="font-medium">Tailored portrait experiences</span>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <CalendarIcon size={18} />
              </div>
              <span className="font-medium">Flexible scheduling</span>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="bg-white p-8 md:p-12 overflow-y-auto">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Start Your Inquiry</h3>
          <p className="text-slate-500 mb-8 text-sm">Takes less than 2 minutes to complete.</p>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-r-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <User size={16} className="text-slate-400" /> Contact Info
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
                  <input required name="name" value={formData.name} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none text-sm font-medium text-slate-800" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email Address *</label>
                  <input required name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none text-sm font-medium text-slate-800" placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none text-sm font-medium text-slate-800" placeholder="(555) 123-4567" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Camera size={16} className="text-slate-400" /> Session Details
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Session Type *</label>
                  <select required name="sessionType" value={formData.sessionType} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none text-sm font-medium text-slate-800 appearance-none">
                    <option value="" disabled>Select a session type...</option>
                    {sessionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1"><CalendarIcon size={12}/> Ideal Timeline</label>
                  <select name="timeline" value={formData.timeline} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none text-sm font-medium text-slate-800 appearance-none">
                    <option value="" disabled>When are you looking to shoot?</option>
                    {timelines.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1"><DollarSign size={12}/> Investment Level</label>
                  <select name="budget" value={formData.budget} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none text-sm font-medium text-slate-800 appearance-none">
                    <option value="" disabled>Select your budget range...</option>
                    {budgets.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1"><Users size={12}/> How did you find me?</label>
                  <input name="referral" value={formData.referral} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none text-sm font-medium text-slate-800" placeholder="e.g. Instagram, Friend, Google Search" />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl text-white font-bold text-sm tracking-wide uppercase transition-all shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: themeColor }}
              >
                {isSubmitting ? 'Submitting...' : 'View Pricing & Information'} 
                {!isSubmitting && <ChevronRight size={18} />}
              </button>
              <p className="text-center text-xs text-slate-400 mt-4">
                By submitting this form, you'll instantly receive our welcome guide outlining pricing and next steps.
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default function PortraitInquiryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <InquiryFormContent />
    </Suspense>
  );
}
