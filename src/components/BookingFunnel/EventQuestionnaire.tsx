'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Field {
  Field_ID: number;
  Label: string;
  Type: string;
  Options: string;
  Is_Required: number;
  Order_Index: number;
}

interface Props {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  onNext: () => void;
  onBack: () => void;
  funnelSettings: any;
}

export default function EventQuestionnaire({ data, setData, onNext, onBack, funnelSettings }: Props) {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const step = funnelSettings?.steps?.[1];
  const title = step?.title || 'Tell Us About Your Day';
  const subtitle = step?.subtitle || 'Help us prepare the perfect agreement for your event.';

  useEffect(() => {
    const urlTemplateId = searchParams.get('questionnaireId');
    
    if (urlTemplateId) {
      fetch(`/api/questionnaire?type=fields&templateId=${urlTemplateId}`)
        .then(res => res.json())
        .then(fData => { if (fData.success) setFields(fData.fields); })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      fetch('/api/questionnaire?type=settings')
        .then(res => res.json())
        .then(sData => {
          const templateId = sData.settings?.Questionnaire_Template_ID;
          if (templateId) {
            fetch(`/api/questionnaire?type=fields&templateId=${templateId}`)
              .then(res => res.json())
              .then(fData => { if (fData.success) setFields(fData.fields); })
              .catch(err => console.error(err))
              .finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [searchParams]);

  const handleChange = (label: string, value: any) => {
    setData((prev: any) => ({ ...prev, [label]: value }));
  };

  const isValid = fields.filter(f => f.Is_Required === 1).every(f => {
    const val = data[f.Label];
    return val !== undefined && val !== null && String(val).trim() !== '';
  });

  const inputStyle = { width: '100%', padding: '14px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' as const, background: '#f9fafb', transition: 'border 0.2s', marginBottom: 20 };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800 as const, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>Loading Questionnaire...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>{title}</h2>
        <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>{subtitle}</p>
      </div>

      {fields.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No questionnaire fields configured. Please contact the studio.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {fields.map(field => (
            <div key={field.Field_ID}>
              {field.Type !== 'checkbox' && (
                <label style={labelStyle}>
                  {field.Label} {field.Is_Required === 1 && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
              )}

              {field.Type === 'textarea' ? (
                <textarea 
                  value={data[field.Label] || ''} 
                  onChange={e => handleChange(field.Label, e.target.value)}
                  placeholder={`Enter ${field.Label.toLowerCase()}...`} 
                  rows={3} 
                  style={{ ...inputStyle, resize: 'vertical' }} 
                />
              ) : field.Type === 'select' ? (
                <select 
                  value={data[field.Label] || ''} 
                  onChange={e => handleChange(field.Label, e.target.value)}
                  style={inputStyle}
                >
                  <option value="" disabled>-- Select an option --</option>
                  {field.Options.split(',').map(opt => (
                    <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                  ))}
                </select>
              ) : field.Type === 'checkbox' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', marginBottom: 20 }}>
                  <input 
                    type="checkbox" 
                    checked={!!data[field.Label]} 
                    onChange={e => handleChange(field.Label, e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }} 
                  />
                  <span style={{ fontSize: 15, color: '#374151', fontWeight: 600 }}>{field.Label}</span>
                </label>
              ) : (
                <input 
                  type={field.Type} 
                  value={data[field.Label] || ''} 
                  onChange={e => handleChange(field.Label, e.target.value)}
                  placeholder={`Enter ${field.Label.toLowerCase()}...`} 
                  style={inputStyle} 
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: 24, marginTop: 20 }}>
        <button onClick={onBack} style={{ background: 'transparent', color: '#6b7280', padding: '16px 24px', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Back</button>
        <button 
          onClick={onNext}
          disabled={!isValid || fields.length === 0}
          style={{
            background: isValid && fields.length > 0 ? '#111827' : '#e5e7eb',
            color: isValid && fields.length > 0 ? '#fff' : '#9ca3af',
            padding: '16px 32px', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 800,
            cursor: isValid && fields.length > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
          }}
        >
          Generate Contract
        </button>
      </div>
    </div>
  );
}
