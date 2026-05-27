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

    const fetchVendorInfo = fetch(`/api/public-booking?type=settings&userId=${userId}`)
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
    return <div className="min-h-screen flex items-center justify-center">Invalid Link</div>;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const steps = [
    { label: 'Select Date', icon: Calendar },
    { label: 'Contract', icon: FileSignature },
    { label: 'Retainer', icon: CreditCard }
  ];

  const themeColor = vendorInfo?.Brand_Color || '#0f172a';

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-20">
      {/* Top Progress Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isPast = currentStep > stepNum;
            const Icon = step.icon;
            
            return (
              <div key={step.label} className={`flex items-center ${isActive || isPast ? 'opacity-100' : 'opacity-40'}`}>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm transition-colors"
                  style={{
                    backgroundColor: isPast ? themeColor : isActive ? '#1e293b' : '#e2e8f0',
                    color: isPast || isActive ? '#fff' : '#64748b'
                  }}
                >
                  {isPast ? <Check size={14} /> : stepNum}
                </div>
                <span className="ml-3 text-sm font-bold text-slate-800 hidden md:block">
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <div className="w-8 md:w-16 h-0.5 mx-4 md:mx-6 rounded-full" style={{ backgroundColor: isPast ? themeColor : '#e2e8f0' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
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
          />
        )}
      </div>
    </div>
  );
}
