export interface PreDesignedTemplate {
  id: string;
  type: 'email' | 'contract' | 'invoice';
  title: string;
  subtitle: string;
  image: string;
  subject?: string;
  body?: string;
  content?: string;
}

export const PRE_DESIGNED_TEMPLATES: PreDesignedTemplate[] = [
  // --- EMAILS ---
  {
    id: 'e1',
    type: 'email',
    title: 'Client Welcome & Onboarding',
    subtitle: 'Email Template',
    image: '/templates/email.png',
    subject: 'Welcome to [Business Name]! Let\'s get started',
    body: `<p>Hi [Client Name],</p>
<p>I'm so thrilled to welcome you to <strong>[Business Name]</strong>! We're incredibly excited to have the opportunity to work with you.</p>
<p>Attached to your portal, you'll find everything you need to get started, including a brief questionnaire to help us learn more about your needs, and your initial invoice.</p>
<p>Here’s a quick overview of our next steps:</p>
<ol>
  <li>Please complete the onboarding questionnaire by [Date].</li>
  <li>We'll schedule our kickoff call for next week.</li>
  <li>Once the contract and retainer are completed, we'll dive right in!</li>
</ol>
<p>If you have any questions at all, please don't hesitate to reach out. We're here to help.</p>
<p>Best regards,<br>[Your Name]</p>`
  },
  {
    id: 'e2',
    type: 'email',
    title: 'Follow-up / Checking In',
    subtitle: 'Email Template',
    image: '/templates/email.png',
    subject: 'Checking in regarding your project',
    body: `<p>Hi [Client Name],</p>
<p>I hope you're having a great week!</p>
<p>I'm just circling back on the proposal I sent over on [Date]. Have you had a chance to review it? I'd love to jump on a quick call to answer any questions you might have or clarify any of the details.</p>
<p>Let me know if you're available for a 15-minute chat sometime this week.</p>
<p>Looking forward to hearing from you soon.</p>
<p>Best,<br>[Your Name]</p>`
  },
  {
    id: 'e3',
    type: 'email',
    title: 'Meeting Reminder',
    subtitle: 'Email Template',
    image: '/templates/email.png',
    subject: 'Reminder: Upcoming meeting tomorrow',
    body: `<p>Hi [Client Name],</p>
<p>This is a friendly reminder about our scheduled meeting tomorrow at [Time].</p>
<p>We'll be meeting via [Zoom / Phone / In-Person Location]. If you need to reschedule for any reason, please let me know as soon as possible by replying to this email.</p>
<p>Looking forward to our chat!</p>
<p>Best,<br>[Your Name]</p>`
  },

  // --- CONTRACTS ---
  {
    id: 'c1',
    type: 'contract',
    title: 'Standard Service Agreement',
    subtitle: 'Contract Template',
    image: '/templates/contract.png',
    content: `<h2>1. SERVICES PROVIDED</h2>
<p>The Service Provider agrees to perform the following services for the Client: [Insert detailed description of services here]. The services will be completed by [End Date].</p>
<h2>2. PAYMENT TERMS</h2>
<p>The Client agrees to pay the Service Provider the total sum of [Total Amount]. A non-refundable retainer of [Retainer Amount] is due upon signing this agreement. The remaining balance is due upon completion of the services.</p>
<h2>3. CANCELLATION POLICY</h2>
<p>Either party may terminate this agreement with [Number] days written notice. In the event of cancellation by the Client, the retainer fee is non-refundable.</p>
<h2>4. CONFIDENTIALITY</h2>
<p>The Service Provider agrees to keep all information shared by the Client confidential and will not disclose any information to third parties without prior written consent.</p>
<h2>5. GOVERNING LAW</h2>
<p>This agreement shall be governed by and construed in accordance with the laws of the State of [State].</p>`
  },
  {
    id: 'c2',
    type: 'contract',
    title: 'Photography & Media Services',
    subtitle: 'Contract Template',
    image: '/templates/contract.png',
    content: `<h2>1. EVENT DETAILS</h2>
<p>The Photographer agrees to provide photography services for the Client's event taking place on [Event Date] at [Location] starting at [Start Time] and ending at [End Time].</p>
<h2>2. DELIVERABLES</h2>
<p>The Photographer will deliver a minimum of [Number] edited, high-resolution digital images to the Client via a secure online gallery within [Number] weeks of the event date.</p>
<h2>3. COPYRIGHT AND USAGE</h2>
<p>The Photographer retains the copyright to all images taken at the event. The Client is granted a personal, non-commercial license to use, print, and share the images online. Any commercial use requires additional written permission.</p>
<h2>4. MEALS AND BREAKS</h2>
<p>For events lasting longer than 5 hours, the Client agrees to provide a meal for the Photographer and their assistants.</p>
<h2>5. LIABILITY</h2>
<p>If the Photographer is unable to perform the services due to illness, emergency, or other unforeseen circumstances, a suitable replacement will be found or a full refund will be issued.</p>`
  },

  // --- INVOICES ---
  {
    id: 'i1',
    type: 'invoice',
    title: 'Standard Final Invoice',
    subtitle: 'Invoice Template',
    image: '/templates/invoice.png',
    content: `<div style="padding: 2rem; border: 1px solid #e2e8f0; border-radius: 8px; font-family: sans-serif;">
  <div style="display: flex; justify-content: space-between; margin-bottom: 2rem;">
    <div>
      <h2 style="margin: 0; color: #0f172a;">[Business Name]</h2>
      <p style="margin: 0.25rem 0; color: #64748b;">[Business Address]</p>
      <p style="margin: 0; color: #64748b;">[Business Email]</p>
    </div>
    <div style="text-align: right;">
      <h1 style="margin: 0; color: #0d9488; font-size: 2rem;">INVOICE</h1>
      <p style="margin: 0.25rem 0; color: #64748b;">Invoice #: INV-0001</p>
      <p style="margin: 0; color: #64748b;">Date: [Date]</p>
    </div>
  </div>
  
  <div style="margin-bottom: 2rem; padding: 1rem; background: #f8fafc; border-radius: 4px;">
    <p style="margin: 0 0 0.5rem 0; font-weight: bold; color: #334155;">Bill To:</p>
    <p style="margin: 0; color: #475569;">[Client Name]</p>
    <p style="margin: 0; color: #475569;">[Client Address]</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
    <thead>
      <tr style="border-bottom: 2px solid #e2e8f0;">
        <th style="padding: 0.75rem; text-align: left; color: #475569;">Description</th>
        <th style="padding: 0.75rem; text-align: right; color: #475569;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 0.75rem;">Professional Services Rendered</td>
        <td style="padding: 0.75rem; text-align: right;">$0.00</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 0.75rem;">Materials / Expenses</td>
        <td style="padding: 0.75rem; text-align: right;">$0.00</td>
      </tr>
    </tbody>
  </table>

  <div style="display: flex; justify-content: flex-end;">
    <div style="width: 300px;">
      <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-weight: bold; font-size: 1.2rem; color: #0f172a; border-top: 2px solid #0d9488;">
        <span>Total Due:</span>
        <span>$0.00</span>
      </div>
    </div>
  </div>
  
  <div style="margin-top: 3rem; text-align: center; color: #94a3b8; font-size: 0.9rem;">
    <p>Thank you for your business!</p>
    <p>Payment is due within 15 days.</p>
  </div>
</div>`
  },
  {
    id: 'i2',
    type: 'invoice',
    title: 'Consulting Retainer',
    subtitle: 'Invoice Template',
    image: '/templates/invoice.png',
    content: `<div style="padding: 2rem; border: 1px solid #e2e8f0; border-radius: 8px; font-family: sans-serif;">
  <div style="text-align: center; margin-bottom: 2rem;">
    <h1 style="color: #0f172a; margin: 0;">RETAINER INVOICE</h1>
    <p style="color: #64748b; margin-top: 0.5rem;">[Business Name]</p>
  </div>
  
  <p style="color: #334155; font-size: 1.1rem; line-height: 1.6;">
    This invoice is for the upfront retainer required to commence work on <strong>[Project Name]</strong> for <strong>[Client Name]</strong>.
  </p>
  
  <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin: 2rem 0; border-left: 4px solid #0ea5e9;">
    <h3 style="margin: 0 0 1rem 0; color: #0f172a;">Retainer Details</h3>
    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
      <span style="color: #475569;">Description:</span>
      <span style="font-weight: 600; color: #0f172a;">Initial Project Retainer (50%)</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding-top: 0.5rem;">
      <span style="color: #475569;">Amount Due:</span>
      <span style="font-weight: bold; font-size: 1.25rem; color: #0ea5e9;">$0.00</span>
    </div>
  </div>
  
  <p style="color: #64748b; font-size: 0.95rem; text-align: center;">
    Work will begin immediately upon receipt of payment. Thank you!
  </p>
</div>`
  }
];
