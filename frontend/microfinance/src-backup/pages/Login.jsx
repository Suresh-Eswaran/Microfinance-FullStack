import { AlertTriangle, Check, Eye, EyeOff, Lock, Mail, Shield, Sparkles, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState(
    location.state?.registered
      ? '🎉 Account verified successfully! Please sign in with your credentials.'
      : (location.state?.message || '')
  );

  useEffect(() => {
    if (location.state?.email) {
      setForm(f => ({ ...f, email: location.state.email }));
    } else {
      const savedEmail = localStorage.getItem('mf_remembered_email');
      if (savedEmail) {
        setForm(f => ({ ...f, email: savedEmail }));
        setRememberMe(true);
      }
    }
  }, [location.state]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleKeyUp = e => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const fillDemoAccount = (email, password) => {
    setForm({ email, password });
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('mf_remembered_email', form.email);
      } else {
        localStorage.removeItem('mf_remembered_email');
      }

      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">💰</div>
          <div>
            <div className="auth-logo-text">MicroFin</div>
            <div className="auth-logo-sub">Loan Management System</div>
          </div>
        </div>

        <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
        <p style={{ marginBottom: 24, fontSize: '0.875rem' }}>Sign in to your account to continue</p>

        {successNotice && (
          <div className="alert alert-success" role="status" style={{ marginBottom: 16 }}>
            <Check size={16} /> {successNotice}
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Lock size={15} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div>{error}</div>
                {error.toLowerCase().includes('not verified') && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{
                      marginTop: 8,
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'var(--color-red)'
                    }}
                    onClick={() => navigate('/verify-otp', { state: { email: form.email, purpose: 'registration' } })}
                  >
                    Enter OTP to activate account →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="login-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="officer@microfinance.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="auth-header-row">
              <label className="form-label" htmlFor="login-password" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" className="auth-link" id="forgot-password-link">
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="login-password"
                className="form-input"
                type={showPw ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyUp}
                required
                autoComplete="current-password"
                style={{ paddingLeft: 38, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {capsLockActive && (
              <div className="caps-warning" role="alert">
                <AlertTriangle size={14} /> Caps Lock is ON
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              Remember my email
            </label>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          >
            {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in…</> : 'Sign in'}
          </button>
        </form>

        {/* Demo Quick Logins Helper */}
        <div className="demo-accounts-box">
          <div className="demo-accounts-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={13} color="var(--color-primary)" /> Quick Demo Fill
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to autofill</span>
          </div>
          <div className="demo-pills">
            <button
              type="button"
              className="demo-pill-btn"
              onClick={() => fillDemoAccount('admin@microfin.com', 'admin123')}
            >
              <Shield size={12} /> Admin
            </button>
            <button
              type="button"
              className="demo-pill-btn"
              onClick={() => fillDemoAccount('officer@microfin.com', 'officer123')}
            >
              <UserCheck size={12} /> Loan Officer
            </button>
            <button
              type="button"
              className="demo-pill-btn"
              onClick={() => fillDemoAccount('manager@microfin.com', 'manager123')}
            >
              🏢 Manager
            </button>
            <button
              type="button"
              className="demo-pill-btn"
              onClick={() => fillDemoAccount('client@microfin.com', 'client123')}
            >
              👤 Client
            </button>
          </div>
        </div>

        <div className="auth-divider" style={{ marginTop: 24 }}>
          <span>Don't have an account?</span>
        </div>
        <Link
          to="/register"
          id="go-to-register-link"
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
