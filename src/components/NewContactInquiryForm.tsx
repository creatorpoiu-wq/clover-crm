"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function NewContactInquiryForm({ onSuccess, onCancel }: Props) {
  const [newContact, setNewContact] = useState({
    name: "", email: "", phone: "", leadSource: "Instagram",
    serviceType: "Wedding Photography", eventDate: "", estimatedValue: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact)
      });
      if (res.ok) {
        onSuccess();
      } else {
        alert("Failed to create.");
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
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Contact Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">Full Name *</label>
            <input type="text" required className="input" placeholder="Jordan Smith" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="jordan@example.com" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="tel" className="input" placeholder="555-0101" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
          </div>
          <div>
            <label className="label">Lead Source</label>
            <select className="input" value={newContact.leadSource} onChange={e => setNewContact({...newContact, leadSource: e.target.value})}>
              <option value="Instagram">Instagram</option>
              <option value="Referral">Referral</option>
              <option value="Website">Website</option>
              <option value="Google">Google</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Inquiry / Project Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">Service Type</label>
            <select className="input" value={newContact.serviceType} onChange={e => setNewContact({...newContact, serviceType: e.target.value})}>
              <option value="Wedding Photography">Wedding Photography</option>
              <option value="Portrait Session">Portrait Session</option>
              <option value="Commercial">Commercial / Branding</option>
              <option value="Videography">Videography</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Event Date</label>
            <DatePicker className="input" value={newContact.eventDate} onChange={val => setNewContact({...newContact, eventDate: val})} />
          </div>
          <div>
            <label className="label">Estimated Value ($)</label>
            <input type="number" step="0.01" className="input" placeholder="0.00" value={newContact.estimatedValue} onChange={e => setNewContact({...newContact, estimatedValue: e.target.value})} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button type="button" onClick={onCancel} className="btn btn-outline" style={{ width: 'auto' }}>Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: 'auto' }}>
          <Plus size={18} /> {loading ? "Saving..." : "Save Project"}
        </button>
      </div>
    </form>
  );
}
