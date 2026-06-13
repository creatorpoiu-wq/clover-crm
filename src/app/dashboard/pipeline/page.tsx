"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, User, Phone, Mail, DollarSign, Edit, Trash2, X, Save, Link as LinkIcon, Plus, Briefcase, MapPin, Package } from "lucide-react";
import { formatDate } from "@/lib/formatDate";
import DeliverablesManager from "@/components/DeliverablesManager";
import { DatePicker } from "@/components/ui/DatePicker";

interface InquiryData {
  Inquiry_ID: number;
  Contact_ID: number;
  Contact_Name: string;
  Email: string;
  Phone: string;
  Service_Type: string;
  Pipeline_Stage: string;
  Estimated_Value: number;
  Status_Flag: string;
  Package_ID?: number | null;
  Event_Date?: string | null;
  Questionnaire_Data?: any;
}

const STAGES = [
  "New Inquiry",
  "Discovery/Consultation",
  "Proposal Drafted",
  "Proposal Sent",
  "Negotiation/Revision",
  "Booked",
];

export default function PipelinePage() {
  const [inquiries, setInquiries] = useState<InquiryData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<InquiryData>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/packages?type=packages')
      .then(res => res.json())
      .then(data => { if (data.success) setPackages(data.packages || []); });
  }, []);

  useEffect(() => {
    const closeDropdown = () => setOpenDropdownId(null);
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  const fetchInquiries = () => {
    setLoading(true);
    fetch("/api/inquiries")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInquiries(data.inquiries || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleUpdate = async () => {
    if (!selectedInquiry) return;
    try {
      const res = await fetch("/api/inquiries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedInquiry.Inquiry_ID,
          Contact_ID: selectedInquiry.Contact_ID,
          Package_ID: editForm.Package_ID,
          Service_Type: editForm.Service_Type,
          Pipeline_Stage: editForm.Pipeline_Stage,
          Estimated_Value: editForm.Estimated_Value,
          Event_Date: editForm.Event_Date,
        }),
      });
      if (res.ok) {
        setSelectedInquiry(null);
        setIsEditing(false);
        fetchInquiries();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!selectedInquiry) return;
    
    if (confirmDeleteId !== selectedInquiry.Inquiry_ID) {
      setConfirmDeleteId(selectedInquiry.Inquiry_ID);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setConfirmDeleteId(null);
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/inquiries?id=${selectedInquiry.Inquiry_ID}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedInquiry(null);
        fetchInquiries();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && inquiries.length === 0) {
    return <div className="empty-state">Loading pipeline board...</div>;
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="mb-6">
        <h1 className="page-title">Projects</h1>
        <p className="page-subtitle">Track and move deals through the pipeline.</p>
      </div>

      <div className="flex flex-row overflow-x-auto gap-6 pb-8 snap-x snap-mandatory">
        {STAGES.map((stage) => {
          const stageInquiries = inquiries.filter((i) => i.Pipeline_Stage === stage);
          const stageTotal = stageInquiries.reduce((sum, i) => sum + (i.Estimated_Value || 0), 0);
          
          return (
            <div key={stage} className="glass-panel flex flex-col min-h-[400px] w-[85vw] sm:w-[320px] shrink-0 snap-center">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 rounded-t-xl shrink-0">
                <div className="text-sm font-extrabold uppercase text-slate-500 mb-2">
                  {stage}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-black text-slate-900">{stageInquiries.length}</span>
                  <span className="text-sm font-bold text-[var(--primary)]">{formatCurrency(stageTotal)}</span>
                </div>
              </div>

              <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
                {stageInquiries.length > 0 ? (
                  stageInquiries.map((inq) => (
                    <motion.div 
                      key={inq.Inquiry_ID} 
                      onClick={() => { setSelectedInquiry(inq); setEditForm(inq); setIsEditing(false); }}
                      whileHover={{ y: -2, scale: 1.01, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}
                      whileTap={{ scale: 0.98 }}
                      style={{ 
                        padding: "1rem", borderRadius: "0.5rem", backgroundColor: "var(--background)", 
                        border: "1px solid var(--border)", cursor: "pointer", 
                        position: "relative", zIndex: openDropdownId === inq.Inquiry_ID ? 50 : 1 
                      }}
                    >
                      <div style={{ marginBottom: "0.5rem" }}>
                        <span className="badge" style={{ backgroundColor: "var(--muted-bg)", color: "var(--foreground)" }}>
                          {inq.Status_Flag}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: "1.125rem", marginBottom: "0.25rem" }}>{inq.Contact_Name}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "0.5rem" }}>{inq.Service_Type}</div>
                      
                      {inq.Event_Date && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600, color: "#15803d", marginBottom: "0.75rem", backgroundColor: "#dcfce7", padding: "0.15rem 0.4rem", borderRadius: "0.25rem", width: "fit-content" }}>
                          <Calendar size={12} /> {formatDate(inq.Event_Date)}
                        </div>
                      )}
                      
                      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "center" }}>
                        {inq.Email && (
                          <a href={`mailto:${inq.Email}`} title={`Email ${inq.Email}`} style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", fontWeight: 600, padding: "0.25rem 0.5rem", backgroundColor: "rgba(15, 118, 110, 0.1)", borderRadius: "0.25rem", transition: "background-color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(15, 118, 110, 0.2)"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(15, 118, 110, 0.1)"} onClick={(e) => e.stopPropagation()}>
                            <Mail size={16} /> Email
                          </a>
                        )}
                        {inq.Phone && (
                          <a href={`tel:${inq.Phone}`} title={`Call ${inq.Phone}`} style={{ color: "var(--status-blue-fg)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", fontWeight: 600, padding: "0.25rem 0.5rem", backgroundColor: "rgba(30, 64, 175, 0.1)", borderRadius: "0.25rem", transition: "background-color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(30, 64, 175, 0.2)"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(30, 64, 175, 0.1)"} onClick={(e) => e.stopPropagation()}>
                            <Phone size={16} /> Call
                          </a>
                        )}
                        <div style={{ position: "relative", marginLeft: "auto" }} onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === inq.Inquiry_ID ? null : inq.Inquiry_ID); }}
                            style={{ color: "var(--foreground)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", fontWeight: 600, padding: "0.25rem 0.5rem", backgroundColor: "var(--muted-bg)", borderRadius: "0.25rem", transition: "background-color 0.2s", border: "none", cursor: "pointer" }}
                          >
                            <Plus size={16} /> Create
                          </button>
                          {openDropdownId === inq.Inquiry_ID && (
                            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "0.25rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "0.5rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 10, minWidth: "160px", overflow: "hidden" }}>
                              <a href={`/dashboard/finance?tab=contracts&create=contract&client=${inq.Contact_ID}`} style={{ display: "block", padding: "0.5rem 1rem", fontSize: "0.875rem", color: "var(--foreground)", textDecoration: "none", borderBottom: "1px solid var(--border)" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--muted-bg)"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                New Contract / Proposal
                              </a>
                              <a href={`/dashboard/finance?tab=invoices&create=invoice&client=${inq.Contact_ID}`} style={{ display: "block", padding: "0.5rem 1rem", fontSize: "0.875rem", color: "var(--foreground)", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--muted-bg)"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                New Invoice
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(inq.Estimated_Value)}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>#{inq.Inquiry_ID}</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-state" style={{ textAlign: "center", padding: "2rem 0" }}>No deals</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
              {isEditing ? "Edit Inquiry" : "Inquiry Details"}
            </h2>

            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="label">Service Type</label>
                  <input type="text" className="input" value={editForm.Service_Type || ""} onChange={(e) => setEditForm({ ...editForm, Service_Type: e.target.value })} />
                </div>
                <div>
                  <label className="label">Pipeline Stage</label>
                  <select className="input" value={editForm.Pipeline_Stage || ""} onChange={(e) => setEditForm({ ...editForm, Pipeline_Stage: e.target.value })}>
                    {STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Assigned Package</label>
                  <select className="input" value={editForm.Package_ID || ""} onChange={(e) => setEditForm({ ...editForm, Package_ID: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">No Package Assigned</option>
                    {packages.map(pkg => <option key={pkg.Package_ID} value={pkg.Package_ID}>{pkg.Name} (${pkg.Price})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Event Date</label>
                  <DatePicker 
                    value={editForm.Event_Date || ""} 
                    onChange={(val) => setEditForm({ ...editForm, Event_Date: val })} 
                    className="input" 
                  />
                </div>
                <div>
                  <label className="label">Estimated Value ($)</label>
                  <input type="number" className="input" value={editForm.Estimated_Value || ""} onChange={(e) => setEditForm({ ...editForm, Estimated_Value: Number(e.target.value) })} />
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpdate}><Save size={16} /> Save Changes</button>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", paddingBottom: "1.5rem", borderBottom: "1px solid #f0efe9" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, #2dd4bf 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 800, boxShadow: "0 4px 10px rgba(15, 118, 110, 0.3)" }}>
                    {selectedInquiry.Contact_Name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "#0f172a", letterSpacing: "-0.02em" }}>{selectedInquiry.Contact_Name}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 500 }}>{selectedInquiry.Status_Flag}</div>
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
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>{selectedInquiry.Event_Date ? formatDate(selectedInquiry.Event_Date) : "Not Set"}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "1rem", border: "1px solid #f1f5f9", transition: "transform 0.2s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={(e) => e.currentTarget.style.transform = "none"}>
                    <div style={{ padding: "0.75rem", backgroundColor: "#fce7f3", color: "#db2777", borderRadius: "0.75rem" }}>
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Estimated Value</div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>{formatCurrency(selectedInquiry.Estimated_Value)}</div>
                    </div>
                  </div>
                </div>

                {selectedInquiry.Questionnaire_Data && Object.keys(selectedInquiry.Questionnaire_Data).length > 0 && (
                  <div style={{ backgroundColor: "#f8fafc", padding: "1.5rem", borderRadius: "1rem", border: "1px solid #f1f5f9" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Briefcase size={18} color="var(--primary)" /> Questionnaire Answers
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {Object.entries(selectedInquiry.Questionnaire_Data).map(([key, value]) => {
                        if (key === 'customAnswers') {
                          return Object.entries(value as object).map(([q, a]) => (
                            <div key={q}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>{q}</div>
                              <div style={{ fontWeight: 500, color: "#0f172a", fontSize: "0.875rem" }}>{String(a) || "N/A"}</div>
                            </div>
                          ));
                        }
                        
                        // Skip empty values or boolean false
                        if (!value || value === false) return null;
                        
                        const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <div key={key}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>{displayKey}</div>
                            <div style={{ fontWeight: 500, color: "#0f172a", fontSize: "0.875rem" }}>{String(value)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "1rem" }}>
                  <a href={`mailto:${selectedInquiry.Email}`} className="btn btn-outline" style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}><Mail size={16} /> Email</a>
                  <a href={`tel:${selectedInquiry.Phone}`} className="btn btn-outline" style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}><Phone size={16} /> Call</a>
                  <button 
                    className="btn btn-outline" 
                    style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", fontWeight: 600, color: "var(--primary)", borderColor: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                    onClick={() => {
                      const portalUrl = `${window.location.origin}/portal/${selectedInquiry.Inquiry_ID}`;
                      navigator.clipboard.writeText(portalUrl);
                      alert('Portal link copied to clipboard!');
                    }}
                  >
                    <LinkIcon size={16} /> Portal Link
                  </button>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                  <button className="btn btn-primary" style={{ flex: 1, padding: "0.875rem", borderRadius: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 4px 6px -1px rgba(15, 118, 110, 0.2)" }} onClick={() => setIsEditing(true)}><Edit size={18} /> Edit Details</button>
                  <button 
                    className="btn btn-outline" 
                    style={{ 
                      flex: 1, 
                      padding: "0.875rem", borderRadius: "0.75rem", fontWeight: 700,
                      color: confirmDeleteId === selectedInquiry.Inquiry_ID ? "#fff" : "#ef4444", 
                      borderColor: "#ef4444",
                      background: confirmDeleteId === selectedInquiry.Inquiry_ID ? "#dc2626" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                    }} 
                    onClick={handleDelete} 
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : confirmDeleteId === selectedInquiry.Inquiry_ID ? "Confirm Delete?" : <><Trash2 size={18} /> Delete Project</>}
                  </button>
                </div>

                {/* Deliverables Manager */}
                <DeliverablesManager inquiryId={selectedInquiry.Inquiry_ID} />

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
