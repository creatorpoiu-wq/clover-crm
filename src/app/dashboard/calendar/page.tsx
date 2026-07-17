"use client";

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Bell, Trash2, ChevronLeft, ChevronRight, Settings, X } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { formatDate } from "@/lib/formatDate";
import BlockTimeModal from "@/components/BlockTimeModal";
import { createPortal } from "react-dom";

interface EventData {
  Inquiry_ID: number;
  Contact_Name: string;
  Event_Date: string;
  Pipeline_Stage: string;
  Service_Type: string;
  Event_Type?: string;
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

interface BlockedDate {
  Block_ID: number;
  Date: string;
  Is_All_Day: boolean;
  Start_Time?: string;
  End_Time?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Current month state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modals
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({ inquiryId: '', dueDate: '', notes: '', channel: 'Email' });
  const [addingReminder, setAddingReminder] = useState(false);
  
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);

  const fetchCalendarData = () => {
    setLoading(true);
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvents(data.events || []);
          setReminders(data.reminders || []);
          setBlockedDates(data.blockedDates || []);
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

  const handleDeleteBlock = async (blockId: number) => {
    if (!confirm("Are you sure you want to unblock this date?")) return;
    try {
      const res = await fetch(`/api/blocked-dates?id=${blockId}`, { method: "DELETE" });
      if (res.ok) {
        fetchCalendarData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getEventColors = (stage: string) => {
    if (stage === "Booked") return { bg: "#e0e7ff", text: "#4338ca", border: "transparent" };
    if (stage === "Meeting") return { bg: "#fef3c7", text: "#b45309", border: "transparent" }; // amber
    if (stage === "Session Booking") return { bg: "#dbeafe", text: "#1d4ed8", border: "transparent" }; // blue
    if (stage === "Proposal Drafted" || stage === "Proposal Sent") return { bg: "#fce7f3", text: "#be185d", border: "transparent" };
    if (stage === "Negotiation/Revision") return { bg: "#f3e8ff", text: "#6b21a8", border: "transparent" };
    if (stage === "New Inquiry" || stage === "Discovery/Consultation") return { bg: "#ccfbf1", text: "#0f766e", border: "transparent" };
    return { bg: "#f3f4f6", text: "#374151", border: "transparent" };
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
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const setToday = () => setCurrentDate(new Date());

  // Generate calendar cells
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(<div key={`empty-${i}`} className="cal-cell empty"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayEvents = events.filter((e) => e.Event_Date === dateStr);
    const dayBlocks = blockedDates.filter((b) => dateStr === b.Date);
    const isToday = dateStr === new Date().toISOString().split("T")[0];

    // If there is any full day block, we might want to color the whole cell or just add a big pill. Let's add a solid gray pill.
    const isCellCompletelyBlocked = dayBlocks.some(b => b.Is_All_Day);

    cells.push(
      <div 
        key={`day-${d}`} 
        className={`cal-cell ${isToday ? "today" : ""}`} 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          height: "100%", 
          backgroundColor: isCellCompletelyBlocked ? "#f1f5f9" : "transparent" // Light solid gray background for blocked dates
        }}
      >
        <div className="cal-day-num" style={{ 
            fontWeight: 600, 
            fontSize: '0.9rem',
            color: isToday ? "var(--primary)" : "#333", 
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: isToday ? "24px" : "auto",
            height: isToday ? "24px" : "auto",
            backgroundColor: isToday ? "#e2e8f0" : "transparent",
            borderRadius: isToday ? "50%" : "0"
          }}>
          {d}
        </div>
        <div className="cal-events-container" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          {/* Render Blocked Date Pills */}
          {dayBlocks.map((b, idx) => (
            <div
              key={`block-${idx}`}
              className="cal-event"
              title="Blocked Time"
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                backgroundColor: "#cbd5e1", color: "#334155", border: `1px solid transparent`,
                padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600
              }}
            >
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {b.Is_All_Day ? "Blocked" : `Blocked ${b.Start_Time} - ${b.End_Time}`}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteBlock(b.Block_ID); }}
                style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 0 }}
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* Render Normal Events */}
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
                {(!ev.Event_Type || ev.Event_Type === 'Inquiry') && (
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Filter events for the next 4 months
  const todayStr = new Date().toISOString().split('T')[0];
  const next4MonthsDate = new Date();
  next4MonthsDate.setMonth(next4MonthsDate.getMonth() + 4);
  const next4MonthsStr = next4MonthsDate.toISOString().split('T')[0];

  const upcomingEvents = events
    .filter(ev => ev.Event_Date >= todayStr && ev.Event_Date <= next4MonthsStr)
    .sort((a, b) => new Date(a.Event_Date).getTime() - new Date(b.Event_Date).getTime());

  return (
    <div className="animate-fade-in" style={{ padding: "0 1rem" }}>
      
      {/* Calendar Header / Actions */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            {monthNames[month]} {year}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button onClick={prevMonth} style={{ padding: "0.25rem", color: "#64748b", background: "none", border: "none", cursor: "pointer" }}><ChevronLeft size={20} /></button>
            <button onClick={nextMonth} style={{ padding: "0.25rem", color: "#64748b", background: "none", border: "none", cursor: "pointer" }}><ChevronRight size={20} /></button>
          </div>
          <button 
            onClick={setToday}
            style={{ 
              padding: "0.35rem 1rem", 
              border: "1px solid #e2e8f0", 
              borderRadius: "0.5rem", 
              fontSize: "0.875rem", 
              fontWeight: 600, 
              color: "#334155", 
              backgroundColor: "white",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}>
            Today
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button 
            onClick={() => setShowBlockTimeModal(true)} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              padding: '0.5rem 1rem', 
              fontSize: '0.875rem', 
              fontWeight: 600,
              color: '#334155',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
              cursor: 'pointer',
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            Block Out Time
          </button>
          <button 
            onClick={handleSyncGoogleCalendar} 
            disabled={syncing}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              padding: '0.5rem 1rem', 
              fontSize: '0.875rem', 
              fontWeight: 600,
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              backgroundColor: 'transparent',
              cursor: syncing ? 'not-allowed' : 'pointer'
            }}
          >
            <CalendarIcon size={16} />
            {syncing ? 'Syncing...' : 'Sync to Google'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Calendar Grid Section */}
        <div className="lg:col-span-3">
          <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0', backgroundColor: "#f8fafc" }}>
              {dayNames.map(d => (
                <div key={d} style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', borderRight: '1px solid #e2e8f0' }}>
                  {d}
                </div>
              ))}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {cells.map((cell, i) => (
                <div key={i} style={{ minHeight: '120px', padding: '0.5rem', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', backgroundColor: cell.props.style?.backgroundColor || (cell.props.className?.includes('empty') ? '#f8fafc' : 'white') }}>
                    {cell.props.children}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Upcoming Events Section */}
          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
            <div className="flex items-center gap-2 section-header mb-4" style={{ marginBottom: '1rem' }}>
              <CalendarIcon size={18} className="text-[var(--primary)]" />
              <h2 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, color: "#0f172a" }}>Upcoming (Next 4 Mos)</h2>
            </div>
            
            <div className="space-y-3" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((ev, idx) => {
                  const colors = getEventColors(ev.Pipeline_Stage);
                  return (
                    <div key={idx} className="p-3 rounded-lg border border-[var(--border)] bg-[#f8fafc]">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-[#334155]">{formatDate(ev.Event_Date)}</span>
                      </div>
                      <div className="font-bold text-[0.95rem] mb-1 text-[#0f172a]">{ev.Contact_Name}</div>
                      <div className="text-xs text-[#64748b]">{ev.Service_Type}</div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state text-sm py-4">No upcoming events in the next 4 months.</div>
              )}
            </div>
          </div>

          {/* Reminders Section */}
          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 section-header" style={{ marginBottom: 0 }}>
                <Bell size={18} className="text-[var(--primary)]" />
                <h2 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, color: "#0f172a" }}>Active Reminders</h2>
              </div>
              <button onClick={() => setShowAddReminder(true)} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
                + Add
              </button>
            </div>
            
            <div className="space-y-4">
              {reminders.length > 0 ? (
                reminders.map((rem) => (
                  <div key={rem.Reminder_ID} className="p-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-orange" style={{ fontSize: "0.65rem" }}>{rem.Reminder_Type}</span>
                        <span className="badge" style={{ background: '#e2e8f0', color: '#475569', fontSize: '0.65rem' }}>{rem.Channel}</span>
                      </div>
                    </div>
                    <div className="font-bold text-[0.9rem] mb-1 text-[#0f172a]">{rem.Contact_Name}</div>
                    <div className="text-sm text-[#475569] mb-3">{rem.Notes}</div>
                    <button className="btn btn-outline" onClick={() => handleToggleReminder(rem.Reminder_ID, rem.Is_Completed)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', width: '100%', borderColor: "#cbd5e1", color: "#475569" }}>
                      Mark Completed
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ fontSize: "0.85rem" }}>No active reminders.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddReminder && typeof window !== 'undefined' && createPortal(
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "0.5rem", width: "100%", maxWidth: "400px" }}>
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
              <div className="form-group">
                <label className="block text-sm font-bold mb-1">Due Date</label>
                <DatePicker 
                  className="input w-full" 
                  value={newReminder.dueDate} 
                  onChange={val => setNewReminder({...newReminder, dueDate: val || ''})} 
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
        </div>,
        document.body
      )}

      {showBlockTimeModal && typeof window !== 'undefined' && createPortal(
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <BlockTimeModal 
            onSuccess={() => { setShowBlockTimeModal(false); fetchCalendarData(); }} 
            onCancel={() => setShowBlockTimeModal(false)} 
          />
        </div>,
        document.body
      )}

    </div>
  );
}
