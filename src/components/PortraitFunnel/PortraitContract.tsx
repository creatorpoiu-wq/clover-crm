import React, { useRef, useState, useEffect } from 'react';
import { FileText, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import SignaturePad from 'signature_pad';

interface PortraitContractProps {
  userId: string;
  inquiryId: string;
  contactName: string;
  selectedDate: string | null;
  selectedTime: string | null;
  signature: string;
  setSignature: (sig: string) => void;
  onNext: () => void;
  onBack: () => void;
  themeColor: string;
  vendorInfo?: any;
}

export default function PortraitContract({
  selectedDate, selectedTime, signature, setSignature, onNext, onBack, themeColor, vendorInfo, contactName
}: PortraitContractProps) {
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);
  const [error, setError] = useState('');
  const [showSigPad, setShowSigPad] = useState(!signature);

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If URL has contractId, use it (sent from Contract Builder)
    const urlParams = new URLSearchParams(window.location.search);
    const urlContractId = urlParams.get('contractId');

    if (urlContractId) {
      fetch(`/api/public-booking?type=contract&contractId=${urlContractId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.contract) {
            setTemplate({ Content: data.contract.Contract_Text, Name: data.contract.Contract_Title });
          }
        })
        .finally(() => setLoading(false));
    } else if (vendorInfo?.contractTemplateId) {
      // Use the contract template defined in Portrait Settings
      fetch('/api/contract-templates')
        .then(res => res.json())
        .then(data => {
          const matched = data.templates?.find((t: any) => t.Template_ID === vendorInfo.contractTemplateId);
          if (matched) {
            setTemplate(matched);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [vendorInfo]);

  useEffect(() => {
    if (showSigPad && sigCanvasRef.current && !sigPadRef.current) {
      const canvas = sigCanvasRef.current;
      // Handle canvas resolution for high-DPI displays
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(ratio, ratio);

      sigPadRef.current = new SignaturePad(canvas, {
        penColor: '#111827',
        backgroundColor: 'rgba(0,0,0,0)'
      });
    }
  }, [showSigPad]);

  const clearSignature = () => {
    if (sigPadRef.current) sigPadRef.current.clear();
  };

  const saveSignature = () => {
    if (showSigPad) {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
        setError('Please provide your signature to proceed.');
        return;
      }
      setSignature(sigPadRef.current.toDataURL());
    } else if (!signature) {
      setError('Please provide your signature to proceed.');
      return;
    }
    onNext();
  };

  const formattedDate = selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD';

  // Replace variables in template
  const replaceVars = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\[Client Name\]|\{Client Name\}/gi, contactName || "Client")
      .replace(/\[Date\]|\{Date\}|\[Event Date\]|\{Event Date\}/gi, formattedDate)
      .replace(/\[Time\]|\{Time\}/gi, selectedTime || 'TBD')
      .replace(/\[Today's Date\]|\{Today's Date\}/gi, new Date().toLocaleDateString());
  };

  const stepInfo = vendorInfo?.steps?.[1];
  const title = stepInfo?.title || 'Portrait Agreement';
  const subtitle = stepInfo?.subtitle || 'Please review the terms for your session on';

  return (
    <div className="glass-panel funnel-pad" style={{ borderRadius: '1.5rem', border: '1px solid #e2e8f0', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem' }}>{title}</h2>
          <p style={{ color: '#64748b' }}>{subtitle} <strong style={{ color: '#1e293b' }}>{formattedDate}</strong> at <strong style={{ color: '#1e293b' }}>{selectedTime}</strong>.</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={32} color="#94a3b8" />
        </div>
      </div>

      <div className="custom-scrollbar" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '1rem', height: '24rem', overflowY: 'auto', fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '2rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Loading contract details...</div>
        ) : template ? (
          <div dangerouslySetInnerHTML={{ __html: replaceVars(template.Content) }} />
        ) : (
          <>
            <h3 style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginBottom: '1rem' }}>1. Scope of Work</h3>
            <p style={{ marginBottom: '1rem' }}>
              Photographer agrees to provide portrait photography services on {formattedDate} at {selectedTime}. Photographer will perform these services in a professional manner and according to the signature style discussed.
            </p>
            <h3 style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginBottom: '1rem' }}>2. Retainer and Payment</h3>
            <p style={{ marginBottom: '1rem' }}>
              A non-refundable retainer is required to secure the session date. The remaining balance (if applicable) is due prior to the delivery of the final images. If the session is canceled by the Client, the retainer serves as a cancellation fee.
            </p>
            <h3 style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginBottom: '1rem' }}>3. Rescheduling</h3>
            <p style={{ marginBottom: '1rem' }}>
              In the event of inclement weather or emergency, the session may be rescheduled to a mutually agreed-upon date without penalty. Requests to reschedule for non-emergencies must be made at least 48 hours in advance.
            </p>
            <h3 style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginBottom: '1rem' }}>4. Copyright and Model Release</h3>
            <p style={{ marginBottom: '1rem' }}>
              Photographer retains the copyright to all images. Client receives a print release for personal use. Photographer may use the images for portfolio, marketing, and promotional purposes unless explicitly opted out in writing by the Client.
            </p>
            <h3 style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginBottom: '1rem' }}>5. Image Delivery</h3>
            <p>
              High-resolution digital files will be delivered via an online gallery within 2-3 weeks of the session date. Unedited RAW files are not provided.
            </p>
          </>
        )}
      </div>

      <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid #e2e8f0' }}>
        <label style={{ display: 'block', fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>
          Digital Signature <span style={{ color: '#ef4444' }}>*</span>
        </label>

        {contactName && (
          <div style={{ marginBottom: '1rem', fontSize: '1rem', color: '#475569', fontWeight: 600 }}>
            Signing on behalf of: <span style={{ color: '#0f172a', fontWeight: 800 }}>{contactName}</span>
          </div>
        )}
        
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontSize: '0.875rem', fontWeight: 700, backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div style={{ backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '1rem', padding: '2rem', textAlign: 'center', position: 'relative' }}>
          {signature && !showSigPad ? (
             <div style={{ padding: '1rem', position: 'relative' }}>
               <img src={signature} alt="Signature" style={{ height: '10rem', margin: '0 auto', display: 'block' }} />
               <button 
                 onClick={() => {
                   setSignature('');
                   setShowSigPad(true);
                 }} 
                 style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', border: 'none' }}>
                 Re-sign
               </button>
             </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              <div style={{ border: '2px dashed #d1d5db', borderRadius: 8, height: 160, position: 'relative', background: '#fff', cursor: 'crosshair' }}>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 14, color: '#9ca3af', pointerEvents: 'none' }}>Draw your signature here</span>
                <canvas ref={sigCanvasRef} style={{ width: '100%', height: '100%', borderRadius: 8, display: 'block' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={clearSignature} style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', borderRadius: '0.5rem', cursor: 'pointer', border: 'none' }}>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={onBack}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', borderRadius: '0.75rem', color: '#475569', fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase', transition: 'all 0.2s', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={saveSignature}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderRadius: '0.75rem', color: 'white', fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase', transition: 'all 0.2s', cursor: 'pointer', backgroundColor: themeColor, border: 'none' }}
        >
          Agree & Proceed <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
