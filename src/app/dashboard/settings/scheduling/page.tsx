"use client";

import { useEffect, useState } from "react";
import { Save, Clock } from "lucide-react";

interface DayAvailability {
  enabled: boolean;
  slots: { start: string; end: string }[];
}

interface SchedulingSettings {
  timezone: string;
  slot_duration: number;
  buffer_time: number;
  availability: Record<string, DayAvailability>;
}

const DEFAULT_SETTINGS: SchedulingSettings = {
  timezone: "America/New_York",
  slot_duration: 60,
  buffer_time: 15,
  availability: {
    monday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    tuesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    wednesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    thursday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    friday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    saturday: { enabled: false, slots: [{ start: "10:00", end: "15:00" }] },
    sunday: { enabled: false, slots: [{ start: "10:00", end: "15:00" }] },
  }
};

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function SchedulingSettingsPage() {
  const [settings, setSettings] = useState<SchedulingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/settings/scheduling")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          // Merge defaults in case new fields were added
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings, availability: { ...DEFAULT_SETTINGS.availability, ...(data.settings.availability || {}) } });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/scheduling", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Scheduling settings saved successfully!", "success");
      } else {
        showToast(data.error || "Failed to save settings", "error");
      }
    } catch (err) {
      showToast("Network error occurred.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setSettings(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          enabled: !prev.availability[day].enabled
        }
      }
    }));
  };

  const updateTime = (day: string, type: "start" | "end", value: string) => {
    setSettings(prev => {
      const daySettings = prev.availability[day];
      const newSlots = [...daySettings.slots];
      if (newSlots.length === 0) newSlots.push({ start: "09:00", end: "17:00" });
      newSlots[0] = { ...newSlots[0], [type]: value };
      
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [day]: { ...daySettings, slots: newSlots }
        }
      };
    });
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title">Availability & Scheduling</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Configure when you can accept new meetings or portrait sessions.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
          <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Availability Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Clock className="text-[var(--primary)]" />
              <h2 className="text-xl font-bold m-0 text-[var(--foreground)]">Weekly Hours</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {DAYS_OF_WEEK.map(day => {
                const dayData = settings.availability[day];
                const slot = dayData.slots.length > 0 ? dayData.slots[0] : { start: "09:00", end: "17:00" };
                
                return (
                  <div key={day} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem',
                    backgroundColor: dayData.enabled ? 'var(--background)' : 'var(--muted-bg)'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', flex: 1 }}>
                      <input 
                        type="checkbox" 
                        checked={dayData.enabled} 
                        onChange={() => toggleDay(day)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                      <span style={{ fontWeight: 700, textTransform: 'capitalize', color: dayData.enabled ? 'var(--foreground)' : 'var(--muted)' }}>{day}</span>
                    </label>

                    {dayData.enabled ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="time" 
                          value={slot.start} 
                          onChange={(e) => updateTime(day, "start", e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)', background: 'transparent' }}
                        />
                        <span style={{ color: 'var(--muted)' }}>-</span>
                        <input 
                          type="time" 
                          value={slot.end} 
                          onChange={(e) => updateTime(day, "end", e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)', background: 'transparent' }}
                        />
                      </div>
                    ) : (
                      <div style={{ color: 'var(--muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>Unavailable</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Settings */}
        <div className="space-y-6">
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h2 className="text-xl font-bold mb-6 text-[var(--foreground)]">Meeting Settings</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="block text-sm font-bold mb-2 text-[var(--muted)] uppercase tracking-wider">Slot Duration (Minutes)</label>
                <input 
                  type="number" 
                  value={settings.slot_duration} 
                  onChange={(e) => setSettings({...settings, slot_duration: parseInt(e.target.value) || 60})}
                  className="w-full p-2 border border-[var(--border)] rounded bg-transparent"
                />
                <p className="text-xs text-[var(--muted)] mt-1">How long each meeting or portrait session lasts.</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[var(--muted)] uppercase tracking-wider">Buffer Time (Minutes)</label>
                <input 
                  type="number" 
                  value={settings.buffer_time} 
                  onChange={(e) => setSettings({...settings, buffer_time: parseInt(e.target.value) || 15})}
                  className="w-full p-2 border border-[var(--border)] rounded bg-transparent"
                />
                <p className="text-xs text-[var(--muted)] mt-1">Break time between consecutive bookings.</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[var(--muted)] uppercase tracking-wider">Timezone</label>
                <select 
                  value={settings.timezone} 
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  className="w-full p-2 border border-[var(--border)] rounded bg-transparent"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="animate-fade-in" style={{
          position: "fixed", bottom: 24, right: 24,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#fff", padding: "16px 24px", borderRadius: 8,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", gap: 12, zIndex: 1000, fontWeight: 700,
        }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
