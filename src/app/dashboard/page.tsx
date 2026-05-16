"use client";

import { useEffect, useState } from "react";
import { Target, Users, AlertCircle } from "lucide-react";

interface DashboardData {
  activeCount: number;
  totalValue: number;
  activeRemindersCount: number;
  stageCounts: { stage: string; count: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  if (loading) {
    return <div className="empty-state">Loading dashboard...</div>;
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Your pipeline performance at a glance.</p>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel metric-card">
          <div className="metric-icon-box metric-icon-teal">
            <Target size={28} />
          </div>
          <div>
            <div className="metric-label">Total Pipeline Value</div>
            <div className="metric-value">{formatCurrency(data?.totalValue || 0)}</div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon-box metric-icon-blue">
            <Users size={28} />
          </div>
          <div>
            <div className="metric-label">Active Inquiries</div>
            <div className="metric-value">{data?.activeCount || 0}</div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon-box metric-icon-orange">
            <AlertCircle size={28} />
          </div>
          <div>
            <div className="metric-label">Active Reminders</div>
            <div className="metric-value">{data?.activeRemindersCount || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 className="section-header">Inquiries by Stage</h2>
          <div className="space-y-4">
            {data?.stageCounts && data.stageCounts.length > 0 ? (
              data.stageCounts.map((s) => (
                <div key={s.stage} className="list-item">
                  <span className="list-label">{s.stage}</span>
                  <span className="list-value">{s.count}</span>
                </div>
              ))
            ) : (
              <div className="empty-state">No active inquiries in pipeline.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
