"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, ChevronDown, Edit2, Plus, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContractBuilder from "@/components/ContractBuilder";
import InvoiceBuilder from "@/components/InvoiceBuilder";

interface Contact {
  Contact_ID: number;
  Name: string;
  Email: string;
  Phone: string;
  Lead_Source: string;
  Company?: string;
  Address?: string;
  Notes?: string;
}

interface Inquiry {
  Inquiry_ID: number;
  Service_Type: string;
  Pipeline_Stage: string;
}

interface Communication {
  Communication_ID: number;
  Last_Contact_Date: string;
  Last_Contact_By: string;
  Message: string;
}

interface Invoice {
  Invoice_ID: number;
  Status: string;
  Issue_Date: string;
  Due_Date: string;
  Total_Amount: number;
}

interface Contract {
  Contract_ID: number;
  Contract_Title: string;
  Status: string;
  Sent_Date: string;
  Signed_Date: string;
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  const [contact, setContact] = useState<Contact | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const [showContractBuilder, setShowContractBuilder] = useState(false);
  const [showInvoiceBuilder, setShowInvoiceBuilder] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({ Service_Type: "", Event_Date: "" });

  const fetchContactData = () => {
    fetch(`/api/contacts/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setContact(data.contact);
          setEditForm(data.contact);
          setInquiries(data.inquiries);
          setCommunications(data.communications);
          setInvoices(data.invoices || []);
          setContracts(data.contracts || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContactData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading contact details...</div>;
  }

  if (!contact) {
    return <div className="p-8 text-center text-red-500">Contact not found.</div>;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const tabs = ["Overview", "Documents", "Payments", "Sessions"];

  const handleSaveInfo = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setContact(editForm as Contact);
        setIsEditingInfo(false);
      } else {
        const err = await res.json();
        alert("Could not save: " + err.error + ". Have you added Company/Address columns to the database?");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNote = async () => {
    setIsSaving(true);
    try {
      const updatedNotes = contact?.Notes ? `${contact.Notes}\n\n${noteText}` : noteText;
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contact, Notes: updatedNotes })
      });
      if (res.ok) {
        setContact({ ...contact, Notes: updatedNotes } as Contact);
        setEditForm({ ...editForm, Notes: updatedNotes });
        setIsNoteModalOpen(false);
        setNoteText("");
      } else {
        const err = await res.json();
        alert("Could not save note: " + err.error + ". Have you added the Notes column to the database?");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSession = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: id,
          Service_Type: newSessionForm.Service_Type,
          Event_Date: newSessionForm.Event_Date
        })
      });
      if (res.ok) {
        setShowSessionModal(false);
        setNewSessionForm({ Service_Type: "", Event_Date: "" });
        fetchContactData();
      } else {
        const err = await res.json();
        alert("Could not create session: " + err.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="animate-fade-in" style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.push('/dashboard/contacts')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#0f172a', margin: 0, textTransform: 'lowercase' }}>
            {contact.Name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#e8f5f0', color: '#4da685', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CLIENT <ChevronDown size={14} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowCreateDropdown(!showCreateDropdown)} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Create New <ChevronDown size={14} />
            </button>
            {showCreateDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #f0efe9', width: '160px', zIndex: 50, overflow: 'hidden' }}>
                <button onClick={() => { setShowCreateDropdown(false); setShowSessionModal(true); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid #f0efe9', fontSize: '0.875rem', color: '#0f172a', cursor: 'pointer' }} className="hover:bg-gray-50">New Session</button>
                <button onClick={() => { setShowCreateDropdown(false); setShowInvoiceBuilder(true); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid #f0efe9', fontSize: '0.875rem', color: '#0f172a', cursor: 'pointer' }} className="hover:bg-gray-50">New Invoice</button>
                <button onClick={() => { setShowCreateDropdown(false); setShowContractBuilder(true); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', fontSize: '0.875rem', color: '#0f172a', cursor: 'pointer' }} className="hover:bg-gray-50">New Contract</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f0efe9', marginBottom: '2rem', gap: '2rem' }}>
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: '0.5rem 0', 
              cursor: 'pointer', 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: activeTab === tab.toLowerCase() ? '#0f172a' : '#a0a0a0',
              borderBottom: activeTab === tab.toLowerCase() ? '2px solid #4da685' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Projects */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0efe9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Projects</h2>
                <button onClick={() => setShowSessionModal(true)} style={{ background: 'none', border: 'none', color: '#4da685', cursor: 'pointer' }}><Plus size={18} /></button>
              </div>
              
              {inquiries.length > 0 ? (
                <div className="space-y-2">
                  {inquiries.map(inq => (
                    <div key={inq.Inquiry_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #f0efe9' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{contact.Name.split(' ')[0]}'s Project</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', backgroundColor: '#fff8f0', color: '#d97706', borderRadius: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#d97706', borderRadius: '50%', marginRight: '4px' }}></span>
                          {inq.Pipeline_Stage.toUpperCase()}
                        </span>
                        <button style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}><MoreHorizontal size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#a0a0a0', fontSize: '0.875rem' }}>No projects linked to this contact yet.</p>
              )}
            </div>

            {/* Recent Conversations */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0efe9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Recent Conversations</h2>
                <button style={{ background: 'none', border: 'none', color: '#4da685', cursor: 'pointer' }}><Plus size={18} /></button>
              </div>
              
              {communications.length > 0 ? (
                <div className="space-y-4">
                  {communications.slice(0, 3).map(comm => {
                    const d = new Date(comm.Last_Contact_Date + "Z");
                    return (
                      <div key={comm.Communication_ID} style={{ padding: '1rem', backgroundColor: '#fafafa', borderRadius: '0.5rem', border: '1px solid #f0efe9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{comm.Last_Contact_By === "Me" ? "You" : contact.Name}</span>
                          <span style={{ color: '#a0a0a0', fontSize: '0.75rem' }}>{d.toLocaleDateString()} at {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#5c5c5c', margin: 0 }}>{comm.Message || "No notes."}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ color: '#a0a0a0', fontSize: '0.875rem', marginTop: '1rem' }}>No conversations from this contact yet.</p>
              )}
            </div>

            {/* Client Gallery Collections */}
            <div>
              <div style={{ borderBottom: '1px solid #f0efe9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Client Gallery Collections</h2>
              </div>
              <p style={{ color: '#a0a0a0', fontSize: '0.875rem', marginTop: '1rem' }}>
                No collections linked to this contact yet. <a href="#" style={{ color: '#4da685' }}>Learn more</a>
              </p>
            </div>

          </div>

          {/* Right Column - Contact Info */}
          <div className="lg:col-span-1">
            <div style={{ borderBottom: '1px solid #f0efe9', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Contact Info</h2>
              {!isEditingInfo ? (
                <button onClick={() => setIsEditingInfo(true)} style={{ background: 'none', border: 'none', color: '#4da685', cursor: 'pointer' }}><Edit2 size={16} /></button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => { setIsEditingInfo(false); setEditForm(contact || {}); }} style={{ fontSize: '0.75rem', color: '#a0a0a0', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSaveInfo} disabled={isSaving} style={{ fontSize: '0.75rem', color: '#4da685', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>{isSaving ? 'Saving...' : 'Save'}</button>
                </div>
              )}
            </div>

            {/* Avatar & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#f9eee5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5443', fontWeight: 700, fontSize: '0.875rem' }}>
                {getInitials(contact.Name)}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{contact.Name}</div>
                <div style={{ color: '#a0a0a0', fontSize: '0.75rem' }}>{contact.Email || 'No email provided'}</div>
              </div>
            </div>

            {/* Details List */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1rem 1.5rem', fontSize: '0.875rem' }}>
              <div style={{ color: '#a0a0a0', display: 'flex', alignItems: 'center' }}>Email</div>
              {isEditingInfo ? (
                <input type="email" value={editForm.Email || ''} onChange={e => setEditForm({ ...editForm, Email: e.target.value })} style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid #f0efe9', borderRadius: '4px' }} />
              ) : (
                <div style={{ color: '#0f172a' }}>{contact.Email || '-'}</div>
              )}

              <div style={{ color: '#a0a0a0', display: 'flex', alignItems: 'center' }}>Phone</div>
              {isEditingInfo ? (
                <input type="tel" value={editForm.Phone || ''} onChange={e => setEditForm({ ...editForm, Phone: e.target.value })} style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid #f0efe9', borderRadius: '4px' }} />
              ) : (
                <div style={{ color: '#0f172a' }}>{contact.Phone || '-'}</div>
              )}

              <div style={{ color: '#a0a0a0', display: 'flex', alignItems: 'center' }}>Company</div>
              {isEditingInfo ? (
                <input type="text" value={editForm.Company || ''} onChange={e => setEditForm({ ...editForm, Company: e.target.value })} style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid #f0efe9', borderRadius: '4px' }} />
              ) : (
                <div style={{ color: '#0f172a' }}>{contact.Company || '-'}</div>
              )}

              <div style={{ color: '#a0a0a0', display: 'flex', alignItems: 'center' }}>Address</div>
              {isEditingInfo ? (
                <input type="text" value={editForm.Address || ''} onChange={e => setEditForm({ ...editForm, Address: e.target.value })} style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid #f0efe9', borderRadius: '4px' }} />
              ) : (
                <div style={{ color: '#0f172a' }}>{contact.Address || '-'}</div>
              )}

              <div style={{ color: '#a0a0a0' }}>Note</div>
              <div>
                {contact.Notes ? (
                  <div style={{ color: '#5c5c5c', marginBottom: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{contact.Notes}</div>
                ) : null}
                <button onClick={() => setIsNoteModalOpen(true)} style={{ background: 'none', border: 'none', color: '#4da685', cursor: 'pointer', padding: 0 }}>Add Note</button>
              </div>
            </div>

          </div>

        </div>
      )}
      
      {activeTab === 'documents' && (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #f0efe9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Documents & Contracts</h2>
            <button onClick={() => setShowContractBuilder(true)} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>New Contract</button>
          </div>
          {contracts.length > 0 ? (
            <div className="space-y-4">
              {contracts.map(c => (
                <div key={c.Contract_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '1px solid #f0efe9', borderRadius: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.5rem 0' }}>{c.Contract_Title || "Untitled Contract"}</h3>
                    <div style={{ fontSize: '0.875rem', color: '#a0a0a0' }}>
                      {c.Sent_Date ? `Sent: ${new Date(c.Sent_Date).toLocaleDateString()}` : 'Not Sent'} 
                      {c.Signed_Date && ` • Signed: ${new Date(c.Signed_Date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '1rem', textTransform: 'uppercase', backgroundColor: c.Status === 'Signed' ? '#e8f5f0' : '#fff8f0', color: c.Status === 'Signed' ? '#4da685' : '#d97706' }}>
                      {c.Status}
                    </span>
                    <button onClick={() => router.push('/dashboard/finance')} style={{ background: 'none', border: 'none', color: '#4da685', fontWeight: 600, cursor: 'pointer' }}>View</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#a0a0a0', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0' }}>No contracts have been generated for this contact.</p>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #f0efe9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Invoices & Payments</h2>
            <button onClick={() => setShowInvoiceBuilder(true)} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>New Invoice</button>
          </div>
          {invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map(inv => (
                <div key={inv.Invoice_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '1px solid #f0efe9', borderRadius: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Invoice #{inv.Invoice_ID}</h3>
                    <div style={{ fontSize: '0.875rem', color: '#a0a0a0' }}>
                      {inv.Issue_Date ? `Issued: ${new Date(inv.Issue_Date).toLocaleDateString()}` : 'Draft'} 
                      {inv.Due_Date && ` • Due: ${new Date(inv.Due_Date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                      ${(inv.Total_Amount || 0).toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '1rem', textTransform: 'uppercase', backgroundColor: inv.Status === 'Paid' ? '#e8f5f0' : (inv.Status === 'Draft' ? '#f1f5f9' : '#fff8f0'), color: inv.Status === 'Paid' ? '#4da685' : (inv.Status === 'Draft' ? '#64748b' : '#d97706') }}>
                      {inv.Status}
                    </span>
                    <button onClick={() => router.push('/dashboard/finance')} style={{ background: 'none', border: 'none', color: '#4da685', fontWeight: 600, cursor: 'pointer' }}>View</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <p style={{ color: '#a0a0a0', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0' }}>No invoices exist for this contact.</p>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #f0efe9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Booked Sessions</h2>
            <button onClick={() => setShowSessionModal(true)} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>New Session</button>
          </div>
          {inquiries.length > 0 ? (
            <div className="space-y-4">
              {inquiries.map(inq => (
                <div key={inq.Inquiry_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '1px solid #f0efe9', borderRadius: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.5rem 0' }}>{inq.Service_Type || "Custom Project"}</h3>
                    <div style={{ fontSize: '0.875rem', color: '#a0a0a0' }}>
                      Inquiry ID: #{inq.Inquiry_ID}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '1rem', textTransform: 'uppercase', backgroundColor: '#e8f0fe', color: '#1a73e8' }}>
                      {inq.Pipeline_Stage}
                    </span>
                    <button onClick={() => router.push('/dashboard/pipeline')} style={{ background: 'none', border: 'none', color: '#4da685', fontWeight: 600, cursor: 'pointer' }}>Manage</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#a0a0a0', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0' }}>No sessions booked yet.</p>
          )}
        </div>
      )}
      </div>

      {/* Add Note Modal */}
      {isNoteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>Add a Note</h2>
            <textarea 
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Type your note here..."
              style={{ width: '100%', minHeight: '120px', padding: '0.75rem', border: '1px solid #f0efe9', borderRadius: '0.25rem', marginBottom: '1.5rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => { setIsNoteModalOpen(false); setNoteText(""); }} style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={handleSaveNote} disabled={isSaving || !noteText.trim()} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontWeight: 600, cursor: 'pointer', opacity: (isSaving || !noteText.trim()) ? 0.5 : 1 }}>
                {isSaving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Session Modal */}
      {showSessionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>New Session / Project</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Service Type</label>
              <input 
                type="text" 
                value={newSessionForm.Service_Type}
                onChange={e => setNewSessionForm({ ...newSessionForm, Service_Type: e.target.value })}
                placeholder="e.g. Wedding Photography"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Event Date (Optional)</label>
              <input 
                type="date" 
                value={newSessionForm.Event_Date}
                onChange={e => setNewSessionForm({ ...newSessionForm, Event_Date: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setShowSessionModal(false)} style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={handleCreateSession} disabled={isSaving || !newSessionForm.Service_Type.trim()} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontWeight: 600, cursor: 'pointer', opacity: (isSaving || !newSessionForm.Service_Type.trim()) ? 0.5 : 1 }}>
                {isSaving ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Builder Portal */}
      {showContractBuilder && (
        <ContractBuilder 
          initialClient={{ Contact_ID: contact.Contact_ID, Name: contact.Name, Email: contact.Email }}
          onClose={() => setShowContractBuilder(false)}
          onSave={() => { setShowContractBuilder(false); fetchContactData(); }}
          onDraftSaved={() => fetchContactData()}
        />
      )}

      {/* Invoice Builder Portal */}
      {showInvoiceBuilder && (
        <InvoiceBuilder 
          initialClient={{ Contact_ID: contact.Contact_ID, Name: contact.Name, Email: contact.Email }}
          onClose={() => setShowInvoiceBuilder(false)}
          onDraftSaved={() => fetchContactData()}
        />
      )}
      
    </>
  );
}
