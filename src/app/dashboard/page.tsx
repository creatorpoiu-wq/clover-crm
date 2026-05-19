"use client";

import { useEffect, useState } from "react";
import { Target, Users, AlertCircle, Folder, FileText, CheckSquare, Calendar, DollarSign, FileSignature } from "lucide-react";

interface DashboardData {
  activeCount: number;
  totalValue: number;
  activeRemindersCount: number;
  stageCounts: { stage: string; count: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    fetch('/api/settings').then(r => r.json()).then(res => {
      if (res.config?.companyName) setCompanyName(res.config.companyName);
    }).catch(() => {});
  }, []);

  if (loading) {
    return <div className="empty-state">Loading dashboard...</div>;
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 500, color: '#0f172a', marginBottom: '0.25rem' }}>
        {greeting}{companyName ? `, ${companyName}` : ''}
      </h1>
      <p style={{ color: '#a0a0a0', fontSize: '0.875rem', marginBottom: '3rem' }}>{currentDate}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column (2 fractions) */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="glass-panel" style={{ padding: "2rem" }}>
             <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 500, marginBottom: '1.5rem', color: '#0f172a' }}>Payments</h2>
             <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 0', backgroundColor: '#fafafa', borderRadius: '0.5rem', border: '1px dashed #e2e8f0' }}>
               <p style={{ marginBottom: '1rem', color: '#5c5c5c', fontSize: '0.875rem' }}>Set up payments to track your studio revenue here.</p>
               <a href="/dashboard/finance" style={{ color: '#4da685', fontWeight: 600, fontSize: '0.875rem' }}>Activate payments</a>
             </div>
          </div>

          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 500, marginBottom: '1.5rem', color: '#0f172a' }}>Recent Projects</h2>
            <div className="space-y-0">
              {data?.stageCounts && data.stageCounts.length > 0 ? (
                data.stageCounts.map((s) => (
                  <div key={s.stage} className="list-item" style={{ borderBottom: '1px solid #f0efe9', borderRadius: 0, padding: '1rem 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.875rem' }}>{s.stage} Project</span>
                      <span style={{ color: '#a0a0a0', fontSize: '0.75rem' }}>{s.count} item(s)</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', backgroundColor: '#fff8f0', color: '#d97706', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>INQUIRY</span>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '1rem 0' }}>No active projects yet.</div>
              )}
            </div>
            <a href="/dashboard/pipeline" style={{ color: '#4da685', fontWeight: 600, display: 'inline-block', marginTop: '1.5rem', fontSize: '0.875rem' }}>View more projects</a>
          </div>

          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 500, marginBottom: '1.5rem', color: '#0f172a' }}>Pipeline Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div style={{ padding: 0 }}>
                <div style={{ color: '#a0a0a0', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Pipeline Value</div>
                <div style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 600 }}>{formatCurrency(data?.totalValue || 0)}</div>
              </div>
              <div style={{ padding: 0 }}>
                <div style={{ color: '#a0a0a0', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Active Inquiries</div>
                <div style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 600 }}>{data?.activeCount || 0}</div>
              </div>
              <div style={{ padding: 0 }}>
                <div style={{ color: '#a0a0a0', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Active Reminders</div>
                <div style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 600 }}>{data?.activeRemindersCount || 0}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right column (1 fraction) */}
        <div className="lg:col-span-1">
           <div className="glass-panel" style={{ padding: "2rem", height: 'fit-content' }}>
             <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 500, marginBottom: '1.5rem', color: '#0f172a' }}>Create New</h2>
             <div className="grid grid-cols-2 gap-4">
               <a href="/dashboard/pipeline" className="action-tile">
                 <Folder size={20} strokeWidth={1.5} />
                 <span>Project</span>
               </a>
               <a href="/dashboard/finance" className="action-tile">
                 <DollarSign size={20} strokeWidth={1.5} />
                 <span>Invoice</span>
               </a>
               <a href="/dashboard/finance" className="action-tile">
                 <FileSignature size={20} strokeWidth={1.5} />
                 <span>Contract</span>
               </a>
               <a href="/dashboard/questionnaire" className="action-tile">
                 <CheckSquare size={20} strokeWidth={1.5} />
                 <span>Questionnaire</span>
               </a>
               <a href="/dashboard/finance" className="action-tile">
                 <FileText size={20} strokeWidth={1.5} />
                 <span>Quote</span>
               </a>
               <a href="/dashboard/calendar" className="action-tile">
                 <Calendar size={20} strokeWidth={1.5} />
                 <span>Session</span>
               </a>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
