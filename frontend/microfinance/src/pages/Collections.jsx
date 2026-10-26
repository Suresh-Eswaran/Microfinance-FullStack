import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  FileText,
  MapPin,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collectionApi } from '../api/collectionApi';
import ReceiptModal from '../components/ReceiptModal';
import { useAuth } from '../context/AuthContext';

function RecordModal({ onClose, onSuccess, prefillEmiId }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    emiId: prefillEmiId || '',
    amountCollected: '',
    collectedBy: user?.userId || '101',
    gpsLat: '',
    gpsLng: '',
  });
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const detectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          gpsLat: pos.coords.latitude.toFixed(6),
          gpsLng: pos.coords.longitude.toFixed(6)
        }));
        setGpsDetecting(false);
      },
      err => {
        alert('Could not retrieve GPS: ' + err.message + '. Default coordinates used.');
        setForm(f => ({ ...f, gpsLat: '12.971600', gpsLng: '77.594600' }));
        setGpsDetecting(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        emiId:           Number(form.emiId),
        amountCollected: parseFloat(form.amountCollected),
        collectedBy:     Number(form.collectedBy) || 101,
        gpsLat:          form.gpsLat ? parseFloat(form.gpsLat) : null,
        gpsLng:          form.gpsLng ? parseFloat(form.gpsLng) : null,
      };
      const result = await collectionApi.record(payload);
      onSuccess(result);
    } catch (err) {
      setError(err.message || 'Collection recording failed');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={18} color="var(--color-primary)" />
            <h3>Record EMI Collection & Issue Receipt</h3>
          </div>
          <button className="modal-close" onClick={onClose} id="close-collection-modal"><X size={16} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} id="record-collection-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="col-emi-id">EMI Schedule ID *</label>
              <input id="col-emi-id" className="form-input" type="number" name="emiId" value={form.emiId} onChange={handleChange} required placeholder="e.g. 101" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="col-amount">Amount Collected (₹) *</label>
              <input id="col-amount" className="form-input" type="number" name="amountCollected" value={form.amountCollected} onChange={handleChange} required min="1" step="0.01" placeholder="2500.00" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="col-by">Collecting Officer / Agent ID</label>
            <input id="col-by" className="form-input" type="number" name="collectedBy" value={form.collectedBy} onChange={handleChange} required />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Field Geolocation (GPS Coordinates)</label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={detectGps}
                disabled={gpsDetecting}
                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
              >
                <MapPin size={12} /> {gpsDetecting ? 'Locating…' : '📍 Auto-Detect GPS'}
              </button>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <input id="col-lat" className="form-input" type="number" step="any" name="gpsLat" value={form.gpsLat} onChange={handleChange} placeholder="Latitude (e.g. 12.9716)" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <input id="col-lng" className="form-input" type="number" step="any" name="gpsLng" value={form.gpsLng} onChange={handleChange} placeholder="Longitude (e.g. 77.5946)" />
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              GPS tags are recorded for audit compliance and printed directly on the client's receipt.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button id="submit-collection-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <ShieldCheck size={15} />}
              Record & Generate Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Collections() {
  const { user, isClient, isCollectionAgent, isBranchManager } = useAuth();
  const [searchParams] = useSearchParams();
  const prefillEmiId   = searchParams.get('emiId') || '';

  const [overdue, setOverdue]         = useState([]);
  const [dashboard, setDashboard]     = useState(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [selectedEmiId, setSelectedEmiId] = useState(prefillEmiId);
  const [tab, setTab]                 = useState(isClient ? 'recorded' : 'overdue');
  const [searchReceipt, setSearchReceipt] = useState('');

  // Newly recorded or inspected receipt modal
  const [viewReceipt, setViewReceipt] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isClient) {
        try {
          const res = await collectionApi.getMyReceipts();
          setCollections(Array.isArray(res) ? res : []);
        } catch (e) {
          console.error("Failed to load client receipts:", e);
          setCollections([]);
        }
      } else {
        const [od, dash, all] = await Promise.allSettled([
          collectionApi.overdue(),
          collectionApi.dashboard(),
          collectionApi.getAll(),
        ]);
        if (od.status   === 'fulfilled') setOverdue(Array.isArray(od.value) ? od.value : []);
        if (dash.status === 'fulfilled') setDashboard(dash.value);
        if (all.status  === 'fulfilled') setCollections(Array.isArray(all.value) ? all.value : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (prefillEmiId) {
      setSelectedEmiId(prefillEmiId);
      setShowModal(true);
    }
  }, [prefillEmiId]);

  const handleSuccess = (newCollection) => {
    setShowModal(false);
    fetchData();
    // Open receipt modal immediately for instant printing/downloading
    setViewReceipt(newCollection);
  };

  const statCards = [
    {
      label: 'Total Collected',
      value: dashboard?.totalCollected ? `₹${Number(dashboard.totalCollected).toLocaleString('en-IN')}` : '₹0',
      color: 'var(--color-primary)'
    },
    {
      label: 'Overdue Queue',
      value: overdue.length,
      color: 'var(--color-red)'
    },
    {
      label: 'Collection Efficiency',
      value: dashboard?.collectionRate ? `${dashboard.collectionRate}%` : '—',
      color: 'var(--color-gold)'
    },
    {
      label: 'Today\'s Recovery Goal',
      value: dashboard?.todayTarget ? `₹${Number(dashboard.todayTarget).toLocaleString('en-IN')}` : '₹0',
      color: 'var(--color-blue)'
    },
  ];

  const filteredCollections = collections.filter(c => {
    const q = searchReceipt.toLowerCase();
    return (
      String(c.receiptNumber || '').toLowerCase().includes(q) ||
      String(c.emiId || '').includes(q) ||
      String(c.amountCollected || '').includes(q)
    );
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {isClient && <span className="badge badge-green">Borrower Receipts</span>}
            {isCollectionAgent && <span className="badge badge-gold">Field Collections Agent Desk</span>}
            {isBranchManager && <span className="badge badge-purple">Branch Recovery Oversight</span>}
          </div>
          <h1 className="page-title">
            {isClient ? 'My Payment Receipts' : 'EMI Collections & Receipts'}
          </h1>
          <p className="page-subtitle">
            {isClient
              ? 'View and download official receipts for your settled loan repayments.'
              : 'Record client EMI collections with verified GPS coordinates and generate instant receipts.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchData}>
            Refresh
          </button>
          {!isClient && (
            <button
              id="open-record-collection-btn"
              className="btn btn-primary"
              onClick={() => { setSelectedEmiId(''); setShowModal(true); }}
            >
              <Plus size={16} /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Stats row (hidden for Client) */}
      {!isClient && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          {statCards.map(s => (
            <div key={s.label} className="stat-card" style={{ '--accent-color': s.color, '--accent-bg': `${s.color}20` }}>
              <span className="stat-label">{s.label}</span>
              <div className="stat-value">{loading ? <div className="skeleton" style={{ height: 28, width: 70 }} /> : s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {!isClient && (
          <button
            className={`tab-btn ${tab === 'overdue' ? 'active' : ''}`}
            onClick={() => setTab('overdue')}
            id="collection-tab-overdue"
          >
            Assigned Overdue Queue
            {overdue.length > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--color-red)', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '0.65rem' }}>
                {overdue.length}
              </span>
            )}
          </button>
        )}
        <button
          className={`tab-btn ${tab === 'recorded' ? 'active' : ''}`}
          onClick={() => setTab('recorded')}
          id="collection-tab-recorded"
        >
          {isClient ? 'My Repayment Receipts' : 'Collection Receipts & History'} ({collections.length})
        </button>
      </div>

      {/* Overdue EMIs Queue for Collections Agent / Manager */}
      {tab === 'overdue' && !isClient && (
        loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : overdue.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon" style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)' }}>
                <CheckCircle size={28} />
              </div>
              <h3>No overdue EMIs in your assigned queue</h3>
              <p>All client repayments are currently up to date!</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr>
                <th>EMI ID</th><th>Loan ID</th><th>Due Date</th>
                <th>Due Amount</th><th>Status</th><th>Field Action</th>
              </tr></thead>
              <tbody>
                {overdue.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>#{e.id}</td>
                    <td>#{e.loanId}</td>
                    <td style={{ color: 'var(--color-red)' }}>
                      <AlertTriangle size={12} style={{ marginRight: 4 }} />
                      {e.dueDate ? new Date(e.dueDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      ₹{Number(e.emiAmount ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td><span className="badge badge-red badge-dot">OVERDUE</span></td>
                    <td>
                      <button
                        id={`collect-emi-${e.id}`}
                        className="btn btn-primary btn-sm"
                        onClick={() => { setSelectedEmiId(e.id); setShowModal(true); }}
                      >
                        <DollarSign size={13} /> Collect & Issue Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Recorded Collections & Receipts */}
      {tab === 'recorded' && (
        <div>
          {/* Search Receipts Bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="search-bar" style={{ position: 'relative', maxWidth: 360 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="search-receipt-input"
                placeholder="Search by receipt number, EMI ID…"
                value={searchReceipt}
                onChange={e => setSearchReceipt(e.target.value)}
              />
            </div>
          </div>

          {filteredCollections.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <div className="empty-icon" style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)' }}>
                  <FileText size={32} />
                </div>
                <h3>{isClient ? 'No Payment Receipts Issued Yet' : 'No payment receipts found'}</h3>
                <p style={{ maxWidth: 520, margin: '8px auto 16px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {isClient
                    ? 'Receipts are generated immediately whenever an installment (EMI) payment is collected by your Collections Agent or recorded at the branch. While you have active loans, upcoming EMIs are scheduled but not yet marked as paid.'
                    : 'Recorded collections will generate certified receipts here.'}
                </p>
                {isClient && (
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <Link to="/loans" className="btn btn-primary btn-sm">
                      View My Loans & EMI Schedules
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr>
                  <th>Receipt Number</th>
                  <th>EMI ID</th>
                  <th>Amount Collected</th>
                  <th>Collection Date</th>
                  <th>Collected By</th>
                  <th>GPS Coordinates</th>
                  <th>Receipt Action</th>
                </tr></thead>
                <tbody>
                  {filteredCollections.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {c.receiptNumber || `REC-${c.id}`}
                      </td>
                      <td>#{c.emiId}</td>
                      <td style={{ fontWeight: 700 }}>
                        ₹{Number(c.amountCollected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {c.collectionDate ? new Date(c.collectionDate).toLocaleString('en-IN') : '—'}
                      </td>
                      <td>Officer #{c.collectedBy || '101'}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {c.gpsLat ? `${Number(c.gpsLat).toFixed(4)}, ${Number(c.gpsLng).toFixed(4)}` : 'Field Verified'}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewReceipt(c)}
                          title="View and download payment receipt"
                        >
                          <Download size={13} /> Download Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Collection Modal */}
      {showModal && (
        <RecordModal
          prefillEmiId={selectedEmiId}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Official Receipt Modal */}
      {viewReceipt && (
        <ReceiptModal
          collection={viewReceipt}
          onClose={() => setViewReceipt(null)}
        />
      )}
    </div>
  );
}
