import { AlertCircle, CheckCircle, Plus, ShieldCheck, UserCheck, X } from 'lucide-react';
import { useState } from 'react';
import { clientApi } from '../api/clientApi';
import { useAuth } from '../context/AuthContext';

export default function RegisterClientModal({ isOpen, onClose, onSuccess, initialEmail }) {
  const { user, isClient } = useAuth();
  const defaultEmail = initialEmail || (isClient ? user?.email : '') || '';

  const [form, setForm] = useState({
    name: '',
    email: defaultEmail,
    phoneNumber: '',
    plainAadhaar: '',
    panNumber: '',
    cibilScore: 750,
    groupId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Phone validation
    const cleanPhone = form.phoneNumber.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        phoneNumber: cleanPhone,
        email: form.email ? form.email.trim().toLowerCase() : undefined,
        plainAadhaar: form.plainAadhaar ? form.plainAadhaar.trim() : undefined,
        panNumber: form.panNumber ? form.panNumber.trim().toUpperCase() : undefined,
        cibilScore: form.cibilScore ? Number(form.cibilScore) : 750,
        groupId: form.groupId ? Number(form.groupId) : undefined,
      };

      const client = await clientApi.register(payload);
      if (onSuccess) onSuccess(client);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register client profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--color-primary-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <UserCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                {isClient ? 'Manual Borrower Profile Registration' : 'Register New Client'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isClient
                  ? 'Complete your borrower profile to unlock loan applications and statements'
                  : 'Enroll a verified borrower client record into the system'}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} id="close-register-modal">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} id="register-client-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cli-name">Full Legal Name *</label>
              <input
                id="cli-name"
                className="form-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Suresh Kumar"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cli-email">Registered Email</label>
              <input
                id="cli-email"
                type="email"
                className="form-input"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="borrower@example.com"
                readOnly={isClient && !!user?.email}
                style={isClient && !!user?.email ? { background: 'var(--color-surface-2)', cursor: 'not-allowed' } : {}}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cli-phone">Mobile Phone (10 Digits) *</label>
              <input
                id="cli-phone"
                className="form-input"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                required
                maxLength={10}
                placeholder="9876543210"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cli-pan">PAN Number</label>
              <input
                id="cli-pan"
                className="form-input"
                name="panNumber"
                value={form.panNumber}
                onChange={handleChange}
                maxLength={10}
                placeholder="ABCDE1234F"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cli-aadhaar">Aadhaar Card Number</label>
              <input
                id="cli-aadhaar"
                className="form-input"
                name="plainAadhaar"
                value={form.plainAadhaar}
                onChange={handleChange}
                maxLength={12}
                placeholder="12-digit Aadhaar"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cli-cibil">CIBIL Score (300–900)</label>
              <input
                id="cli-cibil"
                className="form-input"
                type="number"
                name="cibilScore"
                value={form.cibilScore}
                onChange={handleChange}
                min={300}
                max={900}
                placeholder="750"
              />
            </div>
          </div>

          {!isClient && (
            <div className="form-group">
              <label className="form-label" htmlFor="cli-group">Joint Liability Group (JLG) ID</label>
              <input
                id="cli-group"
                className="form-input"
                type="number"
                name="groupId"
                value={form.groupId}
                onChange={handleChange}
                placeholder="Optional group ID"
              />
            </div>
          )}

          <div style={{
            background: 'var(--color-surface-2)',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <ShieldCheck size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>
              By registering, borrower KYC will be set to <strong>PENDING</strong> for officer verification.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              id="submit-register-client"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Plus size={15} />}
              <span>{isClient ? 'Save Borrower Profile' : 'Register Client'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
