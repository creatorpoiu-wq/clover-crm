'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Edit3, MoreHorizontal, ChevronDown, Plus, Save, FolderOpen,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough as StrikeIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Minus, RemoveFormatting,
  Send, RotateCcw, PenLine
} from 'lucide-react';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Node, mergeAttributes } from '@tiptap/core';
import { ContactPickerModal, SaveTemplateModal, LoadTemplateModal } from './ContractBuilderModals';
import ContractSignatureSection from './ContractSignatureSection';
import SignaturePad from 'signature_pad';

// ─── Custom Variable Node ────────────────────────────────────────────────────
const VariableComponent = ({ node }: any) => (
  <NodeViewWrapper as="span" style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '1px 8px', margin: '0 4px',
    color: '#0d9488', background: '#f0fdfa',
    border: '1.5px dashed #5eead4', borderRadius: '4px',
    fontSize: '0.88em', fontWeight: 700,
    userSelect: 'none', cursor: 'default', verticalAlign: 'baseline',
  }}>
    {node.attrs.label}
  </NodeViewWrapper>
);

const VariableNode = Node.create({
  name: 'variable', group: 'inline', inline: true, selectable: true, atom: true,
  addAttributes() { return { label: { default: 'Variable' } }; },
  parseHTML() { return [{ tag: 'span[data-variable]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-variable': true }), HTMLAttributes.label];
  },
  addNodeView() { return ReactNodeViewRenderer(VariableComponent); },
});

// ─── Custom Input Node ───────────────────────────────────────────────────────
const InputComponent = ({ node }: any) => (
  <NodeViewWrapper as="span" style={{ display: 'inline-flex', verticalAlign: 'baseline', margin: '0 2px' }}>
    <input 
      type="text" 
      placeholder={node.attrs.placeholder} 
      style={{
        border: 'none', borderBottom: '1px solid #9ca3af', background: 'transparent',
        padding: '2px 4px', fontSize: 'inherit', fontFamily: 'inherit',
        color: '#111827', outline: 'none', minWidth: '120px'
      }} 
    />
  </NodeViewWrapper>
);

const InputNode = Node.create({
  name: 'customInput', group: 'inline', inline: true, selectable: true, atom: true,
  addAttributes() { return { placeholder: { default: 'Client Input' } }; },
  parseHTML() { return [{ tag: 'input[data-custom-input]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['input', mergeAttributes(HTMLAttributes, { 
      'data-custom-input': true, 
      type: 'text', 
      style: 'border: none; border-bottom: 1px solid #9ca3af; background: transparent; padding: 2px 4px; font-size: inherit; font-family: inherit; outline: none; min-width: 120px;' 
    })];
  },
  addNodeView() { return ReactNodeViewRenderer(InputComponent); },
});

// ─── Custom Checkbox Node ────────────────────────────────────────────────────
const CheckboxComponent = ({ node, updateAttributes }: any) => {
  const isRequired = !!node.attrs.required;
  return (
    <NodeViewWrapper as="span" style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'baseline', margin: '0 4px', userSelect: 'none' }}>
      <input 
        type="checkbox" 
        style={{ cursor: 'pointer', width: '14px', height: '14px', verticalAlign: 'middle' }} 
        checked={isRequired}
        readOnly
      />
      <span 
        onClick={() => updateAttributes({ required: !isRequired })}
        style={{ 
          fontSize: '10px', 
          marginLeft: '4px', 
          padding: '2px 6px',
          borderRadius: '4px',
          fontWeight: 700,
          cursor: 'pointer',
          backgroundColor: isRequired ? '#fee2e2' : '#f3f4f6',
          color: isRequired ? '#ef4444' : '#6b7280',
          border: isRequired ? '1px solid #fca5a5' : '1px solid #e5e7eb'
        }}
      >
        {isRequired ? 'Required' : 'Optional'}
      </span>
    </NodeViewWrapper>
  );
};

const CheckboxNode = Node.create({
  name: 'customCheckbox', group: 'inline', inline: true, selectable: true, atom: true,
  addAttributes() {
    return {
      required: {
        default: false,
        parseHTML: element => element.hasAttribute('required') || element.getAttribute('data-required') === 'true',
        renderHTML: attributes => {
          if (attributes.required) {
            return { required: 'required', 'data-required': 'true' };
          }
          return {};
        }
      }
    };
  },
  parseHTML() { return [{ tag: 'input[data-custom-checkbox]' }]; },
  renderHTML({ HTMLAttributes, node }) {
    const requiredAttrs = node?.attrs?.required ? { required: 'required', 'data-required': 'true' } : {};
    return ['input', mergeAttributes(HTMLAttributes, { 
      'data-custom-checkbox': true, 
      type: 'checkbox', 
      style: 'width: 14px; height: 14px; vertical-align: middle;',
      ...requiredAttrs
    })];
  },
  addNodeView() { return ReactNodeViewRenderer(CheckboxComponent); },
});

// ─── Toolbar ─────────────────────────────────────────────────────────────────
const S = {
  toolbar: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const,
    gap: '2px', padding: '8px 20px',
    background: '#fff', borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky' as const, top: 0, zIndex: 10,
  },
  btn: (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
    background: active ? '#e0f2fe' : 'transparent',
    color: active ? '#0369a1' : '#4b5563',
    transition: 'background 0.15s',
  }),
  divider: { width: 1, height: 24, background: '#e5e7eb', margin: '0 6px', flexShrink: 0 } as React.CSSProperties,
  select: {
    padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6,
    fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer',
    outline: 'none', marginRight: 8,
  } as React.CSSProperties,
};

const EditorToolbar = ({ editor }: { editor: any }) => {
  const [showVars, setShowVars] = useState(false);
  if (!editor) return null;

  const insertVariable = (label: string) => {
    editor.chain().focus().insertContent({ type: 'variable', attrs: { label } }).insertContent(' ').run();
    setShowVars(false);
  };

  const btn = (active: boolean) => S.btn(active);

  return (
    <div style={S.toolbar}>
      <select style={S.select} onChange={(e) => {
        if (e.target.value === 'p') editor.chain().focus().setParagraph().run();
        else editor.chain().focus().toggleHeading({ level: parseInt(e.target.value) as any }).run();
      }}>
        <option value="p">Normal text</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>

      <div style={S.divider} />

      {[
        { icon: <Bold size={15}/>, fn: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
        { icon: <Italic size={15}/>, fn: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
        { icon: <UnderlineIcon size={15}/>, fn: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
        { icon: <StrikeIcon size={15}/>, fn: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike') },
      ].map((b, i) => (
        <button key={i} onClick={b.fn} style={btn(b.active)}>{b.icon}</button>
      ))}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="color"
          onInput={(e) => editor.chain().focus().setColor(e.currentTarget.value).run()}
          value={editor.getAttributes('textStyle').color || '#000000'}
          style={{
            width: 24, height: 24, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer',
            background: 'transparent', outline: 'none'
          }}
          title="Text Color"
        />
      </div>

      <div style={S.divider} />

      {[
        { icon: <AlignLeft size={15}/>, fn: () => editor.chain().focus().setTextAlign('left').run(), active: editor.isActive({ textAlign: 'left' }) },
        { icon: <AlignCenter size={15}/>, fn: () => editor.chain().focus().setTextAlign('center').run(), active: editor.isActive({ textAlign: 'center' }) },
        { icon: <AlignRight size={15}/>, fn: () => editor.chain().focus().setTextAlign('right').run(), active: editor.isActive({ textAlign: 'right' }) },
        { icon: <AlignJustify size={15}/>, fn: () => editor.chain().focus().setTextAlign('justify').run(), active: editor.isActive({ textAlign: 'justify' }) },
      ].map((b, i) => (
        <button key={i} onClick={b.fn} style={btn(b.active)}>{b.icon}</button>
      ))}

      <div style={S.divider} />

      {[
        { icon: <List size={15}/>, fn: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
        { icon: <ListOrdered size={15}/>, fn: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
        { icon: <Minus size={15}/>, fn: () => editor.chain().focus().setHorizontalRule().run(), active: false },
        { icon: <Edit3 size={15}/>, fn: () => {}, active: false },
        { icon: <RemoveFormatting size={15}/>, fn: () => editor.chain().focus().clearNodes().unsetAllMarks().run(), active: false },
      ].map((b, i) => (
        <button key={i} onClick={b.fn} style={btn(b.active)}>{b.icon}</button>
      ))}

      <div style={S.divider} />

      {/* Insert Fields */}
      <button
        onClick={() => editor.chain().focus().insertContent({ type: 'customInput' }).insertContent(' ').run()}
        style={{ ...btn(false), padding: '0 10px', width: 'auto', fontSize: 13, fontWeight: 600, color: '#374151', gap: 4 }}
        title="Insert a text input field for the client to fill"
      >
        <PenLine size={14} /> Insert Input
      </button>

      <button
        onClick={() => editor.chain().focus().insertContent({ type: 'customCheckbox' }).insertContent(' ').run()}
        style={{ ...btn(false), padding: '0 10px', width: 'auto', fontSize: 13, fontWeight: 600, color: '#374151', gap: 4 }}
        title="Insert a checkbox"
      >
        <List size={14} /> Insert Checkbox
      </button>

      {/* Variables dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowVars(!showVars)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
            border: '1px solid #d1d5db', borderRadius: 6, background: '#fff',
            fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
            minWidth: 110,
          }}
        >
          Variables <ChevronDown size={13} style={{ color: '#9ca3af' }} />
        </button>
        {showVars && (
          <div style={{
            position: 'absolute', top: '100%', marginTop: 4, right: 0,
            width: 200, background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 99, overflow: 'hidden',
          }}>
            {[
              { group: 'Signer 1', fields: ['Client Name', 'Client Email'] },
              { group: 'Signer 2', fields: ['Photographer Name'] },
              { group: 'Document', fields: ['Contract Date', 'Total Amount', 'Effective Date'] },
            ].map(({ group, fields }) => (
              <div key={group}>
                <div style={{ padding: '6px 12px', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  {group}
                </div>
                {fields.map(f => (
                  <button key={f} onClick={() => insertVariable(f)} style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px',
                    fontSize: 13, color: '#374151', background: 'transparent', border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {f}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <div
    onClick={onToggle}
    style={{
      width: 40, height: 22, borderRadius: 11, padding: 2,
      background: on ? '#14b8a6' : '#d1d5db',
      cursor: 'pointer', transition: 'background 0.2s',
      display: 'flex', alignItems: 'center',
      flexShrink: 0,
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transform: on ? 'translateX(18px)' : 'translateX(0)',
      transition: 'transform 0.2s',
    }} />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
interface ContractBuilderProps {
  onClose: () => void;
  onSave: (htmlContent: string, title?: string) => void;
  onDraftSaved?: () => void;
  initialClient?: { Contact_ID: number; Name: string; Email: string };
  documentType?: "Contract" | "Proposal" | "Invoice";
  isTemplateMode?: boolean;
  initialTitle?: string;
  initialContent?: string;
}

export default function ContractBuilder({ onClose, onSave, onDraftSaved, initialClient, documentType = "Contract", isTemplateMode, initialTitle, initialContent }: ContractBuilderProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [expiryOn, setExpiryOn] = useState(false);
  const [remindersOn, setRemindersOn] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [draftId, setDraftId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [contractTitle, setContractTitle] = useState(initialTitle || `Sample Client ${documentType}`);
  const [editingTitle, setEditingTitle] = useState(false);
  const [statusBadge, setStatusBadge] = useState<'Draft' | 'Sent'>('Draft');
  const [companyName, setCompanyName] = useState('');
  const [sendMethod, setSendMethod] = useState<'Standalone' | 'PortraitFunnel' | 'WeddingFunnel'>('Standalone');

  // Fetch company name from settings
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const name = d.config?.companyName || d.config?.Company_Name || d.companyName || d.Company_Name || '';
        if (name) {
          setCompanyName(name);
          setVariables(prev => ({ ...prev, 'Photographer Name': name }));
          setEmailHeader(`You have received a ${documentType.toLowerCase()} from ${name}`);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-fill client variables when initialClient is provided
  useEffect(() => {
    if (initialClient) {
      setVariables(prev => ({
        ...prev,
        'Client Name': initialClient.Name || '',
        'Client Email': initialClient.Email || '',
      }));
    }
  }, [initialClient]);

  // Variables for document field population
  const [variables, setVariables] = useState<Record<string, string>>({
    'Client Name': '', 'Client Email': '', 'Photographer Name': '',
    'Contract Date': new Date().toLocaleDateString(),
    'Total Amount': '', 'Deposit Percentage': '50', 'Deposit Amount': '', 'Balance Due': '',
    'Effective Date': new Date().toLocaleDateString(),
  });

  // Automatically calculate deposit/balance based on Total Amount
  useEffect(() => {
    const total = parseFloat(variables['Total Amount'].replace(/[^0-9.]/g, ''));
    if (!isNaN(total) && total > 0) {
      const pct = parseFloat(variables['Deposit Percentage']) || 50;
      const deposit = (total * pct) / 100;
      const balance = total - deposit;
      setVariables(prev => ({
        ...prev,
        'Deposit Amount': `$${deposit.toFixed(2)}`,
        'Balance Due': `$${balance.toFixed(2)}`
      }));
    }
  }, [variables['Total Amount'], variables['Deposit Percentage']]);

  // Email header/footer
  const [emailHeader, setEmailHeader] = useState(`You have received a new ${documentType.toLowerCase()}`);
  const [emailFooter, setEmailFooter] = useState('Please review the agreement carefully. Reply to this email with any questions.');

  // Provider (owner) pre-saved signature
  const providerSigCanvasRef = useRef<HTMLCanvasElement>(null);
  const providerSigPadRef = useRef<any>(null);
  const [providerSigDataUrl, setProviderSigDataUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('provider_signature');
    return null;
  });
  const [showProviderSigPad, setShowProviderSigPad] = useState(false);

  const [availablePackages, setAvailablePackages] = useState<any[]>([]);

  // Sidebar active tab
  const [sidebarTab, setSidebarTab] = useState<'signers' | 'packages' | 'variables' | 'email' | 'settings'>('signers');

  // Init signature pad for provider when pad is shown
  useEffect(() => {
    if (!showProviderSigPad || !providerSigCanvasRef.current) return;
    const canvas = providerSigCanvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);
    const pad = new SignaturePad(canvas, { minWidth: 1, maxWidth: 2.5, penColor: '#1e3a5f', backgroundColor: 'rgba(0,0,0,0)' });
    providerSigPadRef.current = pad;
    return () => { pad.off(); };
  }, [showProviderSigPad]);

  const tagColors = [
    ['#166534', '#dcfce7'], ['#1e40af', '#dbeafe'], ['#6b21a8', '#f3e8ff'],
    ['#9a3412', '#ffedd5'], ['#c2185b', '#fdf2f4'],
  ];

  const buildClientSigner = (c: { Name: string; Email: string }, idx: number) => {
    const [color, bg] = tagColors[idx % tagColors.length];
    const initials = c.Name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    return { initials, name: c.Name, email: c.Email, bg, color };
  };

  const ownerSigner = useMemo(() => ({
    initials: companyName.slice(0, 2).toUpperCase() || 'ME',
    name: `${companyName || 'Service Provider'} (You)`,
    email: 'owner@yourstudio.com',
    bg: '#fdf2f4', color: '#c2185b'
  }), [companyName]);

  const [signers, setSigners] = useState(() => {
    if (initialClient) {
      return [buildClientSigner(initialClient, 0)];
    }
    return [];
  });

  const addContactAsSigner = (c: { Contact_ID: number; Name: string; Email: string }) => {
    if (signers.find(s => s.email === c.Email)) return;
    const idx = signers.length % tagColors.length;
    const [color, bg] = tagColors[idx];
    const initials = c.Name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    setSigners(prev => [{ initials, name: c.Name, email: c.Email, bg, color }, ...prev]);
  };

  const removeSigner = (email: string) => setSigners(prev => prev.filter(s => s.email !== email));

  const saveAsTemplate = async (name: string) => {
    if (!editor) return;
    await fetch('/api/contract-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content: editor.getHTML() }),
    });
    setSaveMsg(`✓ Saved as "${name}"`);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const loadTemplate = (content: string) => {
    if (editor) editor.commands.setContent(content);
  };

  const saveDraft = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/contract-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_draft',
          title: contractTitle,
          content: editor.getHTML(),
          signers,
          draftId,
          type: documentType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDraftId(data.draftId);
        setStatusBadge('Draft');
        setSaveMsg('✓ Draft saved');
        setTimeout(() => setSaveMsg(''), 3000);
        onDraftSaved?.(); // notify finance page to refresh
      }
    } finally {
      setIsSaving(false);
    }
  };

  const sendContract = async () => {
    if (!editor) return;
    const clientSigners = signers.filter(s => !s.email.includes('owner@yourstudio'));
    if (clientSigners.length === 0) {
      setSaveMsg('⚠ Add a client signer first');
      setTimeout(() => setSaveMsg(''), 4000);
      return;
    }
    setIsSending(true);
    // Resolve variables in content
    let resolvedContent = editor.getHTML();
    Object.entries(variables).forEach(([key, val]) => {
      if (val) resolvedContent = resolvedContent.replace(new RegExp(key, 'g'), val);
    });
    try {
      const res = await fetch('/api/contract-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_contract',
          title: contractTitle,
          content: resolvedContent,
          signers,
          draftId,
          providerSignatureDataUrl: providerSigDataUrl,
          emailHeader,
          emailFooter,
          type: documentType,
          sendMethod, // Standalone, PortraitFunnel, or WeddingFunnel
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusBadge('Sent');
        setSaveMsg(`✓ Sent to ${data.sentTo?.join(', ')}`);
        setTimeout(() => setSaveMsg(''), 5000);
        onSave(editor.getHTML());
      } else {
        setSaveMsg(`⚠ ${data.error}`);
        setTimeout(() => setSaveMsg(''), 6000);
      }
    } finally {
      setIsSending(false);
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Color,
      TextStyle,
      VariableNode,
      InputNode,
      CheckboxNode,
    ],
    content: initialContent || `
      <h1 style="text-align:center;font-size:2rem;font-weight:800;margin-bottom:1rem;color:#111827;">${documentType === 'Proposal' ? 'Project Proposal' : documentType === 'Invoice' ? 'Invoice' : 'Photography Services Agreement'}</h1>
      <p style="text-align:center;color:#6b7280;margin-bottom:1.5rem;">Effective Date: <span data-variable="true" label="Effective Date"></span></p>
      <hr style="border:none;border-top:2px solid #e5e7eb;margin:1.5rem 0;"/>
      <p style="margin-bottom:1rem;line-height:1.7;color:#374151;">This Photography Services Agreement (the "Agreement") is entered into by and between <span data-variable="true" label="Client Name"></span> ("Client") and <span data-variable="true" label="Photographer Name"></span> ("Photographer").</p>
      <h3 style="font-size:1.1rem;font-weight:700;margin:1.5rem 0 0.5rem;color:#111827;">1. Services Provided</h3>
      <p style="margin-bottom:1rem;line-height:1.7;color:#374151;">The Photographer agrees to provide photography services as outlined in the accepted project proposal.</p>
      <h3 style="font-size:1.1rem;font-weight:700;margin:1.5rem 0 0.5rem;color:#111827;">2. How to use this template</h3>
      <ul style="padding-left:1.5rem;margin-bottom:1rem;">
        <li style="margin-bottom:0.4rem;line-height:1.6;color:#374151;">Use the <strong>Insert Field</strong> button in the toolbar to add dynamic variables.</li>
        <li style="margin-bottom:0.4rem;line-height:1.6;color:#374151;">Format your text using the standard tools above.</li>
        <li style="margin-bottom:0.4rem;line-height:1.6;color:#374151;">When sent, variables automatically populate with the signer's information.</li>
      </ul>
      <h3 style="font-size:1.1rem;font-weight:700;margin:1.5rem 0 0.5rem;color:#111827;">3. Disclaimer</h3>
      <p style="line-height:1.7;color:#374151;"><em>This is a sample document and does not constitute legal advice. Please review carefully before sending.</em></p>
    `,
    editorProps: {
      attributes: { style: 'outline:none;min-height:800px;font-family:Georgia,serif;font-size:15px;color:#1f2937;line-height:1.8;' },
    },
  });

  // Force-load initialContent once the editor is ready (handles async Tiptap init timing)
  useEffect(() => {
    if (editor && initialContent) {
      // Use a short timeout to ensure the editor DOM is fully mounted
      const timer = setTimeout(() => {
        editor.commands.setContent(initialContent);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [editor, initialContent]);

  if (!mounted) return null;


  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      background: '#f9fafb', fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: '#111827',
    }}>
      {/* ── Top Nav Bar ── */}
      <div style={{
        height: 64, background: '#fff', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'transparent', cursor: 'pointer', color: '#6b7280',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {editingTitle ? (
                <input
                  autoFocus
                  value={contractTitle}
                  onChange={e => setContractTitle(e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
                  style={{ fontWeight: 700, fontSize: 16, border: 'none', borderBottom: '2px solid #0d9488', outline: 'none', background: 'transparent', minWidth: 200 }}
                />
              ) : (
                <span onClick={() => setEditingTitle(true)} style={{ fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                  {contractTitle}
                </span>
              )}
              <Edit3 size={13} style={{ color: '#9ca3af', cursor: 'pointer' }} onClick={() => setEditingTitle(true)} />
              <span style={{
                padding: '2px 10px',
                background: statusBadge === 'Sent' ? '#dcfce7' : '#f3f4f6',
                color: statusBadge === 'Sent' ? '#166534' : '#6b7280',
                fontSize: 11, fontWeight: 700, borderRadius: 20, letterSpacing: '0.05em',
              }}>{statusBadge.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>No project</div>
          </div>
        </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isTemplateMode ? (
            <button onClick={() => { if (editor) onSave(editor.getHTML(), contractTitle); }} style={{
              padding: '8px 20px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            }}>
              Save Template
            </button>
          ) : (
            <>
            {/* Load Template */}
          <button onClick={() => setShowLoadTemplate(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: 6,
            background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: '#374151',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <FolderOpen size={14} /> Templates
          </button>
          {/* Save Template */}
          <button onClick={() => setShowSaveTemplate(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: 6,
            background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: '#374151',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Save size={14} /> Save as Template
          </button>
          {saveMsg && <span style={{ fontSize: 12, color: saveMsg.startsWith('⚠') ? '#dc2626' : '#0d9488', fontWeight: 600 }}>{saveMsg}</span>}
          <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }} />
          {/* Save Draft */}
          <button onClick={saveDraft} disabled={isSaving} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', border: '1px solid #e5e7eb', borderRadius: 6,
            background: 'transparent', cursor: isSaving ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, color: '#374151',
            opacity: isSaving ? 0.6 : 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Save size={14} /> {isSaving ? 'Saving…' : 'Save Draft'}
          </button>
          
          <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }} />
          
          {/* Send Method Dropdown */}
          <select 
            value={sendMethod}
            onChange={(e) => setSendMethod(e.target.value as any)}
            style={{
              padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6,
              background: '#f9fafb', fontSize: 13, color: '#374151',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="Standalone">Direct Link</option>
            <option value="PortraitFunnel">Portrait Funnel</option>
            <option value="WeddingFunnel">Wedding Funnel</option>
          </select>
          {/* Send Contract */}
          <button onClick={sendContract} disabled={isSending} style={{
            padding: '8px 20px',
            background: isSending ? '#6b7280' : '#0d9488',
            color: '#fff', border: 'none', borderRadius: 7,
            cursor: isSending ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 700,
            boxShadow: '0 2px 6px rgba(13,148,136,0.3)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
          onMouseEnter={e => { if (!isSending) e.currentTarget.style.background = '#0f766e'; }}
          onMouseLeave={e => { if (!isSending) e.currentTarget.style.background = '#0d9488'; }}
          >
            {isSending ? 'Sending…' : `Send ${documentType}`}
          </button>
          </>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ── Left Sidebar ── */}
        <div style={{
          width: 320, background: '#fff', borderRight: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
        }}>
          {/* Sidebar tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
            {(['signers', 'packages', 'variables', 'email', 'settings'] as const).map(tab => (
              <button key={tab} onClick={() => setSidebarTab(tab)} style={{
                flex: 1, padding: '12px 6px', border: 'none', background: 'transparent',
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: sidebarTab === tab ? '#0d9488' : '#9ca3af',
                borderBottom: sidebarTab === tab ? '2px solid #0d9488' : '2px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{tab}</button>
            ))}
          </div>

          {/* SIGNERS TAB */}
          {sidebarTab === 'signers' && (
            <div style={{ padding: '24px 24px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Signers</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {signers.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{s.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</div>
                    </div>
                    <button onClick={() => removeSigner(s.email)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', padding: 4 }}>
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowContactPicker(true)} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0d9488', padding: 0 }}>
                <Plus size={15} /> Add signer from contacts
              </button>

              {/* Provider signature pre-save */}
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Your Signature</div>
                {providerSigDataUrl ? (
                  <div>
                    <img src={providerSigDataUrl} alt="Your signature" style={{ width: '100%', height: 80, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa', padding: 4 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => { setProviderSigDataUrl(null); localStorage.removeItem('provider_signature'); setShowProviderSigPad(true); }}
                        style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>
                        Re-sign
                      </button>
                    </div>
                  </div>
                ) : showProviderSigPad ? (
                  <div>
                    <div style={{ border: '1.5px dashed #d1d5db', borderRadius: 8, height: 100, position: 'relative', background: '#fafafa', cursor: 'crosshair' }}>
                      <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 11, color: '#9ca3af', pointerEvents: 'none' }}>Draw your signature</span>
                      <canvas ref={providerSigCanvasRef} style={{ width: '100%', height: '100%', borderRadius: 8, display: 'block' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => {
                        if (!providerSigPadRef.current) return;
                        const dataUrl = providerSigPadRef.current.toDataURL();
                        setProviderSigDataUrl(dataUrl);
                        localStorage.setItem('provider_signature', dataUrl);
                        setShowProviderSigPad(false);
                      }} style={{ flex: 2, padding: '7px', border: 'none', borderRadius: 6, background: '#0d9488', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Save Signature</button>
                      <button onClick={() => { providerSigPadRef.current?.clear(); }}
                        style={{ flex: 1, padding: '7px', border: '1px solid #e5e7eb', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 11, color: '#6b7280' }}>Clear</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowProviderSigPad(true)}
                    style={{ width: '100%', padding: '10px', border: '1.5px dashed #d1d5db', borderRadius: 8, background: '#fafafa', cursor: 'pointer', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                    + Add your pre-signature
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PACKAGES TAB */}
          {sidebarTab === 'packages' && (
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Inject Packages</div>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>Select a package to inject its details directly into the contract text.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {availablePackages.map(pkg => (
                  <div key={pkg.Package_ID} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#f9fafb' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>{pkg.Name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 8px' }}>${pkg.Price} &middot; {pkg.Duration || 'No Duration'}</div>
                    <button onClick={() => {
                      let html = `<p><strong>Package:</strong> ${pkg.Name}<br/><strong>Price:</strong> $${pkg.Price}`;
                      if (pkg.Duration) html += `<br/><strong>Duration:</strong> ${pkg.Duration}`;
                      if (pkg.Description) html += `<br/><strong>Description:</strong> ${pkg.Description}`;
                      if (pkg.Items) {
                         const items = typeof pkg.Items === 'string' && pkg.Items.startsWith('[') ? JSON.parse(pkg.Items) : pkg.Items.split('\n').filter(Boolean);
                         if (items.length > 0) html += `<br/><strong>Included:</strong><ul>${items.map((i:any)=>`<li>${i}</li>`).join('')}</ul>`;
                      }
                      html += `</p>`;
                      editor?.chain().focus().insertContent(html).run();
                    }} style={{ width: '100%', padding: '6px 0', border: '1px dashed #0d9488', borderRadius: 6, background: '#f0fdfa', color: '#0d9488', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Inject into Document
                    </button>
                  </div>
                ))}
                {availablePackages.length === 0 && <div style={{ fontSize: 13, color: '#9ca3af' }}>No packages found.</div>}
              </div>
            </div>
          )}

          {/* VARIABLES TAB */}
          {sidebarTab === 'variables' && (
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Document Variables</div>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>These values replace variable fields in the contract when the email is sent.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(variables).map(([key, val]) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{key}</label>
                    <input
                      value={val}
                      onChange={e => setVariables(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Enter ${key}…`}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EMAIL TAB */}
          {sidebarTab === 'email' && (
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Email Settings</div>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 20, lineHeight: 1.5 }}>Customize the header and footer shown in the email sent to the client.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Email Header</label>
                  <textarea
                    value={emailHeader}
                    onChange={e => setEmailHeader(e.target.value)}
                    rows={3}
                    placeholder="e.g. You have received a contract from…"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, color: '#374151', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Email Footer / Notes</label>
                  <textarea
                    value={emailFooter}
                    onChange={e => setEmailFooter(e.target.value)}
                    rows={4}
                    placeholder="e.g. Please review and reply with any questions…"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, color: '#374151', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
                  />
                </div>
                <div style={{ padding: 12, background: '#f0fdfa', borderRadius: 8, border: '1px solid #ccfbf1' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', marginBottom: 4 }}>Preview</div>
                  <div style={{ fontSize: 12, color: '#374151', fontStyle: 'italic', lineHeight: 1.5 }}>📨 {emailHeader}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8, lineHeight: 1.5 }}>{emailFooter}</div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {sidebarTab === 'settings' && (
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Settings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {[
                  { label: 'Document Expiry', on: expiryOn, toggle: () => setExpiryOn(!expiryOn), desc: 'Set contract to auto cancel if not completed by the expiry date.' },
                  { label: 'Document Reminders', on: remindersOn, toggle: () => setRemindersOn(!remindersOn), desc: 'Automatically send email reminders to signers who have not yet signed.' },
                ].map(({ label, on, toggle, desc }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{label}</span>
                        <span style={{ padding: '2px 8px', background: '#f0fdfa', color: '#0d9488', border: '1px solid #ccfbf1', fontSize: 9, fontWeight: 800, borderRadius: 20, textTransform: 'uppercase' as const }}>✦ Upgrade</span>
                      </div>
                      <Toggle on={on} onToggle={toggle} />
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Editor Area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f1f5f9', minHeight: 0, overflow: 'hidden' }}>
          <EditorToolbar editor={editor} />
          <div style={{ flex: 1, padding: '40px 48px 80px', overflowY: 'auto' }}>
            <style dangerouslySetInnerHTML={{ __html: `
              .cb-canvas .ProseMirror { outline: none; min-height: 800px; }
              .cb-canvas .ProseMirror h1 { font-size: 2rem; font-weight: 800; margin: 0 0 1rem; line-height: 1.2; color: #111827; }
              .cb-canvas .ProseMirror h2 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: #111827; }
              .cb-canvas .ProseMirror h3 { font-size: 1.1rem; font-weight: 700; margin: 1.5rem 0 0.5rem; color: #111827; }
              .cb-canvas .ProseMirror p { margin: 0 0 1rem; line-height: 1.75; color: #374151; }
              .cb-canvas .ProseMirror ul { list-style: disc; padding-left: 1.5rem; margin: 0 0 1rem; }
              .cb-canvas .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin: 0 0 1rem; }
              .cb-canvas .ProseMirror li { margin-bottom: 0.4rem; line-height: 1.6; color: #374151; }
              .cb-canvas .ProseMirror hr { border: none; border-top: 2px solid #e5e7eb; margin: 1.5rem 0; }
              .cb-canvas .ProseMirror strong { font-weight: 700; }
              .cb-canvas .ProseMirror em { font-style: italic; }
            `}} />
            <div className="cb-canvas" style={{
              maxWidth: 820, margin: '0 auto',
              background: '#fff', borderRadius: 4,
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
              padding: '80px 96px',
              minHeight: 1056,
            }}>
              <EditorContent editor={editor} />
              <ContractSignatureSection signers={signers} providerSignatureDataUrl={providerSigDataUrl} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showContactPicker && (
        <ContactPickerModal
          onSelect={addContactAsSigner}
          onClose={() => setShowContactPicker(false)}
        />
      )}
      {showSaveTemplate && (
        <SaveTemplateModal
          onSave={saveAsTemplate}
          onClose={() => setShowSaveTemplate(false)}
        />
      )}
      {showLoadTemplate && (
        <LoadTemplateModal
          onLoad={loadTemplate}
          onClose={() => setShowLoadTemplate(false)}
        />
      )}
    </div>,
    document.body
  );
}
