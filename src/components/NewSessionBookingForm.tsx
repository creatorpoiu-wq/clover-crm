"use client";

import React, { useState, useEffect } from "react";
import { DatePicker } from "@/components/ui/DatePicker";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function NewSessionBookingForm({ onSuccess, onCancel }: Props) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  
  const [newBooking, setNewBooking] = useState({
    sessionId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    bookedDate: "",
    bookedTime: "10:00",
    notes: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/sessions");
        const data = await res.json();
        if (data.success && data.sessions) {
          setSessions(data.sessions);
          if (data.sessions.length > 0) {
            setNewBooking(prev => ({ ...prev, sessionId: data.sessions[0].Session_ID.toString() }));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.sessionId || !newBooking.clientName || !newBooking.bookedDate || !newBooking.bookedTime) {
      alert("Please fill in all required fields.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/session-bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBooking)
      });
      if (res.ok) {
        onSuccess();
      } else {
        alert("Failed to create booking.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Booking Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Session Type *</label>
            <select 
              className="input" 
              required 
              value={newBooking.sessionId} 
              onChange={e => setNewBooking({...newBooking, sessionId: e.target.value})}
              disabled={loadingSessions}
            >
              <option value="">Select a session...</option>
              {sessions.map((s: any) => (
                <option key={s.Session_ID} value={s.Session_ID}>{s.Session_Type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Client Full Name *</label>
            <input type="text" required className="input" placeholder="Jordan Smith" value={newBooking.clientName} onChange={e => setNewBooking({...newBooking, clientName: e.target.value})} />
          </div>
          <div>
            <label className="label">Client Email</label>
            <input type="email" className="input" placeholder="jordan@example.com" value={newBooking.clientEmail} onChange={e => setNewBooking({...newBooking, clientEmail: e.target.value})} />
          </div>
          <div>
            <label className="label">Client Phone</label>
            <input type="tel" className="input" placeholder="555-0101" value={newBooking.clientPhone} onChange={e => setNewBooking({...newBooking, clientPhone: e.target.value})} />
          </div>
          <div></div>

          <div>
            <label className="label">Date *</label>
            <DatePicker 
              value={newBooking.bookedDate} 
              onChange={(d: string) => setNewBooking({...newBooking, bookedDate: d})} 
            />
          </div>
          <div>
            <label className="label">Time *</label>
            <input type="time" required className="input" value={newBooking.bookedTime} onChange={e => setNewBooking({...newBooking, bookedTime: e.target.value})} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Notes / Details</label>
            <textarea 
              className="input" 
              placeholder="Any specific requests..." 
              value={newBooking.notes} 
              onChange={e => setNewBooking({...newBooking, notes: e.target.value})}
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
        <button type="button" onClick={onCancel} className="btn" style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading || loadingSessions}>
          {loading ? "Saving..." : "Create Booking"}
        </button>
      </div>
    </form>
  );
}
