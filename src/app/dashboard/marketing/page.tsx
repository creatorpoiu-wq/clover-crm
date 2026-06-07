"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Mail, Clock, CheckCircle2, ChevronRight, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function MarketingDashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
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

    const { data, error } = await supabase
      .from("Marketing_Campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCampaigns(data);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>Email Campaigns</h1>
          <p style={{ color: '#64748b' }}>Design, send, and track mass emails to your contacts.</p>
        </div>
        <Link 
          href="/dashboard/marketing/new"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#0f172a',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background-color 0.2s',
          }}
        >
          <Plus size={18} />
          New Campaign
        </Link>
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
      ) : campaigns.length === 0 ? (
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
      ) : (
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
      )}
    </div>
  );
}
