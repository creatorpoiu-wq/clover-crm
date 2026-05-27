'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Star, Calendar, FileSignature, CreditCard } from 'lucide-react';
import Link from 'next/link';

function WelcomeGuideContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const inquiryId = searchParams.get('inquiryId');
  
  const [vendorInfo, setVendorInfo] = useState<any>(null);

  useEffect(() => {
    if (userId) {
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

  if (!userId || !inquiryId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-inter">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Invalid Link</h2>
          <p className="text-slate-600">This guide requires a valid booking link.</p>
        </div>
      </div>
    );
  }

  const themeColor = vendorInfo?.Brand_Color || '#0f172a';
  const companyName = vendorInfo?.Company_Name || 'Portrait Sessions';

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 font-inter selection:bg-slate-200">
      
      {/* Navigation / Header */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold tracking-tight text-lg">
            {companyName}
          </div>
          <Link 
            href={`/portrait/book?userId=${userId}&inquiryId=${inquiryId}`}
            className="text-sm font-bold text-white px-5 py-2 rounded-full transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg"
            style={{ backgroundColor: themeColor, boxShadow: `0 4px 14px 0 ${themeColor}40` }}
          >
            Book Now
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6 text-center max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 leading-[1.1] mb-6">
          Welcome to the experience.
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed mb-10">
          Thank you for inquiring! This guide outlines our signature style, transparent pricing, and the simple three-step process to secure your session.
        </p>
        <Link 
          href={`/portrait/book?userId=${userId}&inquiryId=${inquiryId}`}
          className="inline-flex items-center gap-2 text-lg font-bold text-white px-8 py-4 rounded-full transition-all hover:opacity-90 hover:-translate-y-1 shadow-xl"
          style={{ backgroundColor: themeColor }}
        >
          Secure Your Session <ArrowRight size={20} />
        </Link>
      </header>

      {/* Feature / Style Section */}
      <section className="py-20 px-6 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="aspect-[4/5] bg-slate-100 rounded-3xl overflow-hidden relative">
            {/* Placeholder Image - User can replace via CMS/Code */}
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop" 
              alt="Portrait Style" 
              className="w-full h-full object-cover object-center absolute inset-0"
            />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-slate-400">Our Signature Style</div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-6">
              Candid. Timeless. Authentic.
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-8">
              We specialize in capturing raw, authentic moments rather than stiff poses. Our editing style relies on true-to-life colors with a subtle cinematic warmth, ensuring your portraits look beautiful decades from now.
            </p>
            <ul className="space-y-4">
              {[
                'Natural light prioritization',
                'Guided, movement-based posing',
                'True-to-color editing aesthetic',
                'Focus on genuine emotion'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1" size={20} style={{ color: themeColor }} />
                  <span className="text-slate-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Transparency */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <div className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-slate-400">The Investment</div>
        <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-6">
          Transparent, all-inclusive pricing.
        </h2>
        <p className="text-slate-500 text-lg mb-16 max-w-2xl mx-auto">
          No hidden fees or post-shoot sales sessions. Every package includes your high-resolution digital files and printing rights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Pricing Tier 1 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow relative">
            <h3 className="text-xl font-bold mb-2">The Mini</h3>
            <div className="text-3xl font-black mb-4">$350</div>
            <p className="text-slate-500 text-sm mb-6">Perfect for quick updates or headshots.</p>
            <ul className="space-y-3 mb-8 text-sm font-medium text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-slate-300"/> 30 Minute Session</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-slate-300"/> 15 Edited Images</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-slate-300"/> 1 Location</li>
            </ul>
          </div>

          {/* Pricing Tier 2 */}
          <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-2xl relative transform md:-translate-y-4">
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
              <Star size={12}/> Most Popular
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">The Classic</h3>
            <div className="text-3xl font-black mb-4 text-white">$650</div>
            <p className="text-slate-400 text-sm mb-6">The ideal balance for families and couples.</p>
            <ul className="space-y-3 mb-8 text-sm font-medium text-white/90">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/30"/> 60 Minute Session</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/30"/> 50+ Edited Images</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white/30"/> Up to 2 Outfits</li>
            </ul>
          </div>

          {/* Pricing Tier 3 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow relative">
            <h3 className="text-xl font-bold mb-2">The Extended</h3>
            <div className="text-3xl font-black mb-4">$950</div>
            <p className="text-slate-500 text-sm mb-6">For editorial or multi-location shoots.</p>
            <ul className="space-y-3 mb-8 text-sm font-medium text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-slate-300"/> 2 Hour Session</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-slate-300"/> 100+ Edited Images</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-slate-300"/> Multiple Locations</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works / The Triple Threat */}
      <section className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">What happens next?</h2>
            <p className="text-slate-400 text-lg">Booking your session is a seamless, 3-step process.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                <Calendar size={100} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6 font-black text-xl relative z-10">1</div>
              <h3 className="text-xl font-bold mb-3 relative z-10">Pick Your Date</h3>
              <p className="text-slate-400 leading-relaxed text-sm relative z-10">View my real-time calendar and select the exact date and time that works for you.</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                <FileSignature size={100} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6 font-black text-xl relative z-10">2</div>
              <h3 className="text-xl font-bold mb-3 relative z-10">Sign Digitally</h3>
              <p className="text-slate-400 leading-relaxed text-sm relative z-10">Review and sign your digital contract instantly to secure the legalities.</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                <CreditCard size={100} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6 font-black text-xl relative z-10">3</div>
              <h3 className="text-xl font-bold mb-3 relative z-10">Pay Retainer</h3>
              <p className="text-slate-400 leading-relaxed text-sm relative z-10">Submit your non-refundable retainer securely online. Your date is officially locked in!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-6">
          Ready to make it official?
        </h2>
        <p className="text-slate-500 text-lg mb-10">
          Click below to access our live calendar and secure your session immediately.
        </p>
        <Link 
          href={`/portrait/book?userId=${userId}&inquiryId=${inquiryId}`}
          className="inline-flex items-center justify-center gap-2 text-xl font-bold text-white px-10 py-5 rounded-full transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-2xl"
          style={{ backgroundColor: themeColor, boxShadow: `0 4px 14px 0 ${themeColor}60` }}
        >
          Book Your Session Now
        </Link>
      </section>

    </div>
  );
}

export default function PortraitWelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Guide...</div>}>
      <WelcomeGuideContent />
    </Suspense>
  );
}
