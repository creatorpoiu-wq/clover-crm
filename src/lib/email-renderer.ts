import { EMAIL_DEFAULTS } from "@/app/api/email-settings/route";

export interface GlobalEmailSettings {
  appBackground: string;
  contentBackground: string;
  primaryColor: string;
  headerImage: string;
  fontFamily: string;
  footerText: string;
  contentPadding: string;
  borderRadius: string;
}

/**
 * Wraps HTML email content inside the Global Brand wrapper.
 * @param innerHtml The raw HTML of the email (from a WYSIWYG editor or constructed manually)
 * @param companyName The company name to display in the header
 * @param globalSettings The global branding settings (defaults to EMAIL_DEFAULTS.global)
 * @param overrideAccentColor Optionally override the header background / primary color for this specific email
 * @param headerText Optional header text to show under the company name in the colored banner
 */
export function wrapWithGlobalBranding(
  innerHtml: string,
  companyName: string,
  globalSettings?: GlobalEmailSettings | null,
  overrideAccentColor?: string,
  headerText?: string
): string {
  const g = globalSettings || EMAIL_DEFAULTS.global;
  const ac = overrideAccentColor || g.primaryColor || "#0f172a";
  const name = companyName || "Your Company";

  let headerHtml = "";
  if (g.headerImage) {
    headerHtml = `
      <div style="background-color: ${ac};">
        <img src="${g.headerImage}" alt="Header" style="width: 100%; display: block; object-fit: cover; border-top-left-radius: ${g.borderRadius}; border-top-right-radius: ${g.borderRadius};" />
      </div>
    `;
  } else {
    headerHtml = `
      <div style="background-color: ${ac}; padding: 28px 32px; border-top-left-radius: ${g.borderRadius}; border-top-right-radius: ${g.borderRadius};">
        <div style="color: #ffffff; font-weight: 800; font-size: 18px; margin-bottom: 6px; font-family: ${g.fontFamily};">${name}</div>
        ${headerText ? `<div style="color: rgba(255,255,255,0.85); font-size: 14px; font-family: ${g.fontFamily};">${headerText}</div>` : ""}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${name}</title>
      <style>
        body { margin: 0; padding: 0; background-color: ${g.appBackground}; font-family: ${g.fontFamily}; }
        .wrapper { background-color: ${g.appBackground}; padding: 40px 20px; }
        .content { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: ${g.contentBackground}; 
          border-radius: ${g.borderRadius}; 
          overflow: hidden; 
          font-size: 15px; 
          color: #374151;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .body-content {
          padding: ${g.contentPadding};
        }
        .footer {
          background-color: rgba(0,0,0,0.02);
          padding: 14px 32px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
          font-size: 11px;
          color: #9ca3af;
        }
        a.button {
          display: inline-block;
          background-color: ${ac};
          color: #ffffff;
          padding: 13px 28px;
          border-radius: 8px;
          font-weight: 700;
          text-decoration: none;
        }
        p { margin: 0 0 16px; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="content">
          ${headerHtml}
          
          <div class="body-content">
            ${g.headerImage ? `<div style="font-weight: 800; font-size: 18px; margin-bottom: 16px; color: ${ac};">${name}</div>` : ""}
            ${innerHtml}
          </div>
          
          <div class="footer">
            ${g.footerText || ('Sent via ' + name)}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
