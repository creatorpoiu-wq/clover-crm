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

      <div style={{ maxWidth: 900, margin: '40px auto 0', padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#6b7280' }}>Loading proposal...</div>
        ) : (
          <>
            {currentStep === 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden', textAlign: 'center' }}>
                {funnelSettings?.coverImage && (
                  <div style={{ width: '100%', height: '250px', backgroundImage: `url(${funnelSettings.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
                <div style={{ padding: '3rem 2rem' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                    Welcome to your Booking Proposal
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '2.5rem', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                    We are thrilled at the opportunity to work with you! Please proceed to complete your information, select your package, and finalize your booking.
                  </p>
                  <button 
                    onClick={handleNext}
                    style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 700, backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
                  >
                    Get Started <span style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '0.5rem' }}>→</span>
                  </button>
                </div>
              </div>
            )}

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
    </div>
  );
}
