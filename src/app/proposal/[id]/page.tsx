'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, ChevronRight, Star, Clock, Camera, Heart, AlertTriangle } from 'lucide-react';

export default function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [proposal, setProposal] = useState<any>(null);
  const [config, setConfig] = useState<any>({});
  const [funnelSettings, setFunnelSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    fetch(`/api/proposals/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProposal(data.proposal);
          setConfig(data.config || {});
          setFunnelSettings(data.funnelSettings || {});
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async () => {
    setAccepting(true);
    await fetch(`/api/proposals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Accepted' }),
    });
    setDone('accepted');
    // Redirect to booking funnel with proposalId
    setTimeout(() => router.push(`/booking?proposalId=${id}`), 1500);
  };

  const handleDecline = async () => {
    setDeclining(true);
    await fetch(`/api/proposals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Declined', declineReason }),
    });
    setDeclining(false);
    setShowDeclineModal(false);
    setDone('declined');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'white', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading your proposal…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '2rem' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Proposal Not Found</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>This link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  const pkg = proposal.Packages;
  const clientName = proposal.Contacts?.Name?.split(' ')[0] || 'there';
  const companyName = config.Company_Name || 'Your Photographer';
  const coverImage = proposal.Cover_Image || funnelSettings.Cover_Image || funnelSettings.Style_Photo_Url || '';
  const addons: any[] = proposal.Addons || [];
  const totalPrice = pkg ? (Number(pkg.Price) + addons.reduce((s: number, a: any) => s + Number(a.price || 0), 0)) : 0;

  const isAlreadyResolved = proposal.Status === 'Accepted' || proposal.Status === 'Declined';

  if (done === 'accepted') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #0d9488, #0891b2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 40px rgba(13,148,136,0.4)' }}>
            <CheckCircle2 size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem' }}>Proposal Accepted!</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Redirecting you to complete your booking…</p>
        </div>
      </div>
    );
  }

  if (done === 'declined') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '2rem' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Heart size={48} style={{ color: '#f43f5e', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>Thank you for letting us know</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 400, margin: '0 auto' }}>
            We appreciate you taking the time to review the proposal. If you change your mind or have questions, don't hesitate to reach out.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: '70vh', minHeight: 480, overflow: 'hidden' }}>
        {coverImage ? (
          <img src={coverImage} alt="Cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 100%)' }} />

        {/* Branding */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {config.Logo_Url && (
            <img src={config.Logo_Url} alt={companyName} style={{ height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          )}
          <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.02em' }}>{companyName}</span>
        </div>

        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', zIndex: 10 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 9999, padding: '0.4rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.5rem' }}>
            Personal Proposal
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            {proposal.Title}
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'rgba(255,255,255,0.75)', maxWidth: 560, lineHeight: 1.65 }}>
            Hi {clientName}, we've put together a personalised proposal just for you. Take a look at what's included below.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) 1.5rem' }}>

        {/* Already resolved banner */}
        {isAlreadyResolved && (
          <div style={{ background: proposal.Status === 'Accepted' ? '#f0fdf4' : '#fff1f2', border: `1px solid ${proposal.Status === 'Accepted' ? '#bbf7d0' : '#fecdd3'}`, borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {proposal.Status === 'Accepted' ? <CheckCircle2 size={20} color="#16a34a" /> : <XCircle size={20} color="#dc2626" />}
            <span style={{ fontWeight: 700, color: proposal.Status === 'Accepted' ? '#15803d' : '#b91c1c' }}>
              {proposal.Status === 'Accepted' ? 'You have already accepted this proposal.' : 'You have declined this proposal.'}
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '2rem', alignItems: 'start' }}>
          {/* Left: Package Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Package Card */}
            {pkg && (
              <div style={{ background: '#0f172a', borderRadius: '1.5rem', padding: '2rem', color: 'white', boxShadow: '0 20px 40px rgba(15,23,42,0.2)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>Your Package</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem' }}>{pkg.Name}</h2>
                {pkg.Duration && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} />{pkg.Duration}</p>}

                {pkg.Items && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {pkg.Items.split('\n').filter(Boolean).map((item: string, i: number) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                        <CheckCircle2 size={16} style={{ color: '#0d9488', flexShrink: 0, marginTop: 2 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {addons.length > 0 && (
                  <>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>Add-Ons Included</div>
                      {addons.map((a: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', marginBottom: '0.4rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Star size={12} color="#facc15" />{a.name}</span>
                          <span style={{ color: '#0d9488', fontWeight: 700 }}>+${Number(a.price).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.875rem' }}>Total Investment</span>
                  <span style={{ fontSize: '2rem', fontWeight: 900 }}>${totalPrice.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Photographer Note */}
            {proposal.Custom_Notes && (
              <div style={{ background: 'white', borderRadius: '1.25rem', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={18} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0f172a' }}>A Note from {companyName}</div>
                  </div>
                </div>
                <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-wrap', margin: 0 }}>{proposal.Custom_Notes}</p>
              </div>
            )}
          </div>

          {/* Right: CTA Panel */}
          <div style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>Ready to move forward?</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Accepting this proposal will take you to complete your questionnaire, sign your contract, and secure your date.
              </p>

              {!isAlreadyResolved ? (
                <>
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    style={{
                      width: '100%', padding: '1rem 1.5rem', borderRadius: '0.875rem',
                      background: accepting ? '#94a3b8' : 'linear-gradient(135deg, #0f172a, #1e3a5f)',
                      color: 'white', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: accepting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      boxShadow: accepting ? 'none' : '0 8px 20px rgba(15,23,42,0.3)',
                      transition: 'all 0.2s', marginBottom: '0.75rem'
                    }}
                  >
                    {accepting ? 'Accepting…' : <><CheckCircle2 size={18} /> Accept Proposal & Continue</>}
                  </button>

                  <button
                    onClick={() => setShowDeclineModal(true)}
                    style={{
                      width: '100%', padding: '0.875rem 1.5rem', borderRadius: '0.875rem',
                      background: 'transparent', color: '#94a3b8', fontWeight: 700, fontSize: '0.9rem',
                      border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={e => { (e.target as HTMLButtonElement).style.color = '#ef4444'; (e.target as HTMLButtonElement).style.borderColor = '#fca5a5'; }}
                    onMouseOut={e => { (e.target as HTMLButtonElement).style.color = '#94a3b8'; (e.target as HTMLButtonElement).style.borderColor = '#e2e8f0'; }}
                  >
                    Decline Proposal
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '0.875rem', color: '#64748b', fontSize: '0.9rem' }}>
                  {proposal.Status === 'Accepted'
                    ? '✅ You\'ve already accepted this proposal.'
                    : '❌ You\'ve declined this proposal.'}
                </div>
              )}
            </div>

            {/* Reassurance */}
            <div style={{ background: '#f8fafc', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6, textAlign: 'center' }}>
                Questions? Just reply to the email you received and we'll be happy to help.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', maxWidth: 480, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>We're sorry to hear that</h3>
            <p style={{ color: '#64748b', marginBottom: '1.25rem', fontSize: '0.9rem' }}>Would you mind sharing why this proposal didn't feel right? Your feedback helps us improve.</p>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              placeholder="Optional: share a reason..."
              style={{ width: '100%', minHeight: 100, padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '0.9rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => setShowDeclineModal(false)} style={{ flex: 1, padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDecline} disabled={declining} style={{ flex: 1, padding: '0.875rem', borderRadius: '0.75rem', border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                {declining ? 'Submitting…' : 'Decline Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
