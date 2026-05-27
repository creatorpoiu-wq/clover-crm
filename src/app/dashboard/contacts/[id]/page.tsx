"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, ChevronDown, Edit2, Plus, MoreHorizontal, Trash2, Save, X, Briefcase, MapPin, Package, Calendar, DollarSign, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContractBuilder from "@/components/ContractBuilder";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import { supabase } from "@/lib/supabase";

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
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
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

  const tabs = ["Overview", "Communications", "Documents", "Payments", "Sessions"];

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
      <div className="animate-fade-in max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      
        {/* Hero Header Area */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-700 p-8 md:p-10 text-white shadow-xl">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <button onClick={() => router.push('/dashboard/contacts')} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors backdrop-blur-md">
                <ArrowLeft size={24} className="text-white" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase text-teal-50 shadow-sm border border-white/20">Client</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight capitalize drop-shadow-sm">
                  {contact.Name}
                </h1>
              </div>
            </div>

            <div className="relative w-full md:w-auto">
              <button 
                onClick={() => setShowCreateDropdown(!showCreateDropdown)} 
                className="w-full md:w-auto bg-white text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
              >
                Create New <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
              </button>
              {showCreateDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 w-48 z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
                  <button onClick={() => { setShowCreateDropdown(false); setShowNewInquiryModal(true); }} className="block w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-50 text-sm font-semibold text-slate-700 transition-colors">New Project</button>
                  <button onClick={() => { setShowCreateDropdown(false); setShowSessionModal(true); }} className="block w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-50 text-sm font-semibold text-slate-700 transition-colors">New Session</button>
                  <button onClick={() => { setShowCreateDropdown(false); setShowInvoiceBuilder(true); }} className="block w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-50 text-sm font-semibold text-slate-700 transition-colors">New Invoice</button>
                  <button onClick={() => { setShowCreateDropdown(false); setShowContractBuilder(true); }} className="block w-full text-left px-5 py-3 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors">New Contract</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Navigation Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200">
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex-1 md:flex-none text-center ${activeTab === tab.toLowerCase() ? 'bg-white text-teal-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        
        {/* Left Column (Tab Contents) */}
        <div className="lg:col-span-2 space-y-8">
          
          {activeTab === 'overview' && (
            <div className="space-y-8">
            
            {/* Projects Card */}
            <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Projects</h2>
                <button onClick={() => setShowNewInquiryModal(true)} className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-100 transition-colors shadow-sm">
                  <Plus size={20} />
                </button>
              </div>
              
              {inquiries.length > 0 ? (
                <div className="space-y-4">
                  {inquiries.map(inq => (
                    <div 
                      key={inq.Inquiry_ID} 
                      onClick={() => { setSelectedInquiry(inq); setEditInquiryForm(inq); setIsEditingInquiry(false); }}
                      className="group flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-white border border-slate-200 hover:border-teal-300 rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-100"
                    >
                      <div className="flex items-center gap-4 mb-3 md:mb-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 shadow-sm group-hover:from-teal-100 group-hover:to-teal-50 group-hover:text-teal-600 transition-all">
                          <Briefcase size={20} />
                        </div>
                        <span className="font-extrabold text-slate-800 text-lg">{contact.Name.split(' ')[0]}'s Project <span className="text-slate-300 mx-2">|</span> <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg text-base">{inq.Service_Type}</span></span>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <span className="px-4 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center shadow-sm border border-amber-200/50">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 shadow-sm shadow-amber-500/50"></span>
                          {inq.Pipeline_Stage}
                        </span>
                        <button className="text-slate-300 group-hover:text-teal-500 bg-slate-50 group-hover:bg-teal-50 p-2 rounded-xl transition-all"><MoreHorizontal size={20} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Briefcase size={28} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold">No projects linked to this contact yet.</p>
                </div>
              )}
            </div>

            {/* Recent Conversations Card */}
            <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Recent Conversations</h2>
                <button className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-100 transition-colors shadow-sm"><Plus size={20} /></button>
              </div>
              
              {communications.length > 0 ? (
                <div className="space-y-5">
                  {communications.slice(0, 3).map(comm => {
                    const d = new Date(comm.Last_Contact_Date + "Z");
                    return (
                      <div key={comm.Communication_ID} className="p-5 bg-white border border-slate-200 rounded-2xl relative group hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-extrabold text-slate-800 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-md transform rotate-3 ${comm.Last_Contact_By === "Me" ? "bg-gradient-to-br from-teal-400 to-teal-600" : "bg-gradient-to-br from-slate-400 to-slate-600"}`}>
                              {comm.Last_Contact_By === "Me" ? "Y" : getInitials(contact.Name)}
                            </div>
                            {comm.Last_Contact_By === "Me" ? "You" : contact.Name}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{d.toLocaleDateString()} • {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <button onClick={() => handleDeleteCommunication(comm.Communication_ID)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-white transition-all bg-red-50 hover:bg-red-500 p-2 rounded-xl" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="ml-12 pl-4 border-l-2 border-slate-100">
                          <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                            {comm.Message || "No notes."}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <MessageCircle size={28} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold">No conversations recorded yet.</p>
                </div>
              )}
            </div>

            {/* Client Gallery Collections */}
            <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Client Gallery Collections</h2>
              </div>
              <div className="text-center p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <MapPin size={28} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold">No collections linked to this contact yet. <a href="#" className="text-teal-600 hover:text-teal-700 underline decoration-2 underline-offset-4">Learn more</a></p>
              </div>
            </div>
          </div>
        )}

           {activeTab === 'documents' && (
        <div className="bg-white/80 backdrop-blur-md p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Documents & Contracts</h2>
            <div className="flex gap-3">
              <button onClick={() => { setUploadForm({ title: '', type: 'Contract' }); setShowUploadModal(true); }} className="px-5 py-2.5 bg-white text-teal-600 border-2 border-teal-100 hover:border-teal-300 hover:bg-teal-50 rounded-xl text-sm font-bold transition-all shadow-sm">Upload File</button>
              <button onClick={() => setShowContractBuilder(true)} className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-500/30">New Contract</button>
            </div>
          </div>
          
          {contracts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {contracts.map(c => (
                <div key={c.Contract_ID} className="group p-6 bg-white border border-slate-200 hover:border-teal-300 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 truncate">{c.Contract_Title || "Untitled Contract"}</h3>
                    <div className="text-xs font-semibold text-slate-400 bg-slate-50 inline-block px-3 py-1.5 rounded-lg border border-slate-100">
                      {c.Sent_Date ? `Sent: ${new Date(c.Sent_Date).toLocaleDateString()}` : 'Not Sent'} 
                      {c.Signed_Date && ` • Signed: ${new Date(c.Signed_Date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm border ${c.Status === 'Signed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' : 'bg-amber-50 text-amber-600 border-amber-200/50'}`}>
                      {c.Status}
                    </span>
                    <button onClick={() => router.push('/dashboard/finance')} className="text-sm font-bold text-slate-400 group-hover:text-teal-600 transition-colors">View Details &rarr;</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                  <span className="text-4xl">📄</span>
                </div>
                <p className="text-slate-500 font-bold text-lg mb-2">No contracts generated</p>
                <p className="text-slate-400 text-sm">Create a new contract or upload an existing one.</p>
             </div>
          )}

          {uploadedDocs.filter(d => d.Type === 'Contract').length > 0 && (
            <div className="mt-12 pt-8 border-t-2 border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-6">Uploaded Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedDocs.filter(d => d.Type === 'Contract').map(doc => (
                  <div key={doc.Document_ID} className="p-4 bg-slate-50 border border-slate-200 hover:border-teal-200 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-md">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl border border-slate-100 shrink-0">📎</div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-800 mb-1 truncate" title={doc.Title}>{doc.Title}</h4>
                        <div className="text-xs font-semibold text-slate-400">Uploaded {new Date(doc.Upload_Date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full mt-auto">
                      <button onClick={() => {
                        const win = window.open();
                        if (win) {
                          if (doc.File_Data.startsWith('data:application/pdf')) {
                            win.document.write(`<iframe src="${doc.File_Data}" width="100%" height="100%" style="border:none;"></iframe>`);
                          } else {
                            win.document.write(`<img src="${doc.File_Data}" style="max-width:100%;" />`);
                          }
                        }
                      }} className="flex-1 py-2 bg-white text-teal-600 hover:bg-teal-50 border border-slate-200 rounded-xl transition-colors shadow-sm text-sm font-bold">View</button>
                      <button onClick={() => handleDeleteUploadedDoc(doc.Document_ID)} className="p-2 bg-white text-red-500 hover:bg-red-50 border border-slate-200 rounded-xl transition-colors shadow-sm"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white/80 backdrop-blur-md p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Invoices & Payments</h2>
            <div className="flex gap-3">
              <button onClick={() => { setUploadForm({ title: '', type: 'Invoice' }); setShowUploadModal(true); }} className="px-5 py-2.5 bg-white text-teal-600 border-2 border-teal-100 hover:border-teal-300 hover:bg-teal-50 rounded-xl text-sm font-bold transition-all shadow-sm">Upload Invoice</button>
              <button onClick={() => setShowInvoiceBuilder(true)} className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-500/30">New Invoice</button>
            </div>
          </div>

          {invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map(inv => (
                <div key={inv.Invoice_ID} className="group flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white border border-slate-200 hover:border-teal-300 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Invoice #{inv.Invoice_ID}</h3>
                    <div className="text-xs font-semibold text-slate-400 bg-slate-50 inline-block px-3 py-1.5 rounded-lg border border-slate-100">
                      {inv.Issue_Date ? `Issued: ${new Date(inv.Issue_Date).toLocaleDateString()}` : 'Draft'} 
                      {inv.Due_Date && ` • Due: ${new Date(inv.Due_Date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-2xl font-black text-slate-800 tracking-tight">
                      ${(inv.Total_Amount || 0).toFixed(2)}
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm border ${inv.Status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' : (inv.Status === 'Draft' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-amber-50 text-amber-600 border-amber-200/50')}`}>
                      {inv.Status}
                    </span>
                    <button onClick={() => router.push('/dashboard/finance')} className="hidden md:block text-sm font-bold text-slate-400 group-hover:text-teal-600 transition-colors">Manage &rarr;</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                  <DollarSign size={32} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold text-lg mb-2">No invoices exist</p>
                <p className="text-slate-400 text-sm">Create a new invoice to get paid.</p>
             </div>
          )}

          {uploadedDocs.filter(d => d.Type === 'Invoice').length > 0 && (
            <div className="mt-12 pt-8 border-t-2 border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-6">Uploaded Invoices</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedDocs.filter(d => d.Type === 'Invoice').map(doc => (
                  <div key={doc.Document_ID} className="p-4 bg-slate-50 border border-slate-200 hover:border-teal-200 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-md">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl border border-slate-100 shrink-0">🧾</div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-800 mb-1 truncate" title={doc.Title}>{doc.Title}</h4>
                        <div className="text-xs font-semibold text-slate-400">Uploaded {new Date(doc.Upload_Date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full mt-auto">
                      <button onClick={() => {
                        const win = window.open();
                        if (win) {
                          if (doc.File_Data.startsWith('data:application/pdf')) {
                            win.document.write(`<iframe src="${doc.File_Data}" width="100%" height="100%" style="border:none;"></iframe>`);
                          } else {
                            win.document.write(`<img src="${doc.File_Data}" style="max-width:100%;" />`);
                          }
                        }
                      }} className="flex-1 py-2 bg-white text-teal-600 hover:bg-teal-50 border border-slate-200 rounded-xl transition-colors shadow-sm text-sm font-bold">View</button>
                      <button onClick={() => handleDeleteUploadedDoc(doc.Document_ID)} className="p-2 bg-white text-red-500 hover:bg-red-50 border border-slate-200 rounded-xl transition-colors shadow-sm"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="bg-white/80 backdrop-blur-md p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Booked Sessions</h2>
            <button onClick={() => setShowSessionModal(true)} className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-500/30">New Session</button>
          </div>
          {inquiries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {inquiries.map(inq => (
                <div key={inq.Inquiry_ID} className="p-6 bg-slate-50 border border-slate-200 hover:border-teal-300 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-md">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-teal-500 border border-slate-100"><Calendar size={24} /></div>
                     <div>
                       <h3 className="text-lg font-bold text-slate-800 mb-1">{inq.Service_Type || "Custom Project"}</h3>
                       <div className="text-xs font-semibold text-slate-400">ID: #{inq.Inquiry_ID}</div>
                     </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wider border border-blue-200/50">
                      {inq.Pipeline_Stage}
                    </span>
                    <button onClick={() => router.push('/dashboard/pipeline')} className="text-sm font-bold text-teal-600 bg-white hover:bg-teal-50 px-4 py-2 rounded-xl border border-slate-200 transition-colors shadow-sm">Manage</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                 <Calendar size={32} className="text-slate-300" />
               </div>
               <p className="text-slate-500 font-bold text-lg">No sessions booked yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'communications' && (
        <div className="bg-white/80 backdrop-blur-md p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Communication History</h2>
            <button onClick={() => setIsNoteModalOpen(true)} className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-500/30 flex items-center gap-2"><Edit2 size={16}/> Log Note</button>
          </div>
          {communications.length > 0 ? (
            <div className="space-y-5">
              {communications.map(comm => {
                const d = new Date(comm.Last_Contact_Date + "Z");
                return (
                  <div key={comm.Communication_ID} className={`p-6 border rounded-2xl relative group transition-all duration-300 hover:shadow-md ${comm.Last_Contact_By === "Me" ? 'bg-gradient-to-r from-teal-50/50 to-white border-teal-100' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-sm ${comm.Last_Contact_By === "Me" ? "bg-teal-500" : "bg-slate-500"}`}>
                          {comm.Last_Contact_By === "Me" ? "Y" : getInitials(contact.Name)}
                        </div>
                        <span className="font-extrabold text-slate-800 text-lg">{comm.Last_Contact_By === "Me" ? "You" : contact.Name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">{d.toLocaleDateString()} • {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <button onClick={() => handleDeleteCommunication(comm.Communication_ID)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-white transition-all bg-red-50 hover:bg-red-500 p-2 rounded-xl" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="ml-14 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-sm font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">{comm.Message || "No notes."}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                 <MessageCircle size={32} className="text-slate-300" />
               </div>
               <p className="text-slate-500 font-bold text-lg">No communications logged yet.</p>
            </div>
          )}
        </div>
      )}
          </div>

          {/* Right Column - Contact Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 sticky top-8">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Contact Info</h2>
                {!isEditingInfo ? (
                  <button onClick={() => setIsEditingInfo(true)} className="text-teal-600 bg-teal-50 hover:bg-teal-100 p-2.5 rounded-2xl transition-colors shadow-sm"><Edit2 size={18} /></button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { setIsEditingInfo(false); setEditForm(contact || {}); }} className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                    <button onClick={handleSaveInfo} disabled={isSaving} className="px-4 py-2 text-xs font-bold text-white bg-teal-500 hover:bg-teal-600 rounded-xl transition-colors shadow-lg shadow-teal-500/30">{isSaving ? 'Saving...' : 'Save'}</button>
                  </div>
                )}
              </div>

              {/* Avatar & Name */}
              <div className="flex flex-col items-center gap-4 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-teal-500/30 transform -rotate-3 transition-transform hover:rotate-0">
                  {getInitials(contact.Name)}
                </div>
                <div>
                  <div className="font-extrabold text-slate-800 text-xl tracking-tight mb-1">{contact.Name}</div>
                  <div className="text-slate-500 text-sm font-semibold bg-white px-3 py-1 rounded-lg border border-slate-100 inline-block">{contact.Email || 'No email'}</div>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">Email</div>
                  {isEditingInfo ? (
                    <input type="email" value={editForm.Email || ''} onChange={e => setEditForm({ ...editForm, Email: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-teal-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm" />
                  ) : (
                    <div className="font-bold text-slate-700 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">{contact.Email || '-'}</div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">Phone</div>
                  {isEditingInfo ? (
                    <input type="tel" value={editForm.Phone || ''} onChange={e => setEditForm({ ...editForm, Phone: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-teal-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm" />
                  ) : (
                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">
                      <span className="font-bold text-slate-700">{contact.Phone || '-'}</span>
                      {contact.Phone && (
                        <a 
                          href={`https://wa.me/${contact.Phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border border-emerald-200/50 shadow-sm shadow-emerald-500/10 group"
                          title="Send WhatsApp Message"
                        >
                          <MessageCircle size={14} className="group-hover:scale-110 transition-transform" /> WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">Company</div>
                  {isEditingInfo ? (
                    <input type="text" value={editForm.Company || ''} onChange={e => setEditForm({ ...editForm, Company: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-teal-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm" />
                  ) : (
                    <div className="font-bold text-slate-700 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">{contact.Company || '-'}</div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">Address</div>
                  {isEditingInfo ? (
                    <input type="text" value={editForm.Address || ''} onChange={e => setEditForm({ ...editForm, Address: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-teal-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm" />
                  ) : (
                    <div className="font-bold text-slate-700 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm leading-relaxed">{contact.Address || '-'}</div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Notes</span>
                    <button onClick={() => setIsNoteModalOpen(true)} className="text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"><Plus size={14}/> Add Note</button>
                  </div>
                  {contact.Notes ? (
                    <div className="bg-amber-50/80 border border-amber-200/50 p-5 rounded-2xl shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                      <div className="text-slate-700 whitespace-pre-wrap text-sm font-semibold leading-relaxed relative z-10">{contact.Notes}</div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm font-semibold bg-slate-50 px-5 py-4 rounded-2xl border border-dashed border-slate-300 italic text-center">No notes added.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

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
        <div className="mobile-overlay open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', backgroundColor: 'white' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#0f172a' }}>New Session</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Service Type</label>
              <input type="text" value={newSessionForm.Service_Type} onChange={e => setNewSessionForm({...newSessionForm, Service_Type: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #f0efe9', borderRadius: '0.25rem' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Event Date</label>
              <input type="date" value={newSessionForm.Event_Date} onChange={e => setNewSessionForm({...newSessionForm, Event_Date: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #f0efe9', borderRadius: '0.25rem' }} />
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
                  <input type="date" className="input" value={editInquiryForm.Event_Date || ""} onChange={(e) => setEditInquiryForm({ ...editInquiryForm, Event_Date: e.target.value })} />
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

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button className="btn btn-primary" style={{ flex: 1, padding: "0.875rem", borderRadius: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 4px 6px -1px rgba(15, 118, 110, 0.2)" }} onClick={() => setIsEditingInquiry(true)}><Edit2 size={18} /> Edit Details</button>
                  <button className="btn btn-outline" style={{ flex: 1, padding: "0.875rem", borderRadius: "0.75rem", fontWeight: 700, color: "#ef4444", borderColor: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }} onClick={handleDeleteInquiry}><Trash2 size={18} /> Delete Project</button>
                </div>
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
                <input type="date" className="input-field" value={newInquiryForm.eventDate} onChange={e => setNewInquiryForm({...newInquiryForm, eventDate: e.target.value})} />
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
