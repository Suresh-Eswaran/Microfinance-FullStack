import {
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loanApi } from '../api/loanApi';
import StatementModal from '../components/StatementModal';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  SUBMITTED:   'badge-blue',
  APPROVED:    'badge-green',
  REJECTED:    'badge-red',
  DISBURSED:   'badge-purple',
  CLOSED:      'badge-muted',
  NPA:         'badge-red',
  WRITTEN_OFF: 'badge-muted',
};

const STATUSES = ['ALL', 'SUBMITTED', 'APPROVED', 'DISBURSED', 'REJECTED', 'CLOSED'];

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
            placeholder="Specify reason for credit committee rejection…"
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button id="confirm-reject-btn" className="btn btn-danger" onClick={() => onSubmit(reason)} disabled={!reason}>
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Loans() {
  const { user, isClient, isCollectionAgent, isLoanOfficer, isBranchManager, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [loans, setLoans]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilter]     = useState('ALL');
  const [lookupId, setLookupId]       = useState('');
  const [error, setError]             = useState('');
  const [actionMsg, setActionMsg]     = useState('');
  const [activeTab, setActiveTab]     = useState('all'); // 'all' or 'approvals_queue'
  const [rejectLoanId, setRejectLoanId] = useState(null);

  // Statement modal state
  const [activeStatement, setActiveStatement] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const canApproveOrDisburse = isBranchManager || isAdmin;

  const fetchLoans = async () => {
    setLoading(true);
    setError('');
    try {
      if (isClient) {
        const data = await loanApi.getMyLoans();
        setLoans(Array.isArray(data) ? data : []);
      } else {
        const data = await loanApi.getAll();
        setLoans(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [isClient]);

  const lookupLoan = async () => {
    if (!lookupId) return;
    setError(''); setLoading(true);
    try {
      const data = await loanApi.getById(lookupId);
      const loan = data.loanApplication ?? data;
      setLoans([loan]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const lookupByClient = async () => {
    if (!lookupId) return;
    setError(''); setLoading(true);
    try {
      const data = await loanApi.getByClient(lookupId);
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Branch Manager Actions
  const handleApprove = async (id, e) => {
    if (e) e.stopPropagation();
    setActionMsg('');
    try {
      await loanApi.approve(id);
      setActionMsg(`Loan #${id} approved successfully.`);
      fetchLoans();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDisburse = async (id, e) => {
    if (e) e.stopPropagation();
    setActionMsg('');
    try {
      await loanApi.disburse(id);
      try {
        await loanApi.generateEmiSchedule(id);
      } catch (ignored) {}
      setActionMsg(`Loan #${id} disbursed successfully and repayment schedule generated.`);
      fetchLoans();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectSubmit = async (reason) => {
    if (!rejectLoanId) return;
    const id = rejectLoanId;
    setRejectLoanId(null);
    try {
      await loanApi.reject(id, { reason });
      setActionMsg(`Loan #${id} rejected.`);
      fetchLoans();
    } catch (err) {
      setError(err.message);
    }
  };

  // Statement Download
  const handleDownloadStatement = async (loanId, e) => {
    if (e) e.stopPropagation();
    setStatementLoading(true);
    try {
      const stmt = await loanApi.getStatement(loanId);
      setActiveStatement(stmt);
    } catch (err) {
      alert('Could not fetch statement: ' + (err.message || 'Please check loan ID'));
    } finally {
      setStatementLoading(false);
    }
  };

  // Filter logic
  const filtered = loans.filter(l => {
    if (activeTab === 'approvals_queue') {
      return l.status === 'SUBMITTED' || l.status === 'APPROVED';
    }
    const matchStatus = filterStatus === 'ALL' || l.status === filterStatus;
    const matchSearch =
      String(l.id).includes(search) ||
      String(l.clientId).includes(search) ||
      l.purpose?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingApprovalsCount = loans.filter(l => l.status === 'SUBMITTED').length;
  const pendingDisbursementCount = loans.filter(l => l.status === 'APPROVED').length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {isClient && <span className="badge badge-green">Borrower Statement Desk</span>}
            {canApproveOrDisburse && <span className="badge badge-purple">Branch Management Authority</span>}
            {isLoanOfficer && <span className="badge badge-blue">Portfolio Officer Desk</span>}
          </div>
          <h1 className="page-title">
            {isClient ? 'My Loans & Statements' : 'Loan Lifecycle Management'}
          </h1>
          <p className="page-subtitle">
            {isClient
              ? 'View your loan accounts, repayment timelines, and download certified statements.'
              : canApproveOrDisburse
              ? 'Review branch credit applications, grant approvals, and disburse sanctioned funds.'
              : 'Submit borrower loan applications and monitor credit assessment progress.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchLoans} id="refresh-loans-btn">
            Refresh
          </button>
          {!isCollectionAgent && !isClient && (
            <Link to="/loans/apply" id="new-loan-application-btn" className="btn btn-primary">
              <Plus size={16} /> New Application
            </Link>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} /> {actionMsg}
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Branch Manager / Admin Approvals Queue Tab */}
      {canApproveOrDisburse && !isClient && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('all')}
            id="tab-all-loans"
          >
            All Branch Loans ({loans.length})
          </button>
          <button
            className={`btn ${activeTab === 'approvals_queue' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('approvals_queue')}
            id="tab-approvals-queue"
            style={{ position: 'relative' }}
          >
            <ShieldCheck size={16} /> Approvals & Disbursement Queue
            {(pendingApprovalsCount + pendingDisbursementCount) > 0 && (
              <span style={{
                background: 'var(--color-red)',
                color: '#fff',
                borderRadius: 9999,
                padding: '2px 8px',
                fontSize: '0.7rem',
                marginLeft: 8,
                fontWeight: 700
              }}>
                {pendingApprovalsCount + pendingDisbursementCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Lookup Panel (hidden for Client to keep view clean) */}
      {!isClient && activeTab === 'all' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Quick Search</h4>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              id="loan-lookup-id"
              className="form-input"
              type="number"
              placeholder="Enter Loan ID or Client ID…"
              value={lookupId}
              onChange={e => setLookupId(e.target.value)}
              style={{ maxWidth: 260 }}
            />
            <button id="lookup-by-loan-id-btn" className="btn btn-secondary btn-sm" onClick={lookupLoan} disabled={loading || !lookupId}>
              <Search size={14} /> By Loan ID
            </button>
            <button id="lookup-by-client-id-btn" className="btn btn-ghost btn-sm" onClick={lookupByClient} disabled={loading || !lookupId}>
              By Client ID
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      {loans.length > 0 && activeTab === 'all' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="loans-search-input"
              placeholder="Search by loan ID, purpose…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button
                key={s}
                id={`filter-status-${s.toLowerCase()}`}
                className={`btn btn-sm ${filterStatus === s ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setFilter(s)}
              >
                {s === 'ALL' ? <><Filter size={13} /> All</> : s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loans Table */}
      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'var(--color-blue-dim)', color: 'var(--color-blue)' }}>
              <Plus size={28} />
            </div>
            <h3>No loans found</h3>
            <p>
              {activeTab === 'approvals_queue'
                ? 'The approval and disbursement queue is currently clear!'
                : 'No loan records match your current criteria.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                {!isClient && <th>Client ID</th>}
                <th>Requested Amount</th>
                <th>Purpose</th>
                <th>Tenure</th>
                <th>Rate %</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} onClick={() => navigate(`/loans/${l.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 700 }}>#{l.id}</td>
                  {!isClient && (
                    <td>
                      <Link
                        to={`/clients/${l.clientId}`}
                        style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                        onClick={e => e.stopPropagation()}
                      >
                        Client #{l.clientId}
                      </Link>
                    </td>
                  )}
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    ₹{Number(l.amountRequested).toLocaleString('en-IN')}
                  </td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.purpose || 'General'}
                  </td>
                  <td>{l.tenureMonths}m</td>
                  <td>{l.annualInterestRate}%</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[l.status] ?? 'badge-muted'} badge-dot`}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {l.appliedDate ? new Date(l.appliedDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Statement Download Button */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => handleDownloadStatement(l.id, e)}
                        title="Download official statement"
                        disabled={statementLoading}
                      >
                        <Download size={13} /> Statement
                      </button>

                      {/* Branch Manager Quick Approval / Disburse in Table */}
                      {canApproveOrDisburse && l.status === 'SUBMITTED' && (
                        <>
                          <button
                            id={`approve-btn-${l.id}`}
                            className="btn btn-primary btn-sm"
                            onClick={(e) => handleApprove(l.id, e)}
                            title="Approve loan"
                          >
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button
                            id={`reject-btn-${l.id}`}
                            className="btn btn-danger btn-sm"
                            onClick={(e) => { e.stopPropagation(); setRejectLoanId(l.id); }}
                            title="Reject loan"
                          >
                            <X size={13} /> Reject
                          </button>
                        </>
                      )}

                      {canApproveOrDisburse && l.status === 'APPROVED' && (
                        <button
                          id={`disburse-btn-${l.id}`}
                          className="btn btn-primary btn-sm"
                          onClick={(e) => handleDisburse(l.id, e)}
                          title="Disburse funds and generate EMI schedule"
                        >
                          <DollarSign size={13} /> Disburse
                        </button>
                      )}

                      <Link to={`/loans/${l.id}`} className="btn btn-ghost btn-sm" id={`view-loan-${l.id}`}>
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--color-border)' }}>
            Showing {filtered.length} of {loans.length} records
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectLoanId && (
        <RejectModal onClose={() => setRejectLoanId(null)} onSubmit={handleRejectSubmit} />
      )}

      {/* Statement Modal */}
      {activeStatement && (
        <StatementModal statement={activeStatement} onClose={() => setActiveStatement(null)} />
      )}
    </div>
  );
}
