"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Mail, Send, RefreshCw, X, User, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/formatDate";

export default function HubPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Log Note
  const [noteContent, setNoteContent] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  // Email Modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: "", body: "" });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchInquiries = async () => {
    try {
      const res = await fetch("/api/inquiries");
      const data = await res.json();
      if (data.success) {
        setInquiries(data.inquiries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (inquiryId: string) => {
    try {
      const res = await fetch(`/api/communications?inquiryId=${inquiryId}`);
      const data = await res.json();
      if (data.success) {
        // Sort chronologically ascending for chat view
        const sorted = (data.communications || []).sort((a: any, b: any) => 
          new Date(a.Last_Contact_Date).getTime() - new Date(b.Last_Contact_Date).getTime()
        );
        setMessages(sorted);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInquiries();
    handleSync(true); // Auto-sync silently on load
  }, []);

  useEffect(() => {
    if (selectedInquiry) {
      fetchMessages(selectedInquiry.Inquiry_ID);
    }
  }, [selectedInquiry]);

  const handleSync = async (silent = false) => {
    if (!silent) {
      setIsSyncing(true);
      setSyncStatus('Syncing with Gmail...');
    }
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (!silent || data.count > 0) {
          setSyncStatus(data.count > 0 ? `Synced ${data.count} new emails.` : 'Emails up to date.');
          fetchInquiries();
          if (selectedInquiry) fetchMessages(selectedInquiry.Inquiry_ID);
        }
      } else {
        if (!silent) setSyncStatus(`Sync Failed: ${data.error}`);
      }
    } catch (error) {
      if (!silent) setSyncStatus('Failed to sync.');
    } finally {
      if (!silent) {
        setIsSyncing(false);
        setTimeout(() => setSyncStatus(''), 5000);
      } else if (syncStatus) {
        setTimeout(() => setSyncStatus(''), 5000);
      }
    }
  };

  const handleLogNote = async () => {
    if (!noteContent.trim() || !selectedInquiry) return;
    setIsLogging(true);
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: selectedInquiry.Inquiry_ID,
          contactDate: new Date().toISOString(),
          contactBy: "Vendor (Note)",
          message: noteContent
        })
      });
      if (res.ok) {
        setNoteContent("");
        fetchMessages(selectedInquiry.Inquiry_ID);
        fetchInquiries();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLogging(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.subject.trim() || !emailForm.body.trim() || !selectedInquiry) return;
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedInquiry.Contact_ID,
          subject: emailForm.subject,
          body: emailForm.body
        })
      });
      if (res.ok) {
        // Also log the email in communications
        await fetch('/api/communications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inquiryId: selectedInquiry.Inquiry_ID,
            contactDate: new Date().toISOString(),
            contactBy: "Vendor (Email)",
            message: `[Email Sent]\nSubject: ${emailForm.subject}\n\n${emailForm.body}`
          })
        });
        setIsEmailModalOpen(false);
        setEmailForm({ subject: "", body: "" });
        fetchMessages(selectedInquiry.Inquiry_ID);
        fetchInquiries();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while sending the email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading) return <div className="empty-state">Loading Communication Hub...</div>;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>
      <div className="mb-6" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Inbox & Hub</h1>
          <p className="page-subtitle">Centralized communication and activity logs.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {syncStatus && <span style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 600 }}>{syncStatus}</span>}
          <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => handleSync(false)} disabled={isSyncing}>
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "Syncing..." : "Sync Gmail"}
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ display: "flex", flex: 1, overflow: "hidden", borderRadius: "12px", border: "1px solid var(--border)" }}>
        {/* Left Pane - Inquiries List */}
        <div style={{ width: "350px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", backgroundColor: "var(--background)" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", fontWeight: 800 }}>Active Threads</div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {inquiries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)", fontSize: "0.875rem" }}>No active projects.</div>
            ) : (
              inquiries.map((inq) => {
                const isSelected = selectedInquiry?.Inquiry_ID === inq.Inquiry_ID;
                const snippet = inq.Message || "No messages yet.";
                return (
                  <div
                    key={inq.Inquiry_ID}
                    onClick={() => setSelectedInquiry(inq)}
                    style={{
                      padding: "16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      marginBottom: "4px",
                      backgroundColor: isSelected ? "var(--muted-bg)" : "transparent",
                      transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)" }}
                    onMouseOut={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = "transparent" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.9375rem" }}>{inq.Contact_Name}</div>
                      {inq.Last_Contact_Date && (
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{new Date(inq.Last_Contact_Date).toLocaleDateString()}</div>
                      )}
                    </div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--primary)", marginBottom: "4px" }}>{inq.Service_Type}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {inq.Last_Contact_By ? `${inq.Last_Contact_By}: ` : ''}{snippet}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane - Chat/Messages */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#fdfdfd" }}>
          {selectedInquiry ? (
            <>
              {/* Header */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                    {selectedInquiry.Contact_Name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.125rem" }}>{selectedInquiry.Contact_Name}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 600 }}>{selectedInquiry.Email}</div>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setIsEmailModalOpen(true)}>
                  <Mail size={16} /> Compose Email
                </button>
              </div>

              {/* Message Thread */}
              <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                {messages.length === 0 ? (
                  <div style={{ margin: "auto", color: "var(--muted)", fontSize: "0.875rem", textAlign: "center" }}>
                    <MessageCircle size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                    No communication history. Sync Gmail or log a note to start.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isClient = msg.Last_Contact_By === "Client";
                    const isSystem = msg.Last_Contact_By === "System";
                    return (
                      <div key={msg.Comm_ID} style={{ display: "flex", flexDirection: "column", alignItems: isClient ? "flex-start" : "flex-end" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "4px", padding: "0 4px" }}>
                          {new Date(msg.Last_Contact_Date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} &bull; {msg.Last_Contact_By}
                        </div>
                        <div style={{ 
                          maxWidth: "75%", 
                          padding: "12px 16px", 
                          borderRadius: "12px", 
                          backgroundColor: isClient ? "#e5e7eb" : isSystem ? "#fef3c7" : "var(--primary)", 
                          color: isClient ? "#1f2937" : isSystem ? "#92400e" : "#fff",
                          borderBottomLeftRadius: isClient ? 0 : "12px",
                          borderBottomRightRadius: !isClient ? 0 : "12px",
                          whiteSpace: "pre-wrap",
                          fontSize: "0.9375rem",
                          lineHeight: 1.5,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                        }}>
                          {msg.Message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", backgroundColor: "#fff" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <textarea 
                    className="input" 
                    placeholder="Log a private note or record a call..." 
                    style={{ flex: 1, minHeight: "50px", resize: "none" }}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleLogNote();
                      }
                    }}
                  />
                  <button className="btn btn-primary" style={{ alignSelf: "flex-end", width: "auto" }} onClick={handleLogNote} disabled={isLogging || !noteContent.trim()}>
                    <Send size={18} /> {isLogging ? "..." : "Log Note"}
                  </button>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "8px" }}>Press Enter to log note, Shift+Enter for new line. Notes are internal.</div>
              </div>
            </>
          ) : (
            <div style={{ margin: "auto", color: "var(--muted)", fontSize: "0.875rem", textAlign: "center" }}>
              <MessageCircle size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
              Select a project to view communication history.
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      {isEmailModalOpen && (
        <div className="mobile-overlay open" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 100 }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "600px", padding: "2rem", backgroundColor: "var(--background)", position: "relative" }}>
            <button onClick={() => setIsEmailModalOpen(false)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
              <X size={20} />
            </button>
            <h2 className="section-header" style={{ border: "none", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Mail size={20} className="text-primary" /> Compose Email to {selectedInquiry?.Contact_Name}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Subject</label>
                <input 
                  type="text" 
                  className="input" 
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                  placeholder="Enter email subject"
                />
              </div>
              <div>
                <label className="label">Message Body</label>
                <textarea 
                  className="input" 
                  style={{ minHeight: "200px" }}
                  value={emailForm.body}
                  onChange={(e) => setEmailForm({...emailForm, body: e.target.value})}
                  placeholder="Write your email here..."
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSendEmail} disabled={isSendingEmail}>
                  {isSendingEmail ? "Sending..." : <><Send size={16} /> Send Email</>}
                </button>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsEmailModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
