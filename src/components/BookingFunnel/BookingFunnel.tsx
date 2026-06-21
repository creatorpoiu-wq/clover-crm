'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ClientInfo from './ClientInfo';
import PackageSelection from './PackageSelection';
import EventQuestionnaire from './EventQuestionnaire';
import DigitalContract from './DigitalContract';
import PaymentCheckout from './PaymentCheckout';
import { Check, ArrowLeft, ArrowRight, Star, CheckCircle2, Calendar, FileSignature, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { getEmbedUrl } from '@/utils/embed';

export default function BookingFunnel() {
  const [currentStep, setCurrentStep] = useState(0); // 0 = Welcome, 1 = Client Info...
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);
  const [funnelSettings, setFunnelSettings] = useState<any>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  // Funnel State
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [questionnaireData, setQuestionnaireData] = useState<Record<string, any>>({});
  const [signature, setSignature] = useState('');
  const [contractHtml, setContractHtml] = useState('');

  useEffect(() => {
    const urlUserId = searchParams.get('userId');
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isCustomDomain = hostname && hostname !== 'localhost' && !hostname.includes('vercel.app');

    // Capture userId from URL immediately if present
    if (urlUserId) setResolvedUserId(urlUserId);

    const settingsFetch = (urlUserId || isCustomDomain)
      ? fetch(`/api/public-booking?type=settings&customDomain=${hostname}${urlUserId ? `&userId=${urlUserId}` : ''}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setFunnelSettings(data.settings);
              // If the API resolved userId via custom domain, capture it
              if (data.userId && !urlUserId) setResolvedUserId(data.userId);
            }
          })
          .catch(() => {})
      : fetch('/api/funnel-settings')
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setFunnelSettings(data.settings);
              if (data.userId) setResolvedUserId(data.userId);
            }
          })
          .catch(() => {});

    const pkgFetch = (urlUserId || isCustomDomain)
      ? fetch(`/api/public-booking?type=packages&customDomain=${hostname}${urlUserId ? `&userId=${urlUserId}` : ''}`)
          .then(res => res.json())
          .then(data => { 
            if (data.success) {
              const weddingPkgs = data.packages.filter((p: any) => p.Sessions?.Service_Type?.toLowerCase().includes('wedding'));
              setPackages(weddingPkgs);
            } 
          })
          .catch(() => {})
      : fetch('/api/packages?type=packages')
          .then(res => res.json())
          .then(data => { 
            if (data.success) {
              const weddingPkgs = data.packages.filter((p: any) => p.Sessions?.Service_Type?.toLowerCase().includes('wedding'));
              setPackages(weddingPkgs);
            } 
          })
          .catch(() => {});

    Promise.all([pkgFetch, settingsFetch]).finally(() => setLoading(false));
  }, [searchParams]);

  const steps = ['Client Info', 'Packages', 'Questionnaire', 'Contract', 'Payment'];

  const handleNext = () => {
    if (currentStep < 5) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(s => s - 1);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0f172a', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
      {/* Top Progress Bar */}
      {currentStep > 0 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
          {!searchParams.get('userId') && (
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 20px 0' }}>
              <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#6b7280', textDecoration: 'none', transition: 'color 0.2s' }}>
                <ArrowLeft size={14} /> Back to Dashboard
              </Link>
            </div>
          )}
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            {steps.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = currentStep === stepNum;
              const isPast = currentStep > stepNum;
              
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', opacity: isActive || isPast ? 1 : 0.4 }}>
                  <div style={{ 
                    width: 28, height: 28, borderRadius: '50%', 
                    background: isPast ? '#0d9488' : isActive ? '#111827' : '#e5e7eb',
                    color: isPast ? '#fff' : isActive ? '#fff' : '#6b7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800
                  }}>
                    {isPast ? <Check size={14} /> : stepNum}
                  </div>
                  <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 700, color: '#111827', display: typeof window !== 'undefined' && window.innerWidth > 600 ? 'block' : 'none' }}>
                    {label}
                  </span>
                  {idx < steps.length - 1 && (
                    <div style={{ width: 40, height: 2, background: isPast ? '#0d9488' : '#e5e7eb', margin: '0 16px', display: typeof window !== 'undefined' && window.innerWidth > 600 ? 'block' : 'none' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentStep === 0 ? (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', margin: '-3rem -1rem 0 -1rem', width: 'calc(100% + 2rem)' }}>
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
            {funnelSettings?.coverImage && (
              <img
                src={funnelSettings.coverImage}
                alt="Hero"
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center',
                }}
              />
            )}
            <div style={{
              position: 'absolute', inset: 0,
              background: funnelSettings?.coverImage
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
                {funnelSettings?.welcomeHeroHeadline || "Welcome to the Experience."}
              </h1>
              <p style={{
                fontSize: '1.25rem', color: 'rgba(255,255,255,0.75)',
                fontWeight: 400, lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem',
              }}>
                {funnelSettings?.welcomeHeroSubheadline || "Thank you for inquiring! We are thrilled to be part of your special journey. This guide outlines our signature style and the simple process to secure your session."}
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
          {packages && packages.length > 0 && (
            <section style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center', padding: '6rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', marginBottom: '1rem' }}>The Investment</div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '1.5rem' }}>
                {funnelSettings?.investmentHeadline || 'Transparent, all-inclusive pricing.'}
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '4rem', maxWidth: '42rem', margin: '0 auto 4rem' }}>
                {funnelSettings?.investmentDescription || 'No hidden fees. Select the collection that best suits your vision for the big day.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ textAlign: 'left' }}>
                {packages.map((pkg, idx) => {
                  const isSelected = selectedPackage?.Package_ID === pkg.Package_ID;
                  // Auto-feature the middle package if there are 3, otherwise the first one if there are 2, etc. (Just a visual heuristic)
                  const isFeatured = idx === Math.floor(packages.length / 2) && packages.length > 1;
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
                if (packages && packages.length > 0 && !selectedPackage) {
                  const hero = document.getElementById('funnel-scroll-target');
                  if (hero) hero.scrollIntoView({ behavior: 'smooth' });
                  alert("Please select a package first.");
                } else {
                  handleNext();
                }
              }}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800, padding: '1.25rem 2.5rem', borderRadius: '9999px', backgroundColor: '#0f172a', color: 'white', textDecoration: 'none', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(15, 23, 42, 0.4)' }}
            >
              Book Your Session Now
            </button>
          </section>
        </div>
      ) : (
        <div style={{ maxWidth: 900, margin: '40px auto 0', padding: '0 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: '#6b7280' }}>Loading proposal...</div>
          ) : (
            <>


            {currentStep === 1 && (
              <ClientInfo 
                data={questionnaireData} 
                setData={setQuestionnaireData} 
                onNext={handleNext}
                onBack={handleBack}
                funnelSettings={funnelSettings}
              />
            )}

            {currentStep === 2 && (
              <PackageSelection 
                packages={packages} 
                selectedPackage={selectedPackage} 
                setSelectedPackage={setSelectedPackage} 
                selectedAddons={selectedAddons} 
                setSelectedAddons={setSelectedAddons} 
                onNext={handleNext}
                onBack={handleBack}
                funnelSettings={funnelSettings}
              />
            )}
            
            {currentStep === 3 && (
              <EventQuestionnaire 
                data={questionnaireData} 
                setData={setQuestionnaireData} 
                onNext={handleNext} 
                onBack={handleBack}
                funnelSettings={funnelSettings}
              />
            )}

            {currentStep === 4 && (
              <DigitalContract 
                questionnaire={questionnaireData} 
                pkg={selectedPackage} 
                addons={selectedAddons} 
                signature={signature}
                setSignature={setSignature}
                setContractHtml={setContractHtml}
                onNext={handleNext} 
                onBack={handleBack}
                funnelSettings={funnelSettings}
              />
            )}

            {currentStep === 5 && (
              <PaymentCheckout 
                questionnaire={questionnaireData} 
                pkg={selectedPackage} 
                addons={selectedAddons} 
                signature={signature}
                contractHtml={contractHtml}
                onBack={handleBack}
                funnelSettings={funnelSettings}
                userId={resolvedUserId}
              />
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}
