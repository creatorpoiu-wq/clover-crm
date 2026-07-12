'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, Trash2, Eye, Link as LinkIcon, Image as ImageIcon, Package, FileText, FileSignature, CheckCircle, Copy } from 'lucide-react';
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
  
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch all required data in parallel
    Promise.all([
      fetch(`/api/proposals/${id}`).then(r => r.json()),
      fetch('/api/contacts').then(r => r.json()),
      fetch('/api/inquiries').then(r => r.json()),
      fetch('/api/packages?type=packages').then(r => r.json()),
      fetch('/api/forms?type=template').then(r => r.json()),
      fetch('/api/contract-templates').then(r => r.json())
    ]).then(([propData, contData, inqData, pkgData, qData, cData]) => {
      if (propData.success) {
        setProposal(propData.proposal);
        if (propData.config) setConfig(propData.config);
      }
      if (contData.success) setContacts(contData.contacts || []);
      if (inqData.success) setInquiries(inqData.inquiries || []);
      if (pkgData.success) setPackages(pkgData.packages || []);
      if (qData.success) setQTemplates(qData.forms || []);
      if (cData.success) setCTemplates(cData.templates || []);
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
          packageId: proposal.Package_ID,
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
    if (!proposal.Package_ID) return alert('Please select a package first.');
    if (!proposal.Questionnaire_Template_ID) return alert('Please select a questionnaire template.');
    if (!proposal.Contract_Template_ID) return alert('Please select a contract template.');

    setSending(true);
    try {
      // First save to make sure everything is up to date
      await handleSave();
      
      const res = await fetch('/api/send-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactId: proposal.Contact_ID,
          proposalId: id
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

  const proposalUrl = config?.Custom_Domain 
    ? `https://${config.Custom_Domain}/proposal/${id}`
    : (typeof window !== 'undefined' ? `${window.location.origin}/proposal/${id}` : `/proposal/${id}`);

  const copyLink = () => {
    navigator.clipboard.writeText(proposalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!proposal) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading proposal...</div>;

  const contactInquiries = inquiries.filter(i => i.Contact_ID == proposal.Contact_ID);

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
        
        {/* Left Column: Settings */}
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
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
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
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
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

          {/* Package Selection */}
          <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} color="#8b5cf6" /> Package & Price
            </h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Select Package</label>
              <select 
                value={proposal.Package_ID || ''} 
                onChange={e => setProposal({...proposal, Package_ID: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
              >
                <option value="">-- Choose a package --</option>
                {packages.map(p => (
                  <option key={p.Package_ID} value={p.Package_ID}>{p.Name} (${p.Price})</option>
                ))}
              </select>
            </div>
            
            {proposal.Package_ID && (() => {
              const selectedPkg = packages.find(p => p.Package_ID == proposal.Package_ID);
              return selectedPkg && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedPkg.Name}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8b5cf6', margin: '0.25rem 0' }}>${selectedPkg.Price}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedPkg.Duration}</div>
                </div>
              );
            })()}
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
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
                >
                  <option value="">-- Select --</option>
                  {qTemplates.map(q => (
                    <option key={q.Form_ID} value={q.Form_ID}>{q.Title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Contract Template (Required)</label>
                <select 
                  value={proposal.Contract_Template_ID || ''} 
                  onChange={e => setProposal({...proposal, Contract_Template_ID: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
                >
                  <option value="">-- Select --</option>
                  {cTemplates.map(c => (
                    <option key={c.Template_ID} value={c.Template_ID}>{c.Name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Customization */}
          <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={18} color="#f59e0b" /> Personalization
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Cover Image URL (Optional)</label>
                <input 
                  value={proposal.Cover_Image || ''} 
                  onChange={e => setProposal({...proposal, Cover_Image: e.target.value})}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Personal Note (Optional)</label>
                <textarea 
                  value={proposal.Custom_Notes || ''} 
                  onChange={e => setProposal({...proposal, Custom_Notes: e.target.value})}
                  placeholder="Hi [Name], I'm so excited to be part of your day..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', minHeight: 120, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Preview Info */}
        <div style={{ position: 'sticky', top: '2rem' }}>
           <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1rem' }}>
             <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem' }}>Client Journey</h3>
             <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <li style={{ display: 'flex', gap: '1rem' }}>
                 <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>1</div>
                 <div>
                   <div style={{ fontWeight: 700 }}>Review Proposal</div>
                   <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Client sees custom package and note on public page.</div>
                 </div>
               </li>
               <li style={{ display: 'flex', gap: '1rem' }}>
                 <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>2</div>
                 <div>
                   <div style={{ fontWeight: 700 }}>Questionnaire</div>
                   <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Fills out selected template details.</div>
                 </div>
               </li>
               <li style={{ display: 'flex', gap: '1rem' }}>
                 <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>3</div>
                 <div>
                   <div style={{ fontWeight: 700 }}>Sign Contract</div>
                   <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Signs the generated contract.</div>
                 </div>
               </li>
               <li style={{ display: 'flex', gap: '1rem' }}>
                 <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>4</div>
                 <div>
                   <div style={{ fontWeight: 700 }}>Pay Retainer</div>
                   <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Secures the booking.</div>
                 </div>
               </li>
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
