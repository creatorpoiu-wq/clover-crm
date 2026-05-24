'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { PenTool, Wand2 } from 'lucide-react';
import SignaturePad from 'signature_pad';

interface Props {
  questionnaire: any;
  pkg: any;
  addons: any[];
  signature: string;
  setSignature: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  funnelSettings: any;
}

export default function DigitalContract({ questionnaire, pkg, addons, signature, setSignature, onNext, onBack, funnelSettings }: Props) {
  
  const [template, setTemplate] = useState<any>(null);
  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  // Signature Pad State
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<any>(null);
  const [showSigPad, setShowSigPad] = useState(false);

  // Initialize signature pad
  useEffect(() => {
    if (!showSigPad || !sigCanvasRef.current) return;
    const canvas = sigCanvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);
    
    // Clear old instance to avoid memory leak if re-mounted
    if (sigPadRef.current) {
      sigPadRef.current.off();
    }
    
    sigPadRef.current = new SignaturePad(canvas, { 
      minWidth: 1, 
      maxWidth: 2.5, 
      penColor: '#1e3a5f', 
      backgroundColor: 'rgba(0,0,0,0)' 
    });
  }, [showSigPad]);

  const step = funnelSettings?.steps?.[2];
  const title = step?.title || 'Review & Sign Your Contract';
  const subtitle = step?.subtitle || 'Please fill out any required fields and sign the agreement below.';

  useEffect(() => {
    const urlContractId = searchParams.get('contractId');

    if (urlContractId) {
      fetch(`/api/public-booking?type=contract&contractId=${urlContractId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.contract) {
            setTemplate({ Content: data.contract.Contract_Text, Name: data.contract.Contract_Title });
            extractVariables(data.contract.Contract_Text);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      fetch('/api/questionnaire?type=settings')
        .then(res => res.json())
        .then(sData => {
          const templateId = sData.settings?.Contract_Template_ID;
          if (templateId) {
            fetch('/api/contract-templates')
              .then(res => res.json())
              .then(tData => {
                const matched = tData.templates?.find((t: any) => t.Template_ID === templateId);
                if (matched) {
                  setTemplate(matched);
                  extractVariables(matched.Content);
                }
              })
              .finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    }
  }, [searchParams]);

  // Auto-inject questionnaire answers into variable values when variables are extracted
  useEffect(() => {
    if (variables.length === 0) return;

    const autoFilled: Record<string, string> = {};
    variables.forEach(varLabel => {
      // Try exact match first
      if (questionnaire[varLabel] !== undefined) {
        autoFilled[varLabel] = String(questionnaire[varLabel]);
        return;
      }
      // Try case-insensitive match
      const matchKey = Object.keys(questionnaire).find(
        k => k.toLowerCase() === varLabel.toLowerCase()
      );
      if (matchKey) {
        autoFilled[varLabel] = String(questionnaire[matchKey]);
        return;
      }
      // Try fuzzy: does the questionnaire have a key containing this var label or vice versa?
      const fuzzyKey = Object.keys(questionnaire).find(
        k => k.toLowerCase().includes(varLabel.toLowerCase()) ||
             varLabel.toLowerCase().includes(k.toLowerCase())
      );
      if (fuzzyKey) {
        autoFilled[varLabel] = String(questionnaire[fuzzyKey]);
      }
    });

    // Also map common aliases
    const aliases: Record<string, string[]> = {
      'Client Name':    ['Full Name', 'Name', 'name'],
      'Event Date':     ['Event Date', 'Date', 'Wedding Date'],
      'Event Location': ['Venue', 'Location', 'Event Location', 'Event Venue'],
      'Email':          ['Email', 'Email Address'],
      'Phone':          ['Phone', 'Phone Number', 'Contact Number'],
    };

    variables.forEach(varLabel => {
      if (autoFilled[varLabel]) return; // already filled
      const aliasList = aliases[varLabel] || [];
      for (const alias of aliasList) {
        const found = Object.keys(questionnaire).find(k => k.toLowerCase() === alias.toLowerCase());
        if (found && questionnaire[found]) {
          autoFilled[varLabel] = String(questionnaire[found]);
          break;
        }
      }
    });

    setVariableValues(prev => ({ ...autoFilled, ...prev })); // prior manual entries take precedence
  }, [variables, questionnaire]);

  const extractVariables = (html: string) => {
    const regex = /<span[^>]*data-variable="true"[^>]*label="([^"]+)"[^>]*>.*?<\/span>/g;
    const extracted = new Set<string>();
    let match;
    while ((match = regex.exec(html)) !== null) {
      extracted.add(match[1]);
    }
    setVariables(Array.from(extracted));
  };

  const getProcessedHtml = () => {
    if (!template) return '';
    let html = template.Content;
    
    variables.forEach(v => {
      const regex = new RegExp(`<span[^>]*data-variable="true"[^>]*label="${v}"[^>]*>.*?</span>`, 'g');
      const val = variableValues[v]
        ? `<strong style="color:#0d9488;border-bottom:1px solid #0d9488;">${variableValues[v]}</strong>`
        : `<span style="background:#fef08a;padding:2px 6px;border-radius:4px;color:#854d0e;">[${v}]</span>`;
      html = html.replace(regex, val);
    });

    return html;
  };

  const pkgPrice = pkg?.Price || 0;
  const addonsPrice = addons.reduce((sum, a) => sum + a.price, 0);
  const total = pkgPrice + addonsPrice;
  const deposit = total * 0.5;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const clientName = questionnaire['Full Name'] || questionnaire['Name'] || questionnaire.name || '[Client Name]';

  // Track which variables were auto-filled from questionnaire
  const autoFilledKeys = new Set(
    variables.filter(v => {
      const matchKey = Object.keys(questionnaire).find(
        k => k.toLowerCase() === v.toLowerCase() ||
             k.toLowerCase().includes(v.toLowerCase()) ||
             v.toLowerCase().includes(k.toLowerCase())
      );
      return !!matchKey;
    })
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>Loading contract...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>{title}</h2>
        <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>{subtitle}</p>
      </div>

      {variables.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>Contract Fields</h3>
            <span style={{ fontSize: 12, padding: '2px 8px', background: '#f0fdfa', color: '#0d9488', borderRadius: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Wand2 size={11} /> Auto-filled from your answers
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {variables.map(v => {
              const isAutoFilled = autoFilledKeys.has(v) && variableValues[v];
              return (
                <div key={v}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {v}
                    {isAutoFilled && (
                      <span style={{ fontSize: 10, color: '#0d9488', fontWeight: 800 }}>✓ From questionnaire</span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    value={variableValues[v] || ''} 
                    onChange={(e) => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`Enter ${v}`}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: isAutoFilled ? '1px solid #0d9488' : '1px solid #d1d5db',
                      background: isAutoFilled ? '#f0fdfa' : '#fff',
                      borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contract Document */}
      <div style={{ 
        background: '#fff', borderRadius: 4, padding: '60px 48px', 
        border: '1px solid #e5e7eb', boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
        margin: '0 auto 40px', maxWidth: 800, fontFamily: "'Georgia', serif", color: '#374151', lineHeight: 1.8
      }}>
        
        {template ? (
          <div className="ProseMirror" dangerouslySetInnerHTML={{ __html: getProcessedHtml() }} />
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 40, borderBottom: '2px solid #111827', paddingBottom: 20 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', letterSpacing: '0.05em', color: '#111827' }}>SERVICE AGREEMENT</h1>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Date: {today}</div>
            </div>
            <p>This Agreement is made effective as of <strong>{today}</strong>, by and between <strong>Studio</strong> ("Provider") and <strong>{clientName}</strong> ("Client").</p>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 32, marginBottom: 12, color: '#111827' }}>PACKAGE & COMPENSATION</h3>
            <p>The Client has selected the <strong>{pkg?.Name}</strong> package, valued at <strong>${pkgPrice.toLocaleString()}</strong>.</p>
            <p>The total agreed compensation is <strong>${total.toLocaleString()}</strong>. A non-refundable retainer of <strong>${deposit.toLocaleString()}</strong> (50%) is due upon signing to secure the date.</p>
          </>
        )}

        <div style={{ marginTop: 60, padding: '24px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', fontFamily: "'Inter', sans-serif" }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
            <PenTool size={16} /> Digital Signature
          </h4>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>By drawing your signature below, you acknowledge that you have read, understand, and agree to the terms outlined in this agreement.</p>
          
          {signature && signature.startsWith('data:image') ? (
            <div>
              <div style={{ border: '2px solid #e5e7eb', borderRadius: 8, background: '#fff', padding: 8, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={signature} alt="Client Signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              </div>
              <button 
                onClick={() => {
                  setSignature('');
                  setShowSigPad(true);
                }}
                style={{ marginTop: 12, padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Re-sign Document
              </button>
            </div>
          ) : showSigPad ? (
            <div>
              <div style={{ border: '2px dashed #d1d5db', borderRadius: 8, height: 160, position: 'relative', background: '#fff', cursor: 'crosshair' }}>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 14, color: '#9ca3af', pointerEvents: 'none' }}>Draw your signature here</span>
                <canvas ref={sigCanvasRef} style={{ width: '100%', height: '100%', borderRadius: 8, display: 'block' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button 
                  onClick={() => {
                    if (!sigPadRef.current || sigPadRef.current.isEmpty()) return;
                    setSignature(sigPadRef.current.toDataURL());
                    setShowSigPad(false);
                  }} 
                  style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 8, background: '#111827', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                >
                  Save Signature
                </button>
                <button 
                  onClick={() => sigPadRef.current?.clear()}
                  style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151', fontWeight: 600 }}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowSigPad(true)}
              style={{ width: '100%', padding: '16px', border: '2px dashed #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 15, color: '#4b5563', fontWeight: 700 }}
            >
              Click here to sign
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: 24, marginTop: 20 }}>
        <button onClick={onBack} style={{ background: 'transparent', color: '#6b7280', padding: '16px 24px', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Back</button>
        <button 
          onClick={onNext}
          disabled={signature.trim().length < 3}
          style={{
            background: signature.trim().length < 3 ? '#e5e7eb' : '#0d9488',
            color: signature.trim().length < 3 ? '#9ca3af' : '#fff',
            padding: '16px 32px', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 800,
            cursor: signature.trim().length < 3 ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
          }}
        >
          Proceed to Payment (${deposit.toLocaleString()})
        </button>
      </div>
    </div>
  );
}
