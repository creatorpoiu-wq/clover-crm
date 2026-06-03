"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar as CalendarIcon, Clock, User, AlignLeft, X, Check, Video, Phone, RefreshCw, Trash2, CalendarPlus } from "lucide-react";
import { formatDate } from "@/lib/formatDate";
import { DatePicker } from "@/components/ui/DatePicker";
import { supabase } from "@/lib/supabase";

export default function MeetingsPage() {
  const [userId, setUserId] = useState("");
  const [meetings, setMeetings] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [meetingType, setMeetingType] = useState("Google Meet");
  const [notes, setNotes] = useState("");
  const [syncToGoogle, setSyncToGoogle] = useState(true);

  useEffect(() => {
    fetchData();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/contacts')
      ]);

      const mData = await mRes.json();
      const cData = await cRes.json();

      if (mData.success) setMeetings(mData.meetings || []);
      if (cData.success) setContacts(cData.contacts || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time
      const startTime = new Date(`${date}T${time}`).toISOString();

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          contactId: contactId || null,
          startTime,
          durationMinutes,
          meetingType,
          notes,
          syncToGoogle
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        resetForm();
        fetchData();
      } else {
        alert(data.error || 'Failed to schedule meeting.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to cancel and delete this meeting?')) return;
    
    try {
      const res = await fetch(`/api/meetings?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete meeting.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch('/api/meetings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: id, status })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContactId("");
    setDate("");
    setTime("");
    setDurationMinutes(30);
    setMeetingType("Google Meet");
    setNotes("");
    setSyncToGoogle(true);
  };

  // Group meetings by upcoming vs past
  const now = new Date();
  const upcoming = meetings.filter(m => new Date(m.Start_Time) >= now && m.Status !== 'Cancelled').sort((a, b) => new Date(a.Start_Time).getTime() - new Date(b.Start_Time).getTime());
  const past = meetings.filter(m => new Date(m.Start_Time) < now || m.Status === 'Cancelled').sort((a, b) => new Date(b.Start_Time).getTime() - new Date(a.Start_Time).getTime());

  return (
    <div className="animate-fade-in" style={{ padding: "0" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.5rem 2rem",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--background)",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        <div>
          <h1 className="page-title">Meetings</h1>
          <p style={{ color: "var(--muted)", marginTop: "0.25rem", fontSize: "0.875rem" }}>Schedule calls and sync them directly to your Google Calendar.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => {
              if (userId) {
                const link = `${window.location.origin}/schedule/${userId}`;
                navigator.clipboard.writeText(link);
                alert("Booking link copied to clipboard!");
              } else {
                alert("Loading your info, please try again in a moment.");
              }
            }}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            Copy Public Link
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Plus size={16} /> Schedule Meeting
          </button>
        </div>
      </div>

      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <RefreshCw className="animate-spin" size={24} color="var(--muted)" />
          </div>
        ) : (
          <div style={{ display: "grid", gap: "2rem" }}>
            
            {/* Upcoming Meetings */}
            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <CalendarIcon size={20} color="var(--primary)" />
                Upcoming
              </h2>
              
              {upcoming.length === 0 ? (
                <div style={{ 
                  padding: "3rem", 
                  textAlign: "center", 
                  backgroundColor: "var(--card-bg)", 
                  border: "1px dashed var(--border)", 
                  borderRadius: "12px",
                  color: "var(--muted)" 
                }}>
                  <CalendarPlus size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                  <p>No upcoming meetings scheduled.</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 600, marginTop: "0.5rem", cursor: "pointer" }}
                  >
                    Schedule one now
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {upcoming.map(meeting => (
                    <MeetingCard 
                      key={meeting.Meeting_ID} 
                      meeting={meeting} 
                      onDelete={() => handleDelete(meeting.Meeting_ID)}
                      onStatusChange={(status) => handleStatusChange(meeting.Meeting_ID, status)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Past Meetings */}
            {past.length > 0 && (
              <section style={{ marginTop: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "var(--muted)" }}>Past & Cancelled</h2>
                <div style={{ display: "grid", gap: "1rem", opacity: 0.8 }}>
                  {past.map(meeting => (
                    <MeetingCard 
                      key={meeting.Meeting_ID} 
                      meeting={meeting} 
                      onDelete={() => handleDelete(meeting.Meeting_ID)}
                      onStatusChange={(status) => handleStatusChange(meeting.Meeting_ID, status)}
                      isPast={true}
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Schedule Meeting</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              <div className="form-group">
                <label className="form-label">Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Discovery Call" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact (Optional)</label>
                <select 
                  className="form-input" 
                  value={contactId} 
                  onChange={e => setContactId(e.target.value)}
                >
                  <option value="">Select a contact...</option>
                  {contacts.map(c => (
                    <option key={c.Contact_ID} value={c.Contact_ID}>{c.Name} {c.Email ? `(${c.Email})` : ''}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <DatePicker 
                    value={date} 
                    onChange={val => setDate(val)} 
                    className="form-input" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={time} 
                    onChange={e => setTime(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <select 
                    className="form-input" 
                    value={durationMinutes} 
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select 
                    className="form-input" 
                    value={meetingType} 
                    onChange={e => setMeetingType(e.target.value)}
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="FaceTime">FaceTime</option>
                    <option value="Whatsapp">Whatsapp</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="In Person">In Person</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Description</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  placeholder="Meeting agenda or details..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", padding: "1rem", backgroundColor: "var(--muted-bg)", borderRadius: "8px" }}>
                <input 
                  type="checkbox" 
                  id="syncGoogle" 
                  checked={syncToGoogle}
                  onChange={e => setSyncToGoogle(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
                />
                <label htmlFor="syncGoogle" style={{ fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}>
                  Sync to Google Calendar & Send Invites
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting, onDelete, onStatusChange, isPast = false }: { meeting: any, onDelete: () => void, onStatusChange: (s: string) => void, isPast?: boolean }) {
  const startDt = new Date(meeting.Start_Time);
  const endDt = new Date(startDt.getTime() + (meeting.Duration_Minutes || 30) * 60000);
  
  const timeString = `${startDt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${endDt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  const dateString = startDt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "stretch",
      backgroundColor: "var(--card-bg)", 
      border: "1px solid var(--border)", 
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      opacity: meeting.Status === 'Cancelled' ? 0.6 : 1
    }}>
      
      {/* Date Block */}
      <div style={{ 
        padding: "1.5rem 1rem", 
        backgroundColor: "var(--muted-bg)", 
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "120px",
        textAlign: "center"
      }}>
        <div style={{ color: "var(--primary)", fontWeight: 800, fontSize: "1.5rem", lineHeight: 1 }}>
          {startDt.getDate()}
        </div>
        <div style={{ fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", fontSize: "0.875rem", marginTop: "4px" }}>
          {startDt.toLocaleString('default', { month: 'short' })}
        </div>
      </div>

      {/* Main Info */}
      <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              {meeting.Title}
              {meeting.Google_Event_ID && (
                <span title="Synced to Google Calendar" style={{ display: "inline-flex", color: "#4285F4" }}>
                  <CalendarIcon size={14} />
                </span>
              )}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              <Clock size={14} /> {timeString} ({meeting.Duration_Minutes}m) • {dateString}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select 
              value={meeting.Status}
              onChange={(e) => onStatusChange(e.target.value)}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                backgroundColor: meeting.Status === 'Completed' ? '#dcfce7' : 
                                meeting.Status === 'Cancelled' ? '#fee2e2' : 'var(--muted-bg)',
                color: meeting.Status === 'Completed' ? '#166534' : 
                       meeting.Status === 'Cancelled' ? '#991b1b' : 'var(--foreground)',
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Details Row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.875rem", color: "var(--foreground)" }}>
          {meeting.Contacts && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--muted-bg)", padding: "4px 10px", borderRadius: "100px" }}>
              <User size={14} color="var(--primary)" /> {meeting.Contacts.Name}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--muted-bg)", padding: "4px 10px", borderRadius: "100px" }}>
            {meeting.Meeting_Type === 'Video Call' ? <Video size={14} color="var(--primary)" /> : <Phone size={14} color="var(--primary)" />}
            {meeting.Meeting_Type}
          </div>
        </div>

        {meeting.Notes && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem", padding: "0.75rem", backgroundColor: "var(--muted-bg)", borderRadius: "8px" }}>
            <AlignLeft size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ whiteSpace: "pre-wrap" }}>{meeting.Notes}</div>
          </div>
        )}

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
           <button 
             onClick={onDelete}
             style={{ 
               display: "flex", alignItems: "center", gap: "4px", 
               color: "var(--status-red)", background: "transparent", 
               border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
               padding: "4px 8px", borderRadius: "4px",
               transition: "background 0.2s"
             }}
             onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--status-red-bg)"}
             onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}
           >
             <Trash2 size={14} /> Delete
           </button>
        </div>
      </div>
    </div>
  );
}
