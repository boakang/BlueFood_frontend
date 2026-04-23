import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email })
      });
      if (!res.ok) throw new Error('Đăng ký thất bại');
      setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', padding: 44, borderRadius: 16, boxShadow: '0 18px 42px rgba(0,0,0,0.10)', width: 'min(520px, 100%)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 10, fontWeight: 700, fontSize: 40, color: '#222' }}>BlueFood</h1>
        <h2 style={{ textAlign: 'center', marginBottom: 32, fontWeight: 500, fontSize: 28, color: '#444' }}>Register</h2>
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
          <div style={{ marginBottom: 24 }}>
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
          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, fontSize: 18 }}>Email</label>
            <input
              type="email"
              placeholder=""
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', border: '1px solid #ccc', borderRadius: 10, padding: '16px 18px', fontSize: 20, outline: 'none', background: '#f7f7f7', color: '#222', minHeight: 58, boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '16px 18px', background: '#222', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 20, cursor: 'pointer', marginBottom: 16, minHeight: 58 }}>
            Register
          </button>
        </form>
        {error && <div style={{ color: 'red', marginBottom: 14, textAlign: 'center', fontSize: 17 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: 14, textAlign: 'center', fontSize: 17 }}>{success}</div>}
        <div style={{ textAlign: 'center', fontSize: 18, color: '#888', lineHeight: 1.5 }}>
          Already have an account?{' '}
          <button type="button" style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 18 }} onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    </div>
  );
}
