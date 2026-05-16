'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import SignaturePad from 'signature_pad';
import { formatDate } from '@/lib/formatDate';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

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
    if (!contract || alreadySigned || signed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);
    padRef.current = new SignaturePad(canvas, {
      minWidth: 1, maxWidth: 2.5, penColor: '#1e3a5f', backgroundColor: 'rgba(0,0,0,0)',
    });
    return () => { padRef.current?.off(); };
  }, [contract, alreadySigned, signed]);

  const handleSubmit = async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      alert('Please sign before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const dataUrl = padRef.current.toDataURL('image/png');
      const res = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signatureDataUrl: dataUrl }),
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

  if (alreadySigned) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
        <h2 style={{ margin: '0 0 8px', color: '#111827' }}>Already Signed</h2>
        <p style={{ color: '#6b7280' }}>This contract has already been signed. No further action is required.</p>
        {contract?.Signed_Date && <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>Signed on {formatDate(contract.Signed_Date)}</p>}
      </div>
    </div>
  );

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
        <span style={{ padding: '4px 12px', background: '#fef3c7', color: '#92400e', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>ACTION REQUIRED</span>
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
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '48px 56px', marginBottom: 32, fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.8, color: '#1f2937' }}
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
              <div style={{ border: '2px dashed #0d9488', borderRadius: 8, background: '#f0fdfa', position: 'relative', overflow: 'hidden' }}>
                <canvas
                  ref={canvasRef}
                  style={{ display: 'block', width: '100%', height: 120, cursor: 'crosshair' }}
                />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#99f6e4', fontSize: 12, fontWeight: 600, pointerEvents: 'none', userSelect: 'none' }}>
                  Sign here
                </div>
              </div>
              <button
                onClick={() => padRef.current?.clear()}
                style={{ marginTop: 6, fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >Clear</button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '14px 40px', background: submitting ? '#6b7280' : '#0d9488', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(13,148,136,0.35)',
            }}
          >
            {submitting ? 'Submitting…' : '✍️  Submit My Signature'}
          </button>
          <p style={{ marginTop: 12, fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
            By submitting, you agree this digital signature is legally binding under ESIGN and UETA.
          </p>
        </div>
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
