'use client';
import { useState } from 'react';
import Link from 'next/link';
const API = process.env.NEXT_PUBLIC_API_URL;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || 'Login failed');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{width: '100%', maxWidth: '420px'}}>

        {/* LOGO */}
        <div style={{textAlign: 'center', marginBottom: '40px'}}>
          <span style={{fontSize: '48px'}}>🤝</span>
          <h1 style={{color: '#64b5f6', fontSize: '24px', fontWeight: 'bold', margin: '8px 0 4px'}}>CommunityShare</h1>
          <p style={{color: '#546e7a', fontSize: '14px'}}>Welcome back!</p>
        </div>

        {/* CARD */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(100,181,246,0.2)',
          borderRadius: '24px', padding: '40px'
        }}>
          <h2 style={{color: 'white', fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center'}}>
            Login to your account
          </h2>

          {/* ERROR */}
          {error && (
            <div style={{
              background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)',
              borderRadius: '10px', padding: '12px', marginBottom: '20px',
              color: '#ef9a9a', fontSize: '14px', textAlign: 'center'
            }}>{error}</div>
          )}

          {/* EMAIL */}
          <div style={{marginBottom: '16px'}}>
            <label style={{color: '#90a4ae', fontSize: '13px', display: 'block', marginBottom: '8px'}}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '12px 16px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', color: 'white',
                fontSize: '14px', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* PASSWORD */}
          <div style={{marginBottom: '24px'}}>
            <label style={{color: '#90a4ae', fontSize: '13px', display: 'block', marginBottom: '8px'}}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%', padding: '12px 16px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', color: 'white',
                fontSize: '14px', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '16px', fontWeight: '600', cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(21,101,192,0.4)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Logging in...' : 'Login →'}
          </button>

          {/* REGISTER LINK */}
          <p style={{color: '#546e7a', textAlign: 'center', marginTop: '20px', fontSize: '14px'}}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" style={{color: '#64b5f6', textDecoration: 'none', fontWeight: '500'}}>
              Register here
            </Link>
          </p>
        </div>

        {/* BACK HOME */}
        <p style={{textAlign: 'center', marginTop: '20px'}}>
          <Link href="/" style={{color: '#546e7a', textDecoration: 'none', fontSize: '14px'}}>
            ← Back to Home
          </Link>
        </p>

      </div>
    </main>
  );
}
