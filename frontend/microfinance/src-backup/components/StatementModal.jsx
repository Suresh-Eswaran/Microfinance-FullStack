import { CheckCircle2, Download, FileText, Printer, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import React, { useRef } from 'react';

export default function StatementModal({ statement, onClose }) {
  const statementRef = useRef(null);

  if (!statement) return null;

  const {
    loan,
    client,
    schedules = [],
    collections = [],
    totalPrincipal = 0,
    totalInterest = 0,
    totalRepayable = 0,
    paidAmount = 0,
    outstandingBalance = 0,
    paidCount = 0,
    pendingCount = 0,
    overdueCount = 0,
    generatedAt,
  } = statement;

  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : new Date().toLocaleString('en-IN');

  const handlePrint = () => {
    const printContent = statementRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loan Statement - Loan #${loan?.id}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              padding: 30px;
              color: #0f172a;
              background: #fff;
            }
            .statement-box {
              max-width: 850px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .org-title {
              font-size: 26px;
              font-weight: 800;
              color: #047857;
              margin: 0;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 24px;
            }
            .grid-4 {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 24px;
            }
            .stat-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px 16px;
            }
            .stat-label {
              font-size: 11px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 600;
            }
            .stat-val {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 12px;
            }
            th {
              background: #f1f5f9;
              text-align: left;
              padding: 8px 10px;
              font-weight: 700;
              border-bottom: 2px solid #cbd5e1;
            }
            td {
              padding: 8px 10px;
              border-bottom: 1px solid #e2e8f0;
            }
            .badge {
              padding: 3px 8px;
              border-radius: 4px;
              font-weight: 700;
              font-size: 10px;
              text-transform: uppercase;
            }
            .badge-paid { background: #dcfce7; color: #166534; }
            .badge-overdue { background: #fee2e2; color: #991b1b; }
            .badge-pending { background: #fef3c7; color: #92400e; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="statement-box">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    let text = `
========================================================================
                      MICROFIN INSTITUTION
                 OFFICIAL LOAN ACCOUNT STATEMENT
========================================================================
Generated On    : ${formattedDate}
Loan Reference  : #${loan?.id}
Loan Status     : ${loan?.status}

BORROWER DETAILS:
------------------------------------------------------------------------
Client Name     : ${client?.name || 'Authorized Client'}
Client ID       : #${client?.id || loan?.clientId}
Phone Number    : +91 ${client?.phoneNumber || 'N/A'}
PAN Number      : ${client?.panNumber || 'Verified on file'}
KYC Status      : ${client?.kycStatus || 'VERIFIED'}

FINANCIAL SUMMARY:
------------------------------------------------------------------------
Principal Amount: INR ${Number(totalPrincipal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Total Interest  : INR ${Number(totalInterest).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Total Repayable : INR ${Number(totalRepayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Total Amount Paid: INR ${Number(paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Outstanding Bal : INR ${Number(outstandingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Installments    : ${paidCount} Paid / ${overdueCount} Overdue / ${pendingCount} Pending

REPAYMENT INSTALLMENTS SCHEDULE:
-------------------------------------------------------------------------------------------------
Inst# | Due Date   | Principal (INR) | Interest (INR) | EMI Total (INR) | Status    | Paid Date
-------------------------------------------------------------------------------------------------
`;
    schedules.forEach((s, idx) => {
      const instNo = String(s.installmentNo || idx + 1).padEnd(5);
      const dueDate = String(s.dueDate || '—').padEnd(10);
      const p = String(Number(s.principal || 0).toFixed(2)).padStart(15);
      const i = String(Number(s.interest || 0).toFixed(2)).padStart(14);
      const emi = String(Number(s.emiAmount || 0).toFixed(2)).padStart(15);
      const st = String(s.status).padEnd(9);
      const pd = s.paidDate ? new Date(s.paidDate).toLocaleDateString('en-IN') : '—';
      text += `${instNo} | ${dueDate} | ${p} | ${i} | ${emi} | ${st} | ${pd}\n`;
    });

    text += `
-------------------------------------------------------------------------------------------------
COLLECTIONS & PAYMENT RECEIPTS:
-------------------------------------------------------------------------------------------------
`;
    if (collections.length === 0) {
      text += "No collection receipts recorded yet.\n";
    } else {
      collections.forEach(c => {
        text += `Receipt: ${c.receiptNumber} | Amount: INR ${Number(c.amountCollected).toFixed(2)} | Date: ${c.collectionDate}\n`;
      });
    }

    text += `
========================================================================
This statement is system-generated and serves as official documentation.
MicroFin Financial Services · Regulated Micro-Lending Platform
========================================================================
`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Loan_Statement_Loan_${loan?.id}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 840, width: '92vw', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: 'var(--color-surface-2)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <FileText size={18} color="var(--color-primary)" />
            <span>Loan Account Statement — Loan #{loan?.id}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handlePrint} className="btn btn-primary btn-sm" id="print-statement-btn">
              <Printer size={14} /> Print / Save PDF
            </button>
            <button onClick={handleDownload} className="btn btn-secondary btn-sm" id="download-statement-btn">
              <Download size={14} /> Download Statement
            </button>
            <button className="modal-close" onClick={onClose} id="close-statement-btn">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Statement Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto' }} ref={statementRef}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid var(--color-border)',
            paddingBottom: 16,
            marginBottom: 20
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '1.4rem' }}>💰</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  MicroFin Loan Management
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Official Loan Account Statement
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>Generated: <strong>{formattedDate}</strong></div>
              <div>Account Status: <strong style={{ color: 'var(--color-primary)' }}>{loan?.status}</strong></div>
            </div>
          </div>

          {/* Client & Loan Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            background: 'var(--color-surface-2)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            border: '1px solid var(--color-border)'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Borrower Information
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>
                {client?.name || 'Verified Client'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Client ID: #{client?.id || loan?.clientId} · Phone: +91 {client?.phoneNumber || 'N/A'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                KYC Status: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{client?.kycStatus || 'VERIFIED'}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Loan Parameters
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 4 }}>
                Principal: <strong>₹{Number(loan?.amountRequested || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tenure: <strong>{loan?.tenureMonths || schedules.length} Months</strong> · Interest Rate: <strong>{loan?.annualInterestRate}% p.a.</strong>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Purpose: {loan?.purpose || 'General Microfinance Purpose'}
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
            marginBottom: 24
          }}>
            <div style={{ background: 'var(--color-surface-2)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Repayable</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                ₹{Number(totalRepayable).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ background: 'var(--color-surface-2)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Paid</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: 4 }}>
                ₹{Number(paidAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ background: 'var(--color-surface-2)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining Balance</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-gold)', marginTop: 4 }}>
                ₹{Number(outstandingBalance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ background: 'var(--color-surface-2)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Settled EMIs</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {paidCount} / {schedules.length}
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 10, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              Repayment Schedule Breakdown
            </h4>
            <div className="table-wrapper">
              <table className="data-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Due Date</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Total EMI</th>
                    <th>Status</th>
                    <th>Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s, idx) => {
                    const badgeCls = s.status === 'PAID' ? 'badge-green' : s.status === 'OVERDUE' ? 'badge-red' : 'badge-muted';
                    return (
                      <tr key={s.id || idx}>
                        <td style={{ fontWeight: 600 }}>{s.installmentNo || idx + 1}</td>
                        <td>{s.dueDate ? new Date(s.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td>₹{Number(s.principal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>₹{Number(s.interest || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 700 }}>₹{Number(s.emiAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td><span className={`badge ${badgeCls} badge-dot`}>{s.status}</span></td>
                        <td>{s.paidDate ? new Date(s.paidDate).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footnote */}
          <div style={{
            borderTop: '1px dashed var(--color-border)',
            paddingTop: 14,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <div>
              <span>Official Microfinance Record · Keep for tax and repayment verification.</span>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              ✓ MicroFin Certified Statement
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
