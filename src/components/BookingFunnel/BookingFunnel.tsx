'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ClientInfo from './ClientInfo';
import PackageSelection from './PackageSelection';
import EventQuestionnaire from './EventQuestionnaire';
import DigitalContract from './DigitalContract';
import PaymentCheckout from './PaymentCheckout';
import { Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BookingFunnel() {
  const [currentStep, setCurrentStep] = useState(0); // 0 = Welcome, 1 = Client Info...
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);
  const [funnelSettings, setFunnelSettings] = useState<any>(null);
  const searchParams = useSearchParams();
  
  // Funnel State
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [questionnaireData, setQuestionnaireData] = useState<Record<string, any>>({});
  const [signature, setSignature] = useState('');
  const [contractHtml, setContractHtml] = useState('');

  useEffect(() => {
    const userId = searchParams.get('userId');

    const settingsFetch = userId
      ? fetch(`/api/public-booking?type=settings&userId=${userId}`)
          .then(res => res.json())
          .then(data => { if (data.success) setFunnelSettings(data.settings); })
          .catch(() => {})
      : fetch('/api/funnel-settings')
          .then(res => res.json())
          .then(data => { if (data.success) setFunnelSettings(data.settings); })
          .catch(() => {});

    const pkgFetch = userId
      ? fetch(`/api/public-booking?type=packages&userId=${userId}`)
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
        <header style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#0f172a',
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
              Welcome to the Experience.
            </h1>
            <p style={{
              fontSize: '1.25rem', color: 'rgba(255,255,255,0.75)',
              fontWeight: 400, lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem',
            }}>
              Thank you for inquiring! We are thrilled to be part of your special journey. This guide outlines our signature style and the simple process to secure your session.
            </p>
            <button
              onClick={handleNext}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '1rem', fontWeight: 700, padding: '1rem 2rem',
                borderRadius: '9999px', backgroundColor: 'white', color: '#0f172a',
                textDecoration: 'none', boxShadow: '0 10px 30px -5px rgba(255,255,255,0.3)',
                border: 'none', cursor: 'pointer'
              }}
            >
              Book Your Session <span style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '0.5rem' }}>→</span>
            </button>
          </div>
        </header>
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
              />
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}
