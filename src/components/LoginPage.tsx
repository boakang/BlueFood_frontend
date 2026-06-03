import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Đăng nhập thất bại');
      const data = text ? JSON.parse(text) : {};
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username || username);
      localStorage.setItem('role', data.role || 'User');
      localStorage.setItem('status', data.status || 'Active');
      navigate('/dashboard/overview');
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', padding: 44, borderRadius: 16, boxShadow: '0 18px 42px rgba(0,0,0,0.10)', width: 'min(520px, 100%)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 10, fontWeight: 700, fontSize: 40, color: '#222' }}>BlueFood</h1>
        <h2 style={{ textAlign: 'center', marginBottom: 32, fontWeight: 500, fontSize: 28, color: '#444' }}>Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, fontSize: 18 }}>Username</label>
            <input
              type="text"
              placeholder=""
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{ width: '100%', border: '1px solid #ccc', borderRadius: 10, padding: '16px 18px', fontSize: 20, outline: 'none', background: '#f7f7f7', color: '#222', minHeight: 58, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, fontSize: 18 }}>Password</label>
            <input
              type="password"
              placeholder=""
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', border: '1px solid #ccc', borderRadius: 10, padding: '16px 18px', fontSize: 20, outline: 'none', background: '#f7f7f7', color: '#222', minHeight: 58, boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '16px 18px', background: '#222', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 20, cursor: 'pointer', marginBottom: 16, minHeight: 58 }}>
            Login
          </button>
        </form>
        {error && <div style={{ color: 'red', marginBottom: 14, textAlign: 'center', fontSize: 17 }}>{error}</div>}
        <div style={{ textAlign: 'center', fontSize: 18, color: '#888', lineHeight: 1.5 }}>
          Don't have an account?{' '}
          <button type="button" style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 18 }} onClick={() => navigate('/register')}>Register</button>
        </div>
      </div>
    </div>
  );
}
