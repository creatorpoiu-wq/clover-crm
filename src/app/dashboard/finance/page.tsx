"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FileText, DollarSign, Plus, Edit2, Trash2, Check, X, Printer, Search } from "lucide-react";
import ContractBuilder from "@/components/ContractBuilder";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import { formatDate } from "@/lib/formatDate";

interface InquiryOption {
  Inquiry_ID: number;
  Contact_Name: string;
  Service_Type: string;
}

interface Invoice {
  Invoice_ID: number;
  Inquiry_ID: number;
  Contact_Name: string;
  Service_Type: string;
  Issue_Date: string;
  Due_Date: string;
  Status: string;
  Total_Amount: number;
}

interface Contract {
  Contract_ID: number;
  Inquiry_ID: number;
  Contact_Name: string;
  Service_Type: string;
  Contract_Text: string;
  Contract_Title: string;
  Status: string;
  Sent_Date: string;
  Signed_Date: string;
  Provider_Signature?: string;
  Client_Signature?: string;
  Signers?: string;
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [inquiries, setInquiries] = useState<InquiryOption[]>([]);
  
  // Invoice State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ inquiryId: "", issueDate: new Date().toISOString().split('T')[0], dueDate: "", totalAmount: "", status: "Draft" });

  // Contract State
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractForm, setContractForm] = useState({ inquiryId: "", contractText: "This agreement is between the Service Provider and the Client...", status: "Draft", sentDate: "" });
  const [viewContract, setViewContract] = useState<Contract | null>(null);
  const [showFullBuilder, setShowFullBuilder] = useState(false);
  const [builderDrafts, setBuilderDrafts] = useState<{Draft_ID:number;Title:string;Status:string;Updated_At:string;Signers:string}[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [allContacts, setAllContacts] = useState<{Contact_ID:number;Name:string;Email:string}[]>([]);
  const [selectedClient, setSelectedClient] = useState<{Contact_ID:number;Name:string;Email:string} | null>(null);
  const [contactSearch, setContactSearch] = useState('');

  // Invoice Builder State
  const [showInvoiceBuilder, setShowInvoiceBuilder] = useState(false);
  const [invoiceBuilderDrafts, setInvoiceBuilderDrafts] = useState<{Draft_ID:number;Title:string;Status:string;Updated_At:string;Client_Name:string;Client_Email:string;Due_Date:string}[]>([]);

  useEffect(() => {
    fetchInquiries();
    fetchInvoices();
    fetchContracts();
    fetchBuilderDrafts();
    fetchInvoiceBuilderDrafts();
    fetch('/api/contacts').then(r=>r.json()).then(d=>{ if(d.success) setAllContacts(d.contacts); });
  }, []);

  const fetchInquiries = () => {
    fetch("/api/inquiries")
      .then(res => res.json())
      .then(data => { if (data.success) setInquiries(data.inquiries); });
  };

  const fetchInvoices = () => {
    setLoadingInvoices(true);
    fetch("/api/invoices")
      .then(res => res.json())
      .then(data => { if (data.success) setInvoices(data.invoices); })
      .finally(() => setLoadingInvoices(false));
  };

  const fetchContracts = () => {
    setLoadingContracts(true);
    fetch("/api/contracts")
      .then(res => res.json())
      .then(data => { if (data.success) setContracts(data.contracts); })
      .finally(() => setLoadingContracts(false));
  };

  const fetchBuilderDrafts = () => {
    fetch("/api/contract-actions")
      .then(res => res.json())
      .then(data => { if (data.success) setBuilderDrafts(data.drafts || []); })
      .catch(() => {});
  };

  const fetchInvoiceBuilderDrafts = () => {
    fetch("/api/invoice-actions")
      .then(res => res.json())
      .then(data => { if (data.success) setInvoiceBuilderDrafts(data.drafts || []); })
      .catch(() => {});
  };

  const deleteInvoiceBuilderDraft = async (id: number) => {
    await fetch(`/api/invoice-actions?id=${id}`, { method: "DELETE" });
    fetchInvoiceBuilderDrafts();
    fetchInvoices();
  };

  // Handlers
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...invoiceForm, inquiryId: parseInt(invoiceForm.inquiryId), totalAmount: parseFloat(invoiceForm.totalAmount) })
      });
      if (res.ok) {
        setShowInvoiceForm(false);
        fetchInvoices();
        setInvoiceForm({ inquiryId: "", issueDate: new Date().toISOString().split('T')[0], dueDate: "", totalAmount: "", status: "Draft" });
      }
    } catch (err) { console.error(err); }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contractForm, inquiryId: parseInt(contractForm.inquiryId) })
      });
      if (res.ok) {
        setShowContractForm(false);
        fetchContracts();
        setContractForm({ inquiryId: "", contractText: "This agreement is between the Service Provider and the Client...", status: "Draft", sentDate: "" });
      }
    } catch (err) { console.error(err); }
  };

  const deleteInvoice = async (id: number) => {
    const key = `inv-${id}`;
    if (confirmDeleteId !== key) { setConfirmDeleteId(key); setTimeout(() => setConfirmDeleteId(null), 3000); return; }
    setConfirmDeleteId(null);
    await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
    fetchInvoices();
  };

  const deleteContract = async (id: number) => {
    const key = `cnt-${id}`;
    if (confirmDeleteId !== key) { setConfirmDeleteId(key); setTimeout(() => setConfirmDeleteId(null), 3000); return; }
    setConfirmDeleteId(null);
    await fetch(`/api/contracts?id=${id}`, { method: "DELETE" });
    fetchContracts();
  };

  const deleteBuilderDraft = async (id: number) => {
    const key = `draft-${id}`;
    if (confirmDeleteId !== key) { setConfirmDeleteId(key); setTimeout(() => setConfirmDeleteId(null), 3000); return; }
    setConfirmDeleteId(null);
    await fetch(`/api/contract-actions?id=${id}`, { method: "DELETE" });
    fetchBuilderDrafts();
  };

  const updateInvoiceStatus = async (id: number, status: string) => {
    await fetch("/api/invoices", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId: id, status }) });
    fetchInvoices();
  };

  const updateContractStatus = async (id: number, status: string) => {
    const body: any = { contractId: id, status };
    if (status === "Signed") body.signedDate = new Date().toISOString().split('T')[0];
    await fetch("/api/contracts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchContracts();
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="animate-fade-in">
      {/* ── New Contract Modal (Portal) ── */}
      {showNewContractModal && typeof window !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5vh 16px' }}
          onClick={() => setShowNewContractModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Create Contract</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Select a client to add as a signer</p>
              </div>
              <button onClick={() => setShowNewContractModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}><X size={18} /></button>
            </div>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
              <Search size={15} style={{ color: '#9ca3af', flexShrink: 0 }} />
              <input
                autoFocus
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Search contacts by name or email…"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent' }}
              />
            </div>
            {/* List */}
            <div style={{ overflowY: 'auto', maxHeight: 320, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
              {allContacts
                .filter(c => !contactSearch || c.Name?.toLowerCase().includes(contactSearch.toLowerCase()) || c.Email?.toLowerCase().includes(contactSearch.toLowerCase()))
                .map((c, i) => {
                  const colors = [['#166534','#dcfce7'],['#1e40af','#dbeafe'],['#6b21a8','#f3e8ff'],['#9a3412','#ffedd5']];
                  const [col, bg] = colors[i % colors.length];
                  const initials = c.Name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()||'?';
                  const isSel = selectedClient?.Contact_ID === c.Contact_ID;
                  return (
                    <div key={c.Contact_ID}
                      onClick={() => setSelectedClient(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: isSel ? '#f0fdfa' : 'transparent', border: isSel ? '1px solid #99f6e4' : '1px solid transparent'
                      }}
                      onMouseEnter={e => { if(!isSel)(e.currentTarget as HTMLDivElement).style.background='#f9fafb'; }}
                      onMouseLeave={e => { if(!isSel)(e.currentTarget as HTMLDivElement).style.background='transparent'; }}
                    >
                      <div style={{ width:36, height:36, borderRadius:'50%', background:bg, color:col, fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{initials}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{c.Name}</div>
                        <div style={{ fontSize:12, color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.Email}</div>
                      </div>
                      {isSel && <Check size={16} style={{ color:'#0d9488', flexShrink:0 }} />}
                    </div>
                  );
                })}
              {allContacts.length === 0 && <div style={{ textAlign:'center', color:'#9ca3af', fontSize:13, padding:24 }}>No contacts found</div>}
            </div>
            {/* Actions */}
            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={() => { setSelectedClient(null); setShowNewContractModal(false); setShowFullBuilder(true); }}
                style={{ flex:1, padding:'10px', border:'1px solid #e5e7eb', borderRadius:8, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}
              >
                Skip – open blank
              </button>
              <button
                onClick={() => { setShowNewContractModal(false); setShowFullBuilder(true); }}
                disabled={!selectedClient}
                style={{ flex:2, padding:'10px', border:'none', borderRadius:8, background: selectedClient ? '#0d9488' : '#d1d5db', color:'#fff', cursor: selectedClient ? 'pointer' : 'not-allowed', fontSize:13, fontWeight:700 }}
              >
                {selectedClient ? `Create with ${selectedClient.Name.split(' ')[0]}` : 'Select a client'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showFullBuilder && typeof window !== 'undefined' && createPortal(
        <ContractBuilder 
          onClose={() => { setShowFullBuilder(false); setSelectedClient(null); }} 
          onDraftSaved={fetchBuilderDrafts}
          initialClient={selectedClient || undefined}
          onSave={(html) => { 
            setContractForm({...contractForm, contractText: html}); 
            setShowFullBuilder(false);
            setSelectedClient(null);
            fetchBuilderDrafts();
            fetchContracts();
          }} 
        />,
        document.body
      )}

      {showInvoiceBuilder && typeof window !== 'undefined' && createPortal(
        <InvoiceBuilder
          onClose={() => setShowInvoiceBuilder(false)}
          onDraftSaved={() => { fetchInvoiceBuilderDrafts(); fetchInvoices(); }}
        />,
        document.body
      )}
      
      <h1 className="page-title">Finance & Legal</h1>
      <p className="page-subtitle">Manage client invoices, payments, and digital contracts.</p>

      {viewContract && (
        <div className="mobile-overlay open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '860px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--background)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h2 className="section-header" style={{ marginBottom: 4, border: 'none' }}>{viewContract.Contract_Title || 'Contract Document'}</h2>
                {viewContract.Status === 'Signed' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 12 }}>✓ Signed {viewContract.Signed_Date ? `· ${formatDate(viewContract.Signed_Date)}` : ''}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => window.print()} className="btn btn-outline" style={{ width: 'auto', padding: '0.5rem 1rem' }}><Printer size={18} /> Print PDF</button>
                <button onClick={() => setViewContract(null)} className="btn btn-outline" style={{ width: 'auto', padding: '0.5rem 1rem' }}><X size={18} /> Close</button>
              </div>
            </div>

            {/* Contract body */}
            <div
              style={{
                lineHeight: 1.8, fontFamily: 'Georgia, serif', fontSize: 15,
                padding: '56px 72px', backgroundColor: 'white', color: '#1f2937',
                border: '1px solid #e5e7eb', borderRadius: 4,
                minHeight: 400, boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                marginBottom: 24,
              }}
              dangerouslySetInnerHTML={{ __html: viewContract.Contract_Text || '' }}
            />

            {/* Signatures block */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '28px 32px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Signatures</div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>

                {/* Provider signature */}
                {viewContract.Provider_Signature && (
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 8 }}>SERVICE PROVIDER</div>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', background: '#f9fafb', position: 'relative' }}>
                      <img src={viewContract.Provider_Signature} alt="Provider signature" style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                      <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: '#0d9488', fontWeight: 700 }}>✓ Pre-signed</span>
                    </div>
                  </div>
                )}

                {/* Client signature */}
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 8 }}>CLIENT</div>
                  {viewContract.Client_Signature ? (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', background: '#f9fafb', position: 'relative' }}>
                      <img src={viewContract.Client_Signature} alt="Client signature" style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                      <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: '#15803d', fontWeight: 700 }}>✓ Signed</span>
                    </div>
                  ) : (
                    <div style={{ border: '2px dashed #d1d5db', borderRadius: 8, padding: '20px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                      Awaiting client signature
                    </div>
                  )}
                </div>
              </div>

              {viewContract.Status !== 'Signed' && (
                <p style={{ marginTop: 16, fontSize: 11, color: '#9ca3af' }}>Digital signatures are legally binding under ESIGN and UETA.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: 0 }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
          <button onClick={() => setActiveTab("invoices")} style={{ padding: "1rem 1.5rem", fontWeight: 700, borderBottom: activeTab === "invoices" ? "2px solid var(--primary)" : "2px solid transparent", color: activeTab === "invoices" ? "var(--primary)" : "var(--muted)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <DollarSign size={18} /> Invoices
          </button>
          <button onClick={() => setActiveTab("contracts")} style={{ padding: "1rem 1.5rem", fontWeight: 700, borderBottom: activeTab === "contracts" ? "2px solid var(--primary)" : "2px solid transparent", color: activeTab === "contracts" ? "var(--primary)" : "var(--muted)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={18} /> Contracts
          </button>
        </div>

        <div style={{ padding: "2rem" }}>
          
          {/* INVOICES TAB */}
          {activeTab === "invoices" && (
            <div className="animate-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 className="section-header" style={{ marginBottom: 0, border: "none", padding: 0 }}>Client Invoices</h2>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => setShowInvoiceBuilder(true)} className="btn btn-outline" style={{ width: "auto", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <FileText size={16} /> Invoice Builder
                  </button>
                  <button onClick={() => setShowInvoiceForm(!showInvoiceForm)} className="btn btn-primary" style={{ width: "auto" }}>
                    {showInvoiceForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Quick Invoice</>}
                  </button>
                </div>
              </div>

              {showInvoiceForm && (
                <form onSubmit={handleCreateInvoice} className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem", backgroundColor: "var(--muted-bg)" }}>
                  <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: "1.5rem", marginBottom: "1.5rem" }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Client / Inquiry *</label>
                      <select required className="input" style={{ textAlign: "left", letterSpacing: "normal", fontSize: "0.875rem", padding: "0.75rem" }} value={invoiceForm.inquiryId} onChange={e => setInvoiceForm({...invoiceForm, inquiryId: e.target.value})}>
                        <option value="">-- Select Client --</option>
                        {inquiries.map(inq => <option key={inq.Inquiry_ID} value={inq.Inquiry_ID}>{inq.Contact_Name} ({inq.Service_Type})</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Total Amount ($) *</label>
                      <input required type="number" step="0.01" className="input" style={{ textAlign: "left", letterSpacing: "normal", fontSize: "0.875rem", padding: "0.75rem" }} value={invoiceForm.totalAmount} onChange={e => setInvoiceForm({...invoiceForm, totalAmount: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Due Date *</label>
                      <input required type="date" className="input" style={{ textAlign: "left", letterSpacing: "normal", fontSize: "0.875rem", padding: "0.75rem" }} value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" className="btn btn-primary" style={{ width: "auto" }}>Save Invoice</button>
                  </div>
                </form>
              )}

              {loadingInvoices ? <div style={{ color: "var(--muted)" }}>Loading...</div> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                        <th style={{ padding: "1rem 0.5rem" }}>Invoice #</th>
                        <th style={{ padding: "1rem 0.5rem" }}>Client</th>
                        <th style={{ padding: "1rem 0.5rem" }}>Amount</th>
                        <th style={{ padding: "1rem 0.5rem" }}>Due Date</th>
                        <th style={{ padding: "1rem 0.5rem" }}>Status</th>
                        <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.Invoice_ID} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-[var(--muted-bg)]">
                          <td style={{ padding: "1rem 0.5rem", fontWeight: 700 }}>INV-{inv.Invoice_ID.toString().padStart(4, '0')}</td>
                          <td style={{ padding: "1rem 0.5rem" }}>
                            <div style={{ fontWeight: 600 }}>{inv.Contact_Name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{inv.Service_Type}</div>
                          </td>
                          <td style={{ padding: "1rem 0.5rem", fontWeight: 800 }}>{formatCurrency(inv.Total_Amount)}</td>
                          <td style={{ padding: "1rem 0.5rem" }}>{formatDate(inv.Due_Date)}</td>
                          <td style={{ padding: "1rem 0.5rem" }}>
                            <select 
                              value={inv.Status} 
                              onChange={(e) => updateInvoiceStatus(inv.Invoice_ID, e.target.value)}
                              style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: "1px solid var(--border)", backgroundColor: inv.Status === 'Paid' ? 'var(--status-green)' : inv.Status === 'Overdue' ? 'var(--status-red)' : 'var(--background)', color: inv.Status === 'Paid' ? 'var(--status-green-fg)' : inv.Status === 'Overdue' ? 'var(--status-red-fg)' : 'inherit', fontWeight: 600, fontSize: "0.75rem" }}
                            >
                              <option value="Draft">Draft</option>
                              <option value="Sent">Sent</option>
                              <option value="Paid">Paid</option>
                              <option value="Overdue">Overdue</option>
                            </select>
                          </td>
                          <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                            <button onClick={() => deleteInvoice(inv.Invoice_ID)} className="btn btn-outline" style={{ padding: "0.5rem", width: "auto", color: "var(--status-red-fg)", borderColor: "var(--status-red)" }}><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                {invoices.length === 0 && <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>No invoices found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Invoice Builder Drafts */}
              {invoiceBuilderDrafts.length > 0 && (
                <div style={{ marginTop: "2rem" }}>
                  <h3 className="section-header" style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>Invoice Builder Drafts</h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                          <th style={{ padding: "0.75rem 0.5rem" }}>#</th>
                          <th style={{ padding: "0.75rem 0.5rem" }}>Title</th>
                          <th style={{ padding: "0.75rem 0.5rem" }}>Client</th>
                          <th style={{ padding: "0.75rem 0.5rem" }}>Due Date</th>
                          <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                          <th style={{ padding: "0.75rem 0.5rem" }}>Updated</th>
                          <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceBuilderDrafts.map(draft => (
                          <tr key={draft.Draft_ID} style={{ borderBottom: "1px solid var(--border)", background: "#fffbeb" }}>
                            <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "#92400e", fontSize: "0.8rem" }}>INV-B{String(draft.Draft_ID).padStart(3,'0')}</td>
                            <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>{draft.Title}</td>
                            <td style={{ padding: "0.75rem 0.5rem", color: "var(--muted)", fontSize: "0.875rem" }}>{draft.Client_Name || "—"}{draft.Client_Email ? ` · ${draft.Client_Email}` : ""}</td>
                            <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.875rem" }}>{draft.Due_Date ? formatDate(draft.Due_Date) : "—"}</td>
                            <td style={{ padding: "0.75rem 0.5rem" }}>
                              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "0.25rem", background: draft.Status === 'Sent' ? 'var(--status-blue)' : '#fef3c7', color: draft.Status === 'Sent' ? 'var(--status-blue-fg)' : '#92400e', fontWeight: 700, fontSize: "0.75rem" }}>{draft.Status}</span>
                            </td>
                            <td style={{ padding: "0.75rem 0.5rem", color: "var(--muted)", fontSize: "0.875rem" }}>{formatDate(draft.Updated_At)}</td>
                            <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                <button onClick={() => setShowInvoiceBuilder(true)} className="btn btn-outline" style={{ padding: "0.4rem 0.75rem", width: "auto", fontSize: "0.75rem", fontWeight: 600 }}>
                                  <Edit2 size={14}/> Open
                                </button>
                                <button onClick={() => deleteInvoiceBuilderDraft(draft.Draft_ID)} className="btn btn-outline" style={{ padding: "0.4rem 0.6rem", width: "auto", color: "var(--status-red-fg)", borderColor: "var(--status-red)" }}>
                                  <Trash2 size={14}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTRACTS TAB */}
          {activeTab === "contracts" && (
            <div className="animate-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 className="section-header" style={{ marginBottom: 0, border: "none", padding: 0 }}>Legal Contracts</h2>
                <button onClick={() => { setSelectedClient(null); setContactSearch(''); setShowNewContractModal(true); }} className="btn btn-primary" style={{ width: "auto" }}>
                  <Plus size={18} /> Create Contract
                </button>
              </div>


              {loadingContracts ? <div style={{ color: "var(--muted)" }}>Loading...</div> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                        <th style={{ padding: "1rem 0.5rem" }}>Contract #</th>
                        <th style={{ padding: "1rem 0.5rem" }}>Client</th>
                        <th style={{ padding: "1rem 0.5rem" }}>Status</th>
                        <th style={{ padding: "1rem 0.5rem" }}>Signed Date</th>
                        <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Builder Drafts */}
                      {builderDrafts.map(draft => {
                        const signerList = (() => { try { return JSON.parse(draft.Signers); } catch { return []; } })();
                        const clientSigner = signerList.find((s: any) => s.name && !s.name.includes('Photography'));
                        return (
                          <tr key={`draft-${draft.Draft_ID}`} style={{ borderBottom: "1px solid var(--border)", background: "#fffbeb" }}>
                            <td style={{ padding: "1rem 0.5rem", fontWeight: 700, color: "#92400e" }}>DRAFT-{draft.Draft_ID.toString().padStart(3,'0')}</td>
                            <td style={{ padding: "1rem 0.5rem" }}>
                              <div style={{ fontWeight: 600 }}>{draft.Title}</div>
                              {clientSigner && <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{clientSigner.name} · {clientSigner.email}</div>}
                            </td>
                            <td style={{ padding: "1rem 0.5rem" }}>
                              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "0.25rem", background: draft.Status === 'Sent' ? 'var(--status-blue)' : '#fef3c7', color: draft.Status === 'Sent' ? 'var(--status-blue-fg)' : '#92400e', fontWeight: 700, fontSize: "0.75rem" }}>
                                {draft.Status}
                              </span>
                            </td>
                            <td style={{ padding: "1rem 0.5rem", color: "var(--muted)", fontSize: "0.875rem" }}>{formatDate(draft.Updated_At)}</td>
                            <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                <button onClick={() => setShowFullBuilder(true)} className="btn btn-outline" style={{ padding: "0.5rem", width: "auto" }} title="Open in Builder"><Edit2 size={16} /></button>
                                <button
                                  onClick={() => deleteBuilderDraft(draft.Draft_ID)}
                                  className="btn btn-outline"
                                  style={{ padding: "0.4rem 0.75rem", width: "auto", fontSize: "0.75rem", fontWeight: 600,
                                    color: confirmDeleteId === `draft-${draft.Draft_ID}` ? "#fff" : "var(--status-red-fg)",
                                    background: confirmDeleteId === `draft-${draft.Draft_ID}` ? "#dc2626" : "transparent",
                                    borderColor: "#dc2626", transition: "all 0.15s"
                                  }}
                                >
                                  {confirmDeleteId === `draft-${draft.Draft_ID}` ? "Confirm?" : <Trash2 size={16} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Saved Contracts */}
                      {contracts.map(cnt => (
                        <tr key={cnt.Contract_ID} style={{ borderBottom: "1px solid var(--border)", background: cnt.Status === 'Signed' ? 'rgba(22,163,74,0.03)' : 'transparent' }} className="hover:bg-[var(--muted-bg)]">
                          <td style={{ padding: "1rem 0.5rem", fontWeight: 700 }}>CNT-{cnt.Contract_ID.toString().padStart(4, '0')}</td>
                          <td style={{ padding: "1rem 0.5rem" }}>
                            <div style={{ fontWeight: 600 }}>{cnt.Contact_Name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{cnt.Service_Type}</div>
                          </td>
                          <td style={{ padding: "1rem 0.5rem" }}>
                            {cnt.Status === 'Signed' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.75rem' }}>
                                ✓ Signed
                              </span>
                            ) : (
                              <select 
                                value={cnt.Status} 
                                onChange={(e) => updateContractStatus(cnt.Contract_ID, e.target.value)}
                                style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: "1px solid var(--border)", backgroundColor: cnt.Status === 'Sent' ? 'var(--status-blue)' : 'var(--background)', color: cnt.Status === 'Sent' ? 'var(--status-blue-fg)' : 'inherit', fontWeight: 600, fontSize: "0.75rem" }}
                              >
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Signed">Signed</option>
                              </select>
                            )}
                          </td>
                          <td style={{ padding: "1rem 0.5rem", fontSize: "0.875rem" }}>
                            {cnt.Signed_Date ? (
                              <span style={{ color: '#15803d', fontWeight: 600 }}>📅 {formatDate(cnt.Signed_Date)}</span>
                            ) : (
                              <span style={{ color: "var(--muted)" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                              <button onClick={() => setViewContract(cnt)} className="btn btn-outline" style={{ padding: "0.5rem", width: "auto" }} title="View Contract"><FileText size={16} /></button>
                              <button
                                onClick={() => deleteContract(cnt.Contract_ID)}
                                className="btn btn-outline"
                                style={{ padding: "0.4rem 0.75rem", width: "auto", fontSize: "0.75rem", fontWeight: 600,
                                  color: confirmDeleteId === `cnt-${cnt.Contract_ID}` ? "#fff" : "var(--status-red-fg)",
                                  background: confirmDeleteId === `cnt-${cnt.Contract_ID}` ? "#dc2626" : "transparent",
                                  borderColor: "#dc2626", transition: "all 0.15s"
                                }}
                              >
                                {confirmDeleteId === `cnt-${cnt.Contract_ID}` ? "Confirm?" : <Trash2 size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {contracts.length === 0 && builderDrafts.length === 0 && <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>No contracts found. Click "Create Contract" to get started.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
