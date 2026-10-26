import {
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collectionApi } from '../api/collectionApi';
import { loanApi } from '../api/loanApi';
import ReceiptModal from '../components/ReceiptModal';
import StatementModal from '../components/StatementModal';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  SUBMITTED: 'badge-blue', APPROVED: 'badge-green', REJECTED: 'badge-red',
  DISBURSED: 'badge-purple', CLOSED: 'badge-muted', NPA: 'badge-red',
};

function RejectModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Reject Loan Application</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Rejection Reason *</label>
          <textarea
            className="form-input"
            rows={4}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain the reason for rejection…"
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button id="confirm-reject-btn" className="btn btn-danger" onClick={() => onSubmit(reason)} disabled={!reason}>Reject Loan</button>
        </div>
      </div>
    </div>
  );
}

export default function LoanDetail() {
  const { id } = useParams();
  const { isAdmin, isBranchManager, isClient, isLoanOfficer } = useAuth();
  const [data, setData]       = useState(null);
  const [emi, setEmi]         = useState([]);
  const [timeline, setTimeline]= useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState('overview');
  const [actionMsg, setActionMsg] = useState('');
  const [showReject, setShowReject] = useState(false);

  // Modals for Statement and Receipt
  const [activeStatement, setActiveStatement] = useState(null);
  const [activeReceipt, setActiveReceipt]     = useState(null);
  const [selectedEmiForReceipt, setSelectedEmiForReceipt] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [loanData, emiData, timelineData] = await Promise.allSettled([
        loanApi.getById(id),
        loanApi.getEmiSchedule(id),
        loanApi.getTimeline(id),
      ]);
      if (loanData.status === 'fulfilled') {
        const d = loanData.value;
        setData(d.loanApplication ?? d);
      }
      if (emiData.status === 'fulfilled') setEmi(Array.isArray(emiData.value) ? emiData.value : []);
      if (timelineData.status === 'fulfilled') setTimeline(Array.isArray(timelineData.value) ? timelineData.value : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const doAction = async (action) => {
    setActionMsg('');
    try {
      let result;
      if (action === 'approve') {
        result = await loanApi.approve(id);
      } else if (action === 'disburse') {
        result = await loanApi.disburse(id);
        try {
          await loanApi.generateEmiSchedule(id);
        } catch (ignored) {}
      }
      setData(result?.loanApplication ?? result);
      setActionMsg(`Loan ${action}d successfully.`);
      fetchAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const doReject = async (reason) => {
    setShowReject(false);
    try {
      const result = await loanApi.reject(id, { reason });
      setData(result);
      setActionMsg('Loan rejected.');
      fetchAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const generateEmi = async () => {
    setActionMsg('');
    try {
      await loanApi.generateEmiSchedule(id);
      setActionMsg('EMI schedule generated successfully.');
      fetchAll();
    } catch (err) {
      setError(err.message);
    }
  };

  // Statement Download
  const handleOpenStatement = async () => {
    try {
      const stmt = await loanApi.getStatement(id);
      setActiveStatement(stmt);
    } catch (err) {
      alert('Could not fetch statement: ' + err.message);
    }
  };

  // Receipt Download for Paid EMI
  const handleViewReceipt = async (eItem) => {
    setSelectedEmiForReceipt(eItem);
    try {
      const allCols = await collectionApi.getAll();
      const match = Array.isArray(allCols) ? allCols.find(c => String(c.emiId) === String(eItem.id)) : null;
      if (match) {
        setActiveReceipt(match);
      } else {
        // Construct fallback receipt from settled EMI
        setActiveReceipt({
          id: eItem.id,
          emiId: eItem.id,
          amountCollected: eItem.emiAmount || (Number(eItem.principal || 0) + Number(eItem.interest || 0)),
          collectionDate: eItem.paidDate || new Date(),
          receiptNumber: `REC-${id}-${eItem.installmentNo || eItem.id}-${Date.now().toString().slice(-4)}`,
          collectedBy: data?.officerId || 101,
        });
      }
    } catch (err) {
      setActiveReceipt({
        id: eItem.id,
        emiId: eItem.id,
        amountCollected: eItem.emiAmount || 0,
        collectionDate: eItem.paidDate || new Date(),
        receiptNumber: `REC-${id}-${eItem.installmentNo || eItem.id}`,
        collectedBy: data?.officerId || 101,
      });
    }
  };

  if (loading) return <div className="loading-overlay" style={{ minHeight: 400 }}><div className="spinner" /></div>;

  const loan = data;
  const badge = loan ? (STATUS_BADGE[loan.status] ?? 'badge-muted') : '';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/loans" className="btn btn-ghost btn-sm" id="back-to-loans-from-detail"><ArrowLeft size={15} /> Back</Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 className="page-title">Loan #{id}</h1>
              {loan && <span className={`badge ${badge} badge-dot`} style={{ fontSize: '0.82rem', padding: '4px 12px' }}>{loan.status}</span>}
            </div>
            {loan && <p className="page-subtitle">Client #{loan.clientId} · Applied {loan.appliedDate ? new Date(loan.appliedDate).toLocaleDateString('en-IN') : '—'}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary btn-sm" onClick={handleOpenStatement} id="download-statement-header-btn">
            <Download size={14} /> Download Statement
          </button>
        </div>
      </div>

      {error    && <div className="alert alert-error">{error}</div>}
      {actionMsg && <div className="alert alert-success"><CheckCircle size={15} /> {actionMsg}</div>}

      {/* Action Buttons for Branch Manager & Officers */}
      {loan && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          {loan.status === 'SUBMITTED' && (
            (isAdmin || isBranchManager) ? (
              <>
                <button id="approve-loan-btn" className="btn btn-primary" onClick={() => doAction('approve')}>
                  <CheckCircle size={15} /> Approve Application
                </button>
                <button id="reject-loan-btn" className="btn btn-danger" onClick={() => setShowReject(true)}>
                  <X size={15} /> Reject Application
                </button>
              </>
            ) : (
              <span className="badge badge-blue" style={{ padding: '6px 14px' }}>
                <Clock size={13} style={{ marginRight: 5 }} /> Pending Branch Manager Approval
              </span>
            )
          )}
          {loan.status === 'APPROVED' && (
            (isAdmin || isBranchManager) ? (
              <button id="disburse-loan-btn" className="btn btn-primary" onClick={() => doAction('disburse')}>
                <DollarSign size={15} /> Disburse Loan Funds
              </button>
            ) : (
              <span className="badge badge-green" style={{ padding: '6px 14px' }}>
                <ShieldCheck size={13} style={{ marginRight: 5 }} /> Approved · Awaiting Disbursement Release
              </span>
            )
          )}
          {loan.status === 'DISBURSED' && !isClient && (
            <Link to={`/collections?loanId=${id}`} className="btn btn-secondary" id="record-collection-for-loan">
              <DollarSign size={15} /> Record EMI Collection
            </Link>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {['overview', 'emi-schedule', 'timeline'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} id={`loan-tab-${t}`}>
            {t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && loan && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Loan Parameters</h4>
            {[
              ['Amount Requested', `₹${Number(loan.amountRequested).toLocaleString('en-IN')}`],
              ['Purpose',          loan.purpose || 'General Microfinance Purpose'],
              ['Tenure',           `${loan.tenureMonths} months`],
              ['Interest Rate',    `${loan.annualInterestRate}% p.a.`],
              ['Current Status',   loan.status],
              ['Officer ID',       loan.officerId ? `#${loan.officerId}` : 'Assigned to Branch'],
              ['Product Code',     loan.productId ? `#${loan.productId}` : 'Standard Micro-Credit (MFI)'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Repayment Status</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Total EMIs', value: emi.length, icon: <CreditCard size={18} />, color: 'var(--color-blue)' },
                { label: 'Paid EMIs', value: emi.filter(e => e.status === 'PAID').length, icon: <CheckCircle size={18} />, color: 'var(--color-primary)' },
                { label: 'Overdue', value: emi.filter(e => e.status === 'OVERDUE').length, icon: <X size={18} />, color: 'var(--color-red)' },
                { label: 'Pending', value: emi.filter(e => e.status === 'PENDING').length, icon: <Clock size={18} />, color: 'var(--color-gold)' },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--color-border)' }}>
                  <div style={{ color: item.color, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'Outfit', fontWeight: 700 }}>{item.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Need certified records?</span>
              <button className="btn btn-secondary btn-sm" onClick={handleOpenStatement}>
                <Download size={13} /> Download Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMI Schedule */}
      {tab === 'emi-schedule' && (
        <div className="card">
          <div className="section-header">
            <div>
              <h3>EMI Repayment Schedule</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Track installments and download official payment receipts for paid EMIs
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleOpenStatement}>
              <Download size={13} /> Full Statement
            </button>
          </div>

          {emi.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><CreditCard size={24} /></div>
              <h3>No EMI schedule</h3>
              <p>Schedule is automatically activated after loan disbursement.</p>
              {loan.status === 'DISBURSED' && (
                <button className="btn btn-primary" onClick={generateEmi} style={{ marginTop: 12 }}>
                  Generate EMI Schedule
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr>
                  <th>#</th><th>Due Date</th><th>Principal</th>
                  <th>Interest</th><th>Total EMI</th><th>Balance</th><th>Status</th><th>Receipt / Actions</th>
                </tr></thead>
                <tbody>
                  {emi.map((e, i) => {
                    const statusCls = e.status === 'PAID' ? 'badge-green' : e.status === 'OVERDUE' ? 'badge-red' : 'badge-muted';
                    const principalVal = Number(e.principal ?? e.principalComponent ?? 0);
                    const interestVal = Number(e.interest ?? e.interestComponent ?? 0);
                    const emiVal = Number(e.emiAmount ?? (principalVal + interestVal));
                    const totalPrincipal = Number(loan?.amountRequested ?? (principalVal * emi.length));
                    const installmentNum = e.installmentNo ?? (i + 1);
                    const balanceVal = e.outstandingBalance != null 
                      ? Number(e.outstandingBalance) 
                      : Math.max(0, Math.round((totalPrincipal - installmentNum * principalVal) * 100) / 100);

                    return (
                      <tr key={e.id}>
                        <td style={{ fontWeight: 600 }}>#{installmentNum}</td>
                        <td>{e.dueDate ? new Date(e.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td>₹{principalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>₹{interestVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 700 }}>₹{emiVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>₹{balanceVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td><span className={`badge ${statusCls} badge-dot`}>{e.status}</span></td>
                        <td>
                          {e.status === 'PAID' ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleViewReceipt(e)}
                              title="View & Download Payment Receipt"
                            >
                              <Download size={13} /> Receipt
                            </button>
                          ) : (
                            !isClient && (
                              <Link to={`/collections?emiId=${e.id}`} className="btn btn-primary btn-sm">Collect</Link>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Loan Lifecycle Timeline</h3>
          {timeline.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Clock size={24} /></div>
              <h3>No events yet</h3>
            </div>
          ) : (
            <div className="timeline">
              {timeline.map((t, i) => (
                <div key={i} className="timeline-item">
                  <div className={`timeline-dot ${i === 0 ? 'active' : ''}`}>
                    <CheckCircle size={14} />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">{t.event ?? t.action ?? `Event ${i + 1}`}</div>
                    <div className="timeline-time">{t.timestamp ? new Date(t.timestamp).toLocaleString() : '—'}</div>
                    {t.remarks && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{t.remarks}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showReject && <RejectModal onClose={() => setShowReject(false)} onSubmit={doReject} />}

      {/* Statement Modal */}
      {activeStatement && (
        <StatementModal statement={activeStatement} onClose={() => setActiveStatement(null)} />
      )}

      {/* Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          collection={activeReceipt}
          emi={selectedEmiForReceipt}
          loan={loan}
          onClose={() => { setActiveReceipt(null); setSelectedEmiForReceipt(null); }}
        />
      )}
    </div>
  );
}
