'use client';
import React, { useState } from 'react';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, CreditCard, Building2, Smartphone, Wallet, FileText } from 'lucide-react';
import PayPalCheckoutButton from '@/components/PayPalCheckoutButton';
import PaymentInstruction from '@/components/PaymentInstruction';
import { useSearchParams } from 'next/navigation';

interface Props {
  questionnaire: any;
  pkg: any;
  addons: any[];
  signature: string;
  contractHtml: string;
  onBack: () => void;
  funnelSettings: any;
  userId?: string | null;
}

function PaymentIcon({ iconId }: { iconId: string }) {
  if (iconId === 'card')  return <CreditCard size={20} />;
  if (iconId === 'bank')  return <Building2 size={20} />;
  if (iconId === 'zelle') return <Smartphone size={20} />;
  if (iconId === 'paypal') return <Wallet size={20} />;
  return <CreditCard size={20} />;
}

export default function PaymentCheckout({ questionnaire, pkg, addons, signature, contractHtml, onBack, funnelSettings, userId: propUserId }: Props) {
  const searchParams = useSearchParams();
  const userId = propUserId || searchParams.get('userId');

  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hpValue, setHpValue] = useState('');

  // ── Pricing ──────────────────────────────────────────────────────────────
  const pkgPrice  = pkg?.Price || 0;
  const addonsTotal = addons.reduce((sum, a) => sum + (a.price || 0), 0);
  const total     = pkgPrice + addonsTotal;

  // Retainer: fixed amount OR percent of total
  const retainerType   = funnelSettings?.retainerType || 'percent';
  const retainerSetting = funnelSettings?.retainerAmount ?? 50;
  const retainerDue = retainerType === 'fixed'
    ? Math.min(Number(retainerSetting), total)
    : Math.round((total * Number(retainerSetting)) / 100 * 100) / 100;
  const balanceDue = Math.max(0, total - retainerDue);

  // ── Payment Methods ───────────────────────────────────────────────────────
  const rawMethods: any[] = funnelSettings?.paymentMethods?.length > 0
    ? funnelSettings.paymentMethods.filter((m: any) => m.enabled !== false)
    : [
        { id: 'bank',  name: 'Bank Transfer', icon: 'bank',  details: 'Please contact us for bank transfer details.' },
        { id: 'zelle', name: 'Zelle',          icon: 'zelle', details: 'Send to: payments@studio.com' },
      ];

  // Inject PayPal as a method if configured
  const paypalClientId = funnelSettings?.paypalClientId || null;
  const allMethods = [
    ...rawMethods,
    ...(paypalClientId ? [{ id: 'paypal', name: 'PayPal', icon: 'paypal', details: '' }] : []),
  ];

  const activeMethodId = selectedMethodId || allMethods[0]?.id || '';
  const activeMethod   = allMethods.find(m => m.id === activeMethodId) || allMethods[0];

  // ── Copy ─────────────────────────────────────────────────────────────────
  const step           = funnelSettings?.steps?.[3];
  const stepTitle      = step?.title   || 'Secure Your Booking';
  const stepSubtitle   = step?.subtitle || 'Submit the retainer to officially lock in your date.';
  const confirmTitle   = funnelSettings?.confirmationTitle   || 'Booking Confirmed!';
  const confirmMessage = funnelSettings?.confirmationMessage || 'Your retainer has been received and your contract is signed. Your date is officially locked in!';
  const clientName     = questionnaire['Full Name'] || questionnaire['Name'] || questionnaire.name || 'Client';
  const firstName      = typeof clientName === 'string' ? clientName.split(' ')[0] : 'Client';
  const retainerLabel  = retainerType === 'fixed'
    ? `Fixed Retainer`
    : `${retainerSetting}% Retainer`;

  // ── Submit Handler ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/public-booking/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contractId: searchParams.get('contractId'),
          questionnaire,
          pkg,
          addons,
          signature,
          contractHtml,
          totalAmount: total,
          depositAmount: retainerDue,
          _hp: hpValue,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to submit booking');
      setPortalLink(data.portalLink || null);
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
      window.scrollTo(0, 0);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle size={44} color="#10b981" />
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: '#111827', margin: '0 0 12px' }}>{confirmTitle}</h1>
        <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Thank you, {firstName}! {confirmMessage.replace('[name]', firstName).replace('{name}', firstName)}
        </p>
        {portalLink && (
          <a
            href={portalLink}
            style={{ display: 'inline-block', marginBottom: 20, padding: '14px 28px', background: '#111827', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            Access Your Client Portal →
          </a>
        )}
        <div>
          <button onClick={() => window.location.href = '/'} style={{ background: 'transparent', color: '#6b7280', padding: '12px 24px', border: '1px solid #e5e7eb', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>{stepTitle}</h2>
        <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>{stepSubtitle}</p>
      </div>

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef2f2', color: '#b91c1c', padding: '14px 18px', borderRadius: 10, border: '1px solid #fca5a5', marginBottom: 24, fontSize: 14, fontWeight: 500 }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Honeypot */}
      <input type="text" name="website_url_payment" style={{ display: 'none', visibility: 'hidden', opacity: 0, position: 'absolute', left: '-9999px' }} tabIndex={-1} autoComplete="off" value={hpValue} onChange={e => setHpValue(e.target.value)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'flex-start' }}>

        {/* LEFT: Invoice Summary */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28 }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0', margin: '0 0 20px' }}>
            Invoice Summary
          </h3>

          {/* Package */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{pkg?.Name || 'Session Package'}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>${pkgPrice.toLocaleString()}</span>
          </div>

          {/* Add-ons */}
          {addons.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>+ {a.name}</span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>${(a.price || 0).toLocaleString()}</span>
            </div>
          ))}

          {/* Divider */}
          <div style={{ borderTop: '1px solid #e2e8f0', margin: '16px 0', paddingTop: 16 }}>
            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: '#374151', fontWeight: 600 }}>Total Package Value</span>
              <span style={{ fontWeight: 700, color: '#111827' }}>${total.toLocaleString()}</span>
            </div>

            {/* Balance due later */}
            {balanceDue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>Remaining Balance (Due Later)</span>
                <span style={{ color: '#6b7280' }}>${balanceDue.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Retainer due */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '18px 20px', borderRadius: 12, marginTop: 4 }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>Due Today</div>
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 3 }}>{retainerLabel}</div>
            </div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 26 }}>
              ${retainerDue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* RIGHT: Payment Methods */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0', margin: '0 0 20px' }}>
            Select Payment Method
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {allMethods.map(m => {
              const isActive = activeMethodId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMethodId(m.id)}
                  style={{
                    padding: '14px 16px', borderRadius: 12, border: `2px solid ${isActive ? '#111827' : '#e2e8f0'}`,
                    background: isActive ? '#f8fafc' : '#fff', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', gap: 8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: isActive ? '#111827' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#fff' : '#64748b', flexShrink: 0, transition: 'all 0.15s' }}>
                      <PaymentIcon iconId={m.icon || m.id} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{m.name}</span>
                  </div>

                  {isActive && m.id !== 'paypal' && m.details && (
                    <div style={{ marginLeft: 48, background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0', fontSize: 13, color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {m.details.split('\n').map((line: string, i: number) => (
                        <div key={i}><PaymentInstruction text={line} color="#475569" /></div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* PayPal button OR Confirm button */}
          {activeMethodId === 'paypal' && paypalClientId ? (
            <PayPalCheckoutButton
              clientId={paypalClientId}
              amount={retainerDue}
              description={`Retainer for ${pkg?.Name || 'Session'}`}
              onSuccess={() => handleSubmit()}
              onError={() => setErrorMsg('PayPal payment failed. Please try another method.')}
            />
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              style={{
                width: '100%', background: isProcessing ? '#9ca3af' : '#111827', color: '#fff',
                padding: '16px', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s'
              }}
            >
              {isProcessing ? 'Processing...' : `Confirm & Pay $${retainerDue.toLocaleString()}`}
              {!isProcessing && <Lock size={16} />}
            </button>
          )}

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Lock size={11} /> Secure & encrypted
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid #e5e7eb', paddingTop: 24, marginTop: 36 }}>
        <button
          onClick={onBack}
          disabled={isProcessing}
          style={{ background: 'transparent', color: '#6b7280', padding: '12px 20px', border: 'none', fontSize: 14, fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} /> Back to Contract
        </button>
      </div>
    </div>
  );
}
