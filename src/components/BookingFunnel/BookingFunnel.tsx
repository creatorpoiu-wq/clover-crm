'use client';
import React, { useState, useEffect } from 'react';
import PackageSelection from './PackageSelection';
import EventQuestionnaire from './EventQuestionnaire';
import DigitalContract from './DigitalContract';
import PaymentCheckout from './PaymentCheckout';
import { Check } from 'lucide-react';

export default function BookingFunnel() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);
  const [funnelSettings, setFunnelSettings] = useState<any>(null);
  
  // Funnel State
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [questionnaireData, setQuestionnaireData] = useState<Record<string, any>>({});
  const [signature, setSignature] = useState('');

  useEffect(() => {
    const pkgFetch = fetch('/api/packages?type=packages')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.packages.length > 0) {
          setPackages(data.packages);
        } else {
          setPackages([
            { Package_ID: 'p1', Name: 'Essential', Price: 2500, Duration: '6 Hours', Items: 'High-Res Digital Gallery\n1 Photographer\nPrint Release' },
            { Package_ID: 'p2', Name: 'Premium', Price: 4000, Duration: '8 Hours', Items: 'High-Res Digital Gallery\n2 Photographers\nEngagement Session\nPrint Release' },
            { Package_ID: 'p3', Name: 'Cinematic', Price: 6500, Duration: '10 Hours', Items: 'High-Res Digital Gallery\n2 Photographers & 1 Videographer\nHighlight Film\nEngagement Session' },
          ]);
        }
      })
      .catch(() => {
        setPackages([
          { Package_ID: 'p1', Name: 'Essential', Price: 2500, Duration: '6 Hours', Items: 'High-Res Digital Gallery\n1 Photographer\nPrint Release' },
          { Package_ID: 'p2', Name: 'Premium', Price: 4000, Duration: '8 Hours', Items: 'High-Res Digital Gallery\n2 Photographers\nEngagement Session\nPrint Release' },
          { Package_ID: 'p3', Name: 'Cinematic', Price: 6500, Duration: '10 Hours', Items: 'High-Res Digital Gallery\n2 Photographers & 1 Videographer\nHighlight Film\nEngagement Session' },
        ]);
      });

    const settingsFetch = fetch('/api/funnel-settings')
      .then(res => res.json())
      .then(data => { if (data.success) setFunnelSettings(data.settings); })
      .catch(() => {});

    Promise.all([pkgFetch, settingsFetch]).finally(() => setLoading(false));
  }, []);

  const steps = ['Packages', 'Questionnaire', 'Contract', 'Payment'];

  const handleNext = () => {
    if (currentStep < 4) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(s => s - 1);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
      {/* Top Progress Bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
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
            {currentStep === 1 && (
              <PackageSelection 
                packages={packages} 
                selectedPackage={selectedPackage} 
                setSelectedPackage={setSelectedPackage} 
                selectedAddons={selectedAddons} 
                setSelectedAddons={setSelectedAddons} 
                onNext={handleNext}
                funnelSettings={funnelSettings}
              />
            )}
            
            {currentStep === 2 && (
              <EventQuestionnaire 
                data={questionnaireData} 
                setData={setQuestionnaireData} 
                onNext={handleNext} 
                onBack={handleBack}
                funnelSettings={funnelSettings}
              />
            )}

            {currentStep === 3 && (
              <DigitalContract 
                questionnaire={questionnaireData} 
                pkg={selectedPackage} 
                addons={selectedAddons} 
                signature={signature}
                setSignature={setSignature}
                onNext={handleNext} 
                onBack={handleBack}
                funnelSettings={funnelSettings}
              />
            )}

            {currentStep === 4 && (
              <PaymentCheckout 
                questionnaire={questionnaireData} 
                pkg={selectedPackage} 
                addons={selectedAddons} 
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
