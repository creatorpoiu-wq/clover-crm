"use client";

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Bell, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/formatDate";

interface EventData {
  Inquiry_ID: number;
  Contact_Name: string;
  Event_Date: string;
  Pipeline_Stage: string;
  Service_Type: string;
}

interface ReminderData {
  Reminder_ID: number;
  Inquiry_ID: number;
  Contact_Name: string;
  Reminder_Type: string;
  Due_Date: string;
  Notes: string;
  Is_Completed: number;
  Channel: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Current month state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Add Reminder Modal State
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({ inquiryId: '', dueDate: '', notes: '', channel: 'Email' });
  const [addingReminder, setAddingReminder] = useState(false);

  const fetchCalendarData = () => {
    setLoading(true);
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvents(data.events || []);
          setReminders(data.reminders || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const handleDeleteEvent = async (inquiryId: number) => {
    if (confirmDeleteId !== inquiryId) {
      setConfirmDeleteId(inquiryId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setConfirmDeleteId(null);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/calendar?id=${inquiryId}`, { method: "DELETE" });
      if (res.ok) {
        fetchCalendarData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleReminder = async (id: number, currentStatus: number) => {
    try {
      const res = await fetch("/api/calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId: id, isCompleted: currentStatus === 0 ? 1 : 0 })
      });
      if (res.ok) fetchCalendarData();
    } catch (err) { console.error(err); }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingReminder(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReminder)
      });
      if (res.ok) {
        setShowAddReminder(false);
        setNewReminder({ inquiryId: '', dueDate: '', notes: '', channel: 'Email' });
        fetchCalendarData();
      }
    } catch (err) { console.error(err); }
    setAddingReminder(false);
  };

  const handleSyncGoogleCalendar = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Successfully synced ${data.count} events to Google Calendar!`);
      } else {
        alert(`Failed to sync: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("An error occurred during sync.");
    } finally {
      setSyncing(false);
    }
  };

  const getEventColors = (stage: string) => {
    if (stage === "Booked") return { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" };
    if (stage === "Proposal Drafted" || stage === "Proposal Sent") return { bg: "#fef3c7", text: "#b45309", border: "#fde68a" };
    if (stage === "Negotiation/Revision") return { bg: "#f3e8ff", text: "#6b21a8", border: "#e9d5ff" };
    if (stage === "New Inquiry" || stage === "Discovery/Consultation") return { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" };
    return { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" };
  };

  if (loading) {
    return <div className="empty-state">Loading calendar...</div>;
  }

  // --- Calendar Logic ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Generate calendar cells
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(<div key={`empty-${i}`} className="cal-cell empty"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayEvents = events.filter((e) => e.Event_Date === dateStr);
    const isToday = dateStr === new Date().toISOString().split("T")[0];

    cells.push(
      <div key={`day-${d}`} className={`cal-cell ${isToday ? "today" : ""}`} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div className="cal-day-num" style={{ fontWeight: isToday ? 800 : 600, color: isToday ? "var(--primary)" : "inherit", marginBottom: "0.5rem" }}>{d}</div>
        <div className="cal-events-container" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          {dayEvents.map((ev, idx) => {
            const colors = getEventColors(ev.Pipeline_Stage);
            return (
              <div 
                key={idx} 
                className="cal-event" 
                title={`${ev.Service_Type} - ${ev.Pipeline_Stage}`}
                style={{ 
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                  padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600
                }}
              >
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.Contact_Name}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev.Inquiry_ID); }}
                  style={{ 
                    background: confirmDeleteId === ev.Inquiry_ID ? "#dc2626" : "none", 
                    border: "none", 
                    color: confirmDeleteId === ev.Inquiry_ID ? "#fff" : colors.text, 
                    cursor: "pointer", 
                    opacity: confirmDeleteId === ev.Inquiry_ID ? 1 : 0.7, 
                    padding: confirmDeleteId === ev.Inquiry_ID ? "2px 4px" : 0, 
                    borderRadius: "4px",
                    display: "flex",
                    fontSize: "0.7rem",
                    fontWeight: 700
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
                  onMouseOut={(e) => e.currentTarget.style.opacity = confirmDeleteId === ev.Inquiry_ID ? "1" : "0.7"}
                  title="Remove from Calendar"
                >
                  {confirmDeleteId === ev.Inquiry_ID ? "Confirm?" : <Trash2 size={12} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Calendar & Reminders</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Track your upcoming events and follow-ups.</p>
        </div>
        <button 
          className="btn btn-outline" 
          onClick={handleSyncGoogleCalendar} 
          disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <CalendarIcon size={16} />
          {syncing ? 'Syncing...' : 'Sync to Google Calendar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <div className="glass-panel overflow-hidden">
            <div className="cal-header flex justify-between items-center p-4 bg-[var(--primary)] text-white">
              <button onClick={prevMonth} className="p-2 hover:bg-white/20 rounded-md transition-colors">&larr;</button>
              <h2 className="text-xl font-bold">{monthNames[month]} {year}</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-white/20 rounded-md transition-colors">&rarr;</button>
            </div>
            
            <div className="cal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
              {dayNames.map(d => (
                <div key={d} className="p-2 text-center text-sm font-bold text-[var(--muted)] border-b border-[var(--border)] border-r last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            
            <div className="cal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {cells.map((cell, i) => (
                <div key={i} style={{ minHeight: '100px', padding: '0.5rem', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', backgroundColor: cell.props.className?.includes('empty') ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                    {cell.props.children}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reminders Section */}
        <div>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 section-header" style={{ marginBottom: 0 }}>
                <Bell size={20} className="text-[var(--primary)]" />
                <h2>Active Reminders</h2>
              </div>
              <button className="btn btn-primary" onClick={() => setShowAddReminder(true)} style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                + Add
              </button>
            </div>
            
            <div className="space-y-4">
              {reminders.length > 0 ? (
                reminders.map((rem) => (
                  <div key={rem.Reminder_ID} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-orange">{rem.Reminder_Type}</span>
                        <span className="badge" style={{ background: 'var(--muted-bg)', color: 'var(--muted)', fontSize: '0.7rem' }}>{rem.Channel}</span>
                      </div>
                      <span className="text-sm font-bold">{formatDate(rem.Due_Date)}</span>
                    </div>
                    <div className="font-bold text-lg mb-1">{rem.Contact_Name}</div>
                    <div className="text-sm text-[var(--muted)] mb-3">{rem.Notes}</div>
                    <button className="btn btn-outline" onClick={() => handleToggleReminder(rem.Reminder_ID, rem.Is_Completed)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                      Mark Completed
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">No active reminders.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddReminder && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <h2 className="text-xl font-bold mb-4">Add Reminder</h2>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Select Event/Inquiry</label>
                <select 
                  className="input w-full" 
                  value={newReminder.inquiryId} 
                  onChange={e => setNewReminder({...newReminder, inquiryId: e.target.value})}
                  required
                >
                  <option value="">-- Select Contact --</option>
                  {events.map(ev => (
                    <option key={ev.Inquiry_ID} value={ev.Inquiry_ID}>{ev.Contact_Name} ({ev.Service_Type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Due Date</label>
                <input 
                  type="date" 
                  className="input w-full" 
                  value={newReminder.dueDate} 
                  onChange={e => setNewReminder({...newReminder, dueDate: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Delivery Channel</label>
                <select 
                  className="input w-full" 
                  value={newReminder.channel} 
                  onChange={e => setNewReminder({...newReminder, channel: e.target.value})}
                >
                  <option value="Email">Email Only</option>
                  <option value="SMS">SMS Only</option>
                  <option value="Both">Email & SMS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Notes</label>
                <textarea 
                  className="input w-full" 
                  value={newReminder.notes} 
                  onChange={e => setNewReminder({...newReminder, notes: e.target.value})}
                  placeholder="Additional context for the reminder..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddReminder(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={addingReminder}>
                  {addingReminder ? 'Saving...' : 'Save Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
