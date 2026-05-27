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
      <div className="login-wrapper">
        <div className="login-card glass-panel">
          <h2 className="page-title">Invalid Link</h2>
          <p className="page-subtitle">This guide requires a valid booking link.</p>
        </div>
      </div>
    );
  }

  const themeColor = vendorInfo?.Brand_Color || '#0f172a';
  const companyName = vendorInfo?.Company_Name || 'Portrait Sessions';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', color: '#1e293b', fontFamily: 'inherit' }}>
      
      {/* Navigation / Header */}
      <nav style={{ position: 'fixed', width: '100%', top: 0, zIndex: 50, backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 1.5rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.025em' }}>
            {companyName}
          </div>
          <Link 
            href={`/portrait/book?userId=${userId}&inquiryId=${inquiryId}`}
            style={{ backgroundColor: themeColor, color: 'white', fontWeight: 700, fontSize: '0.875rem', padding: '0.5rem 1.25rem', borderRadius: '9999px', textDecoration: 'none', boxShadow: `0 4px 14px 0 ${themeColor}40` }}
          >
            Book Now
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ paddingTop: '8rem', paddingBottom: '5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', textAlign: 'center', maxWidth: '768px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', color: '#0f172a', lineHeight: 1.1, marginBottom: '1.5rem' }}>
          Welcome to the experience.
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#64748b', fontWeight: 500, lineHeight: 1.6, marginBottom: '2.5rem' }}>
          Thank you for inquiring! This guide outlines our signature style, transparent pricing, and the simple three-step process to secure your session.
        </p>
        <Link 
          href={`/portrait/book?userId=${userId}&inquiryId=${inquiryId}`}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', padding: '1rem 2rem', borderRadius: '9999px', backgroundColor: themeColor, color: 'white', textDecoration: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          Secure Your Session <ArrowRight size={20} />
        </Link>
      </header>

      {/* Feature / Style Section */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'white', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px', backgroundColor: '#f1f5f9', borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', aspectRatio: '4/5' }}>
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop" 
              alt="Portrait Style" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
            />
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', marginBottom: '1rem' }}>Our Signature Style</div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '1.5rem' }}>
              Candid. Timeless. Authentic.
            </h2>
            <p style={{ color: '#475569', fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              We specialize in capturing raw, authentic moments rather than stiff poses. Our editing style relies on true-to-life colors with a subtle cinematic warmth, ensuring your portraits look beautiful decades from now.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                'Natural light prioritization',
                'Guided, movement-based posing',
                'True-to-color editing aesthetic',
                'Focus on genuine emotion'
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} style={{ color: themeColor, marginTop: '0.25rem' }} />
                  <span style={{ color: '#334155', fontWeight: 500 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Transparency */}
      <section style={{ padding: '6rem 1.5rem', maxWidth: '896px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', marginBottom: '1rem' }}>The Investment</div>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '1.5rem' }}>
          Transparent, all-inclusive pricing.
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '4rem', maxWidth: '42rem', margin: '0 auto 4rem' }}>
          No hidden fees or post-shoot sales sessions. Every package includes your high-resolution digital files and printing rights.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'left' }}>
          {/* Pricing Tier 1 */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>The Mini</h3>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, marginBottom: '1rem' }}>$350</div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Perfect for quick updates or headshots.</p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '2rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="#cbd5e1"/> 30 Minute Session</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="#cbd5e1"/> 15 Edited Images</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="#cbd5e1"/> 1 Location</li>
            </ul>
          </div>

          {/* Pricing Tier 2 */}
          <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '2rem', borderRadius: '1.5rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transform: 'translateY(-1rem)' }}>
            <div style={{ position: 'absolute', top: 0, right: '2rem', transform: 'translateY(-50%)', backgroundColor: '#facc15', color: '#713f12', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.75rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Star size={12}/> Most Popular
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>The Classic</h3>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, marginBottom: '1rem', color: 'white' }}>$650</div>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>The ideal balance for families and couples.</p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)', marginBottom: '2rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="rgba(255,255,255,0.3)"/> 60 Minute Session</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="rgba(255,255,255,0.3)"/> 50+ Edited Images</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="rgba(255,255,255,0.3)"/> Up to 2 Outfits</li>
            </ul>
          </div>

          {/* Pricing Tier 3 */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>The Extended</h3>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, marginBottom: '1rem' }}>$950</div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>For editorial or multi-location shoots.</p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '2rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="#cbd5e1"/> 2 Hour Session</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="#cbd5e1"/> 100+ Edited Images</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="#cbd5e1"/> Multiple Locations</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works / The Triple Threat */}
      <section style={{ padding: '6rem 1.5rem', backgroundColor: '#0f172a', color: 'white' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '1rem' }}>What happens next?</h2>
            <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>Booking your session is a seamless, 3-step process.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '2rem', opacity: 0.1 }}>
                <Calendar size={100} />
              </div>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1.5rem', fontWeight: 900, fontSize: '1.25rem', position: 'relative', zIndex: 10 }}>1</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', position: 'relative', zIndex: 10 }}>Pick Your Date</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.875rem', position: 'relative', zIndex: 10 }}>View my real-time calendar and select the exact date and time that works for you.</p>
            </div>
            
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '2rem', opacity: 0.1 }}>
                <FileSignature size={100} />
              </div>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1.5rem', fontWeight: 900, fontSize: '1.25rem', position: 'relative', zIndex: 10 }}>2</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', position: 'relative', zIndex: 10 }}>Sign Digitally</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.875rem', position: 'relative', zIndex: 10 }}>Review and sign your digital contract instantly to secure the legalities.</p>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '2rem', opacity: 0.1 }}>
                <CreditCard size={100} />
              </div>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1.5rem', fontWeight: 900, fontSize: '1.25rem', position: 'relative', zIndex: 10 }}>3</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', position: 'relative', zIndex: 10 }}>Pay Retainer</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.875rem', position: 'relative', zIndex: 10 }}>Submit your non-refundable retainer securely online. Your date is officially locked in!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '8rem 1.5rem', textAlign: 'center', maxWidth: '768px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '1.5rem' }}>
          Ready to make it official?
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '2.5rem' }}>
          Click below to access our live calendar and secure your session immediately.
        </p>
        <Link 
          href={`/portrait/book?userId=${userId}&inquiryId=${inquiryId}`}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800, padding: '1.25rem 2.5rem', borderRadius: '9999px', backgroundColor: themeColor, color: 'white', textDecoration: 'none', boxShadow: `0 4px 14px 0 ${themeColor}60` }}
        >
          Book Your Session Now
        </Link>
      </section>

    </div>
  );
}

export default function PortraitWelcomePage() {
  return (
    <Suspense fallback={<div className="login-wrapper">Loading Guide...</div>}>
      <WelcomeGuideContent />
    </Suspense>
  );
}
