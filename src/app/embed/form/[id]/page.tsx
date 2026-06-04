'use client';
import React, { useState, useEffect } from 'react';
import { DatePicker } from '@/components/ui/DatePicker';

export default function FormEmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  
  const [formConfig, setFormConfig] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/forms/${resolvedParams.id}?public=true`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFormConfig(data.form);
          const initialData: Record<string, any> = {};
          (data.form.fields || []).forEach((f: any) => {
            initialData[f.id] = f.type === 'checkbox' ? [] : '';
          });
          setFormData(initialData);
        } else {
          setError('Form not found.');
        }
      })
      .catch(() => setError('Error loading form.'))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  useEffect(() => {
    const reportHeight = () => {
      // Send height + bottom padding buffer to parent
      const height = document.documentElement.scrollHeight || document.body.scrollHeight;
      window.parent.postMessage({ type: 'crm-form-resize', id: resolvedParams.id, height: height + 40 }, '*');
    };
    
    // Initial report and window resize
    reportHeight();
    window.addEventListener('resize', reportHeight);
    
    // Setup observer for dynamic height changes
    const observer = new MutationObserver(reportHeight);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    
    return () => {
      window.removeEventListener('resize', reportHeight);
      observer.disconnect();
    };
  }, [resolvedParams.id, formConfig, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/public-forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: resolvedParams.id, formData })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (id: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const current = Array.isArray(prev[id]) ? prev[id] : [];
      if (checked) {
        return { ...prev, [id]: [...current, value] };
      } else {
        return { ...prev, [id]: current.filter((v: string) => v !== value) };
      }
    });
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', color: '#64748b' }}>Loading form...</div>;
  if (error && !formConfig) return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', color: '#ef4444' }}>{error}</div>;

  const themeColor = formConfig?.theme_color || '#0f172a';
  const styleConfig = (formConfig?.fields || []).find((f: any) => f.type === '_style_config') || {
    inputBgColor: '#ffffff',
    fieldBorderRadius: '0.5rem',
    buttonBorderRadius: '0.5rem',
    labelColor: '#334155',
    inputTextColor: '#0f172a',
    fontFamily: 'system-ui, sans-serif'
  };
  const activeFields = (formConfig?.fields || []).filter((f: any) => f.type !== '_style_config');

  if (success) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: `${themeColor}20`, color: themeColor, marginBottom: '1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Success!</h2>
        <p style={{ color: '#64748b', lineHeight: 1.5 }}>{formConfig.success_message}</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        html, body { 
          background-color: transparent !important; 
          min-height: auto !important;
          margin: 0 !important;
          /* Hide scrollbar for Chrome, Safari and Opera */
          -webkit-overflow-scrolling: touch;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        html {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        html::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div style={{ padding: '2rem 1rem 6rem 1rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        {formConfig.description && <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>{formConfig.description}</p>}
      
      {error && <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontFamily: styleConfig.fontFamily || 'system-ui, sans-serif' }}>
        {activeFields.map((field: any) => {
          const isHalf = field.width === 'half';
          return (
            <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: isHalf ? '1 1 calc(50% - 0.75rem)' : '1 1 100%', minWidth: isHalf ? '200px' : '100%' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: styleConfig.labelColor, marginBottom: '0.25rem' }}>
                {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: styleConfig.fieldBorderRadius, border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical', backgroundColor: styleConfig.inputBgColor, color: styleConfig.inputTextColor }}
                />
              ) : field.type === 'select' ? (
                <select
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: styleConfig.fieldBorderRadius, border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'inherit', backgroundColor: styleConfig.inputBgColor, color: styleConfig.inputTextColor }}
                >
                  <option value="" disabled>Select an option...</option>
                  {(field.options || []).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'radio' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: styleConfig.inputTextColor }}>
                  {(field.options || []).map((opt: string) => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={field.id}
                        value={opt}
                        checked={formData[field.id] === opt}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        required={field.required && !formData[field.id]}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : field.type === 'checkbox' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: styleConfig.inputTextColor }}>
                  {(field.options || []).map((opt: string) => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name={field.id}
                        value={opt}
                        checked={(formData[field.id] || []).includes(opt)}
                        onChange={e => handleCheckboxChange(field.id, opt, e.target.checked)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : field.type === 'date' ? (
                <DatePicker
                  value={formData[field.id] || ''}
                  onChange={val => handleFieldChange(field.id, val)}
                  required={field.required}
                  placeholder={`Select ${field.label}`}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: styleConfig.fieldBorderRadius, border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'inherit', backgroundColor: styleConfig.inputBgColor, color: styleConfig.inputTextColor }}
                />
              ) : (
                <input
                  type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'time' ? 'time' : field.type === 'number' ? 'number' : field.type === 'website' ? 'url' : 'text'}
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  pattern={field.type === 'phone' ? '^[\\+]?[(]?[0-9]{3}[)]?[-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4,6}$' : undefined}
                  title={field.type === 'phone' ? 'Please enter a valid phone number' : undefined}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: styleConfig.fieldBorderRadius, border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'inherit', backgroundColor: styleConfig.inputBgColor, color: styleConfig.inputTextColor }}
                />
              )}

              {field.description && (
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>{field.description}</p>
              )}
            </div>
          );
        })}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: '1rem',
            width: '100%',
            padding: '1rem',
            borderRadius: styleConfig.buttonBorderRadius,
            backgroundColor: themeColor,
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem',
            fontFamily: 'inherit',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {submitting ? 'Submitting...' : formConfig.submit_text}
        </button>
      </form>
    </div>
    </>
  );
}
