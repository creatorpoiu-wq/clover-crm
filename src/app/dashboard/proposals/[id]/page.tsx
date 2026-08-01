'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, Eye, Link as LinkIcon, Package, FileSignature, CheckCircle, Copy, Plus, List } from 'lucide-react';
import Link from 'next/link';

export default function ProposalBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [proposal, setProposal] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [qTemplates, setQTemplates] = useState<any[]>([]);
  const [cTemplates, setCTemplates] = useState<any[]>([]);

  // Custom package toggle
  const [useCustomPackage, setUseCustomPackage] = useState(false);
  const [customPkg, setCustomPkg] = useState({ name: '', price: '', duration: '', items: '' });

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/proposals/${id}`).then(r => r.json().catch(() => ({ success: false, error: 'Invalid JSON response' }))),
      fetch('/api/contacts').then(r => r.json().catch(() => ({ success: false }))),
      fetch('/api/inquiries').then(r => r.json().catch(() => ({ success: false }))),
      fetch('/api/packages?type=packages').then(r => r.json().catch(() => ({ success: false }))),
      fetch('/api/questionnaire?type=templates').then(r => r.json().catch(() => ({ success: false }))),
      fetch('/api/contract-templates').then(r => r.json().catch(() => ({ success: false })))
    ]).then(([propData, contData, inqData, pkgData, qData, cData]) => {
      if (propData.success && propData.proposal) {
        setProposal(propData.proposal);
        if (propData.config) setConfig(propData.config);
        // Restore custom package state if it was previously saved
        if (propData.proposal.Custom_Package) {
          setUseCustomPackage(true);
          setCustomPkg(propData.proposal.Custom_Package);
        }
      } else {
        setErrorMsg(propData.error || 'Failed to load proposal data.');
      }
      if (contData.success) setContacts(contData.contacts || []);
      if (inqData.success) setInquiries(inqData.inquiries || []);
      if (pkgData.success) setPackages(pkgData.packages || []);
      if (qData.success) setQTemplates(qData.templates || []);
      if (cData.success) setCTemplates(cData.templates || []);
    }).catch(err => {
      setErrorMsg(err.message || 'An unexpected error occurred while loading.');
    });
  }, [id]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: proposal.Title,
          contactId: proposal.Contact_ID,
          inquiryId: proposal.Inquiry_ID,
          packageId: useCustomPackage ? null : (proposal.Package_ID || null),
          customPackage: useCustomPackage ? { ...customPkg, price: Number(String(customPkg.price).replace(/[^0-9.-]+/g, '')) || 0 } : null,
          coverImage: proposal.Cover_Image,
          customNotes: proposal.Custom_Notes,
          questionnaireTemplateId: proposal.Questionnaire_Template_ID,
          contractTemplateId: proposal.Contract_Template_ID,
          addons: proposal.Addons || [],
        }),
      });
      const data = await res.json();
      if (data.success) showToast('Proposal saved successfully');
      else showToast(data.error || 'Failed to save', 'error');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setSaving(false);
  };

  const handleSend = async () => {
    if (!proposal.Contact_ID) return alert('Please select a client first.');
    if (!useCustomPackage && !proposal.Package_ID) return alert('Please select a package or create a custom package.');
    if (useCustomPackage && (!customPkg.name || !customPkg.price)) return alert('Please fill in the custom package name and price.');
    if (!proposal.Questionnaire_Template_ID) return alert('Please select a questionnaire template.');
    if (!proposal.Contract_Template_ID) return alert('Please select a contract template.');

    setSending(true);
    try {
      await handleSave();
      const res = await fetch('/api/send-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: proposal.Contact_ID,
          proposalId: proposal.Proposal_ID || id
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProposal({ ...proposal, Status: 'Sent', Sent_At: new Date().toISOString() });
        showToast('Proposal sent successfully!');
      } else {
        showToast(data.error || 'Failed to send', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setSending(false);
  };

  const urlIdentifier = proposal?.Slug || id;
  const proposalUrl = config?.Custom_Domain
    ? `https://${config.Custom_Domain}/proposal/${urlIdentifier}`
    : (typeof window !== 'undefined' ? `${window.location.origin}/proposal/${urlIdentifier}` : `/proposal/${urlIdentifier}`);

  const copyLink = () => {
    navigator.clipboard.writeText(proposalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (errorMsg) return <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>Error: {errorMsg}</div>;
  if (!proposal) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading proposal...</div>;

  const contactInquiries = inquiries.filter(i => i.Contact_ID == proposal.Contact_ID);
  const selectedPkg = packages.find(p => p.Package_ID == proposal.Package_ID);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
    border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box'
  };

  return (
    <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', maxWidth: 1200, margin: '0 auto', paddingBottom: '6rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/dashboard/proposals" style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                value={proposal.Title || ''}
                onChange={e => setProposal({...proposal, Title: e.target.value})}
                style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', border: 'none', background: 'transparent', outline: 'none', padding: 0, width: 300 }}
                placeholder="Proposal Title"
              />
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700, background: proposal.Status === 'Draft' ? '#f1f5f9' : proposal.Status === 'Sent' ? '#e0f2fe' : '#dcfce7', color: proposal.Status === 'Draft' ? '#64748b' : proposal.Status === 'Sent' ? '#0891b2' : '#16a34a' }}>
                {proposal.Status}
              </span>
            </div>
            {proposal.Sent_At && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Sent: {new Date(proposal.Sent_At).toLocaleString()}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href={proposalUrl} target="_blank">
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              <Eye size={16} /> Preview
            </button>
          </Link>
          <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
            {copied ? <CheckCircle size={16} color="#10b981" /> : <LinkIcon size={16} />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', background: '#0f172a', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleSend} disabled={sending || proposal.Status === 'Accepted'} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', background: '#0d9488', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: proposal.Status === 'Accepted' ? 'not-allowed' : 'pointer', opacity: proposal.Status === 'Accepted' ? 0.5 : 1 }}>
            <Send size={16} /> {sending ? 'Sending...' : 'Send to Client'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Client & Inquiry */}
          <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#0ea5e9' }}>👤</span> Client Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Select Client</label>
                <select
                  value={proposal.Contact_ID || ''}
                  onChange={e => setProposal({...proposal, Contact_ID: e.target.value, Inquiry_ID: null})}
                  style={inputStyle}
                >
                  <option value="">-- Choose a contact --</option>
                  {contacts.map(c => (
                    <option key={c.Contact_ID} value={c.Contact_ID}>{c.Name} ({c.Email})</option>
                  ))}
                </select>
              </div>
              {proposal.Contact_ID && contactInquiries.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Link to Inquiry (Optional)</label>
                  <select
                    value={proposal.Inquiry_ID || ''}
                    onChange={e => setProposal({...proposal, Inquiry_ID: e.target.value})}
                    style={inputStyle}
                  >
                    <option value="">-- No specific inquiry --</option>
                    {contactInquiries.map(i => (
                      <option key={i.Inquiry_ID} value={i.Inquiry_ID}>{i.Service_Type} - {i.Event_Date ? new Date(i.Event_Date).toLocaleDateString() : 'TBD'}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Package — existing OR custom */}
          <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} color="#8b5cf6" /> Package & Price
            </h3>

            {/* Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: '#f1f5f9', borderRadius: '0.5rem', padding: '0.25rem' }}>
              <button
                onClick={() => setUseCustomPackage(false)}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.8rem',
                  background: !useCustomPackage ? 'white' : 'transparent',
                  color: !useCustomPackage ? '#0f172a' : '#94a3b8',
                  boxShadow: !useCustomPackage ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                }}
              >
                <List size={14} /> Select Existing
              </button>
              <button
                onClick={() => setUseCustomPackage(true)}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.8rem',
                  background: useCustomPackage ? 'white' : 'transparent',
                  color: useCustomPackage ? '#8b5cf6' : '#94a3b8',
                  boxShadow: useCustomPackage ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                }}
              >
                <Plus size={14} /> Custom Package
              </button>
            </div>

            {!useCustomPackage ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Select Package</label>
                <select
                  value={proposal.Package_ID || ''}
                  onChange={e => setProposal({...proposal, Package_ID: e.target.value})}
                  style={inputStyle}
                >
                  <option value="">-- Choose a package --</option>
                  {packages.map(p => (
                    <option key={p.Package_ID} value={p.Package_ID}>{p.Name} (${p.Price})</option>
                  ))}
                </select>
                {selectedPkg && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedPkg.Name}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8b5cf6', margin: '0.25rem 0' }}>${selectedPkg.Price}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedPkg.Duration}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ padding: '0.75rem 1rem', background: '#faf5ff', borderRadius: '0.5rem', border: '1px solid #e9d5ff', fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600 }}>
                  ✨ This custom package is exclusive to this proposal and will appear on the contract.
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Package Name *</label>
                  <input
                    value={customPkg.name}
                    onChange={e => setCustomPkg(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Premium Wedding Package"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Price ($) *</label>
                    <input
                      type="number"
                      value={customPkg.price}
                      onChange={e => setCustomPkg(p => ({ ...p, price: e.target.value }))}
                      placeholder="e.g. 2500"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Duration</label>
                    <input
                      value={customPkg.duration}
                      onChange={e => setCustomPkg(p => ({ ...p, duration: e.target.value }))}
                      placeholder="e.g. 8 Hours"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>What's Included (one item per line)</label>
                  <textarea
                    value={customPkg.items}
                    onChange={e => setCustomPkg(p => ({ ...p, items: e.target.value }))}
                    placeholder={"Ceremony Coverage\nReception Highlights\n400 High-Res Photos\nOnline Gallery"}
                    style={{ ...inputStyle, minHeight: 130, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                  />
                </div>
                {customPkg.name && customPkg.price && (
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{customPkg.name}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8b5cf6', margin: '0.2rem 0' }}>${Number(customPkg.price).toLocaleString()}</div>
                    {customPkg.duration && <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{customPkg.duration}</div>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Forms & Contracts */}
          <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileSignature size={18} color="#ec4899" /> Workflow
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Questionnaire Template (Required)</label>
                <select
                  value={proposal.Questionnaire_Template_ID || ''}
                  onChange={e => setProposal({...proposal, Questionnaire_Template_ID: e.target.value})}
                  style={inputStyle}
                >
                  <option value="">-- Select --</option>
                  {qTemplates.map(q => (
                    <option key={q.Template_ID} value={q.Template_ID}>{q.Name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Contract Template (Required)</label>
                <select
                  value={proposal.Contract_Template_ID || ''}
                  onChange={e => setProposal({...proposal, Contract_Template_ID: e.target.value})}
                  style={inputStyle}
                >
                  <option value="">-- Select --</option>
                  {cTemplates.map(c => (
                    <option key={c.Template_ID} value={c.Template_ID}>{c.Name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Personalisation */}
          <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🖼️ Personalization
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Cover Image URL (Optional)</label>
                <input
                  value={proposal.Cover_Image || ''}
                  onChange={e => setProposal({...proposal, Cover_Image: e.target.value})}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Personal Note (Optional)</label>
                <textarea
                  value={proposal.Custom_Notes || ''}
                  onChange={e => setProposal({...proposal, Custom_Notes: e.target.value})}
                  placeholder="Hi [Name], I'm so excited to be part of your day..."
                  style={{ ...inputStyle, minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Client Journey */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem' }}>Client Journey</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { n: 1, title: 'Review Proposal', desc: 'Client sees custom package and note on public page.' },
                { n: 2, title: 'Client Info', desc: 'Fills out contact and event details.' },
                { n: 3, title: 'Questionnaire', desc: 'Fills out selected template details.' },
                { n: 4, title: 'Sign Contract', desc: 'Signs the generated contract.' },
                { n: 5, title: 'Pay Retainer', desc: 'Secures the booking.' },
              ].map(step => (
                <li key={step.n} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{step.n}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{step.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{step.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '1rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, animation: 'slideUp 0.3s ease-out' }}>
          {toast.msg}
          <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  );
}
