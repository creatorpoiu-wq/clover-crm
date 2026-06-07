"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Save, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewPopup() {
  const [internalName, setInternalName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("Subscribe");
  const [buttonColor, setButtonColor] = useState("#3b82f6");
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [imageUrl, setImageUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  const supabase = createClient();
  const router = useRouter();

  const handleSave = async () => {
    if (!internalName || !headline) {
      setError("Internal Name and Headline are required.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: insertError } = await supabase.from("Marketing_Popups").insert({
        user_id: user.id,
        internal_name: internalName,
        headline,
        description,
        button_text: buttonText,
        button_color: buttonColor,
        delay_seconds: delaySeconds,
        image_url: imageUrl,
        active: true
      });

      if (insertError) throw insertError;

      router.push("/dashboard/marketing");
    } catch (err: any) {
      setError(err.message || "Failed to save popup.");
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <Link href="/dashboard/marketing" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', marginBottom: '2rem', fontWeight: 500 }}>
        <ArrowLeft size={16} /> Back to Marketing
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Create Lead Popup</h1>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: '#0f172a', color: 'white', border: 'none',
            padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1
          }}
        >
          {isSaving ? 'Saving...' : <><Save size={18} /> Save Popup</>}
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
        
        {/* Left Col - Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem 0' }}>Internal Settings</h3>
            
            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Popup Name (For your eyes only)</label>
            <input 
              type="text" value={internalName} onChange={e => setInternalName(e.target.value)} 
              placeholder="e.g. Summer Discount Popup"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', marginBottom: '1.5rem' }}
            />

            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Show Delay (Seconds)</label>
            <input 
              type="number" min="0" value={delaySeconds} onChange={e => setDelaySeconds(parseInt(e.target.value) || 0)} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>How long after the page loads should this appear?</p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem 0' }}>Design & Content</h3>
            
            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Headline</label>
            <input 
              type="text" value={headline} onChange={e => setHeadline(e.target.value)} 
              placeholder="Get 10% off your first session!"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', marginBottom: '1.5rem' }}
            />

            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Description (Optional)</label>
            <textarea 
              value={description} onChange={e => setDescription(e.target.value)} 
              placeholder="Join our newsletter and receive exclusive discounts."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', marginBottom: '1.5rem', minHeight: '100px' }}
            />

            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Button Text</label>
            <input 
              type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', marginBottom: '1.5rem' }}
            />

            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Button Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <input 
                type="color" value={buttonColor} onChange={e => setButtonColor(e.target.value)} 
                style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
              />
              <input 
                type="text" value={buttonColor} onChange={e => setButtonColor(e.target.value)} 
                style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}
              />
            </div>

            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Image URL (Optional)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <ImageIcon size={20} color="#64748b" />
              <input 
                type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} 
                placeholder="https://example.com/promo-image.jpg"
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>Paste a link to an image (e.g. from your website or social media).</p>
          </div>
        </div>

        {/* Right Col - Live Preview */}
        <div>
          <div style={{ position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem 0' }}>Live Preview</h3>
            
            {/* Mock website background */}
            <div style={{ 
              backgroundColor: '#f1f5f9', borderRadius: '1rem', overflow: 'hidden', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #cbd5e1',
              height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>Your Website</div>
              
              {/* The Popup */}
              <div style={{ 
                backgroundColor: 'white', borderRadius: '1rem', overflow: 'hidden', width: '90%', maxWidth: '320px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                display: 'flex', flexDirection: 'column'
              }}>
                {imageUrl && (
                  <div style={{ width: '100%', height: '140px', backgroundColor: '#f8fafc', backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
                
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>
                    {headline || "Your Headline Here"}
                  </h4>
                  {description && (
                    <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                      {description}
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input type="text" placeholder="Name" style={{ padding: '0.6rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }} disabled />
                    <input type="email" placeholder="Email Address" style={{ padding: '0.6rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }} disabled />
                    <button style={{ backgroundColor: buttonColor, color: 'white', padding: '0.6rem', borderRadius: '0.25rem', border: 'none', fontWeight: 600, fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      {buttonText || "Subscribe"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
