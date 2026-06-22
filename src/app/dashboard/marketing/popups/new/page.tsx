"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageDropzone from "@/components/ui/ImageDropzone";

export default function NewPopup() {
  const [internalName, setInternalName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("Subscribe");
  const [buttonColor, setButtonColor] = useState("#3b82f6");
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [imageUrl, setImageUrl] = useState("");
  const [modalRadius, setModalRadius] = useState("16px");
  const [buttonRadius, setButtonRadius] = useState("8px");
  const [layout, setLayout] = useState("image-top");
  
  const [fontHeader, setFontHeader] = useState("Forum");
  const [fontBody, setFontBody] = useState("Alata");
  const [fontHeaderSize, setFontHeaderSize] = useState("32px");
  const [fontBodySize, setFontBodySize] = useState("15px");

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
        modal_radius: modalRadius,
        button_radius: buttonRadius,
        layout,
        font_header: fontHeader,
        font_body: fontBody,
        font_header_size: fontHeaderSize,
        font_body_size: fontBodySize,
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

            <ImageDropzone 
              label="Popup Image (Optional)" 
              value={imageUrl} 
              onChange={setImageUrl} 
              aspectRatio="video"
            />
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem 0 1.5rem 0' }}>This image will appear in your popup based on the layout.</p>

            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', margin: '0 0 1rem 0', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>Layout & Styling</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Popup Layout</label>
                <select 
                  value={layout} 
                  onChange={e => setLayout(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                >
                  <option value="image-top">Image Top</option>
                  <option value="image-left">Image Left</option>
                  <option value="image-right">Image Right</option>
                  <option value="image-bottom">Image Bottom</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Modal Roundness</label>
                <select 
                  value={modalRadius} 
                  onChange={e => setModalRadius(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                >
                  <option value="0px">Square (0px)</option>
                  <option value="8px">Slight (8px)</option>
                  <option value="16px">Rounded (16px)</option>
                  <option value="24px">Very Rounded (24px)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Button Roundness</label>
                <select 
                  value={buttonRadius} 
                  onChange={e => setButtonRadius(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                >
                  <option value="0px">Square (0px)</option>
                  <option value="4px">Slight (4px)</option>
                  <option value="8px">Rounded (8px)</option>
                  <option value="999px">Pill (999px)</option>
                </select>
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', margin: '0 0 1rem 0', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>Typography</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Header Font</label>
                <input 
                  type="text" value={fontHeader} onChange={e => setFontHeader(e.target.value)} 
                  placeholder="e.g. Forum"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', marginBottom: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Header Size</label>
                <input 
                  type="text" value={fontHeaderSize} onChange={e => setFontHeaderSize(e.target.value)} 
                  placeholder="e.g. 32px"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', marginBottom: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Body Font</label>
                <input 
                  type="text" value={fontBody} onChange={e => setFontBody(e.target.value)} 
                  placeholder="e.g. Alata"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Body Size</label>
                <input 
                  type="text" value={fontBodySize} onChange={e => setFontBodySize(e.target.value)} 
                  placeholder="e.g. 15px"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>
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
                backgroundColor: 'white', borderRadius: modalRadius, overflow: 'hidden', width: '90%', maxWidth: layout === 'image-left' || layout === 'image-right' ? '800px' : '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                display: 'flex', flexDirection: layout === 'image-left' ? 'row' : layout === 'image-right' ? 'row-reverse' : layout === 'image-bottom' ? 'column-reverse' : 'column'
              }}>
                {imageUrl && (
                  <div style={{ 
                    width: layout === 'image-left' || layout === 'image-right' ? '50%' : '100%', 
                    height: layout === 'image-left' || layout === 'image-right' ? 'auto' : '140px', 
                    minHeight: layout === 'image-left' || layout === 'image-right' ? '400px' : 'auto',
                    backgroundColor: '#f8fafc', backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' 
                  }} />
                )}
                
                <div style={{ padding: layout === 'image-left' || layout === 'image-right' ? '48px 40px' : '1.5rem', textAlign: 'center', flex: 1 }}>
                  <h4 style={{ fontFamily: `"${fontHeader}", serif`, fontSize: fontHeaderSize || '32px', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>
                    {headline || "Your Headline Here"}
                  </h4>
                  {description && (
                    <p style={{ fontFamily: `"${fontBody}", sans-serif`, fontSize: fontBodySize || '15px', color: '#475569', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                      {description}
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input type="text" placeholder="Name" style={{ fontFamily: `"${fontBody}", sans-serif`, padding: '0.6rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem' }} disabled />
                    <input type="email" placeholder="Email Address" style={{ fontFamily: `"${fontBody}", sans-serif`, padding: '0.6rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem' }} disabled />
                    <button style={{ fontFamily: `"${fontBody}", sans-serif`, backgroundColor: buttonColor, color: 'white', padding: '0.6rem', borderRadius: buttonRadius, border: 'none', fontWeight: 600, fontSize: '0.875rem', marginTop: '0.5rem' }}>
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
