"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";

interface Props {
  onSuccess: (id: number) => void;
  onCancel: () => void;
}

export default function NewQuestionnaireModal({ onSuccess, onCancel }: Props) {
  const [templateName, setTemplateName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/questionnaire?type=template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: templateName })
      });
      if (res.ok) {
        // We could extract the ID, but for now we just redirect
        onSuccess(1);
      } else {
        alert("Failed to create template.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5vh 16px' }}
      onClick={onCancel}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Create New Template</h2>
          <button onClick={onCancel} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}><X size={18} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="label">Template Name</label>
            <input type="text" required className="input" placeholder="e.g., Wedding Form" value={templateName} onChange={e => setTemplateName(e.target.value)} autoFocus />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onCancel} className="btn btn-outline" style={{ width: 'auto' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: 'auto' }}>
              <Plus size={18} /> {loading ? "Creating..." : "Create Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
