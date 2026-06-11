"use client";

import React, { useState } from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BlockTimeModal({ onSuccess, onCancel }: Props) {
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [untilDate, setUntilDate] = useState(new Date().toISOString().split('T')[0]);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: fromDate,
          endDate: untilDate,
          isAllDay: allDay,
          startTime: allDay ? null : startTime,
          endTime: allDay ? null : endTime
        })
      });

      if (res.ok) {
        onSuccess();
      } else {
        const errorData = await res.json();
        alert(`Failed to save: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
      <div style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Block Off Time</h2>
        <p style={{ color: '#5c5c5c', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '2rem' }}>
          Blocking off time on your calendar will prevent anyone from booking sessions from your booking site. Alternatively, you can connect your Google Calendar and block off time with busy events.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>From</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input" 
                  required 
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Until</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  value={untilDate} 
                  onChange={(e) => setUntilDate(e.target.value)}
                  className="input" 
                  required 
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="checkbox" 
              id="allDayCheck" 
              checked={allDay} 
              onChange={(e) => setAllDay(e.target.checked)} 
              style={{ width: '1rem', height: '1rem', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="allDayCheck" style={{ fontSize: '0.9rem', fontWeight: 500 }}>All day</label>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4 mb-4" style={{ alignItems: 'center' }}>
              <div>
                <input 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input" 
                  required={!allDay}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#a0a0a0' }}>–</span>
                <input 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input" 
                  required={!allDay}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 600, cursor: 'pointer', padding: '0.5rem 1rem' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ backgroundColor: '#4da685', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '0.25rem', fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Adding...' : 'Add Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
