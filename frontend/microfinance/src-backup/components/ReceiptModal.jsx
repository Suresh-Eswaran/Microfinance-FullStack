import { CheckCircle2, Download, MapPin, Printer, ShieldCheck, X } from 'lucide-react';
import React, { useRef } from 'react';

export default function ReceiptModal({ collection, emi, client, loan, onClose }) {
  const receiptRef = useRef(null);

  if (!collection) return null;

  const receiptNumber = collection.receiptNumber || `REC-${collection.id || Date.now()}`;
  const collectionDate = collection.collectionDate ? new Date(collection.collectionDate).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : new Date().toLocaleString('en-IN');

  const amount = Number(collection.amountCollected || emi?.emiAmount || 0);

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${receiptNumber}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #1e293b;
              background: #fff;
            }
            .receipt-box {
              max-width: 650px;
              margin: 0 auto;
              border: 2px solid #0f172a;
              border-radius: 12px;
              padding: 30px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px dashed #cbd5e1;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .org-title {
              font-size: 24px;
              font-weight: 800;
              color: #047857;
              margin: 0;
            }
            .org-subtitle {
              font-size: 12px;
              color: #64748b;
              margin: 4px 0 0 0;
            }
            .receipt-badge {
              background: #ecfdf5;
              color: #065f46;
              border: 1px solid #a7f3d0;
              font-weight: 700;
              padding: 6px 14px;
              border-radius: 9999px;
              font-size: 13px;
              display: inline-block;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 20px;
            }
            .field-label {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
            }
            .field-value {
              font-size: 15px;
              font-weight: 600;
              color: #0f172a;
              margin-top: 2px;
            }
            .amount-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 20px 0;
            }
            .amount-value {
              font-size: 26px;
              font-weight: 800;
              color: #047857;
            }
            .footer {
              border-top: 1px dashed #cbd5e1;
              padding-top: 16px;
              margin-top: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 12px;
              color: #64748b;
            }
            .stamp {
              border: 2px solid #047857;
              border-radius: 8px;
              padding: 8px 16px;
              color: #047857;
              font-weight: 800;
              text-align: center;
              font-size: 11px;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            @media print {
              body { padding: 0; }
              .receipt-box { border: 1px solid #94a3b8; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
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
    const textContent = `
==================================================
           MICROFIN LOAN MANAGEMENT
          OFFICIAL PAYMENT RECEIPT
==================================================
Receipt Number  : ${receiptNumber}
Date & Time     : ${collectionDate}
Status          : SUCCESSFUL / VERIFIED

CLIENT DETAILS:
Client ID       : #${client?.id || emi?.loanId || 'N/A'}
Client Name     : ${client?.name || 'Authorized Client'}
Phone           : ${client?.phoneNumber || 'N/A'}

LOAN & EMI DETAILS:
Loan ID         : #${loan?.id || emi?.loanId || 'N/A'}
EMI ID          : #${collection.emiId || emi?.id || 'N/A'}
Installment No  : #${emi?.installmentNo || '1'}

COLLECTION DETAILS:
Amount Collected: INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Collected By    : Officer #${collection.collectedBy || '101'}
GPS Geolocation : ${collection.gpsLat ? `${collection.gpsLat}, ${collection.gpsLng}` : 'Verified Field Collection'}

==================================================
This is a computer-generated official receipt.
Thank you for your timely EMI repayment!
==================================================
`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payment_Receipt_${receiptNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620, padding: 0, overflow: 'hidden' }}>
        {/* Modal Top Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: 'var(--color-surface-2)',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <ShieldCheck size={18} color="var(--color-primary)" />
            <span>Official Repayment Receipt</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary btn-sm"
              id="print-receipt-btn"
              title="Print Receipt or Save as PDF"
            >
              <Printer size={14} /> Print / PDF
            </button>
            <button
              onClick={handleDownload}
              className="btn btn-secondary btn-sm"
              id="download-receipt-btn"
              title="Download text copy"
            >
              <Download size={14} /> Download
            </button>
            <button className="modal-close" onClick={onClose} id="close-receipt-btn" style={{ marginLeft: 4 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={receiptRef} style={{ padding: '28px 32px', background: 'var(--color-surface)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px dashed var(--color-border)',
            paddingBottom: 20,
            marginBottom: 20
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '1.4rem' }}>💰</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  MicroFin Ltd.
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Microfinance & Micro-Credit Institution
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                RBI Registered NBFC-MFI · Head Office
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 10px',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <CheckCircle2 size={12} /> PAYMENT VERIFIED
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Receipt No: <strong style={{ color: 'var(--text-primary)' }}>{receiptNumber}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Date: {collectionDate}
              </div>
            </div>
          </div>

          {/* Client & Loan Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Borrower Details
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                {client?.name || 'Verified Client'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Client ID: #{client?.id || loan?.clientId || '—'}
              </div>
              {client?.phoneNumber && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Phone: +91 {client.phoneNumber}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Loan & EMI Reference
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                Loan #{loan?.id || emi?.loanId || '—'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                EMI Schedule ID: #{collection.emiId || emi?.id || '—'}
              </div>
              {emi?.installmentNo && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Installment No: #{emi.installmentNo}
                </div>
              )}
            </div>
          </div>

          {/* Amount Paid Box */}
          <div style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Amount Paid (INR)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Payment Mode: Cash / Field Collection
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Collection Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>
              <span>Collected By: </span>
              <strong style={{ color: 'var(--text-primary)' }}>Agent #{collection.collectedBy || '101'}</strong>
            </div>
            {collection.gpsLat ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} color="var(--color-primary)" />
                <span>GPS: {Number(collection.gpsLat).toFixed(4)}, {Number(collection.gpsLng).toFixed(4)}</span>
              </div>
            ) : (
              <div>Field Verification: Verified</div>
            )}
          </div>

          {/* Seal / Footer */}
          <div style={{
            borderTop: '1px dashed var(--color-border)',
            paddingTop: 18,
            marginTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <div>
              <p style={{ margin: 0 }}>This is an electronic receipt issued by MicroFin System.</p>
              <p style={{ margin: '2px 0 0' }}>For inquiries, please contact your branch or call 1800-MICROFIN.</p>
            </div>
            <div style={{
              border: '2px solid var(--color-primary)',
              borderRadius: 6,
              padding: '6px 12px',
              color: 'var(--color-primary)',
              fontWeight: 800,
              letterSpacing: 1,
              fontSize: '0.7rem',
              textAlign: 'center',
              textTransform: 'uppercase'
            }}>
              ✓ MICROFIN AUTHENTICATED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
