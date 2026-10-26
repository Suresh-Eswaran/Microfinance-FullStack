import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Sparkles,
  User
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'ADMIN',             label: 'Admin' },
  { value: 'BRANCH_MANAGER',    label: 'Branch Manager' },
  { value: 'CREDIT_OFFICER',    label: 'Credit Officer' },
  { value: 'LOAN_OFFICER',      label: 'Loan Officer' },
  { value: 'COLLECTIONS_AGENT', label: 'Collections Agent' },
  { value: 'CLIENT',            label: 'Client' },
];

const BRANCHES = [
  { value: 'Head Office',    label: 'Head Office' },
  { value: 'Main Branch',    label: 'Main Branch' },
  { value: 'North Branch',   label: 'North Branch' },
  { value: 'South Branch',   label: 'South Branch' },
  { value: 'East Branch',    label: 'East Branch' },
  { value: 'West Branch',    label: 'West Branch' },
  { value: 'Central Branch', label: 'Central Branch' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Registration Form, 2: OTP Verification
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'LOAN_OFFICER',
    branch: 'Head Office',
  });

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  const inputRefs = useRef([]);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Focus first input box when step 2 is active
  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Step 1: Submit details and trigger OTP
  const handleSubmitDetails = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await register(form);
      setStep(2);
      setResendTimer(60);
      setSuccess(`A 6-digit verification code has been dispatched to ${form.email}.`);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 OTP Digits management
  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    if (cleanVal.length > 1) {
      handlePasteValue(cleanVal);
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal.slice(-1);
    setOtpDigits(newDigits);
    setError('');

    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = e => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      handlePasteValue(pasteData);
    }
  };

  const handlePasteValue = value => {
    const chars = value.split('');
    const newDigits = ['', '', '', '', '', ''];
    chars.forEach((ch, idx) => {
      if (idx < 6) newDigits[idx] = ch;
    });
    setOtpDigits(newDigits);
    setError('');
    const nextIdx = Math.min(chars.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const currentOtp = otpDigits.join('');

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending || loading) return;
    setError('');
    setResendSuccess('');
    setResending(true);
    try {
      await authApi.resendRegistrationOtp(form.email);
      setResendTimer(60);
      setResendSuccess('A fresh 6-digit verification code has been dispatched to ' + form.email);
      setTimeout(() => setResendSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async e => {
    if (e) e.preventDefault();
    setError('');

    if (currentOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyRegistrationOtp(form.email, currentOtp);
      setSuccess('🎉 Account verified and activated! Redirecting to login…');
      setTimeout(() => {
        navigate('/login', { state: { email: form.email, registered: true } });
      }, 1800);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">💰</div>
          <div>
            <div className="auth-logo-text">MicroFin</div>
            <div className="auth-logo-sub">User Registration</div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="auth-steps">
          <div className={`auth-step-item ${step === 1 ? 'active' : 'completed'}`}>
            <div className="auth-step-circle">
              {step > 1 ? <Check size={12} /> : 1}
            </div>
            <span>Account Details</span>
          </div>
          <div className={`auth-step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`auth-step-item ${step === 2 ? 'active' : ''}`}>
            <div className="auth-step-circle">2</div>
            <span>Verify OTP</span>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 18 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="status" style={{ marginBottom: 18 }}>
            <Check size={15} /> {success}
          </div>
        )}

        {/* STEP 1: REGISTRATION FORM */}
        {step === 1 && (
          <>
            <h2 style={{ marginBottom: 6 }}>Create account</h2>
            <p style={{ marginBottom: 24, fontSize: '0.875rem' }}>
              Register to access the microfinance management system
            </p>

            <form className="auth-form" onSubmit={handleSubmitDetails} id="register-form">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-fullname">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input id="reg-fullname" className="form-input" type="text" name="fullName" placeholder="Jane Doe" value={form.fullName} onChange={handleChange} required style={{ paddingLeft: 38 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input id="reg-email" className="form-input" type="email" name="email" placeholder="jane@microfinance.com" value={form.email} onChange={handleChange} required style={{ paddingLeft: 38 }} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-role">Role *</label>
                  <select id="reg-role" className="form-input" name="role" value={form.role} onChange={handleChange} required>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-branch">Branch *</label>
                  <select id="reg-branch" className="form-input" name="branch" value={form.branch} onChange={handleChange} required>
                    {BRANCHES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input id="reg-password" className="form-input" type="password" name="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required minLength={6} style={{ paddingLeft: 38 }} />
                </div>
              </div>

              <button id="register-submit-btn" type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating Account…</> : 'Continue to Verification →'}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 2 && (
          <>
            <h2 style={{ marginBottom: 6 }}>Verify Security Code</h2>
            <p style={{ marginBottom: 16, fontSize: '0.875rem' }}>
              We sent a 6-digit verification code to
            </p>

            {/* Email pill with change option */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <Mail size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                  {form.email}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setStep(1); setError(''); }}
                style={{ padding: '3px 8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}
              >
                Change
              </button>
            </div>

            {/* Email Dispatched Alert */}
            <div style={{
              background: 'var(--color-primary-dim, rgba(16, 185, 129, 0.08))',
              border: '1px solid var(--color-primary, #10b981)',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
              fontSize: '0.84rem',
              color: 'var(--text-primary)'
            }}>
              <Mail size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>A 6-digit verification code has been dispatched to your email. Please check your inbox and spam folder.</span>
            </div>

            {resendSuccess && (
              <div className="alert alert-success" role="status" style={{ marginBottom: 16 }}>
                <Check size={15} /> {resendSuccess}
              </div>
            )}

            <form className="auth-form" onSubmit={handleVerifyOtp} id="otp-verify-form">
              <div className="form-group">
                <div className="auth-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Enter 6-Digit Code</label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || resending || loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--color-primary)',
                      cursor: resendTimer > 0 ? 'default' : 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0
                    }}
                  >
                    <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>

                {/* 6 Digit Input Boxes */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 10,
                    marginBottom: 6,
                    width: '100%'
                  }}
                  onPaste={handlePaste}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (inputRefs.current[idx] = el)}
                      id={`otp-box-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      style={{
                        width: '44px',
                        height: '48px',
                        minWidth: 0,
                        maxWidth: '44px',
                        padding: 0,
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        fontFamily: 'Outfit, monospace',
                        borderRadius: 'var(--radius-md)',
                        border: digit
                          ? '2px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                        background: digit ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface-2)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'all var(--transition-fast)',
                        boxShadow: digit ? '0 0 10px rgba(16, 185, 129, 0.25)' : 'none'
                      }}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              <button
                id="verify-otp-submit-btn"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading || currentOtp.length !== 6}
                style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verifying…</>
                ) : (
                  <>Verify & Activate Account <Sparkles size={16} /></>
                )}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setStep(1); setError(''); }}
                style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: '0.85rem' }}
              >
                <ArrowLeft size={15} /> Back to details
              </button>
            </form>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Already have an account?{' '}</span>
          <Link to="/login" id="go-to-login-link" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
