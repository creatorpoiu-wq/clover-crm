"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, ChevronDown, Edit2, Plus, MoreHorizontal, Trash2, Save, X, Briefcase, MapPin, Package, Calendar, DollarSign, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContractBuilder from "@/components/ContractBuilder";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import DeliverablesManager from "@/components/DeliverablesManager";
import { supabase } from "@/lib/supabase";
import { DatePicker } from "@/components/ui/DatePicker";

interface Contact {
  Contact_ID: number;
  Name: string;
  Email: string;
  Phone: string;
  Lead_Source: string;
  Company?: string;
  Address?: string;
  Notes?: string;
  Status?: string;
}

interface Inquiry {
  Inquiry_ID: number;
  Service_Type: string;
  Pipeline_Stage: string;
  Event_Date?: string | null;
  Estimated_Value?: number | null;
  Package_ID?: number | null;
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
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [showLogCommModal, setShowLogCommModal] = useState(false);
  const [commInquiryId, setCommInquiryId] = useState("");
  const [commDate, setCommDate] = useState(new Date().toISOString().slice(0, 16));
  const [commBy, setCommBy] = useState("Me");
  const [commMessage, setCommMessage] = useState("");
  const [commLoading, setCommLoading] = useState(false);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const [showContractBuilder, setShowContractBuilder] = useState(false);
  const [showInvoiceBuilder, setShowInvoiceBuilder] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showNewInquiryModal, setShowNewInquiryModal] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({ Service_Type: "", Event_Date: "" });
  const [newInquiryForm, setNewInquiryForm] = useState({ serviceType: "Wedding Photography", eventDate: "", estimatedValue: "", pipelineStage: "New Inquiry" });
  const [isCreatingInquiry, setIsCreatingInquiry] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', type: 'Contract' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [isEditingInquiry, setIsEditingInquiry] = useState(false);
  const [editInquiryForm, setEditInquiryForm] = useState<any>({});
  const [packages, setPackages] = useState<any[]>([]);
  const STAGES = ["New Inquiry", "Consultation", "Proposal Sent", "Booked", "Lost/Archived"];

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

  const fetchUploadedDocs = () => {
    fetch(`/api/contacts/${id}/documents`)
      .then(res => res.json())
      .then(data => { if (data.success) setUploadedDocs(data.documents); })
      .catch(console.error);
  };

  useEffect(() => {
    fetchContactData();
    fetchUploadedDocs();
    fetch('/api/packages?type=packages')
      .then(res => res.json())
      .then(data => { if (data.success) setPackages(data.packages || []); });
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading contact details...</div>;
  }

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadForm.title) return alert("Please select a file and provide a title.");
    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        
        const res = await fetch(`/api/contacts/${id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: uploadForm.title,
            type: uploadForm.type,
            fileType: uploadFile.type,
            fileData: fileData
          })
        });
        
        const data = await res.json();
        if (data.success) {
          setUploadedDocs([data.document, ...uploadedDocs]);
          setShowUploadModal(false);
          setUploadForm({ title: '', type: 'Contract' });
          setUploadFile(null);
        } else {
          alert("Error: " + data.error);
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(uploadFile);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const handleDeleteUploadedDoc = async (docId: number) => {
    if (!confirm("Delete this uploaded document?")) return;
    try {
      const res = await fetch(`/api/contacts/${id}/documents?docId=${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setUploadedDocs(uploadedDocs.filter(d => d.Document_ID !== docId));
      }
    } catch (e) { console.error(e); }
  };

  if (!contact) {
    return <div className="p-8 text-center text-red-500">Contact not found.</div>;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const tabs = ["Overview", "Communications", "Documents", "Payments", "Sessions", "Deliverables"];

  const handleDeleteCommunication = async (commId: number) => {
    if (!confirm("Are you sure you want to delete this communication?")) return;
    try {
      const res = await fetch(`/api/communications/${commId}`, { method: 'DELETE' });
      if (res.ok) {
        setCommunications(prev => prev.filter(c => c.Communication_ID !== commId));
      } else {
        alert("Failed to delete communication.");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting communication.");
    }
  };

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
    } catch (error) {
      console.error(error);
      alert("Failed to update contact info");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingInquiry(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: id,
          serviceType: newInquiryForm.serviceType,
          eventDate: newInquiryForm.eventDate,
          estimatedValue: newInquiryForm.estimatedValue,
          pipelineStage: newInquiryForm.pipelineStage
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowNewInquiryModal(false);
        setNewInquiryForm({ serviceType: "Wedding Photography", eventDate: "", estimatedValue: "", pipelineStage: "New Inquiry" });
        fetchContactData(); // refresh everything
      } else {
        alert("Failed to create inquiry: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create inquiry");
    } finally {
      setIsCreatingInquiry(false);
    }
  };

  const handleUpdateInquiry = async () => {
    if (!selectedInquiry) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedInquiry.Inquiry_ID,
          Contact_ID: id,
          Package_ID: editInquiryForm.Package_ID,
          Service_Type: editInquiryForm.Service_Type,
          Pipeline_Stage: editInquiryForm.Pipeline_Stage,
          Estimated_Value: editInquiryForm.Estimated_Value,
          Event_Date: editInquiryForm.Event_Date,
        }),
      });
      if (res.ok) {
        setSelectedInquiry(null);
        setIsEditingInquiry(false);
        fetchContactData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteInquiry = async () => {
    if (!selectedInquiry || !confirm("Delete this inquiry?")) return;
    try {
      const res = await fetch(`/api/inquiries?id=${selectedInquiry.Inquiry_ID}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedInquiry(null);
        setIsEditingInquiry(false);
        fetchContactData();
      }
    } catch (e) {
      console.error(e);
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

  
  const handleLogComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commInquiryId) {
       alert("Please select an inquiry");
       return;
    }
    setCommLoading(true);
    try {
      const res = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: parseInt(commInquiryId),
          contactDate: commDate.replace("T", " ") + ":00",
          contactBy: commBy,
          message: commMessage
        })
      });
      if (res.ok) {
        setShowLogCommModal(false);
        setCommMessage("");
        fetchContactData();
      } else {
        alert("Failed to log communication.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommLoading(false);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: contact.Status === 'Client' ? 'var(--status-green)' : 'var(--status-gray)', color: contact.Status === 'Client' ? 'var(--status-green-fg)' : 'var(--status-gray-fg)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {contact.Status || 'LEAD'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowCreateDropdown(!showCreateDropdown)} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Create New <ChevronDown size={14} />
            </button>
            {showCreateDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #f0efe9', width: '160px', zIndex: 50, overflow: 'hidden' }}>
                <button onClick={() => { setShowCreateDropdown(false); setShowNewInquiryModal(true); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid #f0efe9', fontSize: '0.875rem', color: '#0f172a', cursor: 'pointer' }} className="hover:bg-gray-50">New Project</button>
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
                <button onClick={() => setShowNewInquiryModal(true)} style={{ background: 'none', border: 'none', color: '#4da685', cursor: 'pointer' }}><Plus size={18} /></button>
              </div>
              
              {inquiries.length > 0 ? (
                <div className="space-y-2">
                  {inquiries.map(inq => (
                    <div 
                      key={inq.Inquiry_ID} 
                      onClick={() => { setSelectedInquiry(inq); setEditInquiryForm(inq); setIsEditingInquiry(false); }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #f0efe9', cursor: 'pointer', transition: "background-color 0.2s ease", borderRadius: "0.5rem" }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--muted-bg)"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{contact.Name.split(' ')[0]}'s Project - {inq.Service_Type}</span>
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
                    const formatSafeDate = (dStr: string) => {
                      if (!dStr) return 'Unknown Date';
                      const hasTz = dStr.endsWith('Z') || dStr.match(/[+-]\d{2}:?\d{2}$/);
                      const d = new Date(hasTz ? dStr : dStr + "Z");
                      if (isNaN(d.getTime())) return 'Invalid Date';
                      return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    };
                    const displayDate = formatSafeDate(comm.Last_Contact_Date);

                    return (
                      <div key={comm.Communication_ID} style={{ padding: '1rem', backgroundColor: '#fafafa', borderRadius: '0.5rem', border: '1px solid #f0efe9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{comm.Last_Contact_By === "Me" ? "You" : contact.Name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ color: '#a0a0a0', fontSize: '0.75rem' }}>{displayDate}</span>
                            <button onClick={() => handleDeleteCommunication(comm.Communication_ID)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p 
                          style={{ fontSize: '0.875rem', color: '#5c5c5c', margin: 0, wordBreak: 'break-word' }}
                          dangerouslySetInnerHTML={{ __html: comm.Message || "No notes." }}
                        />
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

              <div style={{ color: '#a0a0a0', display: 'flex', alignItems: 'center' }}>Status</div>
              {isEditingInfo ? (
                <select value={editForm.Status || 'Lead'} onChange={e => setEditForm({ ...editForm, Status: e.target.value })} style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid #f0efe9', borderRadius: '4px' }}>
                  <option value="Lead">Lead</option>
                  <option value="Client">Client</option>
                </select>
              ) : (
                <div style={{ color: '#0f172a' }}>{contact.Status || 'Lead'}</div>
              )}

              <div style={{ color: '#a0a0a0', display: 'flex', alignItems: 'center' }}>Phone</div>
              {isEditingInfo ? (
                <input type="tel" value={editForm.Phone || ''} onChange={e => setEditForm({ ...editForm, Phone: e.target.value })} style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid #f0efe9', borderRadius: '4px' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#0f172a' }}>{contact.Phone || '-'}</span>
                  {contact.Phone && (
                    <a 
                      href={`https://wa.me/${contact.Phone.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#25D366', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#e8f5e9', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}
                      title="Send WhatsApp Message"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  )}
                </div>
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
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => { setUploadForm({ title: '', type: 'Contract' }); setShowUploadModal(true); }} style={{ backgroundColor: '#fff', color: '#4da685', border: '1px solid #4da685', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Upload</button>
              <button onClick={() => setShowContractBuilder(true)} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>New Contract</button>
            </div>
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

          {uploadedDocs.filter(d => d.Type === 'Contract').length > 0 && (
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid #f0efe9' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>Uploaded Contracts</h3>
              <div className="space-y-4">
                {uploadedDocs.filter(d => d.Type === 'Contract').map(doc => (
                  <div key={doc.Document_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', border: '1px solid #f0efe9', borderRadius: '0.5rem', backgroundColor: '#fafafa' }}>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.25rem 0', color: '#0f172a' }}>{doc.Title}</h4>
                      <div style={{ fontSize: '0.75rem', color: '#a0a0a0' }}>Uploaded: {new Date(doc.Upload_Date).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button onClick={() => {
                        const win = window.open();
                        if (win) {
                          if (doc.File_Data.startsWith('data:application/pdf')) {
                            win.document.write(`<iframe src="${doc.File_Data}" width="100%" height="100%" style="border:none;"></iframe>`);
                          } else {
                            win.document.write(`<img src="${doc.File_Data}" style="max-width:100%;" />`);
                          }
                        }
                      }} style={{ background: 'none', border: 'none', color: '#4da685', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>View</button>
                      <button onClick={() => handleDeleteUploadedDoc(doc.Document_ID)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #f0efe9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Invoices & Payments</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => { setUploadForm({ title: '', type: 'Invoice' }); setShowUploadModal(true); }} style={{ backgroundColor: '#fff', color: '#4da685', border: '1px solid #4da685', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Upload</button>
              <button onClick={() => setShowInvoiceBuilder(true)} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>New Invoice</button>
            </div>
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

          {uploadedDocs.filter(d => d.Type === 'Invoice').length > 0 && (
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid #f0efe9' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>Uploaded Invoices</h3>
              <div className="space-y-4">
                {uploadedDocs.filter(d => d.Type === 'Invoice').map(doc => (
                  <div key={doc.Document_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', border: '1px solid #f0efe9', borderRadius: '0.5rem', backgroundColor: '#fafafa' }}>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.25rem 0', color: '#0f172a' }}>{doc.Title}</h4>
                      <div style={{ fontSize: '0.75rem', color: '#a0a0a0' }}>Uploaded: {new Date(doc.Upload_Date).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button onClick={() => {
                        const win = window.open();
                        if (win) {
                          if (doc.File_Data.startsWith('data:application/pdf')) {
                            win.document.write(`<iframe src="${doc.File_Data}" width="100%" height="100%" style="border:none;"></iframe>`);
                          } else {
                            win.document.write(`<img src="${doc.File_Data}" style="max-width:100%;" />`);
                          }
                        }
                      }} style={{ background: 'none', border: 'none', color: '#4da685', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>View</button>
                      <button onClick={() => handleDeleteUploadedDoc(doc.Document_ID)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                <div key={inq.Inquiry_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '1px solid #f0efe9', borderRadius: '0.5rem', transition: 'box-shadow 0.2s' }} onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'} onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.25rem 0' }}>{inq.Service_Type || "Custom Project"}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#a0a0a0', display: 'flex', gap: '1rem' }}>
                      {inq.Event_Date && <span>📅 {new Date(inq.Event_Date).toLocaleDateString()}</span>}
                      {inq.Estimated_Value && <span>💰 ${Number(inq.Estimated_Value).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '1rem', textTransform: 'uppercase', backgroundColor: '#e8f0fe', color: '#1a73e8' }}>
                      {inq.Pipeline_Stage}
                    </span>
                    <button onClick={() => { setSelectedInquiry(inq); setEditInquiryForm(inq); setIsEditingInquiry(false); }} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Manage</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#a0a0a0', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0' }}>No sessions booked yet.</p>
          )}
        </div>
      )}

      {activeTab === 'communications' && (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #f0efe9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Communication History</h2>
            <button onClick={() => setShowLogCommModal(true)} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Log Communication</button>
          </div>
          {communications.length > 0 ? (
            <div className="space-y-4">
              {communications.map(comm => {
                const formatSafeDate = (dStr: string) => {
                  if (!dStr) return 'Unknown Date';
                  const hasTz = dStr.endsWith('Z') || dStr.match(/[+-]\d{2}:?\d{2}$/);
                  const d = new Date(hasTz ? dStr : dStr + "Z");
                  if (isNaN(d.getTime())) return 'Invalid Date';
                  return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                };
                const displayDate = formatSafeDate(comm.Last_Contact_Date);

                return (
                  <div key={comm.Communication_ID} style={{ padding: '1.5rem', border: '1px solid #f0efe9', borderRadius: '0.5rem', backgroundColor: comm.Last_Contact_By === "Me" ? '#f8fdfb' : '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{comm.Last_Contact_By === "Me" ? "You" : contact.Name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ color: '#a0a0a0', fontSize: '0.75rem' }}>{displayDate}</span>
                        <button onClick={() => handleDeleteCommunication(comm.Communication_ID)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p 
                      style={{ fontSize: '0.875rem', color: '#5c5c5c', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      dangerouslySetInnerHTML={{ __html: comm.Message || "No notes." }}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ color: '#a0a0a0', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0' }}>No communication history yet.</p>
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

      {activeTab === 'deliverables' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {inquiries.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: '1rem', border: '1px dashed #e2e8f0', color: '#64748b' }}>
              No projects found. Create a project/inquiry first to manage deliverables.
            </div>
          ) : (
            inquiries.map(inq => (
              <div key={inq.Inquiry_ID} className="glass-panel" style={{ padding: '2rem', border: '1px solid #f0efe9', borderRadius: '1rem', backgroundColor: '#fff' }}>
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f8fafc' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{inq.Service_Type || "Project"}</h3>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
                    <span>Stage: {inq.Pipeline_Stage}</span>
                    <span>•</span>
                    <span>Date: {inq.Event_Date ? new Date(inq.Event_Date).toLocaleDateString() : 'TBD'}</span>
                  </div>
                </div>
                <DeliverablesManager inquiryId={inq.Inquiry_ID} />
              </div>
            ))
          )}
        </div>
      )}

      {/* New Session Modal */}
      {showSessionModal && (
        <div className="mobile-overlay open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', backgroundColor: 'white' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#0f172a' }}>New Session</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Service Type</label>
              <input type="text" value={newSessionForm.Service_Type} onChange={e => setNewSessionForm({...newSessionForm, Service_Type: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #f0efe9', borderRadius: '0.25rem' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Event Date</label>
              <DatePicker value={newSessionForm.Event_Date} onChange={val => setNewSessionForm({...newSessionForm, Event_Date: val})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #f0efe9', borderRadius: '0.25rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowSessionModal(false)} style={{ flex: 1, padding: '0.5rem', background: 'none', border: '1px solid #f0efe9', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleCreateSession} disabled={isSaving} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#4da685', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 600 }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Preview / Edit Modal */}
      {selectedInquiry && (
        <div 
          className="mobile-overlay open" 
          style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 100, backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}
          onClick={() => setSelectedInquiry(null)}
        >
          <div 
            className="glass-panel" 
            style={{ width: "100%", maxWidth: "550px", maxHeight: "90vh", overflowY: "auto", padding: "2.5rem", backgroundColor: "white", position: "relative", borderRadius: "1.5rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setSelectedInquiry(null)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
              <X size={20} />
            </button>
            
            <h2 className="section-header" style={{ border: "none", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {isEditingInquiry ? "Edit Inquiry" : "Inquiry Details"}
            </h2>

            {isEditingInquiry ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="label">Service Type</label>
                  <input type="text" className="input" value={editInquiryForm.Service_Type || ""} onChange={(e) => setEditInquiryForm({ ...editInquiryForm, Service_Type: e.target.value })} />
                </div>
                <div>
                  <label className="label">Pipeline Stage</label>
                  <select className="input" value={editInquiryForm.Pipeline_Stage || ""} onChange={(e) => setEditInquiryForm({ ...editInquiryForm, Pipeline_Stage: e.target.value })}>
                    {STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Assigned Package</label>
                  <select className="input" value={editInquiryForm.Package_ID || ""} onChange={(e) => setEditInquiryForm({ ...editInquiryForm, Package_ID: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">No Package Assigned</option>
                    {packages.map(pkg => <option key={pkg.Package_ID} value={pkg.Package_ID}>{pkg.Name} (${pkg.Price})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Event Date</label>
                  <DatePicker className="input" value={editInquiryForm.Event_Date || ""} onChange={(val) => setEditInquiryForm({ ...editInquiryForm, Event_Date: val })} />
                </div>
                <div>
                  <label className="label">Estimated Value ($)</label>
                  <input type="number" className="input" value={editInquiryForm.Estimated_Value || ""} onChange={(e) => setEditInquiryForm({ ...editInquiryForm, Estimated_Value: Number(e.target.value) })} />
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpdateInquiry} disabled={isSaving}>
                    <Save size={16} /> {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsEditingInquiry(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", paddingBottom: "1.5rem", borderBottom: "1px solid #f0efe9" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, #2dd4bf 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 800, boxShadow: "0 4px 10px rgba(15, 118, 110, 0.3)" }}>
                    {contact.Name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "#0f172a", letterSpacing: "-0.02em" }}>{contact.Name}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 500 }}>Project Details & Status</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "1rem", border: "1px solid #f1f5f9", transition: "transform 0.2s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={(e) => e.currentTarget.style.transform = "none"}>
                    <div style={{ padding: "0.75rem", backgroundColor: "#e0f2fe", color: "#0284c7", borderRadius: "0.75rem" }}>
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Service Type</div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>{selectedInquiry.Service_Type}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "1rem", border: "1px solid #f1f5f9", transition: "transform 0.2s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={(e) => e.currentTarget.style.transform = "none"}>
                    <div style={{ padding: "0.75rem", backgroundColor: "#fef3c7", color: "#d97706", borderRadius: "0.75rem" }}>
                      <MapPin size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Stage</div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>{selectedInquiry.Pipeline_Stage}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "1rem", border: "1px solid #f1f5f9", transition: "transform 0.2s", cursor: "default", gridColumn: "1 / -1" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={(e) => e.currentTarget.style.transform = "none"}>
                    <div style={{ padding: "0.75rem", backgroundColor: "#f3e8ff", color: "#9333ea", borderRadius: "0.75rem" }}>
                      <Package size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Assigned Package</div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>
                        {packages.find(p => p.Package_ID === selectedInquiry.Package_ID)?.Name || "No Package Assigned"}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "1rem", border: "1px solid #f1f5f9", transition: "transform 0.2s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={(e) => e.currentTarget.style.transform = "none"}>
                    <div style={{ padding: "0.75rem", backgroundColor: "#ecfdf5", color: "#059669", borderRadius: "0.75rem" }}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Event Date</div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>{selectedInquiry.Event_Date ? new Date(selectedInquiry.Event_Date).toLocaleDateString() : "TBD"}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "1rem", border: "1px solid #f1f5f9", transition: "transform 0.2s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={(e) => e.currentTarget.style.transform = "none"}>
                    <div style={{ padding: "0.75rem", backgroundColor: "#fce7f3", color: "#db2777", borderRadius: "0.75rem" }}>
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Estimated Value</div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>${Number(selectedInquiry.Estimated_Value || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", borderTop: "1px solid #f0efe9", paddingTop: "1.5rem" }}>
                  <button className="btn btn-primary" style={{ flex: 1, padding: "0.875rem", borderRadius: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 4px 6px -1px rgba(15, 118, 110, 0.2)" }} onClick={() => setIsEditingInquiry(true)}><Edit2 size={18} /> Edit Details</button>
                  <button className="btn btn-outline" style={{ flex: 1, padding: "0.875rem", borderRadius: "0.75rem", fontWeight: 700, color: "#ef4444", borderColor: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }} onClick={handleDeleteInquiry}><Trash2 size={18} /> Delete Project</button>
                </div>

                {/* Deliverables Manager */}
                <DeliverablesManager inquiryId={selectedInquiry.Inquiry_ID} />

              </div>
            )}
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
      
      {/* New Inquiry Modal */}
      {showNewInquiryModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "0.5rem", width: "100%", maxWidth: "500px" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>New Project / Inquiry</h2>
              <button onClick={() => setShowNewInquiryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={20} color="#64748b" style={{display: 'none'}}/><Edit2 size={20} color="#64748b" style={{display: 'none'}}/><span style={{fontSize:'1.5rem', color:'#64748b'}}>&times;</span></button>
            </div>
            
            <form onSubmit={handleCreateInquiry} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Service Type</label>
                <select className="input-field" value={newInquiryForm.serviceType} onChange={e => setNewInquiryForm({...newInquiryForm, serviceType: e.target.value})} required>
                  <option value="Wedding Photography">Wedding Photography</option>
                  <option value="Portrait Session">Portrait Session</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Pipeline Stage</label>
                <select className="input-field" value={newInquiryForm.pipelineStage} onChange={e => setNewInquiryForm({...newInquiryForm, pipelineStage: e.target.value})} required>
                  <option value="New Inquiry">New Inquiry</option>
                  <option value="Discovery/Consultation">Discovery/Consultation</option>
                  <option value="Proposal Drafted">Proposal Drafted</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Negotiation/Revision">Negotiation/Revision</option>
                  <option value="Booked">Booked</option>
                </select>
              </div>
              <div>
                <label className="label">Event Date (Optional)</label>
                <DatePicker className="input-field" value={newInquiryForm.eventDate} onChange={val => setNewInquiryForm({...newInquiryForm, eventDate: val})} />
              </div>
              <div>
                <label className="label">Estimated Value ($) (Optional)</label>
                <input type="number" step="0.01" className="input-field" placeholder="e.g. 1500" value={newInquiryForm.estimatedValue} onChange={e => setNewInquiryForm({...newInquiryForm, estimatedValue: e.target.value})} />
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowNewInquiryModal(false)} className="btn btn-outline" disabled={isCreatingInquiry}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingInquiry}>
                  {isCreatingInquiry ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: 400 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#0f172a' }}>Upload Document</h2>
            <div className="space-y-4">
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>Title</label>
                <input type="text" value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} placeholder="e.g. Old Contract 2023" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>Type</label>
                <select value={uploadForm.type} onChange={e => setUploadForm({...uploadForm, type: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem', background: '#fff' }}>
                  <option value="Contract">Contract</option>
                  <option value="Invoice">Invoice</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>File (PDF/Image)</label>
                <input type="file" accept="application/pdf,image/*" onChange={e => setUploadFile(e.target.files?.[0] || null)} style={{ width: '100%', fontSize: '0.875rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleUploadDocument} disabled={isUploading || !uploadFile} style={{ backgroundColor: '#4da685', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontWeight: 600, cursor: (isUploading || !uploadFile) ? 'not-allowed' : 'pointer' }}>
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
