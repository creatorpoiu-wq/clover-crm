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
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetch(`/api/public-booking?type=portrait_settings&userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.settings) {
            setVendorInfo(data.settings);
            document.title = `${data.settings.companyName || 'Portrait Studio'} | Booking Process`;
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.setAttribute('name', 'description');
              document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', 'Booking Process');
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

  const themeColor = vendorInfo?.brandColor || '#0f172a';
  const companyName = vendorInfo?.companyName || 'Portrait Sessions';

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
      <header style={{
        position: 'relative',
        width: '100%',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
      }}>
        {/* Background Image */}
        {vendorInfo?.welcomeHeroPhotoUrl && (
          <img
            src={vendorInfo.welcomeHeroPhotoUrl}
            alt="Hero"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
            }}
          />
        )}
        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: vendorInfo?.welcomeHeroPhotoUrl
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.65) 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        }} />
        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 10, textAlign: 'center',
          padding: '8rem 1.5rem 5rem', maxWidth: '800px', margin: '0 auto',
        }}>
          <div style={{
            display: 'inline-block', marginBottom: '1.5rem',
            fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.25em', color: 'rgba(255,255,255,0.65)',
          }}>
            {companyName}
          </div>
          <h1 style={{
            fontWeight: 900, letterSpacing: '-0.04em', color: 'white',
            marginBottom: '1.5rem', fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1.1,
          }}>
            {vendorInfo?.welcomeHeroHeadline || 'Welcome to the Experience.'}
          </h1>
          <p style={{
            fontSize: '1.25rem', color: 'rgba(255,255,255,0.75)',
            fontWeight: 400, lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem',
          }}>
            {vendorInfo?.welcomeHeroSubheadline || 'Thank you for inquiring! This guide outlines our signature style, transparent pricing, and the simple three-step process to secure your session.'}
          </p>
          <Link
            href={`/portrait/book?userId=${userId}&inquiryId=${inquiryId}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '1rem', fontWeight: 700, padding: '1rem 2rem',
              borderRadius: '9999px', backgroundColor: themeColor, color: 'white',
              textDecoration: 'none', boxShadow: `0 10px 30px -5px ${themeColor}80`,
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            Book Your Session <ArrowRight size={18} />
          </Link>
        </div>
        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          <span>Scroll to explore</span>
          <div style={{
            width: '1px', height: '2rem',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
          }} />
        </div>
      </header>

      {/* Feature / Style Section */}
      <section className="funnel-section" style={{ backgroundColor: 'white', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div className="funnel-flex-responsive" style={{ maxWidth: '1024px', margin: '0 auto', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px', height: '600px', borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            {vendorInfo && (
              <img 
                src={vendorInfo.stylePhotoUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop"}
                alt="Portrait Style" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
              />
            )}
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', marginBottom: '1rem' }}>Our Signature Style</div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '1.5rem' }}>
              {vendorInfo?.styleHeading || 'Candid. Timeless. Authentic.'}
            </h2>
            <p style={{ color: '#475569', fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {vendorInfo?.styleDescription || 'We specialize in capturing raw, authentic moments rather than stiff poses. Our editing style relies on true-to-life colors with a subtle cinematic warmth, ensuring your portraits look beautiful decades from now.'}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(vendorInfo?.styleBullets || [
                'Natural light prioritization',
                'Guided, movement-based posing',
                'True-to-color editing aesthetic',
                'Focus on genuine emotion'
              ]).map((item: string, idx: number) => (
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
      <section className="funnel-section" style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', marginBottom: '1rem' }}>The Investment</div>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '1.5rem' }}>
          Transparent, all-inclusive pricing.
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '4rem', maxWidth: '42rem', margin: '0 auto 4rem' }}>
          No hidden fees or post-shoot sales sessions. Every package includes your high-resolution digital files and printing rights.
        </p>

        <div className={`funnel-grid funnel-grid-${Math.min(vendorInfo?.packages?.length || 3, 3)}`} style={{ textAlign: 'left' }}>
          {(vendorInfo?.packages || [
            { name: 'The Mini', price: 350, description: 'Perfect for quick updates or headshots.', features: ['30 Minute Session', '15 Edited Images', '1 Location'], featured: false },
            { name: 'The Classic', price: 650, description: 'The ideal balance for families and couples.', features: ['60 Minute Session', '50+ Edited Images', 'Up to 2 Outfits'], featured: true },
            { name: 'The Extended', price: 950, description: 'For editorial or multi-location shoots.', features: ['2 Hour Session', '100+ Edited Images', 'Multiple Locations'], featured: false }
          ]).map((pkg: any, idx: number) => {
            const isSelected = selectedPackage === pkg.name;
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedPackage(pkg.name)}
                style={{ 
                  backgroundColor: pkg.featured ? '#0f172a' : 'white', 
                  color: pkg.featured ? 'white' : '#1e293b', 
                  padding: '2rem', 
                  borderRadius: '1.5rem', 
                  position: 'relative', 
                  boxShadow: isSelected ? `0 0 0 4px ${themeColor}` : pkg.featured ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none', 
                  border: isSelected ? `2px solid ${themeColor}` : '1px solid #e2e8f0',
                  transform: pkg.featured ? 'translateY(-1rem)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {pkg.featured && (
                  <div style={{ position: 'absolute', top: 0, right: '2rem', transform: 'translateY(-50%)', backgroundColor: '#facc15', color: '#713f12', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.75rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={12}/> Most Popular
                  </div>
                )}
                {isSelected && (
                  <div style={{ position: 'absolute', top: '-0.75rem', left: '2rem', backgroundColor: themeColor, color: 'white', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.75rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <CheckCircle2 size={12}/> Selected
                  </div>
                )}
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: pkg.featured ? 'white' : '#1e293b' }}>{pkg.name}</h3>
                <div style={{ fontSize: '1.875rem', fontWeight: 900, marginBottom: '1rem', color: pkg.featured ? 'white' : '#0f172a' }}>${pkg.price}</div>
                <p style={{ color: pkg.featured ? '#94a3b8' : '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{pkg.description}</p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: pkg.featured ? 'rgba(255,255,255,0.9)' : '#334155', marginBottom: '2rem' }}>
                  {pkg.features.map((feature: string, fIdx: number) => (
                    <li key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} color={pkg.featured ? "rgba(255,255,255,0.3)" : "#cbd5e1"}/> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works / The Triple Threat */}
      <section className="funnel-section" style={{ backgroundColor: '#0f172a', color: 'white' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '1rem' }}>
              {vendorInfo?.whatsNextHeading || "What happens next?"}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
              {vendorInfo?.whatsNextSub || 'Booking your session is a seamless, 3-step process.'}
            </p>
          </div>

          <div className="funnel-grid funnel-grid-3">
            {(vendorInfo?.whatsNextSteps || [
              { title: 'Pick Your Date', description: 'View my real-time calendar and select the exact date and time that works for you.' },
              { title: 'Sign Digitally', description: 'Review and sign your digital contract instantly to secure the legalities.' },
              { title: 'Pay Retainer', description: 'Submit your non-refundable retainer securely. Your date is officially locked in!' },
            ]).map((step: any, idx: number) => {
              const icons = [<Calendar key={0} size={100} />, <FileSignature key={1} size={100} />, <CreditCard key={2} size={100} />];
              return (
                <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, padding: '2rem', opacity: 0.1 }}>
                    {icons[idx % 3]}
                  </div>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1.5rem', fontWeight: 900, fontSize: '1.25rem', position: 'relative', zIndex: 10 }}>{idx + 1}</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', position: 'relative', zIndex: 10 }}>{step.title}</h3>
                  <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.875rem', position: 'relative', zIndex: 10 }}>{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="funnel-hero">
        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '1.5rem' }}>
          Ready to make it official?
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '2.5rem' }}>
          Click below to access our live calendar and secure your session immediately.
        </p>
        <Link 
          href={`/portrait/book?userId=${userId}&inquiryId=${inquiryId}${selectedPackage ? `&package=${encodeURIComponent(selectedPackage)}` : ''}`}
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
