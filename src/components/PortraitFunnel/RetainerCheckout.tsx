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
      <div className="glass-panel" style={{ padding: '3rem 4rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', backgroundColor: 'white', textAlign: 'center' }}>
        <div style={{ width: '6rem', height: '6rem', borderRadius: '9999px', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ecfdf5', color: '#10b981' }}>
          <CheckCircle2 size={48} />
        </div>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem', letterSpacing: '-0.025em' }}>You're officially booked!</h2>
        <p style={{ color: '#64748b', fontSize: '1.125rem', maxWidth: '32rem', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Your session on <strong style={{ color: '#1e293b' }}>{new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</strong> at <strong style={{ color: '#1e293b' }}>{selectedTime}</strong> is securely locked in. A copy of your contract and the receipt have been sent to your email.
        </p>
        <button
          onClick={() => window.location.href = vendorInfo?.Website || 'https://google.com'}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderRadius: '0.75rem', color: 'white', fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: themeColor, border: 'none', cursor: 'pointer' }}
        >
          Return to Website
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '2rem 2.5rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem' }}>Secure Your Date</h2>
          <p style={{ color: '#64748b' }}>Submit the non-refundable retainer to permanently lock your calendar slot.</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={32} color="#94a3b8" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginBottom: '2.5rem' }}>
        
        {/* Invoice Summary */}
        <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>Retainer Invoice</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: '#475569', fontWeight: 500 }}>
            <span>Portrait Session Retainer</span>
            <span>${retainerAmount.toFixed(2)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
            <span>Date Lock ({new Date(selectedDate + 'T00:00:00').toLocaleDateString()})</span>
            <span>Included</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', fontWeight: 900, fontSize: '1.25rem', color: '#1e293b' }}>
            <span>Total Due Today</span>
            <span>${retainerAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Select Payment Method
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paymentMethods.map(method => (
              <div 
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                style={{
                  padding: '1rem', borderRadius: '0.75rem', border: '2px solid', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                  ...(selectedMethod === method.id ? { backgroundColor: '#f8fafc', borderColor: themeColor, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' } : { borderColor: '#f1f5f9', backgroundColor: 'transparent' })
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, color: '#1e293b', marginBottom: selectedMethod === method.id ? '0.5rem' : 0 }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #f1f5f9', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', color: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {method.icon}
                  </div>
                  {method.name}
                </div>
                {selectedMethod === method.id && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#475569', whiteSpace: 'pre-wrap', paddingLeft: '3rem', backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9' }}>
                    {method.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#dc2626', fontSize: '0.875rem', fontWeight: 700, backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', borderRadius: '0.75rem', color: '#475569', fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase', transition: 'all 0.2s', backgroundColor: 'transparent', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderRadius: '0.75rem', color: 'white', fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase', transition: 'all 0.2s', cursor: isSubmitting ? 'wait' : 'pointer', backgroundColor: themeColor, border: 'none', opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? 'Processing...' : 'Confirm Payment & Book'} <CheckCircle2 size={18} />
        </button>
      </div>
    </div>
  );
}
