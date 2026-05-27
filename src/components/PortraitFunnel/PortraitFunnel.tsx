'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, ArrowLeft, Calendar, FileSignature, CreditCard } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import PortraitContract from './PortraitContract';
import RetainerCheckout from './RetainerCheckout';

export default function PortraitFunnel() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [vendorInfo, setVendorInfo] = useState<any>(null);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const searchParams = useSearchParams();
  
  const userId = searchParams.get('userId');
  const inquiryId = searchParams.get('inquiryId');

  // Funnel State
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [signature, setSignature] = useState('');

  useEffect(() => {
    if (!userId || !inquiryId) {
      setLoading(false);
      return;
    }

    const fetchVendorInfo = fetch(`/api/public-booking?type=portrait_settings&userId=${userId}`)
      .then(res => res.json())
      .then(data => { if (data.success) setVendorInfo(data.settings); })
      .catch(() => {});

    // Fetch booked dates from the public booking API or a dedicated calendar availability API
    // We'll use the existing public-booking endpoint and modify the backend slightly or add a new endpoint.
    // For now, let's fetch from a new endpoint we will create: `/api/portrait/availability?userId=...`
    const fetchAvailability = fetch(`/api/portrait/availability?userId=${userId}`)
      .then(res => res.json())
      .then(data => { if (data.success) setBookedDates(data.bookedDates); })
      .catch(() => {});

    Promise.all([fetchVendorInfo, fetchAvailability]).finally(() => setLoading(false));
  }, [userId, inquiryId]);

  if (!userId || !inquiryId) {
    return (
      <div className="login-wrapper">
        <div className="login-card glass-panel">
          <h2 className="page-title">Invalid Link</h2>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="login-wrapper">
        <div className="login-card glass-panel">
          <h2 className="page-title">Loading...</h2>
        </div>
      </div>
    );
  }

  const steps = [
    { label: 'Select Date', icon: Calendar },
    { label: 'Contract', icon: FileSignature },
    { label: 'Retainer', icon: CreditCard }
  ];

  const themeColor = vendorInfo?.Brand_Color || '#0f172a';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'inherit', paddingBottom: '5rem' }}>
      {/* Top Progress Bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isPast = currentStep > stepNum;
            
            return (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', opacity: isActive || isPast ? 1 : 0.4 }}>
                <div 
                  style={{
                    width: '2rem', height: '2rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900,
                    backgroundColor: isPast ? themeColor : isActive ? '#1e293b' : '#e2e8f0',
                    color: isPast || isActive ? '#fff' : '#64748b',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {isPast ? <Check size={14} /> : stepNum}
                </div>
                <span className={`funnel-step-text ${isActive ? 'active' : ''}`} style={{ marginLeft: '0.75rem', fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <div className="funnel-step-line" style={{ width: '2rem', height: '0.125rem', margin: '0 1rem', borderRadius: '9999px', backgroundColor: isPast ? themeColor : '#e2e8f0' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: '896px', margin: '2rem auto 0', padding: '0 1rem' }}>
        {currentStep === 1 && (
          <CalendarPicker 
            bookedDates={bookedDates}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelect={(date, time) => {
              setSelectedDate(date);
              setSelectedTime(time);
            }}
            onNext={() => setCurrentStep(2)}
            themeColor={themeColor}
          />
        )}

        {currentStep === 2 && (
          <PortraitContract 
            userId={userId}
            inquiryId={inquiryId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            signature={signature}
            setSignature={setSignature}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
            themeColor={themeColor}
            vendorInfo={vendorInfo}
          />
        )}

        {currentStep === 3 && (
          <RetainerCheckout 
            userId={userId}
            inquiryId={inquiryId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            signature={signature}
            onBack={() => setCurrentStep(2)}
            themeColor={themeColor}
            vendorInfo={vendorInfo}
            selectedPackageName={searchParams.get('package')}
          />
        )}
      </div>
    </div>
  );
}
