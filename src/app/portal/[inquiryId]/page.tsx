"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, FileText, DollarSign, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ClientPortal() {
  const params = useParams();
  const inquiryId = params.inquiryId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!inquiryId) return;
    fetch(`/api/portal?inquiryId=${inquiryId}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.portal);
        } else {
          setError(res.error || 'Portal not found.');
        }
      })
      .catch(() => setError('Failed to load portal.'))
      .finally(() => setLoading(false));
  }, [inquiryId]);

  if (loading) return <div className="empty-state" style={{ height: '100vh' }}>Loading your portal...</div>;
  if (error || !data) return <div className="empty-state" style={{ height: '100vh', color: '#ef4444' }}>{error}</div>;

  const { vendor, client, event, contracts, invoices } = data;
  const firstName = client?.name?.split(' ')[0] || 'there';

  const calculateDaysUntil = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const daysUntil = calculateDaysUntil(event.eventDate);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '20px 0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {vendor.businessLogo ? (
            <img src={vendor.businessLogo} alt={vendor.companyName} style={{ maxHeight: 40, maxWidth: 150, objectFit: 'contain' }} />
          ) : (
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{vendor.companyName}</div>
          )}
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Client Portal</div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Welcome & Event Summary */}
        <div className="glass-panel animate-fade-in" style={{ padding: '30px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Welcome back, {firstName}!</h1>
          <p style={{ fontSize: 15, color: '#cbd5e1', margin: '0 0 24px' }}>Here is your project overview with {vendor.companyName}.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}><Calendar size={20} /></div>
              <div>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase' }}>Event Date</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{event.eventDate || 'TBD'}</div>
              </div>
            </div>
            {daysUntil !== null && daysUntil >= 0 && (
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}><Clock size={20} /></div>
                <div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase' }}>Countdown</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{daysUntil} Days Left</div>
                </div>
              </div>
            )}
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '8px' }}><CheckCircle2 size={20} /></div>
              <div>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase' }}>Status</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{event.stage || 'Active'}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }} className="mobile-stack">
          {/* Contracts Section */}
          <div className="glass-panel animate-fade-in" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={20} color="#0d9488" /> Contracts & Agreements
            </h2>
            {contracts.length === 0 ? (
              <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center', padding: '30px 0', background: '#f8fafc', borderRadius: 8 }}>
                No contracts available.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {contracts.map((c: any) => (
                  <div key={c.Contract_ID} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{c.Contract_Title || 'Digital Agreement'}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                          {c.Status === 'Signed' ? `Signed on ${c.Signed_Date}` : 'Awaiting Signature'}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase',
                        background: c.Status === 'Signed' ? '#dcfce7' : '#fef9c3', 
                        color: c.Status === 'Signed' ? '#166534' : '#854d0e' 
                      }}>
                        {c.Status}
                      </div>
                    </div>
                    {c.Status !== 'Signed' && c.Sign_Token && (
                      <Link href={`/sign/${c.Sign_Token}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#fff', background: '#0f172a', padding: '8px 16px', borderRadius: 6, textDecoration: 'none' }}>
                        Review & Sign <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices Section */}
          <div className="glass-panel animate-fade-in" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={20} color="#0284c7" /> Invoices & Billing
            </h2>
            {invoices.length === 0 ? (
              <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center', padding: '30px 0', background: '#f8fafc', borderRadius: 8 }}>
                No invoices available.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {invoices.map((inv: any) => {
                  const isPaid = inv.Status === 'Paid';
                  return (
                    <div key={inv.Invoice_ID} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>Invoice #{inv.Invoice_ID.toString().padStart(4, '0')}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Due: {inv.Due_Date || 'N/A'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>${Number(inv.Total_Amount).toLocaleString()}</div>
                          <div style={{ 
                            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, marginTop: 6, display: 'inline-block',
                            background: isPaid ? '#dcfce7' : '#f1f5f9', 
                            color: isPaid ? '#166534' : '#475569' 
                          }}>
                            {inv.Status}
                          </div>
                        </div>
                      </div>
                      {!isPaid && inv.Status !== 'Draft' && (
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ea580c', background: '#fff7ed', padding: '8px 12px', borderRadius: 6 }}>
                          <AlertCircle size={14} /> Please check your email for the secure payment link.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .mobile-stack {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
}
