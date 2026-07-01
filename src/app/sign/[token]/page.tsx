'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import SignaturePad from 'signature_pad';
import { formatDate } from '@/lib/formatDate';
import { syncContractFormDOM } from '@/lib/processContract';

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedDate, setSignedDate] = useState('');
  const [companyName, setCompanyName] = useState('Clover');
  
  // Signature pad & contract container states
  const contractContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [showSigPad, setShowSigPad] = useState(false);
  const [signature, setSignature] = useState('');

  useEffect(() => {
    fetch(`/api/sign?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) { setError(data.error || 'Invalid link.'); }
        else if (data.alreadySigned) { setAlreadySigned(true); setContract(data.contract); setCompanyName(data.companyName); }
        else { setContract(data.contract); setCompanyName(data.companyName); }
      })
      .catch(() => setError('Failed to load contract.'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!showSigPad || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);
    
    // Clear old instance to avoid memory leak if re-mounted
    if (padRef.current) {
      padRef.current.off();
    }
    
    padRef.current = new SignaturePad(canvas, {
      minWidth: 1, maxWidth: 2.5, penColor: '#1e3a5f', backgroundColor: 'rgba(0,0,0,0)',
    });
  }, [showSigPad]);

  const handleSubmit = async () => {
    if (!signature || !signature.startsWith('data:image')) {
      alert('Please sign and save your signature before submitting.');
      return;
    }
    syncContractFormDOM(contractContainerRef.current);
    const contractHtml = contractContainerRef.current ? contractContainerRef.current.innerHTML : null;

    setSubmitting(true);
    try {
      const res = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signatureDataUrl: signature, contractHtml }),
      });
      const data = await res.json();
      if (data.success) {
        setSigned(true);
        setSignedDate(formatDate(data.signedDate || new Date().toISOString()));
      } else {
        alert(data.error || 'Failed to submit signature.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.spinner} />
        <p style={{ color: '#6b7280', marginTop: 16 }}>Loading contract…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: '#dc2626', margin: '0 0 8px' }}>Link Invalid or Expired</h2>
        <p style={{ color: '#6b7280' }}>{error}</p>
      </div>
    </div>
  );

  if (signed) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>✅</div>
        <h1 style={{ margin: '0 0 8px', color: '#111827', fontSize: 24, fontWeight: 800 }}>Contract Signed!</h1>
        <p style={{ color: '#6b7280', margin: '0 0 4px' }}>Thank you. Your signature has been recorded.</p>
        <p style={{ color: '#9ca3af', fontSize: 13 }}>Signed on {signedDate}</p>
        <div style={{ marginTop: 28, padding: 16, background: '#f0fdfa', borderRadius: 8, border: '1px solid #ccfbf1', fontSize: 13, color: '#0d9488', lineHeight: 1.6 }}>
          A copy of this signed agreement has been saved. You may close this window.
        </div>
      </div>
    </div>
  );

  // Removed early return for `alreadySigned` so the document actually renders.

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#0f766e,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>{companyName.charAt(0)}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>{companyName}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Digital Contract Signing</div>
          </div>
        </div>
        {!alreadySigned && (
          <span style={{ padding: '4px 12px', background: '#fef3c7', color: '#92400e', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>ACTION REQUIRED</span>
        )}
        {alreadySigned && (
          <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#166534', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>COMPLETED</span>
        )}
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Intro */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#111827' }}>
            {contract?.Contract_Title || 'Contract for Review & Signature'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Please review the full agreement below, then add your signature at the bottom to confirm your acceptance.
          </p>
        </div>

        {/* Contract document */}
        <div 
          ref={contractContainerRef}
          onChange={() => syncContractFormDOM(contractContainerRef.current)}
          onInput={() => syncContractFormDOM(contractContainerRef.current)}
          style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '48px 56px', marginBottom: 32, fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.8, color: '#1f2937' }}
          dangerouslySetInnerHTML={{ __html: contract?.Contract_Text || '' }}
        />

        {/* Signatures */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '32px', marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 24px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#111827' }}>Signatures</h3>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>

            {/* Provider signature */}
            {contract?.Provider_Signature && (
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Service Provider</div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#f9fafb', position: 'relative' }}>
                  <img src={contract.Provider_Signature} alt="Provider signature" style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                  <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: '#0d9488', fontWeight: 700 }}>✓ Pre-signed</span>
                </div>
              </div>
            )}

            {/* Client signature pad */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Your Signature</div>
              
              {alreadySigned ? (
                <div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', padding: 12, position: 'relative' }}>
                    {contract?.Client_Signature ? (
                      <img src={contract.Client_Signature} alt="Your signature" style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                    ) : (
                      <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>Signature captured.</div>
                    )}
                    <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: '#0d9488', fontWeight: 700 }}>✓ Signed</span>
                  </div>
                  {contract?.Signed_Date && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Signed on: {formatDate(contract.Signed_Date)}</p>}
                </div>
              ) : signature && signature.startsWith('data:image') ? (
                <div>
                  <div style={{ border: '2px solid #e5e7eb', borderRadius: 8, background: '#fff', padding: 8, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={signature} alt="Client Signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                  <button 
                    onClick={() => {
                      syncContractFormDOM(contractContainerRef.current);
                      setSignature('');
                      setShowSigPad(true);
                    }}
                    style={{ marginTop: 12, padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}
                  >
                    Re-sign Document
                  </button>
                </div>
              ) : showSigPad ? (
                <div>
                  <div style={{ border: '2px dashed #0d9488', borderRadius: 8, height: 120, position: 'relative', background: '#f0fdfa', cursor: 'crosshair' }}>
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 12, color: '#99f6e4', pointerEvents: 'none', fontWeight: 600 }}>Sign here</span>
                    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: 8, display: 'block' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button 
                      onClick={() => {
                        if (!padRef.current || padRef.current.isEmpty()) return;
                        setSignature(padRef.current.toDataURL('image/png'));
                        setShowSigPad(false);
                      }} 
                      style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 8, background: '#111827', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                    >
                      Save Signature
                    </button>
                    <button 
                      onClick={() => padRef.current?.clear()}
                      style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    syncContractFormDOM(contractContainerRef.current);
                    setShowSigPad(true);
                  }}
                  style={{ width: '100%', padding: '16px', border: '2px dashed #0d9488', borderRadius: 8, background: '#f0fdfa', cursor: 'pointer', fontSize: 15, color: '#0f766e', fontWeight: 700, transition: 'all 0.2s' }}
                >
                  Click here to sign
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        {!alreadySigned && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || !signature}
              style={{
                padding: '14px 40px', background: submitting || !signature ? '#9ca3af' : '#0d9488', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting || !signature ? 'not-allowed' : 'pointer',
                boxShadow: submitting || !signature ? 'none' : '0 4px 12px rgba(13,148,136,0.35)', transition: 'all 0.2s'
              }}
            >
              {submitting ? 'Submitting…' : '✍️  Submit My Signature'}
            </button>
            <p style={{ marginTop: 12, fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
              By submitting, you agree this digital signature is legally binding under ESIGN and UETA.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid #e5e7eb', color: '#9ca3af', fontSize: 12 }}>
        Powered by {companyName} CRM · {new Date().getFullYear()}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#f1f5f9',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    display: 'flex', flexDirection: 'column' as const,
  },
  header: {
    background: '#fff', borderBottom: '1px solid #e5e7eb',
    padding: '16px 32px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  card: {
    margin: 'auto', background: '#fff', borderRadius: 16, padding: 48,
    maxWidth: 440, width: '100%', textAlign: 'center' as const,
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  },
  spinner: {
    width: 40, height: 40, borderRadius: '50%', margin: '0 auto',
    border: '3px solid #e5e7eb', borderTopColor: '#0d9488',
    animation: 'spin 0.8s linear infinite',
  },
};
