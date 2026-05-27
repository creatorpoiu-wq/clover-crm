import React, { useRef, useState, useEffect } from 'react';
import { FileText, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import SignaturePad from 'signature_pad';

interface PortraitContractProps {
  userId: string;
  inquiryId: string;
  selectedDate: string | null;
  selectedTime: string | null;
  signature: string;
  setSignature: (sig: string) => void;
  onNext: () => void;
  onBack: () => void;
  themeColor: string;
}

export default function PortraitContract({
  selectedDate, selectedTime, signature, setSignature, onNext, onBack, themeColor
}: PortraitContractProps) {
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);
  const [error, setError] = useState('');
  const [showSigPad, setShowSigPad] = useState(!signature);

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

  return (
    <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Portrait Agreement</h2>
          <p className="text-slate-500">Please review the terms for your session on <strong>{formattedDate}</strong> at <strong>{selectedTime}</strong>.</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl hidden md:block">
          <FileText size={32} className="text-slate-400" />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl h-96 overflow-y-auto text-sm text-slate-600 leading-relaxed mb-8 custom-scrollbar">
        <h3 className="font-bold text-slate-800 text-base mb-4">1. Scope of Work</h3>
        <p className="mb-4">
          Photographer agrees to provide portrait photography services on {formattedDate} at {selectedTime}. Photographer will perform these services in a professional manner and according to the signature style discussed.
        </p>
        <h3 className="font-bold text-slate-800 text-base mb-4">2. Retainer and Payment</h3>
        <p className="mb-4">
          A non-refundable retainer is required to secure the session date. The remaining balance (if applicable) is due prior to the delivery of the final images. If the session is canceled by the Client, the retainer serves as a cancellation fee.
        </p>
        <h3 className="font-bold text-slate-800 text-base mb-4">3. Rescheduling</h3>
        <p className="mb-4">
          In the event of inclement weather or emergency, the session may be rescheduled to a mutually agreed-upon date without penalty. Requests to reschedule for non-emergencies must be made at least 48 hours in advance.
        </p>
        <h3 className="font-bold text-slate-800 text-base mb-4">4. Copyright and Model Release</h3>
        <p className="mb-4">
          Photographer retains the copyright to all images. Client receives a print release for personal use. Photographer may use the images for portfolio, marketing, and promotional purposes unless explicitly opted out in writing by the Client.
        </p>
        <h3 className="font-bold text-slate-800 text-base mb-4">5. Image Delivery</h3>
        <p>
          High-resolution digital files will be delivered via an online gallery within 2-3 weeks of the session date. Unedited RAW files are not provided.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          Digital Signature <span className="text-red-500">*</span>
        </h3>
        
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm font-bold bg-red-50 p-3 rounded-lg mb-4">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="border-2 border-slate-200 rounded-2xl bg-white relative overflow-hidden group">
          {signature && !showSigPad ? (
             <div className="p-4 relative">
               <img src={signature} alt="Signature" className="h-40 mx-auto" />
               <button 
                 onClick={() => {
                   setSignature('');
                   setShowSigPad(true);
                 }} 
                 className="absolute top-4 right-4 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg">
                 Re-sign
               </button>
             </div>
          ) : (
            <div className="p-4">
              <div style={{ border: '2px dashed #d1d5db', borderRadius: 8, height: 160, position: 'relative', background: '#fff', cursor: 'crosshair' }}>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 14, color: '#9ca3af', pointerEvents: 'none' }}>Draw your signature here</span>
                <canvas ref={sigCanvasRef} style={{ width: '100%', height: '100%', borderRadius: 8, display: 'block' }} />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={clearSignature} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded-lg hover:bg-slate-200 transition-colors">
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-slate-100">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-4 rounded-xl text-slate-600 font-bold tracking-wide uppercase transition-all hover:bg-slate-100"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={saveSignature}
          className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold tracking-wide uppercase transition-all shadow-lg hover:-translate-y-0.5"
          style={{ backgroundColor: themeColor }}
        >
          Agree & Proceed <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
