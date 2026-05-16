import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #fbfcfa; /* Clean, slightly warm studio white */
            color: #2c2c2c;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }

        /* Header / Navigation */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 32px 40px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .logo {
            font-family: 'Playfair Display', serif;
            font-size: 26px;
            letter-spacing: 0.5px;
            font-weight: 400;
            text-decoration: none;
            color: #1a1a1a;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* Subtle dot in the accent color */
        .logo::after {
            content: '.';
            color: #4da685; /* Mint accent */
        }

        .nav-buttons {
            display: flex;
            align-items: center;
            gap: 28px;
        }

        .btn-login {
            text-decoration: none;
            color: #555;
            font-size: 14px;
            font-weight: 500;
            transition: color 0.2s ease;
        }

        .btn-login:hover {
            color: #1a1a1a;
        }

        .btn-primary {
            text-decoration: none;
            background-color: #1a1a1a;
            color: #fff;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 0.3px;
            transition: all 0.2s ease;
        }

        .btn-primary:hover {
            background-color: #2b2b2b;
        }

        /* Hero Section */
        .hero {
            max-width: 840px;
            margin: 0 auto;
            text-align: center;
            padding: 140px 20px 100px 20px;
        }

        /* Accent badge */
        .badge {
            display: inline-block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #3b876a; /* Darker mint for text readability */
            background-color: #e8f5f0; /* Soft mint tint */
            padding: 6px 16px;
            border-radius: 20px;
            margin-bottom: 24px;
            font-weight: 600;
        }

        .hero h1 {
            font-family: 'Playfair Display', serif;
            font-size: 56px;
            font-weight: 400;
            line-height: 1.25;
            color: #1a1a1a;
            margin-bottom: 24px;
        }

        .hero h1 em {
            font-style: italic;
            position: relative;
            display: inline-block;
        }

        /* Subtle mint underline highlight under the emphasized word */
        .hero h1 em::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: 4px;
            width: 100%;
            height: 8px;
            background-color: rgba(77, 166, 133, 0.15);
            z-index: -1;
        }

        .hero p {
            font-size: 18px;
            color: #5c5c5c;
            max-width: 580px;
            margin: 0 auto 44px auto;
            font-weight: 300;
        }

        /* Hero CTA specific style using the mint color */
        .btn-cta {
            background-color: #4da685; /* Fresh Mint */
            padding: 16px 36px;
            font-size: 15px;
            border: none;
        }

        .btn-cta:hover {
            background-color: #3f9072; /* Slightly deeper mint on hover */
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            header {
                padding: 24px 20px;
            }
            .hero {
                padding: 90px 20px 60px 20px;
            }
            .hero h1 {
                font-size: 40px;
            }
            .hero p {
                font-size: 16px;
                margin-bottom: 32px;
            }
        }
      `}} />

      <header>
        <Link href="/" className="logo">clover</Link>
        <div className="nav-buttons">
          <Link href="/login" className="btn-login">Log In</Link>
          <Link href="/signup" className="btn-primary">Get Started</Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <span className="badge">Studio Automation</span>
          <h1>Simplify your booking. Elevate your <em>client</em> experience.</h1>
          <p>Contracts, scheduling, and seamless payments designed beautifully for modern photographers.</p>
          <Link href="/signup" className="btn-primary btn-cta">Get Started Free</Link>
        </section>
      </main>
    </>
  );
}
