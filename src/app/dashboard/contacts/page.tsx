"use client";

import { useState, useEffect } from "react";
import { UserPlus, Plus, MessageSquare, Users, Edit2, Trash2, Save, X, Search } from "lucide-react";
import Link from "next/link";

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

  // New Contact State
  const [newContact, setNewContact] = useState({
    name: "", email: "", phone: "", leadSource: "Instagram",
    serviceType: "Wedding Photography", eventDate: "", estimatedValue: ""
  });
  const [newContactLoading, setNewContactLoading] = useState(false);
  const [newContactSuccess, setNewContactSuccess] = useState(false);

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

  const handleNewContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewContactLoading(true);
    setNewContactSuccess(false);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact)
      });
      if (res.ok) {
        setNewContactSuccess(true);
        setTimeout(() => setNewContactSuccess(false), 3000);
        setNewContact({ name: "", email: "", phone: "", leadSource: "Instagram", serviceType: "Wedding Photography", eventDate: "", estimatedValue: "" });
        fetchContacts();
        fetchInquiries();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNewContactLoading(false);
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
            onClick={() => setActiveTab("contact")}
            style={{ padding: "1rem 1.5rem", fontWeight: 700, borderBottom: activeTab === "contact" ? "2px solid var(--primary)" : "2px solid transparent", color: activeTab === "contact" ? "var(--primary)" : "var(--muted)", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
          >
            <UserPlus size={18} /> New Contact + Inquiry
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

          {/* ADD CONTACT TAB */}
          {activeTab === "contact" && (
            <div className="animate-fade-in" style={{ maxWidth: "800px" }}>
              <form onSubmit={handleNewContactSubmit}>
                <h2 className="section-header">Contact Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Full Name *</label>
                    <input type="text" required className="input" style={{ textAlign: "left", letterSpacing: "normal" }} placeholder="e.g. Jordan Smith" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Email</label>
                    <input type="email" className="input" style={{ textAlign: "left", letterSpacing: "normal" }} placeholder="jordan@example.com" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Phone</label>
                    <input type="tel" className="input" style={{ textAlign: "left", letterSpacing: "normal" }} placeholder="555-0101" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Lead Source</label>
                    <select className="input" style={{ textAlign: "left", letterSpacing: "normal" }} value={newContact.leadSource} onChange={e => setNewContact({...newContact, leadSource: e.target.value})}>
                      <option value="Instagram">Instagram</option>
                      <option value="Referral">Referral</option>
                      <option value="Website">Website</option>
                      <option value="Google">Google</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <h2 className="section-header">Inquiry Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Service Type</label>
                    <select className="input" style={{ textAlign: "left", letterSpacing: "normal" }} value={newContact.serviceType} onChange={e => setNewContact({...newContact, serviceType: e.target.value})}>
                      <option value="Wedding Photography">Wedding Photography</option>
                      <option value="Portrait Session">Portrait Session</option>
                      <option value="Commercial">Commercial / Branding</option>
                      <option value="Videography">Videography</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Event Date</label>
                    <input type="date" className="input" style={{ textAlign: "left", letterSpacing: "normal" }} value={newContact.eventDate} onChange={e => setNewContact({...newContact, eventDate: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>Estimated Value ($)</label>
                    <input type="number" step="0.01" className="input" style={{ textAlign: "left", letterSpacing: "normal" }} placeholder="0.00" value={newContact.estimatedValue} onChange={e => setNewContact({...newContact, estimatedValue: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1rem" }}>
                  {newContactSuccess && <span style={{ color: "var(--status-green-fg)", fontWeight: 600 }}>Successfully saved!</span>}
                  <button type="submit" disabled={newContactLoading} className="btn btn-primary" style={{ width: "auto" }}>
                    <Plus size={18} /> {newContactLoading ? "Saving..." : "Save Contact & Inquiry"}
                  </button>
                </div>
              </form>
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
    </div>
  );
}
