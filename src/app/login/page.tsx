'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Check for error in URL on mount (e.g. from expired reset links)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('error');
      if (urlError) setError(urlError);
    }
  }, []);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/confirm` },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Account created! Please check your email to confirm your account before logging in.');
      setEmail('');
      setPassword('');
      setIsLogin(true);
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/confirm?next=/dashboard/settings`, 
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset instructions have been sent to your email.');
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isForgotPassword) {
      handleForgotPassword(e);
    } else if (isLogin) {
      handleLogin(e);
    } else {
      handleSignup(e);
    }
  };

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setError(null);
    setMessage(null);
  };

  const toggleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsForgotPassword(true);
    setError(null);
    setMessage(null);
  };

  const backToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsForgotPassword(false);
    setIsLogin(true);
    setError(null);
    setMessage(null);
  };

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
            background-color: #fbfcfa;
            color: #2c2c2c;
            -webkit-font-smoothing: antialiased;
            height: 100vh;
            overflow: hidden;
        }

        .page-container {
            display: flex;
            height: 100vh;
            width: 100vw;
        }

        /* Left Side: Form Panel */
        .form-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 40px;
            max-width: 560px;
            width: 100%;
            background-color: #fbfcfa;
        }

        .brand-header .logo {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            letter-spacing: 0.5px;
            text-decoration: none;
            color: #1a1a1a;
        }

        .brand-header .logo::after {
            content: '.';
            color: #4da685;
        }

        .form-wrapper {
            max-width: 360px;
            width: 100%;
            margin: 0 auto;
        }

        .form-wrapper h2 {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 400;
            color: #1a1a1a;
            margin-bottom: 8px;
        }

        .form-wrapper .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 32px;
            font-weight: 300;
        }

        .form-wrapper .subtitle a {
            color: #4da685;
            text-decoration: none;
            font-weight: 500;
        }

        .form-wrapper .subtitle a:hover {
            text-decoration: underline;
        }

        /* Form Controls */
        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 8px;
            color: #1a1a1a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-group input {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid #e2e2e0;
            border-radius: 4px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            background-color: #fff;
            color: #1a1a1a;
            transition: all 0.2s ease;
            outline: none;
        }

        .form-group input:focus {
            border-color: #4da685;
            box-shadow: 0 0 0 3px rgba(77, 166, 133, 0.1);
        }

        .form-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            margin-bottom: 28px;
        }

        .remember-me {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #5c5c5c;
            cursor: pointer;
        }

        .remember-me input {
            accent-color: #4da685;
            cursor: pointer;
        }

        .forgot-pass {
            color: #5c5c5c;
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .forgot-pass:hover {
            color: #1a1a1a;
        }

        /* Action Buttons */
        .btn-submit {
            width: 100%;
            padding: 14px;
            background-color: #4da685;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
            letter-spacing: 0.3px;
        }

        .btn-submit:hover {
            background-color: #3f9072;
        }

        .form-footer {
            font-size: 12px;
            color: #8c8c8c;
            text-align: center;
            font-weight: 300;
        }

        /* Right Side: Creative Visual Panel */
        .visual-panel {
            flex: 1;
            background-color: #e8f5f0; /* Soft mint tint */
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px;
            position: relative;
        }

        /* Clean geometric accent frame acting as an abstract placeholder for a gorgeous photo */
        .visual-container {
            max-width: 480px;
            text-align: left;
        }

        .visual-container h3 {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 400;
            line-height: 1.3;
            color: #244d3e; /* Deep rich mint-derived tone */
            margin-bottom: 16px;
        }

        .visual-container p {
            font-size: 16px;
            color: #3b876a;
            font-weight: 300;
            line-height: 1.6;
        }

        /* Responsive styling */
        @media (max-width: 900px) {
            .visual-panel {
                display: none;
            }
            .form-panel {
                max-width: 100%;
            }
        }
      `}} />

      <div className="page-container">
          
          {/* Left Section: Interactive Form */}
          <div className="form-panel">
              <div className="brand-header">
                  <Link href="/" className="logo">clover</Link>
              </div>

              <div className="form-wrapper" id="login-view">
                  <h2>{isForgotPassword ? "Reset Password" : (isLogin ? "Welcome back" : "Create your account")}</h2>
                  <p className="subtitle">
                    {isForgotPassword ? (
                      <>Remembered it? <a href="#" onClick={backToLogin}>Log in</a></>
                    ) : isLogin ? (
                      <>Don't have an account? <a href="#" onClick={toggleMode}>Sign up for free</a></>
                    ) : (
                      <>Already have an account? <a href="#" onClick={toggleMode}>Log in</a></>
                    )}
                  </p>

                  {error && (
                    <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '4px', fontSize: '13px', border: '1px solid #fca5a5' }}>
                      {error}
                    </div>
                  )}

                  {message && (
                    <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#e8f5f0', color: '#3b876a', borderRadius: '4px', fontSize: '13px', border: '1px solid #4da685' }}>
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                      <div className="form-group">
                          <label htmlFor="email">Email Address</label>
                          <input 
                            type="email" 
                            id="email" 
                            autoComplete="email" 
                            required 
                            placeholder="name@studio.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                      </div>

                      {!isForgotPassword && (
                        <div className="form-group">
                            <label htmlFor="password">{isLogin ? "Password" : "Create Password"}</label>
                            <input 
                              type="password" 
                              id="password" 
                              autoComplete={isLogin ? "current-password" : "new-password"} 
                              required 
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              minLength={isLogin ? undefined : 6}
                            />
                        </div>
                      )}

                      {!isForgotPassword && isLogin && (
                        <div className="form-options">
                            <label className="remember-me">
                                <input type="checkbox" id="remember" />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="forgot-pass" onClick={toggleForgotPassword}>Forgot password?</a>
                        </div>
                      )}

                      <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Processing...' : (isForgotPassword ? "Send Reset Link" : (isLogin ? "Sign In" : "Create Account"))}
                      </button>
                  </form>
              </div>

              <div className="form-footer">
                  <p>&copy; {new Date().getFullYear()} Clover Technologies. All rights reserved.</p>
              </div>
          </div>

          {/* Right Section: Inspiring Editorial Sidebar */}
          <div className="visual-panel">
              <div className="visual-container">
                  <h3>Built so you can focus on the art, not the paperwork.</h3>
                  <p>Join thousands of professional creators managing their entire photography business seamlessly from one beautiful dashboard.</p>
              </div>
          </div>

      </div>
    </>
  );
}
