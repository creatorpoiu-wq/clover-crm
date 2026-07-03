import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, CreditCard, Landmark, Wallet, AlertCircle } from 'lucide-react';
import PayPalCheckoutButton from '../PayPalCheckoutButton';

interface RetainerCheckoutProps {
  userId: string;
  inquiryId: string;
  selectedDate: string | null;
  selectedTime: string | null;
  signature: string;
  contractHtml: string;
  onBack: () => void;
  themeColor: string;
  vendorInfo: any;
  selectedPackageName?: string | null;
}

export default function RetainerCheckout({
  userId, inquiryId, selectedDate, selectedTime, signature, contractHtml, onBack, themeColor, vendorInfo, selectedPackageName
}: RetainerCheckoutProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Dynamic Retainer Amount and Package Selection
  const selectedPackage = (vendorInfo?.packages || []).find((p: any) => p.name === selectedPackageName) || null;
  const packageTotal = selectedPackage?.price ? Number(selectedPackage.price) : 0;
  const retainerAmount = vendorInfo?.retainerAmount ? Number(vendorInfo.retainerAmount) : 100;
  const balanceDue = packageTotal > retainerAmount ? packageTotal - retainerAmount : 0;

  // Determine if package supports deposit vs full payment selection
  const showPaymentChoice = packageTotal > retainerAmount;
  const [paymentChoice, setPaymentChoice] = useState<'retainer' | 'full' | null>(
    showPaymentChoice ? null : 'retainer'
  );

  const amountToPayToday = paymentChoice === 'full' ? packageTotal : retainerAmount;
  const remainingBalance = paymentChoice === 'full' ? 0 : balanceDue;

  const [selectedMethod, setSelectedMethod] = useState('');

  // Re-map payment methods based on what's active in vendorInfo
  const activeMethods = vendorInfo?.paymentMethods || [];
  const hasPaypal = vendorInfo?.paypalClientId && activeMethods.includes('PayPal');

  // Filter or build the methods list
  const paymentMethodsList = [];
  if (activeMethods.includes('Bank Transfer') || activeMethods.includes('Bank Transfer (BACS / Wire)')) {
    paymentMethodsList.push({
      id: 'bank',
      name: 'Bank Transfer',
      icon: <Landmark size={20} />,
      details: vendorInfo?.paymentInstructions || "Please contact the studio for bank transfer details."
    });
  }
  if (activeMethods.includes('Credit Card (Stripe)')) {
    paymentMethodsList.push({
      id: 'card',
      name: 'Credit Card (Stripe)',
      icon: <CreditCard size={20} />,
      details: "You will be redirected to a secure Stripe checkout page to complete your payment.",
      isPlaceholder: true
    });
  }
  if (hasPaypal) {
    paymentMethodsList.push({
      id: 'paypal',
      name: 'PayPal',
      icon: <Wallet size={20} />,
      details: "Checkout securely with PayPal."
    });
  }
  if (activeMethods.includes('Venmo') || activeMethods.includes('Zelle') || activeMethods.includes('Cash App')) {
    paymentMethodsList.push({
      id: 'digital',
      name: 'Digital Wallet (Venmo / Zelle / Cash App)',
      icon: <Wallet size={20} />,
      details: `Venmo: ${vendorInfo?.venmoHandle || 'N/A'}\nZelle: ${vendorInfo?.zelleContact || 'N/A'}`
    });
  }

  // Fallback if none configured
  if (paymentMethodsList.length === 0) {
    paymentMethodsList.push({
      id: 'manual',
      name: 'Manual / Invoice Later',
      icon: <FileText size={20} />,
      details: "We will send you an invoice manually."
    });
  }

  // Initialize selectedMethod if empty
  if (!selectedMethod && paymentMethodsList.length > 0) {
    setSelectedMethod(paymentMethodsList[0].id);
  }

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
          pkg: selectedPackage ? { Name: selectedPackage.name, Price: packageTotal } : { Name: 'Portrait Session', Price: packageTotal || retainerAmount },
          addons: [],
          signature,
          contractHtml,
          totalAmount: packageTotal || retainerAmount,
          depositAmount: amountToPayToday,
          paymentChoice,
          paymentMethod: selectedMethod
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
          onClick={() => window.location.href = vendorInfo?.website || 'https://google.com'}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderRadius: '0.75rem', color: 'white', fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: themeColor, border: 'none', cursor: 'pointer' }}
        >
          Return to Website
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel funnel-pad">
      <div className="funnel-flex-responsive" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem' }}>Secure Your Date</h2>
          <p style={{ color: '#64748b' }}>Submit the non-refundable retainer to permanently lock your calendar slot.</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={32} color="#94a3b8" />
        </div>
      </div>

      {showPaymentChoice && (
        <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
            Choose Payment Option
          </h3>
          <div style={{ display: 'flex', gap: '1.25rem', flexDirection: 'row', flexWrap: 'wrap' }}>
            {/* Pay Retainer Option */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => setPaymentChoice('retainer')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPaymentChoice('retainer'); }}
              style={{
                flex: 1, 
                minWidth: '260px',
                padding: '1.75rem 1.5rem', 
                borderRadius: '1rem', 
                border: '2px solid', 
                cursor: 'pointer', 
                transition: 'all 0.25s ease',
                textAlign: 'left',
                backgroundColor: paymentChoice === 'retainer' ? '#ffffff' : '#f8fafc',
                borderColor: paymentChoice === 'retainer' ? themeColor : '#e2e8f0',
                boxShadow: paymentChoice === 'retainer' ? '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' : 'none',
                transform: paymentChoice === 'retainer' ? 'translateY(-2px)' : 'none',
                outline: 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Pay Retainer</h4>
                <div style={{
                  width: '1.25rem', height: '1.25rem', borderRadius: '9999px', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderColor: paymentChoice === 'retainer' ? themeColor : '#cbd5e1',
                  backgroundColor: paymentChoice === 'retainer' ? themeColor : 'transparent'
                }}>
                  {paymentChoice === 'retainer' && <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: 'white' }} />}
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
                ${retainerAmount.toFixed(2)}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                Secure your slot now. The remaining balance of ${balanceDue.toFixed(2)} will be due later.
              </p>
            </div>

            {/* Pay in Full Option */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => setPaymentChoice('full')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPaymentChoice('full'); }}
              style={{
                flex: 1, 
                minWidth: '260px',
                padding: '1.75rem 1.5rem', 
                borderRadius: '1rem', 
                border: '2px solid', 
                cursor: 'pointer', 
                transition: 'all 0.25s ease',
                textAlign: 'left',
                backgroundColor: paymentChoice === 'full' ? '#ffffff' : '#f8fafc',
                borderColor: paymentChoice === 'full' ? themeColor : '#e2e8f0',
                boxShadow: paymentChoice === 'full' ? '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' : 'none',
                transform: paymentChoice === 'full' ? 'translateY(-2px)' : 'none',
                outline: 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Pay in Full</h4>
                <div style={{
                  width: '1.25rem', height: '1.25rem', borderRadius: '9999px', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderColor: paymentChoice === 'full' ? themeColor : '#cbd5e1',
                  backgroundColor: paymentChoice === 'full' ? themeColor : 'transparent'
                }}>
                  {paymentChoice === 'full' && <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: 'white' }} />}
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
                ${packageTotal.toFixed(2)}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                Complete payment today. No future transactions or balance reminders.
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentChoice === null ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '2px dashed #e2e8f0', borderRadius: '1rem', color: '#64748b', backgroundColor: '#f8fafc', marginBottom: '2.5rem' }}>
          <CreditCard size={40} style={{ margin: '0 auto 1rem', opacity: 0.6, color: themeColor }} />
          <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Select a payment option to continue</h4>
          <p style={{ fontSize: '0.875rem', maxWidth: '24rem', margin: '0 auto', lineHeight: 1.5 }}>Choose whether you want to pay the retainer or the full amount to see the available payment methods.</p>
        </div>
      ) : (
        <div className="funnel-grid funnel-grid-2" style={{ marginBottom: '2.5rem' }}>
          
          {/* Invoice Summary */}
          <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>Invoice Summary</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: '#475569', fontWeight: 500 }}>
              <span>{selectedPackage?.name || 'Portrait Session'}</span>
              <span>{packageTotal ? `$${packageTotal.toFixed(2)}` : 'TBD'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
              <span>Date Lock ({new Date(selectedDate + 'T00:00:00').toLocaleDateString()})</span>
              <span>Included</span>
            </div>

            {packageTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                <span>Remaining Balance (Due Later)</span>
                <span>${remainingBalance.toFixed(2)}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', fontWeight: 900, fontSize: '1.25rem', color: '#1e293b' }}>
              <span>{paymentChoice === 'full' ? 'Total Due Today' : 'Retainer Due Today'}</span>
              <span>${amountToPayToday.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Select Payment Method
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {paymentMethodsList.map(method => (
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
      )}

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
        
        {paymentChoice !== null && (
          selectedMethod === 'paypal' ? (
            <div style={{ minWidth: 300 }}>
              <PayPalCheckoutButton 
                clientId={vendorInfo?.paypalClientId} 
                amount={amountToPayToday} 
                description={`${paymentChoice === 'full' ? 'Full Payment' : 'Retainer'} for ${selectedPackage?.name || 'Portrait Session'}`}
                onSuccess={(details) => {
                  // Details will contain PayPal order capture response
                  handleComplete();
                }}
                onError={(err) => setError("PayPal payment failed. Please try again or use another method.")}
              />
            </div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderRadius: '0.75rem', color: 'white', fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase', transition: 'all 0.2s', cursor: isSubmitting ? 'wait' : 'pointer', backgroundColor: themeColor, border: 'none', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Processing...' : 'Confirm Payment & Book'} <CheckCircle2 size={18} />
            </button>
          )
        )}
      </div>
    </div>
  );
}
