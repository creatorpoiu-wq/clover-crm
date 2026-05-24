"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, FileText, DollarSign, CheckCircle2, Clock, MessageSquare, ListTodo, DownloadCloud, Send, ExternalLink, Menu, X, ArrowRight } from 'lucide-react';

export default function ClientPortal() {
  const params = useParams();
  const inquiryId = params.inquiryId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Message State
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inquiryId) return;
    fetchPortalData();
  }, [inquiryId]);

  const fetchPortalData = () => {
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
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, data?.communications]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !data) return;
    setSendingMessage(true);
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          inquiryId,
          payload: { message: newMessage, clientName: data.client.name }
        })
      });
      if (res.ok) {
        setNewMessage('');
        fetchPortalData(); // Refresh to get the new message
      }
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b' }}>Loading your portal...</div>;
  if (error || !data) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#ef4444' }}>{error}</div>;

  const { vendor, client, event, contracts, invoices, deliverables, communications } = data;
  const firstName = client?.name?.split(' ')[0] || 'there';
  const brandColor = vendor.brandColor || '#0f172a';

  const calculateDaysUntil = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };
  const daysUntil = calculateDaysUntil(event.eventDate);

  const pendingContracts = contracts.filter((c: any) => c.Status !== 'Signed');
  const pendingInvoices = invoices.filter((i: any) => i.Status !== 'Paid');
  const milestones = event.deliverableMilestones || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Calendar size={18} /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={18} /> },
    { id: 'deliverables', label: 'Deliverables', icon: <DownloadCloud size={18} /> },
  ];

  const renderActionItems = () => {
    const items = [];
    if (pendingContracts.length > 0) {
      items.push({ text: `Sign ${pendingContracts[0].Contract_Title}`, tab: 'documents' });
    }
    if (pendingInvoices.length > 0) {
      items.push({ text: `Pay Invoice #${pendingInvoices[0].Invoice_ID}`, tab: 'documents' });
    }
    
    if (items.length === 0) {
      return (
        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: 12, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
          <CheckCircle2 size={24} style={{ color: '#10b981', margin: '0 auto 8px' }} />
          You are all caught up! No pending tasks.
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, borderLeft: `4px solid ${brandColor}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.text}</div>
            <button onClick={() => setActiveTab(item.tab)} style={{ background: 'none', border: 'none', color: brandColor, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
              View <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderTimeline = () => {
    if (milestones.length === 0) return <div style={{ color: '#64748b', fontSize: 14 }}>No timeline milestones available yet.</div>;
    return (
      <div style={{ position: 'relative', paddingLeft: 20 }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 27, width: 2, background: '#e2e8f0', zIndex: 0 }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 1 }}>
          {milestones.map((m: any, i: number) => {
            const isCompleted = m.status === 'completed';
            return (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ 
                  width: 16, height: 16, borderRadius: '50%', marginTop: 2,
                  background: isCompleted ? brandColor : '#fff',
                  border: `2px solid ${isCompleted ? brandColor : '#cbd5e1'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isCompleted && <CheckCircle2 size={10} color="#fff" />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: isCompleted ? '#0f172a' : '#64748b' }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{isCompleted ? 'Completed' : 'Pending'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Mobile Nav Toggle */}
      <button 
        onClick={() => setMobileMenuOpen(true)}
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 50, background: '#fff', border: '1px solid #e2e8f0', padding: 8, borderRadius: 8, display: 'flex' }}
        className="lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {vendor.businessLogo ? (
              <img src={vendor.businessLogo} alt={vendor.companyName} style={{ maxHeight: 40, maxWidth: 140, objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: 18, fontWeight: 800, color: brandColor }}>{vendor.companyName}</div>
            )}
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b' }}><X size={20}/></button>
          </div>

          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Portal Menu</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 14, fontWeight: isActive ? 600 : 500, transition: 'all 0.2s',
                      background: isActive ? `${brandColor}10` : 'transparent',
                      color: isActive ? brandColor : '#475569'
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>Logged in as</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{client.name}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{client.email}</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }} className="lg:p-10">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <div style={{ background: brandColor, color: '#fff', padding: '40px 32px', borderRadius: 16, marginBottom: 32, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Welcome back, {firstName}!</h1>
                <p style={{ fontSize: 15, opacity: 0.9, margin: 0 }}>Here is your project overview with {vendor.companyName}.</p>
                
                <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Event Date</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{event.eventDate || 'TBD'}</div>
                  </div>
                  {daysUntil !== null && daysUntil >= 0 && (
                    <div>
                      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Countdown</div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{daysUntil} Days Left</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Status</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{event.stage || 'Active'}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ListTodo size={18} color={brandColor} /> Action Items
                  </h2>
                  {renderActionItems()}
                </div>

                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={18} color={brandColor} /> Project Timeline
                  </h2>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                    {renderTimeline()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Messages</h2>
                <p style={{ color: '#64748b', fontSize: 14 }}>Communicate directly with {vendor.companyName}.</p>
              </div>

              <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px 16px 0 0', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {communications?.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', margin: 'auto 0' }}>No messages yet. Say hello!</div>
                ) : (
                  communications?.map((msg: any) => {
                    const isClient = msg.Last_Contact_By === client.name || msg.Last_Contact_By === 'Client';
                    return (
                      <div key={msg.Comm_ID} style={{ display: 'flex', flexDirection: 'column', alignItems: isClient ? 'flex-end' : 'flex-start' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, marginLeft: 4, marginRight: 4 }}>
                          {isClient ? 'You' : vendor.companyName} • {new Date(msg.Last_Contact_Date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                        <div style={{ 
                          padding: '12px 16px', borderRadius: 16, maxWidth: '80%', fontSize: 14, lineHeight: 1.5,
                          background: isClient ? brandColor : '#f1f5f9',
                          color: isClient ? '#fff' : '#0f172a',
                          borderBottomRightRadius: isClient ? 4 : 16,
                          borderBottomLeftRadius: isClient ? 16 : 4
                        }}>
                          {msg.Message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: 16 }}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    style={{ flex: 1, padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: 24, outline: 'none', fontSize: 14 }}
                  />
                  <button 
                    type="submit" 
                    disabled={sendingMessage || !newMessage.trim()}
                    style={{ background: brandColor, color: '#fff', border: 'none', borderRadius: 24, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: sendingMessage || !newMessage.trim() ? 'not-allowed' : 'pointer', opacity: sendingMessage || !newMessage.trim() ? 0.7 : 1 }}
                  >
                    <Send size={16} /> <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="animate-fade-in space-y-8">
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Documents</h2>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>View and manage your contracts and invoices.</p>
              </div>

              {/* Contracts */}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color={brandColor} /> Contracts</h3>
                {contracts.length === 0 ? (
                  <div style={{ padding: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#64748b', fontSize: 14 }}>No contracts available.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {contracts.map((c: any) => (
                      <div key={c.Contract_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{c.Contract_Title}</div>
                          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Status: <span style={{ color: c.Status === 'Signed' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{c.Status}</span></div>
                        </div>
                        {c.Status !== 'Signed' && c.Sign_Token ? (
                          <a href={`/contract/${c.Sign_Token}`} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', background: brandColor, color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Review & Sign</a>
                        ) : (
                          <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={16}/> Signed</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoices */}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign size={18} color={brandColor} /> Invoices</h3>
                {invoices.length === 0 ? (
                  <div style={{ padding: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#64748b', fontSize: 14 }}>No invoices available.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {invoices.map((inv: any) => (
                      <div key={inv.Invoice_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Invoice #{inv.Invoice_ID}</div>
                          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Due: {new Date(inv.Due_Date).toLocaleDateString()} • Amount: ${inv.Total_Amount}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: inv.Status === 'Paid' ? '#10b981' : '#f59e0b' }}>{inv.Status}</span>
                          {inv.Status !== 'Paid' && (
                            <a href={`/invoice/${inv.Invoice_ID}`} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', background: brandColor, color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Pay Now</a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DELIVERABLES TAB */}
          {activeTab === 'deliverables' && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Deliverables</h2>
                <p style={{ color: '#64748b', fontSize: 14 }}>Access your final galleries, timelines, and other files.</p>
              </div>

              {deliverables?.length === 0 ? (
                <div style={{ padding: 40, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, textAlign: 'center' }}>
                  <DownloadCloud size={40} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>No deliverables yet</div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>Your deliverables will appear here once they are ready.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
                  {deliverables?.map((d: any) => (
                    <div key={d.Deliverable_ID} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ background: `${brandColor}10`, width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <DownloadCloud size={20} color={brandColor} />
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{d.Title}</h3>
                      {d.Description && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, flex: 1 }}>{d.Description}</p>}
                      
                      {d.Link_URL && (
                        <a href={d.Link_URL} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', background: '#f1f5f9', color: '#0f172a', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s', marginTop: 'auto' }}>
                          Open Link <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
