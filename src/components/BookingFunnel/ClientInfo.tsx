'use client';
import React from 'react';

interface Props {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  onNext: () => void;
  onBack?: () => void;
  funnelSettings?: any;
}

export default function ClientInfo({ data, setData, onNext, onBack, funnelSettings }: Props) {
  const handleChange = (label: string, value: string) => {
    setData((prev: any) => ({ ...prev, [label]: value }));
  };

  const isValid = data['Full Name']?.trim() && data['Email']?.trim() && data['Phone']?.trim();

  const inputStyle = { width: '100%', padding: '14px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' as const, background: '#f9fafb', transition: 'border 0.2s', marginBottom: 20 };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800 as const, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 };

  return (
    <div className="animate-fade-in" style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>Let's Get Started</h2>
        <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>Please provide your details before we begin the booking process.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div>
          <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
          <input 
            type="text" 
            value={data['Full Name'] || ''} 
            onChange={e => handleChange('Full Name', e.target.value)}
            placeholder="e.g. Jordan Smith" 
            style={inputStyle} 
          />
        </div>

        <div>
          <label style={labelStyle}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
          <input 
            type="email" 
            value={data['Email'] || ''} 
            onChange={e => handleChange('Email', e.target.value)}
            placeholder="e.g. jordan@example.com" 
            style={inputStyle} 
          />
        </div>

        <div>
          <label style={labelStyle}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
          <input 
            type="tel" 
            value={data['Phone'] || ''} 
            onChange={e => handleChange('Phone', e.target.value)}
            placeholder="e.g. (555) 123-4567" 
            style={inputStyle} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: 24, marginTop: 20 }}>
        {onBack ? (
          <button 
            onClick={onBack}
            style={{ padding: '16px 24px', border: '1px solid #e5e7eb', background: 'transparent', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#4b5563' }}
          >
            Back
          </button>
        ) : <div />}
        <button 
          onClick={onNext}
          disabled={!isValid}
          style={{
            background: isValid ? '#111827' : '#e5e7eb',
            color: isValid ? '#fff' : '#9ca3af',
            padding: '16px 32px', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 800,
            cursor: isValid ? 'pointer' : 'not-allowed', transition: 'all 0.2s', width: onBack ? 'auto' : '100%'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
