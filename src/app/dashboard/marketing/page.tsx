"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Mail, Clock, CheckCircle2, ChevronRight, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'popups'>('campaigns');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [popups, setPopups] = useState<any[]>([]);
  const [customDomain, setCustomDomain] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const [campaignRes, popupRes, settingsRes] = await Promise.all([
      supabase.from("Marketing_Campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("Marketing_Popups").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      fetch("/api/settings").then(r => r.json())
    ]);

    if (!campaignRes.error && campaignRes.data) {
      setCampaigns(campaignRes.data);
    }
    if (!popupRes.error && popupRes.data) {
      setPopups(popupRes.data);
    }
    if (settingsRes.success && settingsRes.config?.customDomain) {
      setCustomDomain(settingsRes.config.customDomain);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>Marketing</h1>
          <p style={{ color: '#64748b' }}>Design email campaigns and lead capture popups.</p>
        </div>
        
        {activeTab === 'campaigns' ? (
          <Link 
            href="/dashboard/marketing/new"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#0f172a', color: 'white', padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem', fontWeight: 500, textDecoration: 'none',
            }}
          >
            <Plus size={18} /> New Campaign
          </Link>
        ) : (
          <Link 
            href="/dashboard/marketing/popups/new"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#0f172a', color: 'white', padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem', fontWeight: 500, textDecoration: 'none',
            }}
          >
            <Plus size={18} /> New Popup
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('campaigns')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer',
            fontSize: '1rem', fontWeight: 600, color: activeTab === 'campaigns' ? '#0f172a' : '#64748b',
            borderBottom: activeTab === 'campaigns' ? '2px solid #0f172a' : '2px solid transparent'
          }}
        >
          Email Campaigns
        </button>
        <button 
          onClick={() => setActiveTab('popups')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer',
            fontSize: '1rem', fontWeight: 600, color: activeTab === 'popups' ? '#0f172a' : '#64748b',
            borderBottom: activeTab === 'popups' ? '2px solid #0f172a' : '2px solid transparent'
          }}
        >
          Website Popups
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div className="spinner"></div>
          <style jsx>{`
            .spinner {
              border: 3px solid rgba(0,0,0,0.1);
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border-left-color: #0f172a;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      ) : activeTab === 'campaigns' && campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
          <Mail size={48} color="#94a3b8" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>No campaigns yet</h3>
          <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Reach out to your entire contact list or specific segments with powerful, personalized email blasts.
          </p>
          <Link 
            href="/dashboard/marketing/new"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Create Your First Campaign
          </Link>
        </div>
      ) : activeTab === 'campaigns' ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {campaigns.map((campaign, i) => (
            <motion.div 
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{campaign.name}</h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: campaign.status === 'Sent' ? '#dcfce7' : '#f1f5f9',
                    color: campaign.status === 'Sent' ? '#166534' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {campaign.status === 'Sent' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {campaign.status}
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>Subject: "{campaign.subject}"</p>
                
                {campaign.status === 'Sent' && (
                  <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sent To</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{campaign.sent_count} contacts</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opened</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#3b82f6', margin: 0 }}>{campaign.open_count}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sent At</p>
                      <p style={{ fontSize: '0.875rem', color: '#334155', margin: 0, marginTop: '0.25rem' }}>
                        {new Date(campaign.sent_at).toLocaleDateString()} {new Date(campaign.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : activeTab === 'popups' && popups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>No popups yet</h3>
          <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Create embedded website popups to capture leads and grow your email list.
          </p>
          <Link 
            href="/dashboard/marketing/popups/new"
            style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}
          >
            Create Your First Popup
          </Link>
        </div>
      ) : activeTab === 'popups' ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {popups.map((popup, i) => (
            <motion.div 
              key={popup.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{popup.internal_name}</h3>
                  <span style={{
                    padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                    backgroundColor: popup.active ? '#dcfce7' : '#f1f5f9',
                    color: popup.active ? '#166534' : '#475569',
                  }}>
                    {popup.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>Headline: "{popup.headline}"</p>
                
                <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Views</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{popup.view_count}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leads Captured</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#10b981', margin: 0 }}>{popup.conversion_count}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Embed Code</p>
                    <input 
                      readOnly 
                      value={`<script src="${customDomain ? `https://${customDomain}` : (process.env.NEXT_PUBLIC_SITE_URL || 'https://clover-crm.vercel.app')}/api/popups/widget/${popup.id}"></script>`}
                      onClick={(e) => { (e.target as HTMLInputElement).select(); navigator.clipboard.writeText((e.target as HTMLInputElement).value); alert('Copied to clipboard!') }}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', width: '200px', cursor: 'pointer', backgroundColor: '#f8fafc' }}
                      title="Click to copy"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
