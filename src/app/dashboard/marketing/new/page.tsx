"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Send, Users, Tags, Save } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function CampaignBuilder() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draftId');
  const duplicateId = searchParams.get('duplicateId');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);

  const [audienceType, setAudienceType] = useState("all"); // 'all', 'pipeline', 'tags'
  const [selectedPipelineStage, setSelectedPipelineStage] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [pipelineStages] = useState([
    "New Inquiry", "Consultation Booked", "Proposal Sent", 
    "Contract Signed", "Active Project", "Completed", "Lost"
  ]);

  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchTags();
    if (draftId || duplicateId) {
      fetchCampaign((draftId || duplicateId) as string);
    }
  }, [draftId, duplicateId]);

  useEffect(() => {
    calculateAudienceSize();
  }, [audienceType, selectedPipelineStage, selectedTag]);

  const fetchCampaign = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from("Marketing_Campaigns")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
      
    if (data) {
      if (duplicateId) {
        setName(`${data.name} (Copy)`);
      } else {
        setName(data.name);
      }
      setSubject(data.subject);
      setBody(data.body_html || "");
      
      const criteria = data.audience_criteria;
      if (criteria) {
        setAudienceType(criteria.type || 'all');
        if (criteria.type === 'pipeline') setSelectedPipelineStage(criteria.value || '');
        if (criteria.type === 'tags') setSelectedTag(criteria.value || '');
      }
    }
  };

  const fetchTags = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch unique tags from contacts (assuming tags are stored in an array or comma-separated string)
    const { data } = await supabase.from("Contacts").select("Tags").eq("user_id", user.id);
    if (data) {
      const tagsSet = new Set<string>();
      data.forEach(c => {
        if (c.Tags && Array.isArray(c.Tags)) {
          c.Tags.forEach((t: string) => tagsSet.add(t));
        } else if (c.Tags && typeof c.Tags === 'string') {
          c.Tags.split(',').map((t: string) => t.trim()).forEach((t: string) => tagsSet.add(t));
        }
      });
      setAvailableTags(Array.from(tagsSet));
    }
  };

  const calculateAudienceSize = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from("Contacts").select("Contact_ID", { count: 'exact' }).eq("user_id", user.id).not('Email', 'is', null).neq('Email', '');

    if (audienceType === 'pipeline' && selectedPipelineStage) {
      // Need to join with Inquiries or filter if pipeline stage is on contact. 
      // Assuming Pipeline Stage is on Inquiries. We'll need a different query.
      const { count } = await supabase.from("Inquiries")
        .select("Contact_ID", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("Pipeline_Stage", selectedPipelineStage);
      setPreviewCount(count);
      return;
    } else if (audienceType === 'tags' && selectedTag) {
      // For string contains
      query = query.ilike('Tags', `%${selectedTag}%`);
    } else if (audienceType !== 'all') {
      setPreviewCount(0);
      return;
    }

    const { count } = await query;
    setPreviewCount(count);
  };

  const handleSend = async () => {
    if (!name || !subject || !body) {
      setError("Please fill out all campaign fields.");
      return;
    }
    if (audienceType === 'pipeline' && !selectedPipelineStage) {
      setError("Please select a pipeline stage.");
      return;
    }
    if (audienceType === 'tags' && !selectedTag) {
      setError("Please select a tag.");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const res = await fetch("/api/marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          name,
          subject,
          bodyHtml: body,
          audienceCriteria: {
            type: audienceType,
            value: audienceType === 'pipeline' ? selectedPipelineStage : (audienceType === 'tags' ? selectedTag : 'all')
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        // If this was a draft, we might want to delete it since we just created a 'Sent' record, or update it.
        // Actually, send creates a new record. We should probably delete the old draft.
        if (currentDraftId) {
          await supabase.from("Marketing_Campaigns").delete().eq("id", currentDraftId);
        }

        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/marketing");
        }, 2000);
      } else {
        setError(data.error || "Failed to send campaign.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSending(true);
    setError("");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch("/api/marketing/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          draftId: currentDraftId,
          name,
          subject,
          bodyHtml: body,
          audienceCriteria: {
            type: audienceType,
            value: audienceType === 'pipeline' ? selectedPipelineStage : (audienceType === 'tags' ? selectedTag : 'all')
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentDraftId(data.draft.id);
        alert("Draft saved successfully.");
      } else {
        setError(data.error || "Failed to save draft.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSending(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Send size={32} color="#166534" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>Campaign Sent Successfully!</h2>
        <p style={{ color: '#64748b' }}>Your mass email has been queued and is being delivered.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <Link href="/dashboard/marketing" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', marginBottom: '2rem', fontWeight: 500 }}>
        <ArrowLeft size={16} /> Back to Campaigns
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Create Campaign</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleSaveDraft}
            disabled={isSending}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
              padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600,
              cursor: isSending ? 'not-allowed' : 'pointer', opacity: isSending ? 0.7 : 1
            }}
          >
            <Save size={18} /> Save Draft
          </button>
          <button 
            onClick={handleSend}
            disabled={isSending}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#3b82f6', color: 'white', border: 'none',
              padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600,
              cursor: isSending ? 'not-allowed' : 'pointer', opacity: isSending ? 0.7 : 1
            }}
          >
            {isSending ? 'Sending...' : <><Send size={18} /> Send Campaign</>}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* Left Col - Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Internal Campaign Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Summer Mini Sessions Promo"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Email Subject</label>
            <input 
              type="text" 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              placeholder="Limited time offer inside!"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Email Body</label>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>You can use HTML tags (e.g. &lt;b&gt;bold&lt;/b&gt;, &lt;br/&gt;) and variables like [Name].</p>
            <textarea 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="Hi [Name],&#10;&#10;We are excited to announce..."
              style={{ width: '100%', minHeight: '300px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'monospace', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Right Col - Audience */}
        <div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} /> Audience Selection
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="audience" checked={audienceType === 'all'} onChange={() => setAudienceType('all')} />
                <span style={{ color: '#334155' }}>All Contacts</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="audience" checked={audienceType === 'pipeline'} onChange={() => setAudienceType('pipeline')} />
                <span style={{ color: '#334155' }}>By Pipeline Stage</span>
              </label>
              
              {audienceType === 'pipeline' && (
                <div style={{ paddingLeft: '1.5rem' }}>
                  <select 
                    value={selectedPipelineStage} 
                    onChange={e => setSelectedPipelineStage(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">Select Stage...</option>
                    {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="audience" checked={audienceType === 'tags'} onChange={() => setAudienceType('tags')} />
                <span style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Tags size={14} /> By Tag</span>
              </label>

              {audienceType === 'tags' && (
                <div style={{ paddingLeft: '1.5rem' }}>
                  {availableTags.length > 0 ? (
                    <select 
                      value={selectedTag} 
                      onChange={e => setSelectedTag(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Select Tag...</option>
                      {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>No tags found in your contacts.</p>
                  )}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Recipients</p>
              <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, color: '#3b82f6', margin: 0 }}>
                {previewCount === null ? '...' : previewCount}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.5rem 0 0 0' }}>Excludes contacts without emails</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function NewCampaign() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CampaignBuilder />
    </Suspense>
  );
}
