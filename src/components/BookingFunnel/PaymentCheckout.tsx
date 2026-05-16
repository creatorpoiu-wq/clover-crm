'use client';
import React, { useState } from 'react';
import { Lock, CreditCard, Building2, Smartphone, CheckCircle } from 'lucide-react';

interface Props {
  questionnaire: any;
  pkg: any;
  addons: any[];
  onBack: () => void;
  funnelSettings: any;
}

// Default payment methods when none are configured
const DEFAULT_PAYMENT_METHODS = [
  { id: 'card',  name: 'Credit Card',   icon: 'card',  details: '' },
  { id: 'bank',  name: 'Bank Transfer', icon: 'bank',  details: 'Bank: Chase\nAccount: 123456789\nRouting: 987654321' },
  { id: 'zelle', name: 'Zelle',         icon: 'zelle', details: 'payments@studio.com' },
];

function PaymentIcon({ iconId }: { iconId: string }) {
  if (iconId === 'card')  return <CreditCard size={20} />;
  if (iconId === 'bank')  return <Building2 size={20} />;
  if (iconId === 'zelle') return <Smartphone size={20} />;
  return <CreditCard size={20} />;
}

export default function PaymentCheckout({ questionnaire, pkg, addons, onBack, funnelSettings }: Props) {
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Resolve payment methods: use custom ones if defined, else defaults
  const rawMethods: any[] = funnelSettings?.paymentMethods?.length > 0
    ? funnelSettings.paymentMethods.filter((m: any) => m.enabled !== false)
    : DEFAULT_PAYMENT_METHODS;

  // Select first method by default
  const activeMethodId = selectedMethodId || rawMethods[0]?.id || '';
  const activeMethod = rawMethods.find(m => m.id === activeMethodId) || rawMethods[0];

  // Step 4 text
  const step = funnelSettings?.steps?.[3];
  const stepTitle = step?.title || 'Complete Your Booking';
  const stepSubtitle = step?.subtitle || 'Secure your date by submitting the 50% retainer.';

  // Confirmation text
  const confirmTitle = funnelSettings?.confirmationTitle || 'Booking Confirmed!';
  const confirmMessage = funnelSettings?.confirmationMessage || 'Your deposit has been received and your contract is securely signed. We are officially locked in!';

  const pkgPrice = pkg?.Price || 0;
  const addonsPrice = addons.reduce((sum, a) => sum + a.price, 0);
  const total = pkgPrice + addonsPrice;
  const deposit = total * 0.5;

  const clientNameStr = questionnaire['Full Name'] || questionnaire['Name'] || questionnaire.name || 'Client';
  const firstName = typeof clientNameStr === 'string' ? clientNameStr.split(' ')[0] : 'Client';
  const eventDateStr = questionnaire['Event Date'] || questionnaire.eventDate || 'your selected date';

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
    }, 2000);
  };

  const isCardMethod = activeMethod && !activeMethod.details;

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, background: '#fff', marginBottom: 16 };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700 as const, color: '#374151', marginBottom: 6 };

  if (success) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }}>
        <CheckCircle size={64} color="#0d9488" style={{ margin: '0 auto 24px' }} />
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: '0 0 16px' }}>{confirmTitle}</h1>
        <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Thank you, {firstName}! {confirmMessage.replace('[name]', firstName).replace('{name}', firstName)}
        </p>
        <button onClick={() => window.location.href = '/'} style={{ background: '#111827', color: '#fff', padding: '14px 28px', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Return Home</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>{stepTitle}</h2>
        <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>{stepSubtitle}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Left: Order Summary */}
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: 16, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Summary</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
            <span style={{ color: '#374151', fontWeight: 600 }}>{pkg?.Name} Package</span>
            <span style={{ color: '#111827', fontWeight: 700 }}>${pkgPrice.toLocaleString()}</span>
          </div>
          
          {addons.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: '#6b7280' }}>+ {a.name}</span>
              <span style={{ color: '#6b7280' }}>${a.price.toLocaleString()}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #e5e7eb', margin: '20px 0', paddingTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: '#374151', fontWeight: 600 }}>Total Value</span>
              <span style={{ color: '#111827', fontWeight: 700 }}>${total.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e0f2fe', padding: '16px', borderRadius: 8, marginTop: 16 }}>
              <div>
                <div style={{ color: '#0369a1', fontWeight: 800, fontSize: 14 }}>Amount Due Today</div>
                <div style={{ color: '#0284c7', fontSize: 12, marginTop: 4 }}>50% Retainer</div>
              </div>
              <div style={{ color: '#0369a1', fontWeight: 900, fontSize: 24 }}>
                ${deposit.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment Gateway */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          {/* Method selector buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {rawMethods.map((m: any) => (
              <button
                key={m.id}
                onClick={() => setSelectedMethodId(m.id)}
                style={{
                  flex: 1, minWidth: 80, padding: '12px 10px',
                  border: activeMethodId === m.id ? '2px solid #0d9488' : '1px solid #d1d5db',
                  background: activeMethodId === m.id ? '#f0fdfa' : '#fff',
                  borderRadius: 8, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  color: activeMethodId === m.id ? '#0d9488' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                <PaymentIcon iconId={m.icon || m.id} />
                <span style={{ fontSize: 11, fontWeight: 700 }}>{m.name}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handlePay}>
            {/* Card form — only for methods with no custom details (defaults to card) */}
            {isCardMethod ? (
              <div className="animate-fade-in">
                <label style={labelStyle}>Cardholder Name</label>
                <input required placeholder="Jordan Smith" style={inputStyle} />
                
                <label style={labelStyle}>Card Number</label>
                <div style={{ position: 'relative' }}>
                  <input required placeholder="0000 0000 0000 0000" style={inputStyle} maxLength={19} />
                  <CreditCard size={16} color="#9ca3af" style={{ position: 'absolute', right: 14, top: 14 }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Expiration</label>
                    <input required placeholder="MM/YY" style={inputStyle} maxLength={5} />
                  </div>
                  <div>
                    <label style={labelStyle}>CVC</label>
                    <input required placeholder="123" type="password" style={inputStyle} maxLength={4} />
                  </div>
                </div>
                <label style={labelStyle}>Billing Zip Code</label>
                <input required placeholder="90210" style={inputStyle} maxLength={10} />
              </div>
            ) : (
              /* Custom instructions panel for non-card methods */
              <div className="animate-fade-in" style={{ padding: 20, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Please send your deposit using the details below. Include your name and event date in the reference.
                </p>
                {activeMethod?.details?.split('\n').map((line: string, i: number) => (
                  <div key={i} style={{ fontSize: 14, color: '#111827', fontWeight: 600, marginBottom: 4 }}>{line}</div>
                ))}
              </div>
            )}
            
            <button 
              type="submit"
              disabled={isProcessing}
              style={{
                width: '100%', background: isProcessing ? '#9ca3af' : '#111827', color: '#fff',
                padding: '16px', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 800,
                cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s'
              }}
            >
              {isProcessing ? 'Processing securely...' : isCardMethod ? `Pay $${deposit.toLocaleString()}` : 'I Have Sent Payment'}
              {!isProcessing && <Lock size={16} />}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Lock size={12} /> Secure encrypted checkout
            </p>
          </form>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid #e5e7eb', paddingTop: 24, marginTop: 40 }}>
        <button onClick={onBack} disabled={isProcessing} style={{ background: 'transparent', color: '#6b7280', padding: '16px 24px', border: 'none', fontSize: 15, fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer' }}>Back to Contract</button>
      </div>
    </div>
  );
}
