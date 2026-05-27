import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, CreditCard, Landmark, Wallet, AlertCircle } from 'lucide-react';

interface RetainerCheckoutProps {
  userId: string;
  inquiryId: string;
  selectedDate: string | null;
  selectedTime: string | null;
  signature: string;
  onBack: () => void;
  themeColor: string;
  vendorInfo: any;
}

export default function RetainerCheckout({
  userId, inquiryId, selectedDate, selectedTime, signature, onBack, themeColor, vendorInfo
}: RetainerCheckoutProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Placeholder Retainer Amount (could be dynamic in the future)
  const retainerAmount = 250;

  // Placeholder Payment Methods (modeled after the Invoice Builder)
  const paymentMethods = [
    {
      id: 'bank',
      name: 'Bank Transfer (BACS / Wire)',
      icon: <Landmark size={20} />,
      details: "Bank Name: National Bank\nAccount Name: Clover Studios\nAccount Number: 12345678\nRouting/Sort Code: 12-34-56"
    },
    {
      id: 'card',
      name: 'Credit Card (Stripe Placeholder)',
      icon: <CreditCard size={20} />,
      details: "You will be redirected to a secure Stripe checkout page to complete your payment.",
      isPlaceholder: true
    },
    {
      id: 'digital',
      name: 'Digital Wallet (PayPal / Venmo)',
      icon: <Wallet size={20} />,
      details: "PayPal: payments@cloverstudios.com\nVenmo: @CloverStudios"
    }
  ];

  const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0].id);

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Submit the final booking payload (Contract, Invoice, Calendar)
      const res = await fetch('/api/public-booking/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          inquiryId, // Custom field for portrait funnel to map to existing inquiry
          contractId: null, // New contract
          questionnaire: {
            'Event Date': selectedDate,
            'Event Time': selectedTime
          },
          pkg: { Name: 'Portrait Session Retainer', Price: retainerAmount },
          addons: [],
          signature,
          totalAmount: retainerAmount,
          depositAmount: retainerAmount
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
        // Also update the Inquiry with the exact Date
        await fetch(`/api/portrait/availability/lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inquiryId, selectedDate })
        }).catch(() => {}); // Fire and forget
      } else {
        setError(data.error || 'Failed to complete booking.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-12 md:p-16 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 text-center">
        <div className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center bg-emerald-50 text-emerald-500">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">You're officially booked!</h2>
        <p className="text-slate-500 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          Your session on <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</strong> at <strong>{selectedTime}</strong> is securely locked in. A copy of your contract and the receipt have been sent to your email.
        </p>
        <button
          onClick={() => window.location.href = vendorInfo?.Website || 'https://google.com'}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold tracking-wide uppercase transition-all shadow-lg hover:-translate-y-0.5"
          style={{ backgroundColor: themeColor }}
        >
          Return to Website
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Secure Your Date</h2>
          <p className="text-slate-500">Submit the non-refundable retainer to permanently lock your calendar slot.</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl hidden md:block">
          <FileText size={32} className="text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        
        {/* Invoice Summary */}
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 border-b border-slate-200 pb-4">Retainer Invoice</h3>
          
          <div className="flex justify-between items-center mb-4 text-slate-600 font-medium">
            <span>Portrait Session Retainer</span>
            <span>${retainerAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center mb-6 text-slate-500 text-sm">
            <span>Date Lock ({new Date(selectedDate + 'T00:00:00').toLocaleDateString()})</span>
            <span>Included</span>
          </div>
          
          <div className="flex justify-between items-center pt-6 border-t border-slate-200 font-black text-xl text-slate-800">
            <span>Total Due Today</span>
            <span>${retainerAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 border-b border-slate-200 pb-4 flex items-center gap-2">
            Select Payment Method
          </h3>
          
          <div className="space-y-4">
            {paymentMethods.map(method => (
              <div 
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col ${
                  selectedMethod === method.id 
                    ? 'bg-slate-50 shadow-sm' 
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                }`}
                style={selectedMethod === method.id ? { borderColor: themeColor } : {}}
              >
                <div className="flex items-center gap-3 font-bold text-slate-800 mb-2">
                  <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm" style={{ color: themeColor }}>
                    {method.icon}
                  </div>
                  {method.name}
                </div>
                {selectedMethod === method.id && (
                  <div className="mt-2 text-sm text-slate-600 whitespace-pre-wrap pl-12 bg-white p-4 rounded-lg border border-slate-100">
                    {method.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {error && (
        <div className="flex items-center justify-center gap-2 text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl mb-8">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="flex justify-between items-center pt-8 border-t border-slate-100">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-4 rounded-xl text-slate-600 font-bold tracking-wide uppercase transition-all hover:bg-slate-100 disabled:opacity-50"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold tracking-wide uppercase transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait"
          style={{ backgroundColor: themeColor }}
        >
          {isSubmitting ? 'Processing...' : 'Confirm Payment & Book'} <CheckCircle2 size={18} />
        </button>
      </div>
    </div>
  );
}
