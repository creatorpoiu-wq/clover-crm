'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePad from 'signature_pad';
import { RotateCcw, Check, Lock } from 'lucide-react';

export interface SignatureBlockData {
  name: string;
  role: string;
  signatureDataUrl: string | null;
  signed: boolean;
  signedAt: string | null;
  isOwner: boolean;
}

interface SignatureBlockProps {
  name: string;
  role: string;
  isOwner: boolean;
  preloadedSignature?: string | null;
  onChange: (data: Pick<SignatureBlockData, 'signatureDataUrl' | 'signed' | 'signedAt'>) => void;
}

const SignatureBlock = ({ name, role, isOwner, preloadedSignature, onChange }: SignatureBlockProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [signed, setSigned] = useState(!!preloadedSignature);
  const [isEmpty, setIsEmpty] = useState(!preloadedSignature);

  // Init pad
  useEffect(() => {
    if (!canvasRef.current || isOwner) return;
    const ratio = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);

    const pad = new SignaturePad(canvas, {
      minWidth: 1, maxWidth: 2.5,
      penColor: '#1e3a5f',
      backgroundColor: 'rgba(0,0,0,0)',
    });
    padRef.current = pad;

    const handleEnd = () => {
      if (!pad.isEmpty()) {
        const dataUrl = pad.toDataURL();
        const now = new Date().toLocaleString();
        setSigned(true);
        setIsEmpty(false);
        onChange({ signatureDataUrl: dataUrl, signed: true, signedAt: now });
      }
    };
    pad.addEventListener('endStroke', handleEnd);
    return () => { pad.off(); };
  }, [isOwner]);

  // Pre-load owner signature image onto canvas
  useEffect(() => {
    if (!isOwner || !preloadedSignature || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
    };
    img.src = preloadedSignature;
  }, [isOwner, preloadedSignature]);

  const handleClear = useCallback(() => {
    padRef.current?.clear();
    setIsEmpty(true);
    setSigned(false);
    onChange({ signatureDataUrl: null, signed: false, signedAt: null });
  }, [onChange]);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Canvas */}
      <div style={{
        border: signed ? '2px solid #0d9488' : isOwner ? '1.5px solid #d1fae5' : '1.5px dashed #d1d5db',
        borderRadius: 8,
        background: signed ? '#f0fdfa' : isOwner ? '#f9fafb' : '#fafafa',
        position: 'relative', height: 120,
        cursor: isOwner ? 'default' : 'crosshair',
        transition: 'border-color 0.2s',
      }}>
        {isEmpty && !isOwner && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Sign here</span>
          </div>
        )}
        {isOwner && !preloadedSignature && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
            <Lock size={18} style={{ color: '#d1d5db' }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Pre-signed</span>
          </div>
        )}
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: 6, display: 'block' }} />
        {signed && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: '#0d9488', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={12} />
          </div>
        )}
        {isOwner && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: '#6b7280', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={10} />
          </div>
        )}
      </div>

      {/* Name line */}
      <div style={{ borderTop: '1.5px solid #374151', paddingTop: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{name || '________________________'}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{role}</div>
      </div>

      {/* Controls */}
      {!isOwner && !isEmpty && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={handleClear}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
            <RotateCcw size={11} /> Clear
          </button>
          {signed && <span style={{ fontSize: 11, color: '#0d9488', fontWeight: 600 }}>✓ Signed</span>}
        </div>
      )}
      {isOwner && <span style={{ fontSize: 11, color: '#6b7280' }}>🔒 Service provider — pre-signed</span>}
    </div>
  );
};

interface ContractSignatureSectionProps {
  signers: { name: string; email: string; initials: string; bg: string; color: string }[];
  providerSignatureDataUrl?: string | null;
  onSignaturesChange?: (signatures: SignatureBlockData[]) => void;
}

const OWNER_KEYWORDS = ['photography', 'marx', 'you)'];

export default function ContractSignatureSection({ signers, providerSignatureDataUrl, onSignaturesChange }: ContractSignatureSectionProps) {
  const isOwnerSigner = (name: string) => OWNER_KEYWORDS.some(k => name.toLowerCase().includes(k));

  const [blocks, setBlocks] = useState<SignatureBlockData[]>(() =>
    signers.map(s => ({
      name: s.name,
      role: isOwnerSigner(s.name) ? 'Service Provider' : 'Client',
      isOwner: isOwnerSigner(s.name),
      signatureDataUrl: isOwnerSigner(s.name) ? (providerSignatureDataUrl || null) : null,
      signed: isOwnerSigner(s.name) && !!providerSignatureDataUrl,
      signedAt: isOwnerSigner(s.name) && providerSignatureDataUrl ? new Date().toLocaleDateString() : null,
    }))
  );

  // Sync when signers change
  useEffect(() => {
    setBlocks(signers.map(s => ({
      name: s.name,
      role: isOwnerSigner(s.name) ? 'Service Provider' : 'Client',
      isOwner: isOwnerSigner(s.name),
      signatureDataUrl: isOwnerSigner(s.name) ? (providerSignatureDataUrl || null) : null,
      signed: isOwnerSigner(s.name) && !!providerSignatureDataUrl,
      signedAt: isOwnerSigner(s.name) && providerSignatureDataUrl ? new Date().toLocaleDateString() : null,
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signers.map(s => s.name).join(','), providerSignatureDataUrl]);

  const handleChange = useCallback((idx: number, data: Pick<SignatureBlockData, 'signatureDataUrl' | 'signed' | 'signedAt'>) => {
    setBlocks(prev => {
      const next = prev.map((b, i) => i === idx ? { ...b, ...data } : b);
      onSignaturesChange?.(next);
      return next;
    });
  }, [onSignaturesChange]);

  const allSigned = blocks.length > 0 && blocks.every(b => b.signed);

  return (
    <div style={{ marginTop: 48, borderTop: '2px solid #e5e7eb', paddingTop: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Signatures</h3>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>By signing below, all parties agree to the terms outlined in this agreement.</p>
        </div>
        {allSigned && (
          <span style={{ padding: '4px 14px', background: '#dcfce7', color: '#166534', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid #bbf7d0' }}>
            ✓ All parties signed
          </span>
        )}
      </div>

      {blocks.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13, border: '1.5px dashed #e5e7eb', borderRadius: 8 }}>
          Add signers from the left sidebar to generate signature blocks.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          {blocks.map((block, i) => (
            <SignatureBlock
              key={`${block.name}-${i}`}
              name={block.name}
              role={block.role}
              isOwner={block.isOwner}
              preloadedSignature={block.isOwner ? providerSignatureDataUrl : null}
              onChange={(data) => handleChange(i, data)}
            />
          ))}
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 10, color: '#9ca3af', lineHeight: 1.6 }}>
        This document constitutes a legal agreement when signed by all parties. Digital signatures are legally binding under the Electronic Signatures in Global and National Commerce Act (ESIGN) and the Uniform Electronic Transactions Act (UETA).
      </p>
    </div>
  );
}
