'use client';
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function PaymentInstruction({ text, color = '#0d9488' }: { text: string; color?: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (str: string) => {
    navigator.clipboard.writeText(str);
    setCopied(str);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!text) return null;

  // We split by whitespace, preserving the whitespace as tokens so we can render it exactly
  const tokens = text.split(/(\s+)/);

  return (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'inline' }}>
      {tokens.map((token, i) => {
        // Is it whitespace?
        if (/^\s+$/.test(token)) {
          return <span key={i}>{token}</span>;
        }

        // Remove trailing punctuation for the check, but render it after
        let cleanToken = token;
        let trailingPunctuation = '';
        if (/[.,;:!?]$/.test(token)) {
          cleanToken = token.slice(0, -1);
          trailingPunctuation = token.slice(-1);
        }

        // Email check
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanToken)) {
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <strong style={{ color }}>{cleanToken}</strong>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); handleCopy(cleanToken); }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                title="Copy to clipboard"
              >
                {copied === cleanToken ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#6b7280" />}
              </button>
              {trailingPunctuation}
            </span>
          );
        }

        // URL check
        if (/^https?:\/\/[^\s]+$/.test(cleanToken) || cleanToken.includes('square.link') || cleanToken.includes('paypal.me') || cleanToken.includes('venmo.com')) {
          const href = cleanToken.startsWith('http') ? cleanToken : `https://${cleanToken}`;
          return (
            <span key={i}>
              <a href={href} target="_blank" rel="noreferrer" style={{ color, textDecoration: 'underline', fontWeight: 600 }}>{cleanToken}</a>
              {trailingPunctuation}
            </span>
          );
        }

        return <span key={i}>{token}</span>;
      })}
    </div>
  );
}
