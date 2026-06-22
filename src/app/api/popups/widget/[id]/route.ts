import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const popupId = (await params).id;

    // Fetch popup configuration
    const { data: popup, error } = await supabase
      .from('Marketing_Popups')
      .select('*')
      .eq('id', popupId)
      .eq('active', true)
      .single();

    if (error || !popup) {
      // If inactive or not found, return empty script
      return new NextResponse('console.log("Popup unavailable or inactive");', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }

    // Increment view count (async so it doesn't block)
    supabase.from('Marketing_Popups')
      .update({ view_count: (popup.view_count || 0) + 1 })
      .eq('id', popup.id)
      .then();

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clover-crm.vercel.app';
    const submitUrl = `${baseUrl}/api/popups/submit`;

    // Construct the Javascript widget
    // Note: We use vanilla JS to ensure it works on any platform (Wordpress, Shopify, static HTML, etc)
    const jsWidget = `
(function() {
  // Prevent multiple injections
  if (document.getElementById('crm-popup-${popup.id}')) return;

  const style = document.createElement('style');
  
  // Import Google Fonts
  style.innerHTML = \`
    @import url('https://fonts.googleapis.com/css2?family=\${(popup.font_header || 'Forum').replace(/ /g, '+')}:wght@400;700&family=\${(popup.font_body || 'Alata').replace(/ /g, '+')}:wght@400;700&display=swap');
    
    .crm-popup-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      font-family: \${popup.font_body ? '"' + popup.font_body + '"' : '"Alata"'}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .crm-popup-overlay.crm-show {
      opacity: 1;
      visibility: visible;
    }
    .crm-popup-container {
      background: white;
      border-radius: ${popup.modal_radius || '16px'};
      width: 90%;
      max-width: 400px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      transform: translateY(20px) scale(0.95);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
    }
    .crm-popup-overlay.crm-show .crm-popup-container {
      transform: translateY(0) scale(1);
    }
    .crm-popup-close {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255,255,255,0.8);
      border: none;
      border-radius: 50%;
      width: 32px; height: 32px;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #64748b;
      z-index: 10;
    }
    .crm-popup-image {
      width: 100%;
      height: 180px;
      background-size: cover;
      background-position: center;
      background-color: #f1f5f9;
    }
    .crm-popup-content {
      padding: 32px 24px;
      text-align: center;
    }
    .crm-popup-title {
      margin: 0 0 12px 0;
      font-family: \${popup.font_header ? '"' + popup.font_header + '"' : '"Forum"'}, serif;
      font-size: \${popup.font_header_size || '32px'};
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .crm-popup-desc {
      margin: 0 0 24px 0;
      font-size: \${popup.font_body_size || '15px'};
      color: #475569;
      line-height: 1.5;
    }
    .crm-popup-input {
      width: 100%;
      padding: 12px 16px;
      margin-bottom: 16px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 15px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
    }
    .crm-popup-input:focus {
      border-color: ${popup.button_color || '#3b82f6'};
    }
    .crm-popup-btn {
      width: 100%;
      padding: 14px 16px;
      background-color: ${popup.button_color || '#3b82f6'};
      color: white;
      border: none;
      border-radius: ${popup.button_radius || '8px'};
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .crm-popup-btn:hover {
      opacity: 0.9;
    }
    .crm-popup-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .crm-popup-success {
      display: none;
      flex-direction: column;
      align-items: center;
      padding: 40px 24px;
      text-align: center;
    }
    .crm-popup-success-icon {
      width: 64px; height: 64px;
      background: #dcfce7;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #166534;
      font-size: 32px;
      margin-bottom: 16px;
    }
  \`;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'crm-popup-${popup.id}';
  overlay.className = 'crm-popup-overlay';
  
  let imageHtml = '';
  if (${popup.image_url ? 'true' : 'false'}) {
    imageHtml = \`<div class="crm-popup-image" style="background-image: url('${popup.image_url}')"></div>\`;
  }

  const layout = '${popup.layout || 'image-top'}';
  const isHorizontal = layout === 'image-left' || layout === 'image-right';
  
  if (isHorizontal) {
    style.innerHTML += \`
      .crm-popup-container { max-width: 800px; display: flex; flex-direction: \${layout === 'image-left' ? 'row' : 'row-reverse'}; }
      .crm-popup-image { width: 50%; height: auto; min-height: 400px; }
      .crm-popup-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 48px 40px; }
    \`;
  } else {
    style.innerHTML += \`
      .crm-popup-container { max-width: 320px; display: flex; flex-direction: \${layout === 'image-bottom' ? 'column-reverse' : 'column'}; }
      .crm-popup-image { width: 100%; height: 140px; }
    \`;
  }

  overlay.innerHTML = \`
    <div class="crm-popup-container">
      <button class="crm-popup-close" id="crm-close-btn">&times;</button>
      \${imageHtml}
      <div class="crm-popup-content" id="crm-popup-form">
        <h2 class="crm-popup-title">${popup.headline.replace(/'/g, "\\'")}</h2>
        <p class="crm-popup-desc">${(popup.description || '').replace(/'/g, "\\'")}</p>
        <input type="text" id="crm-popup-name" class="crm-popup-input" placeholder="Your Name" required />
        <input type="email" id="crm-popup-email" class="crm-popup-input" placeholder="Your Email Address" required />
        <!-- Honeypot for spam -->
        <input type="text" id="crm-popup-hp" style="display:none" tabindex="-1" autocomplete="off" />
        <button id="crm-popup-submit" class="crm-popup-btn">${popup.button_text || 'Subscribe'}</button>
      </div>
      <div class="crm-popup-success" id="crm-popup-success">
        <div class="crm-popup-success-icon">✓</div>
        <h2 class="crm-popup-title">Thank You!</h2>
        <p class="crm-popup-desc">Your information has been received successfully.</p>
      </div>
    </div>
  \`;

  document.body.appendChild(overlay);

  const closeBtn = document.getElementById('crm-close-btn');
  const submitBtn = document.getElementById('crm-popup-submit');
  const formDiv = document.getElementById('crm-popup-form');
  const successDiv = document.getElementById('crm-popup-success');

  const closePopup = () => {
    overlay.classList.remove('crm-show');
    // Save to sessionStorage so we don't annoy them on every page load
    sessionStorage.setItem('crm_popup_closed_${popup.id}', 'true');
  };

  closeBtn.addEventListener('click', closePopup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePopup();
  });

  submitBtn.addEventListener('click', async () => {
    const name = document.getElementById('crm-popup-name').value;
    const email = document.getElementById('crm-popup-email').value;
    const hp = document.getElementById('crm-popup-hp').value;

    if (!email) return alert('Email is required');
    if (hp) return; // Honeypot filled by bot, silently ignore

    submitBtn.disabled = true;
    submitBtn.innerText = 'Sending...';

    try {
      const res = await fetch('${submitUrl}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          popupId: '${popup.id}',
          userId: '${popup.user_id}',
          name,
          email
        })
      });

      if (res.ok) {
        formDiv.style.display = 'none';
        successDiv.style.display = 'flex';
        sessionStorage.setItem('crm_popup_submitted_${popup.id}', 'true');
        setTimeout(closePopup, 3000);
      } else {
        alert('An error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerText = '${popup.button_text || 'Subscribe'}';
      }
    } catch (e) {
      alert('Network error. Please try again.');
      submitBtn.disabled = false;
      submitBtn.innerText = '${popup.button_text || 'Subscribe'}';
    }
  });

  // Show logic
  if (!sessionStorage.getItem('crm_popup_closed_${popup.id}') && !sessionStorage.getItem('crm_popup_submitted_${popup.id}')) {
    setTimeout(() => {
      overlay.classList.add('crm-show');
    }, ${popup.delay_seconds || 0} * 1000);
  }

})();
  `;

    return new NextResponse(jsWidget, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
      }
    });

  } catch (err: any) {
    console.error("Popup widget error:", err);
    return new NextResponse(`console.error("Failed to load popup: ${err.message}");`, {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}
