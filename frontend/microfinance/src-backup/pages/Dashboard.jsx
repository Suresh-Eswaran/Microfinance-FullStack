import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Plus,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi } from '../api/adminApi';
import { clientApi } from '../api/clientApi';
import { collectionApi } from '../api/collectionApi';
import { loanApi } from '../api/loanApi';
import { portfolioApi } from '../api/portfolioApi';
import StatementModal from '../components/StatementModal';
import RegisterClientModal from '../components/RegisterClientModal';
import { useAuth } from '../context/AuthContext';

// Fallback data for when backend is unreachable
const MOCK_TREND = [
  { month: 'Mar', disbursed: 4.2, collected: 3.8 },
  { month: 'Apr', disbursed: 5.1, collected: 4.5 },
  { month: 'May', disbursed: 4.8, collected: 4.6 },
  { month: 'Jun', disbursed: 6.2, collected: 5.8 },
  { month: 'Jul', disbursed: 5.9, collected: 5.6 },
  { month: 'Aug', disbursed: 7.1, collected: 6.8 },
];

const MOCK_PAR = [
  { name: 'Current', value: 72, color: '#10b981' },
  { name: 'PAR 1-30', value: 14, color: '#f59e0b' },
  { name: 'PAR 31-60', value: 8,  color: '#ef4444' },
  { name: 'PAR 60+',  value: 6,  color: '#6366f1' },
];

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontSize: '0.85rem', fontWeight: 600 }}>
          {p.name}: ₹{p.value}L
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user, isClient, isCollectionAgent, isLoanOfficer, isBranchManager } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]       = useState(null);
  const [par, setPar]           = useState(null);
  const [colDash, setColDash]   = useState(null);
  const [overdue, setOverdue]   = useState([]);
  const [loading, setLoading]   = useState(true);

  // Client role specific state
  const [clientProfile, setClientProfile] = useState(null);
  const [myLoans, setMyLoans]             = useState([]);
  const [activeStatement, setActiveStatement] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isClient) {
        const [meRes, loansRes] = await Promise.allSettled([
          clientApi.getMe(),
          loanApi.getMyLoans(),
        ]);
        if (meRes.status === 'fulfilled') setClientProfile(meRes.value);
        if (loansRes.status === 'fulfilled') setMyLoans(Array.isArray(loansRes.value) ? loansRes.value : []);
      } else {
        const [adminData, parData, colData, overdueData] = await Promise.allSettled([
          adminApi.dashboard(),
          portfolioApi.par(),
          collectionApi.dashboard(),
          collectionApi.overdue(),
        ]);
        if (adminData.status === 'fulfilled') setStats(adminData.value);
        if (parData.status   === 'fulfilled') setPar(parData.value);
        if (colData.status   === 'fulfilled') setColDash(colData.value);
        if (overdueData.status === 'fulfilled') setOverdue(overdueData.value?.slice(0, 5) ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isClient]);

  const handleDownloadStatement = async (loanId, e) => {
    if (e) e.stopPropagation();
    setStatementLoading(true);
    try {
      const stmt = await loanApi.getStatement(loanId);
      setActiveStatement(stmt);
    } catch (err) {
      alert('Could not fetch statement: ' + (err.message || 'Please try again.'));
    } finally {
      setStatementLoading(false);
    }
  };

  // -------------------------------------------------------------
  // CLIENT PORTAL VIEW
  // -------------------------------------------------------------
  if (isClient) {
    const totalBorrowed = myLoans.reduce((sum, l) => sum + Number(l.amountRequested || 0), 0);
    const activeLoans = myLoans.filter(l => l.status === 'DISBURSED' || l.status === 'APPROVED');

    return (
      <div className="animate-fade-in">
        {/* Client Welcome Header */}
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-green" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Client Self-Service Portal
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Client ID: {clientProfile?.id ? `#${clientProfile.id}` : 'Profile Pending'}
              </span>
            </div>
            <h1 className="page-title">Welcome back, {clientProfile?.name || user?.email?.split('@')[0]}!</h1>
            <p className="page-subtitle">View your loan statements, repayment schedules, and download payment receipts.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={fetchData} id="client-dash-refresh">
              <RefreshCw size={14} /> Refresh
            </button>
            {clientProfile ? (
              <Link to="/loans" className="btn btn-primary btn-sm" id="client-my-loans-btn">
                <CreditCard size={14} /> My Loans & Statements
              </Link>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowRegisterModal(true)}
                id="client-header-register-btn"
              >
                <Plus size={14} /> Register Borrower Profile
              </button>
            )}
            <Link to="/collections" className="btn btn-secondary btn-sm" id="client-receipts-btn">
              <FileText size={14} /> Payment Receipts
            </Link>
          </div>
        </div>

        {/* Manual Client Registration Banner if Profile Not Yet Created */}
        {!clientProfile && !loading && (
          <div className="card" style={{
            marginBottom: 24,
            border: '1px solid rgba(245, 158, 11, 0.4)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
            padding: '20px 24px',
            borderRadius: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ maxWidth: 660 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="badge badge-gold" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>Action Required</span>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Complete Borrower Profile Registration
                  </h3>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Your account login is verified! In accordance with microfinance borrower guidelines, please manually register your borrower client details (identity, contact, and bureau info) to activate your borrowing profile and apply for loans.
                </p>
              </div>
              <button
                id="open-manual-client-reg-btn"
                className="btn btn-primary"
                onClick={() => setShowRegisterModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontWeight: 600, flexShrink: 0 }}
              >
                <Plus size={16} /> Register Borrower Profile
              </button>
            </div>
          </div>
        )}

        {/* Client Stat Cards */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ '--accent-color': 'var(--color-primary)', '--accent-bg': 'var(--color-primary-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">Active Loans</span>
              <div className="stat-icon"><CreditCard size={20} /></div>
            </div>
            <div className="stat-value">{loading ? '…' : activeLoans.length}</div>
            <div className="stat-sub">{clientProfile ? 'Accounts in progress' : 'Profile not registered'}</div>
          </div>

          <div className="stat-card" style={{ '--accent-color': 'var(--color-blue)', '--accent-bg': 'var(--color-blue-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">Total Borrowed</span>
              <div className="stat-icon"><DollarSign size={20} /></div>
            </div>
            <div className="stat-value">{loading ? '…' : `₹${totalBorrowed.toLocaleString('en-IN')}`}</div>
            <div className="stat-sub">{clientProfile ? 'Across all applications' : '₹0 portfolio'}</div>
          </div>

          <div className="stat-card" style={{ '--accent-color': 'var(--color-gold)', '--accent-bg': 'var(--color-gold-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">CIBIL Score</span>
              <div className="stat-icon"><ShieldCheck size={20} /></div>
            </div>
            <div className="stat-value">{clientProfile?.cibilScore ?? '—'}</div>
            <div className="stat-sub">{clientProfile ? 'Bureau Standing: Good' : 'Pending client registration'}</div>
          </div>

          <div className="stat-card" style={{ '--accent-color': 'var(--color-purple)', '--accent-bg': 'rgba(168, 85, 247, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">KYC Status</span>
              <div className="stat-icon"><UserCheck size={20} /></div>
            </div>
            <div className="stat-value" style={{ fontSize: clientProfile?.kycStatus ? '1.5rem' : '1.1rem' }}>
              {clientProfile?.kycStatus || 'NOT REGISTERED'}
            </div>
            <div className="stat-sub">{clientProfile ? 'Identity verified' : 'Profile pending'}</div>
          </div>
        </div>

        {/* My Loans & Statements Section */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-header">
            <div>
              <h3>My Loans & Repayment Statements</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Download your official loan statement or review your installments schedule
              </p>
            </div>
            {clientProfile && <Link to="/loans" className="btn btn-ghost btn-sm">View all loans</Link>}
          </div>

          {loading ? (
            <div className="loading-overlay" style={{ minHeight: 180 }}><div className="spinner" /></div>
          ) : !clientProfile ? (
            <div className="empty-state" style={{ padding: '36px 20px' }}>
              <div className="empty-icon"><UserCheck size={32} /></div>
              <h3>Borrower Profile Registration Needed</h3>
              <p style={{ maxWidth: 440, margin: '8px auto 16px auto', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                You must manually complete your borrower registration before you can apply for loans and access statements.
              </p>
              <button
                id="empty-state-register-btn"
                className="btn btn-primary"
                onClick={() => setShowRegisterModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> Register Borrower Profile
              </button>
            </div>
          ) : myLoans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><CreditCard size={28} /></div>
              <h3>No loan applications yet</h3>
              <p>You currently do not have any registered loans.</p>
              <Link to="/loans/apply" className="btn btn-primary" style={{ marginTop: 12 }}>
                Apply for Loan
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Principal Amount</th>
                    <th>Purpose</th>
                    <th>Tenure</th>
                    <th>Rate</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myLoans.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700 }}>#{l.id}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(l.amountRequested).toLocaleString('en-IN')}</td>
                      <td>{l.purpose || 'General Microfinance Purpose'}</td>
                      <td>{l.tenureMonths} Months</td>
                      <td>{l.annualInterestRate}% p.a.</td>
                      <td>
                        <span className={`badge ${l.status === 'DISBURSED' ? 'badge-purple' : l.status === 'APPROVED' ? 'badge-green' : l.status === 'SUBMITTED' ? 'badge-blue' : 'badge-muted'} badge-dot`}>
                          {l.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(e) => handleDownloadStatement(l.id, e)}
                            title="Download Statement"
                            disabled={statementLoading}
                          >
                            <Download size={13} /> Statement
                          </button>
                          <Link to={`/loans/${l.id}`} className="btn btn-ghost btn-sm">
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Client Quick Help & Receipts Card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <h4 style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="var(--color-primary)" />
              Payment Receipts & Invoices
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              Every EMI paid generates an official signed payment receipt with receipt number and verification seal.
            </p>
            <Link to="/collections" className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
              Browse Payment Receipts <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </Link>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} color="var(--color-primary)" />
              Borrower Rights & RBI Guidelines
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              MicroFin strictly adheres to Fair Practices Code (FPC) and RBI microfinance lending norms with 0% hidden charges.
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Helpline: <strong>1800-MICROFIN</strong> (Toll Free)
            </div>
          </div>
        </div>

        {/* Statement Modal */}
        {activeStatement && (
          <StatementModal statement={activeStatement} onClose={() => setActiveStatement(null)} />
        )}

        {/* Manual Client Registration Modal */}
        <RegisterClientModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={newClient => {
            setClientProfile(newClient);
            fetchData();
          }}
          initialEmail={user?.email}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // STAFF / INTERNAL ROLES VIEW (Collections Agent, Loan Officer, Branch Manager, Admin)
  // -------------------------------------------------------------
  const statCards = [
    {
      label: 'Total Portfolio',
      value: stats?.totalPortfolioValue ? `₹${(stats.totalPortfolioValue/100000).toFixed(1)}L` : '₹—',
      icon: <DollarSign size={20} />,
      accentColor: 'var(--color-primary)',
      accentBg: 'var(--color-primary-dim)',
      sub: 'Active loan book',
    },
    {
      label: 'Active Loans',
      value: stats?.activeLoans ?? '—',
      icon: <CreditCard size={20} />,
      accentColor: 'var(--color-blue)',
      accentBg: 'var(--color-blue-dim)',
      sub: 'Disbursed accounts',
    },
    {
      label: isCollectionAgent ? 'Target Today' : 'Total Clients',
      value: isCollectionAgent
        ? (colDash?.todayTarget ? `₹${Number(colDash.todayTarget).toLocaleString('en-IN')}` : '₹0')
        : (stats?.totalClients ?? '—'),
      icon: <Users size={20} />,
      accentColor: 'var(--color-secondary)',
      accentBg: 'var(--color-secondary-dim)',
      sub: isCollectionAgent ? 'Recovery goal' : 'Registered borrowers',
    },
    {
      label: 'Collection Rate',
      value: colDash?.collectionRate ? `${colDash.collectionRate}%` : '—',
      icon: <TrendingUp size={20} />,
      accentColor: 'var(--color-gold)',
      accentBg: 'var(--color-gold-dim)',
      sub: 'Collection efficiency',
    },
    {
      label: 'Overdue EMIs',
      value: stats?.overdueEMIs ?? overdue.length,
      icon: <AlertTriangle size={20} />,
      accentColor: 'var(--color-red)',
      accentBg: 'var(--color-red-dim)',
      sub: 'Require follow-up',
    },
    {
      label: isBranchManager ? 'Pending Branch Approvals' : 'Pending Approvals',
      value: stats?.pendingApprovals ?? '—',
      icon: <CheckCircle size={20} />,
      accentColor: 'var(--color-cyan)',
      accentBg: 'rgba(6,182,212,0.15)',
      sub: 'Awaiting manager action',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-blue" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
              {isBranchManager ? 'Branch Executive Desk' : isLoanOfficer ? 'Loan Officer Portfolio Desk' : isCollectionAgent ? 'Collections Recovery Desk' : 'System Administration'}
            </span>
          </div>
          <h1 className="page-title">
            {isBranchManager ? 'Branch Oversight Dashboard' : isCollectionAgent ? 'Collections Desk' : isLoanOfficer ? 'Loan Officer Desk' : 'Executive Dashboard'}
          </h1>
          <p className="page-subtitle">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.email?.split('@')[0]} · {user?.branch || 'Head Office'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchData} id="dashboard-refresh-btn">
            <RefreshCw size={14} /> Refresh
          </button>
          {isBranchManager && (
            <Link to="/loans" className="btn btn-primary btn-sm" id="manager-approvals-queue-btn">
              <CheckCircle size={14} /> Approvals Queue ({stats?.pendingApprovals ?? 0})
            </Link>
          )}
          {isLoanOfficer && (
            <>
              <Link to="/clients" className="btn btn-secondary btn-sm" id="officer-new-client-btn">
                <Users size={14} /> Register Client
              </Link>
              <Link to="/loans/apply" className="btn btn-primary btn-sm" id="officer-new-loan-btn">
                <Plus size={14} /> New Application
              </Link>
            </>
          )}
          {isCollectionAgent && (
            <Link to="/collections" className="btn btn-primary btn-sm" id="agent-collect-emi-btn">
              <DollarSign size={14} /> Collect EMI
            </Link>
          )}
        </div>
      </div>

      {/* Role-Specific Alert Banner */}
      {isBranchManager && (
        <div style={{
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: 10,
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              Branch Oversight Notice
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              You have full authority to approve submitted loan applications, release loan disbursements, and monitor regulatory compliance.
            </div>
          </div>
          <Link to="/loans" className="btn btn-primary btn-sm">
            Go to Approvals & Disbursement Queue <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {isCollectionAgent && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 10,
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-gold)' }}>
              Daily Recovery Target: ₹{Number(colDash?.todayTarget || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Capture GPS geolocation on field visits to automatically generate official client repayment receipts.
            </div>
          </div>
          <Link to="/collections" className="btn btn-secondary btn-sm">
            Open EMI Collections Queue <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map(card => (
          <div
            key={card.label}
            className="stat-card"
            style={{ '--accent-color': card.accentColor, '--accent-bg': card.accentBg }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">{card.label}</span>
              <div className="stat-icon">{card.icon}</div>
            </div>
            <div className="stat-value">
              {loading ? <div className="skeleton" style={{ height: 32, width: 80 }} /> : card.value}
            </div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        {/* Area Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Disbursement vs Collections</div>
              <div className="chart-subtitle">Last 6 months (₹ Lakhs)</div>
            </div>
            <BarChart2 size={18} color="var(--text-muted)" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_TREND} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
              <Area type="monotone" dataKey="disbursed" name="Disbursed" stroke="#10b981" strokeWidth={2} fill="url(#gradGreen)" />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#6366f1" strokeWidth={2} fill="url(#gradIndigo)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* PAR Pie */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Portfolio at Risk (PAR)</div>
              <div className="chart-subtitle">By ageing bucket</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={MOCK_PAR}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {MOCK_PAR.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${v}%`, '']}
                contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Overdue EMIs & Quick Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Overdue EMIs */}
        <div className="card">
          <div className="section-header">
            <h3 style={{ fontSize: '0.95rem' }}>Overdue EMIs Queue</h3>
            <Link to="/collections" className="btn btn-ghost btn-sm" id="view-overdue-link">View all</Link>
          </div>
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : overdue.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><CheckCircle size={24} /></div>
              <h3>All clear!</h3>
              <p>No overdue EMIs requiring action.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>EMI ID</th><th>Loan ID</th><th>Amount</th><th>Due Date</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map(e => (
                    <tr key={e.id}>
                      <td>#{e.id}</td>
                      <td>#{e.loanId}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(e.emiAmount ?? 0).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--color-red)' }}>{e.dueDate ? new Date(e.dueDate).toLocaleDateString() : '—'}</td>
                      <td>
                        <Link to={`/collections?emiId=${e.id}`} className="btn btn-primary btn-sm">Collect</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Operational Shortcuts */}
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>Role Portals & Shortcuts</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Link to="/loans" className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: 12, border: '1px solid var(--color-border)' }}>
              <CreditCard size={16} color="var(--color-primary)" />
              <div style={{ textAlign: 'left', marginLeft: 8 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Loan Applications</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lifecycle management</div>
              </div>
            </Link>

            <Link to="/collections" className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: 12, border: '1px solid var(--color-border)' }}>
              <DollarSign size={16} color="var(--color-gold)" />
              <div style={{ textAlign: 'left', marginLeft: 8 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Collections Center</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Record EMI & Receipts</div>
              </div>
            </Link>

            <Link to="/clients" className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: 12, border: '1px solid var(--color-border)' }}>
              <Users size={16} color="var(--color-blue)" />
              <div style={{ textAlign: 'left', marginLeft: 8 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Client Directory</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Onboarding & KYC</div>
              </div>
            </Link>

            <Link to="/portfolio" className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: 12, border: '1px solid var(--color-border)' }}>
              <BarChart2 size={16} color="var(--color-purple)" />
              <div style={{ textAlign: 'left', marginLeft: 8 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Portfolio Analytics</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Risk & Aging breakdown</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
