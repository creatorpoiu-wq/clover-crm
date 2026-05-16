"use client";

import { useEffect, useState } from "react";
import { Download, PieChart, TrendingUp, BarChart3, Activity, Package } from "lucide-react";

interface ReportData {
  valueByStage: { label: string; value: number; count: number }[];
  sourceBreakdown: { label: string; count: number }[];
  serviceBreakdown: { label: string; count: number }[];
  packagePopularity: { label: string; count: number }[];
  overallStats: { total: number; booked: number; lost: number; totalValue: number };
  rawData: any[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
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
    return <div className="empty-state">Loading reports data...</div>;
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const handleExportCSV = () => {
    if (!data || !data.rawData || data.rawData.length === 0) return;
    
    // Get headers from first object
    const headers = Object.keys(data.rawData[0]);
    
    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...data.rawData.map(row => headers.map(header => {
        // Handle commas in strings
        const val = row[header] === null ? "" : String(row[header]);
        return val.includes(",") ? `"${val}"` : val;
      }).join(","))
    ].join("\\n");

    // Create and download Blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `clover-export-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalInquiries = data?.overallStats.total || 1; // Prevent div by 0
  const bookedPercent = Math.round(((data?.overallStats.booked || 0) / totalInquiries) * 100);
  const lostPercent = Math.round(((data?.overallStats.lost || 0) / totalInquiries) * 100);
  const activePercent = 100 - bookedPercent - lostPercent;

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Analyze performance and export data.</p>
        </div>
        <button onClick={handleExportCSV} className="btn btn-primary" style={{ width: "auto" }}>
          <Download size={18} /> Export Full CSV
        </button>
      </div>

      {/* Top Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: "2rem", marginBottom: "2rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Conversion Rate</div>
          <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "var(--status-green-fg)" }}>{bookedPercent}%</div>
          <div style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>of total inquiries booked</div>
        </div>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Active Deals</div>
          <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "var(--status-blue-fg)" }}>{activePercent}%</div>
          <div style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>currently in pipeline</div>
        </div>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Lost Deals</div>
          <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "var(--muted)" }}>{lostPercent}%</div>
          <div style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>did not book</div>
        </div>
        <div className="glass-panel" style={{ padding: "1.5rem", background: "var(--primary)", color: "white" }}>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Total Value Logged</div>
          <div style={{ fontSize: "2.25rem", fontWeight: 900 }}>{formatCurrency(data?.overallStats.totalValue || 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "2rem", marginBottom: "2rem" }}>
        {/* Pipeline Value Chart */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div className="flex items-center gap-2 section-header">
            <TrendingUp size={20} className="text-[var(--primary)]" />
            <h2>Pipeline Value by Stage</h2>
          </div>
          <div className="space-y-6">
            {data?.valueByStage.map((item, idx) => {
              const maxVal = Math.max(...(data.valueByStage.map(v => v.value || 0)));
              const percentage = maxVal > 0 ? ((item.value || 0) / maxVal) * 100 : 0;
              return (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.875rem", fontWeight: 600 }}>
                    <span>{item.label || "Unassigned"} ({item.count})</span>
                    <span>{formatCurrency(item.value || 0)}</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${percentage}%`, height: "100%", backgroundColor: "var(--primary)", borderRadius: "4px" }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Lead Sources Chart */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div className="flex items-center gap-2 section-header">
            <PieChart size={20} className="text-[var(--primary)]" />
            <h2>Lead Sources</h2>
          </div>
          <div className="space-y-6">
            {data?.sourceBreakdown.map((item, idx) => {
              const maxCount = Math.max(...(data.sourceBreakdown.map(v => v.count || 0)));
              const percentage = maxCount > 0 ? ((item.count || 0) / maxCount) * 100 : 0;
              return (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.875rem", fontWeight: 600 }}>
                    <span>{item.label || "Unknown"}</span>
                    <span>{item.count}</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${percentage}%`, height: "100%", backgroundColor: "var(--status-blue-fg)", borderRadius: "4px" }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "2rem" }}>
         {/* Service Type Breakdown */}
         <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div className="flex items-center gap-2 section-header">
            <BarChart3 size={20} className="text-[var(--primary)]" />
            <h2>Service Popularity</h2>
          </div>
          <div className="space-y-4">
            {data?.serviceBreakdown.map((item, idx) => (
              <div key={idx} className="list-item" style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--border)", borderRadius: 0 }}>
                <span className="list-label">{item.label || "Unknown Service"}</span>
                <span className="list-value text-lg">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Package Popularity Breakdown */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div className="flex items-center gap-2 section-header">
            <Package size={20} className="text-[var(--primary)]" />
            <h2>Package Popularity</h2>
          </div>
          <div className="space-y-4">
            {data?.packagePopularity?.map((item, idx) => (
              <div key={idx} className="list-item" style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--border)", borderRadius: 0 }}>
                <span className="list-label">{item.label || "Unknown Package"}</span>
                <span className="list-value text-lg">{item.count}</span>
              </div>
            ))}
            {(!data?.packagePopularity || data.packagePopularity.length === 0) && (
              <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontStyle: "italic" }}>No packages found.</div>
            )}
          </div>
        </div>

        {/* Action Callout */}
        <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", background: "linear-gradient(135deg, var(--sidebar-bg), var(--primary))", color: "white" }}>
          <Activity size={48} style={{ opacity: 0.8, marginBottom: "1rem" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Data dictates strategy.</h2>
          <p style={{ opacity: 0.9, maxWidth: "300px" }}>Use these analytics to double down on your best lead sources and most popular services.</p>
        </div>
      </div>
    </div>
  );
}
