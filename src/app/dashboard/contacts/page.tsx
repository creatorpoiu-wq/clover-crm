"use client";

import { useState, useEffect } from "react";
import { UserPlus, Plus, MessageSquare, Users, Edit2, Trash2, Save, X, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { DatePicker } from "@/components/ui/DatePicker";
import NewContactInquiryForm from "@/components/NewContactInquiryForm";

interface InquiryOption {
  Inquiry_ID: number;
  Contact_Name: string;
  Service_Type: string;
}

interface Contact {
  Contact_ID: number;
  Name: string;
  Email: string;
  Phone: string;
  Lead_Source: string;
  Package_ID?: number | null;
  Package_Name?: string | null;
  Company?: string;
  Address?: string;
}

interface Communication {
  Communication_ID: number;
  Last_Contact_Date: string;
  Last_Contact_By: string;
  Message: string;
}

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState("directory");
  
  // Data State
  const [inquiries, setInquiries] = useState<InquiryOption[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});

  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  
  // Communication form state
  const [commInquiryId, setCommInquiryId] = useState("");
  const [commDate, setCommDate] = useState(new Date().toISOString().slice(0, 16));
  const [commBy, setCommBy] = useState("Me");
  const [commMessage, setCommMessage] = useState("");
  const [commLoading, setCommLoading] = useState(false);
  const [commSuccess, setCommSuccess] = useState(false);
  
  // History State
  const [commHistory, setCommHistory] = useState<Communication[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") {
      setActiveTab("contact");
      window.history.replaceState({}, '', '/dashboard/contacts');
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
    fetch('/api/packages?type=packages')
      .then(res => res.json())
      .then(data => { if (data.success) setPackages(data.packages || []); });
    if (activeTab === "directory") {
      fetchContacts();
    }
  }, [activeTab]);

  const fetchInquiries = () => {
    fetch("/api/inquiries")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.inquiries) {
          setInquiries(data.inquiries);
        }
      });
  };

  useEffect(() => {
    if (commInquiryId) {
      setLoadingHistory(true);
      fetch(`/api/communications?inquiryId=${commInquiryId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setCommHistory(data.communications || []);
        })
        .finally(() => setLoadingHistory(false));
    } else {
      setCommHistory([]);
    }
  }, [commInquiryId, commSuccess]);

  const fetchContacts = () => {
    setLoadingContacts(true);
    fetch("/api/contacts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.contacts) {
          setContacts(data.contacts);
        }
      })
      .finally(() => setLoadingContacts(false));
  };

  const handleLogComm = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommLoading(true);
    setCommSuccess(false);
    
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
        setCommSuccess(true);
        setTimeout(() => setCommSuccess(false), 3000);
        setCommInquiryId("");
        setCommMessage("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommLoading(false);
    }
  };

  // --- Contact Directory Actions ---

  const startEdit = (c: Contact) => {
    setEditingId(c.Contact_ID);
    setEditForm({ ...c });
  };

  const saveEdit = async (id: number) => {
    try {
      const payload = { 
        id, 
        name: editForm.Name,
        email: editForm.Email,
        phone: editForm.Phone,
        leadSource: editForm.Lead_Source,
        packageId: editForm.Package_ID,
        company: editForm.Company,
        address: editForm.Address
      };
      const res = await fetch("/api/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditingId(null);
        fetchContacts();
      } else {
        const errorData = await res.json();
        alert(`Failed to save: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Network error: ${err.message}`);
    }
  };

  const deleteContact = async (id: number) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchContacts();
        fetchInquiries(); // Refresh dropdown
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.Name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.Email && c.Email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Contacts</h1>
      <p className="page-subtitle">Manage your client directory, add leads, and log interactions.</p>

      <div className="glass-panel" style={{ padding: "0" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
          <button 
            onClick={() => setActiveTab("directory")}
            style={{ padding: "1rem 1.5rem", fontWeight: 700, borderBottom: activeTab === "directory" ? "2px solid var(--primary)" : "2px solid transparent", color: activeTab === "directory" ? "var(--primary)" : "var(--muted)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
          >
            <Users size={18} /> Directory
          </button>
          <button 
            onClick={() => setActiveTab("communication")}
            style={{ padding: "1rem 1.5rem", fontWeight: 700, borderBottom: activeTab === "communication" ? "2px solid var(--primary)" : "2px solid transparent", color: activeTab === "communication" ? "var(--primary)" : "var(--muted)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
          >
            <MessageSquare size={18} /> Log Communication
          </button>
        </div>

        <div style={{ padding: "2rem" }}>
          
          {/* DIRECTORY TAB */}
          {activeTab === "directory" && (
            <div className="animate-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 className="section-header" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>All Contacts</h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ position: "relative", width: "300px" }}>
                    <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Search name or email..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: "2.5rem", margin: 0, fontSize: "0.875rem" }}
                    />
                  </div>

                  <div style={{ position: "relative", display: "inline-flex", borderRadius: "0.5rem", overflow: "visible" }}>
                    <button 
                      onClick={() => setShowNewContactModal(true)}
                      style={{ padding: "0.5rem 1rem", background: "#111827", color: "#fff", fontWeight: 600, fontSize: "0.875rem", border: "1px solid #111827", borderRadius: "0.5rem 0 0 0.5rem", cursor: "pointer" }}
                    >
                      Create new
                    </button>
                    <button 
                      onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                      style={{ padding: "0.5rem", background: "#1f2937", color: "#fff", border: "1px solid #111827", borderLeft: "1px solid #374151", borderRadius: "0 0.5rem 0.5rem 0", cursor: "pointer" }}
                    >
                      <ChevronDown size={16} />
                    </button>
                    
                    {showCreateDropdown && (
                      <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "0.5rem", width: "260px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.5rem", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 100 }}>
                        <div style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Create manually</div>
                        <button onClick={() => { setShowNewContactModal(true); setShowCreateDropdown(false); }} style={{ width: "100%", textAlign: "left", padding: "0.5rem 1rem", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#374151" }} onMouseOver={e => e.currentTarget.style.background = "#f3f4f6"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                          <UserPlus size={16} /> New contact
                        </button>
                        <button onClick={() => { alert('Not implemented yet'); setShowCreateDropdown(false); }} style={{ width: "100%", textAlign: "left", padding: "0.5rem 1rem", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#374151" }} onMouseOver={e => e.currentTarget.style.background = "#f3f4f6"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                          <Users size={16} /> New organization
                        </button>
                        <div style={{ height: "1px", background: "#e5e7eb", margin: "0.5rem 0" }} />
                        <div style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Import contacts</div>
                        <button onClick={() => { alert('Not implemented yet'); setShowCreateDropdown(false); }} style={{ width: "100%", textAlign: "left", padding: "0.5rem 1rem", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#374151" }} onMouseOver={e => e.currentTarget.style.background = "#f3f4f6"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                          Import from Google <span style={{ marginLeft: "auto", background: "#f3f4f6", padding: "2px 6px", borderRadius: "10px", fontSize: "0.65rem" }}>Best</span>
                        </button>
                        <button onClick={() => { alert('Not implemented yet'); setShowCreateDropdown(false); }} style={{ width: "100%", textAlign: "left", padding: "0.5rem 1rem", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#374151" }} onMouseOver={e => e.currentTarget.style.background = "#f3f4f6"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          Import spreadsheet
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {loadingContacts ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Loading contacts...</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                        <th style={{ padding: "1rem 0.5rem" }}>Name</th>
                        <th style={{ padding: "1rem 0.5rem" }}>Email</th>
                        <th style={{ padding: "1rem 0.5rem" }}>Phone</th>
                        <th style={{ padding: "1rem 0.5rem" }}>Lead Source</th>
                        <th style={{ padding: "1rem 0.5rem" }}>Package</th>
                        <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map(c => {
                        const isEditing = editingId === c.Contact_ID;
                        return (
                          <tr key={c.Contact_ID} style={{ borderBottom: "1px solid var(--border)", transition: "background-color 0.2s" }} className="hover:bg-[var(--muted-bg)]">
                            <td style={{ padding: "1rem 0.5rem", fontWeight: 600 }}>
                              {isEditing ? (
                                <input type="text" className="input" value={editForm.Name || ""} onChange={e => setEditForm({...editForm, Name: e.target.value})} style={{ padding: "0.5rem", fontSize: "0.875rem" }} />
                              ) : <Link href={`/dashboard/contacts/${c.Contact_ID}`} style={{ color: "#4da685", textDecoration: "none" }} className="hover:underline">{c.Name}</Link>}
                            </td>
                            <td style={{ padding: "1rem 0.5rem" }}>
                              {isEditing ? (
                                <input type="email" className="input" value={editForm.Email || ""} onChange={e => setEditForm({...editForm, Email: e.target.value})} style={{ padding: "0.5rem", fontSize: "0.875rem" }} />
                              ) : c.Email || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>None</span>}
                            </td>
                            <td style={{ padding: "1rem 0.5rem" }}>
                              {isEditing ? (
                                <input type="tel" className="input" value={editForm.Phone || ""} onChange={e => setEditForm({...editForm, Phone: e.target.value})} style={{ padding: "0.5rem", fontSize: "0.875rem" }} />
                              ) : c.Phone || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>None</span>}
                            </td>
                            <td style={{ padding: "1rem 0.5rem" }}>
                              {isEditing ? (
                                <select className="input" value={editForm.Lead_Source || "Website"} onChange={e => setEditForm({...editForm, Lead_Source: e.target.value})} style={{ padding: "0.5rem", fontSize: "0.875rem" }}>
                                  <option value="Website">Website</option>
                                  <option value="Referral">Referral</option>
                                  <option value="Instagram">Instagram</option>
                                  <option value="Other">Other</option>
                                </select>
                              ) : c.Lead_Source || "Website"}
                            </td>
                            <td style={{ padding: "1rem 0.5rem" }}>
                              {isEditing ? (
                                <select className="input" value={editForm.Package_ID || ""} onChange={e => setEditForm({...editForm, Package_ID: parseInt(e.target.value) || null})} style={{ padding: "0.5rem", fontSize: "0.875rem" }}>
                                  <option value="">-- No Package --</option>
                                  {packages.map(pkg => (
                                    <option key={pkg.Package_ID} value={pkg.Package_ID}>{pkg.Name}</option>
                                  ))}
                                </select>
                              ) : c.Package_Name ? (
                                <span style={{ display:'inline-block', padding:'2px 8px', background:'var(--status-blue)', color:'var(--status-blue-fg)', borderRadius:12, fontSize:'0.75rem', fontWeight:600 }}>{c.Package_Name}</span>
                              ) : (
                                <span style={{ color: "var(--muted)" }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                {isEditing ? (
                                  <>
                                    <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: "0.5rem", width: "auto" }} title="Cancel"><X size={16} /></button>
                                    <button onClick={() => saveEdit(c.Contact_ID)} className="btn btn-primary" style={{ padding: "0.5rem", width: "auto" }} title="Save"><Save size={16} /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit({ Contact_ID: c.Contact_ID, Name: c.Name, Email: c.Email, Phone: c.Phone, Lead_Source: c.Lead_Source, Package_ID: c.Package_ID })} className="btn btn-outline" style={{ padding: "0.5rem", width: "auto" }} title="Edit"><Edit2 size={16} /></button>
                                    <button 
                                      onClick={() => deleteContact(c.Contact_ID)} 
                                      className="btn btn-outline" 
                                      style={{ 
                                        padding: confirmDeleteId === c.Contact_ID ? "0.5rem 0.75rem" : "0.5rem", 
                                        width: "auto", 
                                        color: confirmDeleteId === c.Contact_ID ? "#fff" : "var(--status-red-fg)", 
                                        borderColor: "var(--status-red)",
                                        background: confirmDeleteId === c.Contact_ID ? "#dc2626" : "transparent"
                                      }} 
                                      title="Delete"
                                    >
                                      {confirmDeleteId === c.Contact_ID ? "Confirm Delete?" : <Trash2 size={16} />}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredContacts.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>No contacts found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* LOG COMMUNICATION TAB */}
          {activeTab === "communication" && (
            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2" style={{ gap: "4rem" }}>
              <div style={{ padding: "1.5rem", backgroundColor: "var(--background)", borderRadius: "0.75rem", border: "1px solid var(--border)" }}>
                <h2 className="section-header">Log New Interaction</h2>
                <form onSubmit={handleLogComm} className="space-y-6">
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Select Inquiry *</label>
                    <select 
                      className="input" 
                      style={{ textAlign: "left", letterSpacing: "normal" }}
                      value={commInquiryId}
                      onChange={(e) => setCommInquiryId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose an active inquiry --</option>
                      {inquiries.map((inq) => (
                        <option key={inq.Inquiry_ID} value={inq.Inquiry_ID}>
                          {inq.Contact_Name} ({inq.Service_Type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Date & Time of Contact *</label>
                    <input 
                      type="datetime-local" 
                      className="input" 
                      style={{ textAlign: "left", letterSpacing: "normal" }}
                      value={commDate}
                      onChange={(e) => setCommDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Who initiated contact? *</label>
                    <select 
                      className="input" 
                      style={{ textAlign: "left", letterSpacing: "normal" }}
                      value={commBy}
                      onChange={(e) => setCommBy(e.target.value)}
                      required
                    >
                      <option value="Me">Me (I reached out to them)</option>
                      <option value="Client">Client (They reached out to me)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Message / Notes</label>
                    <textarea 
                      className="input" 
                      style={{ textAlign: "left", letterSpacing: "normal", minHeight: "100px", resize: "vertical" }} 
                      placeholder="Record what was discussed or sent..." 
                      value={commMessage}
                      onChange={(e) => setCommMessage(e.target.value)}
                    />
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={commLoading}>
                    <Plus size={18} /> {commLoading ? "Saving..." : "Log Communication"}
                  </button>

                  {commSuccess && (
                    <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "var(--status-green)", color: "var(--status-green-fg)", borderRadius: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                      Communication logged successfully!
                    </div>
                  )}
                </form>
              </div>

              {/* HISTORY SECTION */}
              <div style={{ padding: "1.5rem", backgroundColor: "var(--background)", borderRadius: "0.75rem", border: "1px solid var(--border)" }}>
                <h2 className="section-header">Activity Log</h2>
                {!commInquiryId ? (
                  <div className="empty-state" style={{ padding: "2rem" }}>Select an inquiry to view its communication history.</div>
                ) : loadingHistory ? (
                  <div style={{ padding: "1rem", color: "var(--muted)" }}>Loading history...</div>
                ) : commHistory.length === 0 ? (
                  <div className="empty-state" style={{ padding: "2rem" }}>No communications logged for this inquiry yet.</div>
                ) : (
                  <div className="space-y-4">
                    {commHistory.map(comm => {
                      const dateObj = new Date(comm.Last_Contact_Date + "Z");
                      return (
                        <div key={comm.Communication_ID} style={{ padding: "1.25rem", borderRadius: "0.5rem", backgroundColor: "var(--muted-bg)", border: "1px solid var(--border)", position: "relative" }}>
                          <div style={{ position: "absolute", top: "1.25rem", right: "1.25rem", padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 700, backgroundColor: comm.Last_Contact_By === "Me" ? "var(--primary)" : "var(--status-blue-fg)", color: "white" }}>
                            {comm.Last_Contact_By === "Me" ? "Sent" : "Received"}
                          </div>
                          <div style={{ fontWeight: 800, marginBottom: "0.25rem" }}>
                            {dateObj.toLocaleDateString('en-GB')} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: "0.875rem", color: "var(--foreground)", whiteSpace: "pre-wrap", marginTop: "0.75rem" }}>
                            {comm.Message || <span style={{ fontStyle: "italic", color: "var(--muted)" }}>No message recorded</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewContactModal && typeof window !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5vh 16px' }}
          onClick={() => setShowNewContactModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Create New Contact</h2>
              </div>
              <button onClick={() => setShowNewContactModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}><X size={18} /></button>
            </div>
            <NewContactInquiryForm 
              onSuccess={() => { 
                setShowNewContactModal(false); 
                fetchContacts(); 
                fetchInquiries(); 
              }} 
              onCancel={() => setShowNewContactModal(false)} 
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
