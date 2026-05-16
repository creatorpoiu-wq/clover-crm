'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Edit3, Save, FolderOpen, Send, Plus, Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight, List } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { SaveTemplateModal, LoadTemplateModal } from './InvoiceBuilderModals';

interface LineItem { id: string; description: string; quantity: number; price: number; }
interface Contact { Contact_ID: number; Name: string; Email: string; }
interface PaymentMethod { id: string; name: string; enabled: boolean; details: string; qrCode?: string; paymentLink?: string; }

interface InvoiceBuilderProps {
  onClose: () => void;
  onDraftSaved?: () => void;
  initialClient?: { Contact_ID: number; Name: string; Email: string };
}

function genId() { return Math.random().toString(36).slice(2); }

const S = {
  toolbar: { display:'flex', alignItems:'center', flexWrap:'wrap' as const, gap:'2px', padding:'8px 16px', background:'#fff', borderBottom:'1px solid #e5e7eb', position:'sticky' as const, top:0, zIndex:10 },
  btn: (a:boolean):React.CSSProperties => ({ display:'inline-flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:6, border:'none', cursor:'pointer', background: a ? '#dbeafe':'transparent', color: a ? '#1d4ed8':'#4b5563' }),
  divider: { width:1, height:24, background:'#e5e7eb', margin:'0 6px', flexShrink:0 } as React.CSSProperties,
};

const Toolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  return (
    <div style={S.toolbar}>
      {[
        { icon:<Bold size={15}/>, fn:()=>editor.chain().focus().toggleBold().run(), active:editor.isActive('bold') },
        { icon:<Italic size={15}/>, fn:()=>editor.chain().focus().toggleItalic().run(), active:editor.isActive('italic') },
      ].map((b,i) => <button key={i} onClick={b.fn} style={S.btn(b.active)}>{b.icon}</button>)}
      <div style={S.divider}/>
      {[
        { icon:<AlignLeft size={15}/>, fn:()=>editor.chain().focus().setTextAlign('left').run(), active:editor.isActive({textAlign:'left'}) },
        { icon:<AlignCenter size={15}/>, fn:()=>editor.chain().focus().setTextAlign('center').run(), active:editor.isActive({textAlign:'center'}) },
        { icon:<AlignRight size={15}/>, fn:()=>editor.chain().focus().setTextAlign('right').run(), active:editor.isActive({textAlign:'right'}) },
      ].map((b,i) => <button key={i} onClick={b.fn} style={S.btn(b.active)}>{b.icon}</button>)}
      <div style={S.divider}/>
      {[
        { icon:<List size={15}/>, fn:()=>editor.chain().focus().toggleBulletList().run(), active:editor.isActive('bulletList') },
      ].map((b,i) => <button key={i} onClick={b.fn} style={S.btn(b.active)}>{b.icon}</button>)}
    </div>
  );
};

export default function InvoiceBuilder({ onClose, onDraftSaved, initialClient }: InvoiceBuilderProps) {
  const [title, setTitle] = useState('Invoice');
  const [editingTitle, setEditingTitle] = useState(false);
  const [statusBadge, setStatusBadge] = useState<'Draft'|'Sent'>('Draft');
  const [draftId, setDraftId] = useState<number|null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'client'|'items'|'payment'|'design'|'email'>('client');
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [clientName, setClientName] = useState(initialClient?.Name || '');
  const [clientEmail, setClientEmail] = useState(initialClient?.Email || '');
  const [dueDate, setDueDate] = useState('');
  
  const [emailHeader, setEmailHeader] = useState('You have received a new invoice');
  const [emailFooter, setEmailFooter] = useState('Please review the invoice and contact us with any questions.');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: genId(), description: 'Photography Services', quantity: 1, price: 0 },
  ]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 'bank', name: 'Bank Transfer', enabled: false, details: 'Account: 123456789\nRouting: 987654321' },
    { id: 'cc', name: 'Credit Card', enabled: false, details: 'Pay online at: https://...' },
    { id: 'zelle', name: 'Zelle', enabled: false, details: 'zelle@example.com' },
    { id: 'paypal', name: 'PayPal', enabled: false, details: 'paypal.me/example' },
  ]);

  const [themeColor, setThemeColor] = useState('#1e40af'); // Default blue
  const themeColors = ['#1e40af', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#475569', '#000000'];
  
  const [businessLogo, setBusinessLogo] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    fetch('/api/contacts').then(r=>r.json()).then(d=>{ if(d.success) setContacts(d.contacts); });
    fetch('/api/settings').then(r=>r.json()).then(d=>{
      if(d.success && d.config) {
        if(d.config.businessLogo) setBusinessLogo(d.config.businessLogo);
        if(d.config.businessAddress) setBusinessAddress(d.config.businessAddress);
        if(d.config.companyName) {
          setCompanyName(d.config.companyName);
          setEmailHeader(`You have received an invoice from ${d.config.companyName}`);
        }
      }
    });
    fetch('/api/packages?type=packages').then(r=>r.json()).then(d=>{ if(d.success) setAvailablePackages(d.packages); });
  }, []);

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const c = contacts.find(x => x.Contact_ID.toString() === e.target.value);
    if (c) {
      setClientName(c.Name);
      setClientEmail(c.Email || '');
    }
  };

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.price, 0);

  const addItem = () => setLineItems(p => [...p, { id:genId(), description:'', quantity:1, price:0 }]);
  const addPackageToLineItems = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pkgId = e.target.value;
    if (!pkgId) return;
    const pkg = availablePackages.find(p => p.Package_ID.toString() === pkgId);
    if (!pkg) return;
    
    let desc = pkg.Name;
    if (pkg.Duration) desc += ` (${pkg.Duration})`;
    if (pkg.Description) desc += `\n${pkg.Description}`;
    
    setLineItems(p => [...p, { id: genId(), description: desc, quantity: 1, price: pkg.Price }]);
    e.target.value = '';
  };
  const removeItem = (id:string) => setLineItems(p => p.filter(i => i.id !== id));
  const updateItem = (id:string, field:string, val:any) => setLineItems(p => p.map(i => i.id===id ? {...i,[field]:val} : i));

  const togglePaymentMethod = (id: string) => setPaymentMethods(p => p.map(m => m.id === id ? {...m, enabled:!m.enabled} : m));
  const updatePaymentMethod = (id: string, field: string, value: any) => setPaymentMethods(p => p.map(m => m.id === id ? {...m, [field]: value} : m));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, TextAlign.configure({ types: ['heading','paragraph'] })],
    content: `<p style="color:#374151;line-height:1.8;">Thank you for your business. Please find the details of your invoice below.</p><hr/><p style="color:#374151;line-height:1.8;">Any special notes or terms can be written here.</p>`,
    editorProps: { attributes: { style: 'outline:none;min-height:200px;font-family:Georgia,serif;font-size:14px;color:#1f2937;line-height:1.8;' } },
  });

  const showMsg = (m:string) => { setSaveMsg(m); setTimeout(() => setSaveMsg(''), 4000); };

  const getPayload = (action: string) => ({
    action, title, content:editor?.getHTML()||'', lineItems, draftId, clientName, clientEmail, dueDate, emailHeader, emailFooter,
    themeColor, paymentMethods, businessLogo: showLogo ? businessLogo : '', businessAddress
  });

  const saveDraft = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/invoice-actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload('save_draft')),
      });
      const d = await res.json();
      if (d.success) { setDraftId(d.draftId); showMsg('✓ Draft saved'); onDraftSaved?.(); }
    } finally { setIsSaving(false); }
  };

  const sendInvoice = async () => {
    if (!editor) return;
    if (!clientEmail) { showMsg('⚠ Add a client email first'); return; }
    setIsSending(true);
    try {
      const res = await fetch('/api/invoice-actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload('send_invoice')),
      });
      const d = await res.json();
      if (d.success) { setStatusBadge('Sent'); showMsg(`✓ Sent to ${d.sentTo}`); onDraftSaved?.(); }
      else showMsg(`⚠ ${d.error}`);
    } finally { setIsSending(false); }
  };

  const saveTemplate = async (name: string) => {
    if (!editor) return;
    await fetch('/api/invoice-actions', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'save_template', name, content:editor.getHTML() }),
    });
    showMsg(`✓ Saved as "${name}"`);
  };

  const loadTemplate = (content:string) => { if (editor) editor.commands.setContent(content); };

  const inputStyle: React.CSSProperties = { width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, outline:'none', boxSizing:'border-box' as const };
  const labelStyle: React.CSSProperties = { fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4 };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', flexDirection:'column', background:'#f9fafb', fontFamily:"'Inter','Segoe UI',sans-serif", color:'#111827' }}>
      {/* Top Bar */}
      <div style={{ height:64, background:'#fff', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:'50%', border:'none', background:'transparent', cursor:'pointer', color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ArrowLeft size={20}/>
          </button>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {editingTitle
                ? <input autoFocus value={title} onChange={e=>setTitle(e.target.value)} onBlur={()=>setEditingTitle(false)} onKeyDown={e=>{if(e.key==='Enter')setEditingTitle(false);}} style={{ fontWeight:700, fontSize:16, border:'none', borderBottom:`2px solid ${themeColor}`, outline:'none', background:'transparent', minWidth:200 }}/>
                : <span onClick={()=>setEditingTitle(true)} style={{ fontWeight:700, fontSize:16, cursor:'pointer' }}>{title}</span>
              }
              <Edit3 size={13} style={{ color:'#9ca3af', cursor:'pointer' }} onClick={()=>setEditingTitle(true)}/>
              <span style={{ padding:'2px 10px', background: statusBadge==='Sent'?'#dcfce7':'#f3f4f6', color: statusBadge==='Sent'?'#166534':'#6b7280', fontSize:11, fontWeight:700, borderRadius:20 }}>{statusBadge.toUpperCase()}</span>
            </div>
            <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>Invoice Builder</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button onClick={()=>setShowLoadTemplate(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', border:'1px solid #e5e7eb', borderRadius:6, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
            <FolderOpen size={14}/> Templates
          </button>
          <button onClick={()=>setShowSaveTemplate(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', border:'1px solid #e5e7eb', borderRadius:6, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
            <Save size={14}/> Save as Template
          </button>
          {saveMsg && <span style={{ fontSize:12, color:saveMsg.startsWith('⚠')?'#dc2626':'#0d9488', fontWeight:600 }}>{saveMsg}</span>}
          <div style={{ width:1, height:24, background:'#e5e7eb', margin:'0 4px' }}/>
          <button onClick={saveDraft} disabled={isSaving} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', border:'1px solid #e5e7eb', borderRadius:6, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151', opacity:isSaving?0.6:1 }}>
            <Save size={14}/> {isSaving?'Saving…':'Save Draft'}
          </button>
          <button onClick={sendInvoice} disabled={isSending} style={{ padding:'8px 20px', background:isSending?'#6b7280':themeColor, color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
            <Send size={14}/> {isSending?'Sending…':'Send Invoice'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden' }}>
        {/* Sidebar */}
        <div style={{ width:340, background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
          <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', flexWrap:'wrap' }}>
            {(['client','items','payment','design','email'] as const).map(tab => (
              <button key={tab} onClick={()=>setSidebarTab(tab)} style={{ padding:'12px 10px', border:'none', background:'transparent', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', color:sidebarTab===tab?themeColor:'#9ca3af', borderBottom:sidebarTab===tab?`2px solid ${themeColor}`:'2px solid transparent', cursor:'pointer', whiteSpace:'nowrap' }}>{tab}</button>
            ))}
          </div>

          {/* CLIENT TAB */}
          {sidebarTab==='client' && (
            <div style={{ padding:'24px' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>Client Details</div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={labelStyle}>Select Existing Client</label>
                  <select onChange={handleClientSelect} style={inputStyle} defaultValue="">
                    <option value="" disabled>-- Select Contact --</option>
                    {contacts.map(c => <option key={c.Contact_ID} value={c.Contact_ID}>{c.Name} ({c.Email})</option>)}
                  </select>
                </div>
                <div style={{ height:1, background:'#e5e7eb', margin:'4px 0' }}/>
                <div><label style={labelStyle}>Client Name</label><input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="e.g. Jane Smith" style={inputStyle}/></div>
                <div><label style={labelStyle}>Client Email *</label><input type="email" value={clientEmail} onChange={e=>setClientEmail(e.target.value)} placeholder="client@email.com" style={inputStyle}/></div>
                <div><label style={labelStyle}>Due Date</label><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={inputStyle}/></div>
              </div>
            </div>
          )}

          {/* LINE ITEMS TAB */}
          {sidebarTab==='items' && (
            <div style={{ padding:'24px' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>Line Items</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {lineItems.map((item, i) => (
                  <div key={item.id} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'#6b7280' }}>Item {i+1}</span>
                      <button onClick={()=>removeItem(item.id)} style={{ border:'none', background:'none', cursor:'pointer', color:'#d1d5db', padding:2 }}><Trash2 size={13}/></button>
                    </div>
                    <input value={item.description} onChange={e=>updateItem(item.id,'description',e.target.value)} placeholder="Description" style={{ ...inputStyle, marginBottom:6 }}/>
                    <div style={{ display:'flex', gap:6 }}>
                      <div style={{ flex:1 }}>
                        <label style={{ ...labelStyle, fontSize:10 }}>Qty</label>
                        <input type="number" value={item.quantity} onChange={e=>updateItem(item.id,'quantity',parseFloat(e.target.value)||0)} style={{ ...inputStyle, textAlign:'center' as const }}/>
                      </div>
                      <div style={{ flex:2 }}>
                        <label style={{ ...labelStyle, fontSize:10 }}>Price ($)</label>
                        <input type="number" value={item.price} onChange={e=>updateItem(item.id,'price',parseFloat(e.target.value)||0)} style={inputStyle}/>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' as const, fontSize:12, fontWeight:700, color:themeColor, marginTop:6 }}>${(item.quantity*item.price).toFixed(2)}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addItem} style={{ flex: 1, display:'flex', alignItems:'center', gap:6, border:'1.5px dashed #d1d5db', borderRadius:8, padding:'10px', background:'transparent', cursor:'pointer', fontSize:13, fontWeight:600, color:'#6b7280', justifyContent:'center' }}>
                    <Plus size={14}/> Add Custom Item
                  </button>
                  <select onChange={addPackageToLineItems} defaultValue="" style={{ flex: 1, border:'1.5px dashed #d1d5db', borderRadius:8, padding:'10px', background:'transparent', cursor:'pointer', fontSize:13, fontWeight:600, color:'#0d9488', outline: 'none' }}>
                    <option value="" disabled>+ Add Package</option>
                    {availablePackages.map(p => <option key={p.Package_ID} value={p.Package_ID}>{p.Name} (${p.Price})</option>)}
                  </select>
                </div>
                <div style={{ borderTop:'2px solid #e5e7eb', paddingTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:800, fontSize:14, color:'#111827' }}>Total</span>
                  <span style={{ fontWeight:800, fontSize:18, color:themeColor }}>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT TAB */}
          {sidebarTab==='payment' && (
            <div style={{ padding:'24px' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>Payment Methods</div>
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:20, lineHeight:1.5 }}>Select the payment methods you accept and enter your details to show them on the invoice.</div>
              {paymentMethods.map(m => (
                <div key={m.id} style={{ marginBottom:16, border:'1px solid #e5e7eb', borderRadius:8, padding:12, background:m.enabled?'#f8fafc':'#fff' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:m.enabled?12:0 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>{m.name}</span>
                    <div onClick={()=>togglePaymentMethod(m.id)} style={{ width:36, height:20, borderRadius:10, padding:2, background:m.enabled?themeColor:'#d1d5db', cursor:'pointer', display:'flex', alignItems:'center' }}>
                      <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', transform:m.enabled?'translateX(16px)':'translateX(0)', transition:'transform 0.2s' }}/>
                    </div>
                  </div>
                  {m.enabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <textarea value={m.details} onChange={e=>updatePaymentMethod(m.id, 'details', e.target.value)} rows={3} placeholder={`${m.name} details...`} style={{ ...inputStyle, resize:'vertical' as const }} />
                      <input type="url" value={m.paymentLink || ''} onChange={e=>updatePaymentMethod(m.id, 'paymentLink', e.target.value)} placeholder="Payment Link (URL)" style={inputStyle} />
                      <div style={{ fontSize: 12 }}>
                        {m.qrCode ? (
                          <div style={{ display:'flex', alignItems:'center', gap: 10, background:'#fff', padding:8, borderRadius:6, border:'1px solid #e5e7eb' }}>
                            <img src={m.qrCode} alt="QR Code" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                            <button onClick={()=>updatePaymentMethod(m.id, 'qrCode', '')} style={{ border:'none', background:'none', color:'#dc2626', cursor:'pointer', fontSize:12, fontWeight:600 }}>Remove QR</button>
                          </div>
                        ) : (
                          <label style={{ display:'block', cursor:'pointer', padding:'8px 12px', border:'1px dashed #d1d5db', borderRadius:6, textAlign:'center', color:'#6b7280', fontWeight:600 }}>
                            Upload QR Code
                            <input type="file" accept="image/*" style={{ display:'none' }} onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => updatePaymentMethod(m.id, 'qrCode', ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }} />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* DESIGN TAB */}
          {sidebarTab==='design' && (
            <div style={{ padding:'24px' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>Design & Theme</div>
              
              <div style={{ marginBottom:24 }}>
                <label style={labelStyle}>Theme Color</label>
                <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap' }}>
                  {themeColors.map(c => (
                    <div key={c} onClick={()=>setThemeColor(c)} style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', border:themeColor===c?'2px solid #111827':'2px solid transparent', outline:themeColor===c?'2px solid #fff':'none', boxShadow:themeColor===c?'0 0 0 4px #111827':'none' }}/>
                  ))}
                  <input type="color" value={themeColor} onChange={e=>setThemeColor(e.target.value)} style={{ width:28, height:28, padding:0, border:'none', cursor:'pointer', background:'transparent' }}/>
                </div>
              </div>

              <div style={{ height:1, background:'#e5e7eb', margin:'20px 0' }}/>

              <div>
                <label style={labelStyle}>Business Logo</label>
                <div style={{ fontSize:12, color:'#6b7280', marginBottom:12, lineHeight:1.5 }}>
                  {businessLogo ? 'Your logo from Settings will be displayed on the invoice.' : 'No logo found in Settings. Go to Settings > General to upload one.'}
                </div>
                {businessLogo && (
                  <>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, background:'#f9fafb', padding:10, borderRadius:8, border:'1px solid #e5e7eb' }}>
                      <span style={{ fontSize:12, fontWeight:600 }}>Show Logo on Invoice</span>
                      <div onClick={()=>setShowLogo(!showLogo)} style={{ width:36, height:20, borderRadius:10, padding:2, background:showLogo?themeColor:'#d1d5db', cursor:'pointer', display:'flex', alignItems:'center' }}>
                        <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', transform:showLogo?'translateX(16px)':'translateX(0)', transition:'transform 0.2s' }}/>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* EMAIL TAB */}
          {sidebarTab==='email' && (
            <div style={{ padding:'24px' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>Email Settings</div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div><label style={labelStyle}>Email Header</label><textarea value={emailHeader} onChange={e=>setEmailHeader(e.target.value)} rows={3} style={{ ...inputStyle, resize:'vertical' as const, lineHeight:1.5 }}/></div>
                <div><label style={labelStyle}>Email Footer</label><textarea value={emailFooter} onChange={e=>setEmailFooter(e.target.value)} rows={4} style={{ ...inputStyle, resize:'vertical' as const, lineHeight:1.5 }}/></div>
                <div style={{ padding:12, background:themeColor+'10', borderRadius:8, border:`1px solid ${themeColor}40`, fontSize:12, color:themeColor }}>
                  <div style={{ fontWeight:700, marginBottom:4 }}>Preview</div>
                  <div style={{ fontStyle:'italic' }}>📨 {emailHeader}</div>
                  <div style={{ color:'#6b7280', marginTop:6 }}>{emailFooter}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Editor + Preview */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#f1f5f9', minHeight:0, overflow:'hidden' }}>
          <Toolbar editor={editor}/>
          <div style={{ flex:1, padding:'40px 48px 80px', overflowY:'auto' }}>
            <style dangerouslySetInnerHTML={{ __html: `.ib-canvas .ProseMirror{outline:none;min-height:200px;}.ib-canvas .ProseMirror h1{font-size:2rem;font-weight:800;margin:0 0 1rem;color:#111827;}.ib-canvas .ProseMirror h2{font-size:1.5rem;font-weight:700;margin:1.5rem 0 0.75rem;color:#111827;}.ib-canvas .ProseMirror p{margin:0 0 1rem;line-height:1.75;color:#374151;}.ib-canvas .ProseMirror hr{border:none;border-top:2px solid #e5e7eb;margin:1.5rem 0;}` }}/>
            <div className="ib-canvas" style={{ maxWidth:820, margin:'0 auto', background:'#fff', borderRadius:4, border:'1px solid #e5e7eb', boxShadow:'0 2px 20px rgba(0,0,0,0.06)', padding:'60px 72px', minHeight:900 }}>
              {/* Invoice Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:40 }}>
                <div style={{ flex: 1 }}>
                  {(showLogo && businessLogo) ? (
                    <img src={businessLogo} alt="Logo" style={{ maxWidth:200, maxHeight:80, objectFit:'contain', marginBottom:16 }}/>
                  ) : null}
                  <div style={{ fontSize:32, fontWeight:900, color:themeColor, letterSpacing:'-0.02em', textTransform:'uppercase' }}>INVOICE</div>
                  <div style={{ fontSize:14, color:'#6b7280', marginTop:4 }}>#{draftId ? String(draftId).padStart(4,'0') : '0001'}</div>
                </div>
                <div style={{ textAlign:'right' as const, flex: 1 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:'#111827' }}>{companyName || 'Your Business'}</div>
                  {businessAddress && <div style={{ fontSize:13, color:'#6b7280', marginTop:4, whiteSpace:'pre-wrap' }}>{businessAddress}</div>}
                  <div style={{ marginTop: 24 }}>
                    {clientName && <div style={{ fontSize:13, color:'#6b7280', fontWeight:600 }}>Bill To: {clientName}</div>}
                    {clientEmail && <div style={{ fontSize:13, color:'#6b7280' }}>{clientEmail}</div>}
                    {dueDate && <div style={{ fontSize:13, color:themeColor, fontWeight:700, marginTop:4 }}>Due: {dueDate}</div>}
                  </div>
                </div>
              </div>

              <EditorContent editor={editor}/>

              {/* Line Items Table */}
              {lineItems.length > 0 && (
                <div style={{ marginTop:32 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:14 }}>
                    <thead>
                      <tr style={{ background:themeColor, color:'#fff' }}>
                        {['Description','Qty','Unit Price','Total'].map(h => <th key={h} style={{ padding:'12px 16px', textAlign:h==='Description'?'left' as const:'right' as const, fontWeight:700, fontSize:12 }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item,i) => (
                        <tr key={item.id} style={{ background:i%2===0?'#fff':'#f8fafc', borderBottom:'1px solid #e5e7eb' }}>
                          <td style={{ padding:'12px 16px', color:'#374151' }}>{item.description || '—'}</td>
                          <td style={{ padding:'12px 16px', textAlign:'right' as const, color:'#374151' }}>{item.quantity}</td>
                          <td style={{ padding:'12px 16px', textAlign:'right' as const, color:'#374151' }}>${Number(item.price).toFixed(2)}</td>
                          <td style={{ padding:'12px 16px', textAlign:'right' as const, fontWeight:700, color:'#111827' }}>${(item.quantity*item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop:`2px solid ${themeColor}` }}>
                        <td colSpan={3} style={{ padding:'16px', textAlign:'right' as const, fontWeight:800, fontSize:15, color:'#111827' }}>TOTAL DUE</td>
                        <td style={{ padding:'16px', textAlign:'right' as const, fontWeight:900, fontSize:20, color:themeColor }}>${subtotal.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Payment Methods */}
              {paymentMethods.some(m => m.enabled) && (
                <div style={{ marginTop:40, paddingTop:20, borderTop:'2px solid #e5e7eb' }}>
                  <div style={{ fontSize:14, fontWeight:800, color:themeColor, marginBottom:12, textTransform:'uppercase' }}>Payment Options</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    {paymentMethods.filter(m => m.enabled).map(m => (
                      <div key={m.id} style={{ background:'#f9fafb', padding:16, borderRadius:8, border:'1px solid #e5e7eb' }}>
                        <div style={{ fontSize:12, fontWeight:800, color:'#374151', marginBottom:4 }}>{m.name}</div>
                        <div style={{ fontSize:13, color:'#6b7280', whiteSpace:'pre-wrap' }}>{m.details}</div>
                        {m.qrCode && <img src={m.qrCode} alt={`${m.name} QR Code`} style={{ width: 80, height: 80, objectFit: 'contain', marginTop: 12, display: 'block', borderRadius: 4 }} />}
                        {m.paymentLink && <div style={{ marginTop: 12 }}><a href={m.paymentLink} target="_blank" rel="noreferrer" style={{ color: themeColor, textDecoration: 'underline', fontSize: 13, fontWeight: 700 }}>Pay via {m.name}</a></div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSaveTemplate && <SaveTemplateModal onSave={saveTemplate} onClose={()=>setShowSaveTemplate(false)}/>}
      {showLoadTemplate && <LoadTemplateModal onLoad={loadTemplate} onClose={()=>setShowLoadTemplate(false)} apiPath="/api/invoice-actions?type=templates" deleteApiPath="/api/invoice-actions?type=template"/>}
    </div>
  );
}
