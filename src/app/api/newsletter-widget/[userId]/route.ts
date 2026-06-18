import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = (await params).userId;
    const supabase = getServiceClient();

    // Verify the user exists
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !user) {
      return new NextResponse('console.error("Newsletter widget: invalid user ID");', {
        headers: { 'Content-Type': 'application/javascript' },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clover-crm.vercel.app';
    const submitUrl = `${baseUrl}/api/newsletter-widget/submit`;

    // Customisation via query params
    const url = new URL(req.url);
    const inputBg    = url.searchParams.get('inputBg')    || '#ffffff';
    const inputColor = url.searchParams.get('inputColor') || '#1a1a1a';
    const btnBg      = url.searchParams.get('btnBg')      || '#c8c5b8';
    const btnColor   = url.searchParams.get('btnColor')   || '#1a1a1a';
    const btnText    = url.searchParams.get('btnText')    || 'SIGN UP';
    const placeholder= url.searchParams.get('placeholder')|| 'Email Address';
    const fontFamily = url.searchParams.get('font')       || '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const borderColor= url.searchParams.get('borderColor')|| '#aaaaaa';

    const js = `
(function() {
  if (document.getElementById('clvr-nl-root')) return;

  /* ── Styles ── */
  const style = document.createElement('style');
  style.textContent = \`
    #clvr-nl-root * { box-sizing: border-box; }
    #clvr-nl-root {
      display: inline-flex;
      align-items: stretch;
      width: 100%;
      max-width: 520px;
      font-family: ${fontFamily};
    }
    #clvr-nl-input {
      flex: 1;
      padding: 10px 14px;
      font-size: 14px;
      color: ${inputColor};
      background: ${inputBg};
      border: none;
      border-bottom: 1.5px solid ${borderColor};
      outline: none;
      letter-spacing: 0.02em;
    }
    #clvr-nl-input::placeholder { color: ${borderColor}; }
    #clvr-nl-btn {
      padding: 10px 22px;
      background: ${btnBg};
      color: ${btnColor};
      border: none;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.2s;
    }
    #clvr-nl-btn:hover { opacity: 0.85; }
    #clvr-nl-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    #clvr-nl-msg {
      display: none;
      font-size: 13px;
      font-family: ${fontFamily};
      margin-top: 8px;
      letter-spacing: 0.02em;
    }
    #clvr-nl-msg.success { color: #2d7a4f; }
    #clvr-nl-msg.error   { color: #c0392b; }
  \`;
  document.head.appendChild(style);

  /* ── Markup ── */
  const wrapper = document.createElement('div');
  wrapper.style.display = 'inline-block';
  wrapper.style.width = '100%';
  wrapper.style.maxWidth = '520px';

  const root = document.createElement('div');
  root.id = 'clvr-nl-root';

  const input = document.createElement('input');
  input.id = 'clvr-nl-input';
  input.type = 'email';
  input.placeholder = '${placeholder}';
  input.autocomplete = 'email';

  const btn = document.createElement('button');
  btn.id = 'clvr-nl-btn';
  btn.textContent = '${btnText}';

  const msg = document.createElement('div');
  msg.id = 'clvr-nl-msg';

  root.appendChild(input);
  root.appendChild(btn);
  wrapper.appendChild(root);
  wrapper.appendChild(msg);

  /* ── Mount: replace the current script tag ── */
  const scripts = document.querySelectorAll('script[src*="newsletter-widget"]');
  const currentScript = scripts[scripts.length - 1];
  if (currentScript && currentScript.parentNode) {
    currentScript.parentNode.insertBefore(wrapper, currentScript);
  } else {
    document.currentScript
      ? document.currentScript.parentNode.insertBefore(wrapper, document.currentScript)
      : document.body.appendChild(wrapper);
  }

  /* ── Submit handler ── */
  btn.addEventListener('click', submit);
  input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submit(); });

  async function submit() {
    const email = input.value.trim();
    if (!email || !email.includes('@')) {
      showMsg('Please enter a valid email address.', false);
      return;
    }
    btn.disabled = true;
    btn.textContent = '...';
    try {
      const res = await fetch('${submitUrl}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '${userId}', email })
      });
      const data = await res.json();
      if (data.success) {
        root.style.display = 'none';
        showMsg('Thank you for subscribing!', true);
      } else {
        showMsg(data.error || 'Something went wrong. Please try again.', false);
        btn.disabled = false;
        btn.textContent = '${btnText}';
      }
    } catch (e) {
      showMsg('Network error — please try again.', false);
      btn.disabled = false;
      btn.textContent = '${btnText}';
    }
  }

  function showMsg(text, success) {
    msg.textContent = text;
    msg.className = success ? 'success' : 'error';
    msg.style.display = 'block';
  }
})();
`;

    return new NextResponse(js, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new NextResponse(`console.error("Newsletter widget error: ${err.message}");`, {
      headers: { 'Content-Type': 'application/javascript' },
    });
  }
}
