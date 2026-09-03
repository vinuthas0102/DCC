import type { DccPayment, DccTile, DccDemand } from '../types/dcc';
import { PAYMENT_MODE_LABELS } from '../types/payableCriteria';
import type { PaymentMode } from '../types/payableCriteria';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export function receiptNumber(paymentId: string): string {
  const short = paymentId.replace(/-/g, '').slice(-8).toUpperCase();
  return `RCP-${short}`;
}

export interface ReceiptContext {
  payment: DccPayment;
  tile: DccTile;
  demand: DccDemand | null;
}

export function generatePaymentReceipt({ payment, tile, demand }: ReceiptContext): void {
  const rcpNo = receiptNumber(payment.id);
  const modeLabel = PAYMENT_MODE_LABELS[payment.payment_mode as PaymentMode] ?? payment.payment_mode;
  const generatedAt = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const ownerAddress = [tile.owner_address].filter(Boolean).join(', ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Receipt — ${rcpNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1f2937; background: #f3f4f6; padding: 24px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .receipt { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0f766e, #115e59); color: #fff; padding: 28px 32px; display: flex; align-items: center; gap: 16px; }
    .header-logo { width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; }
    .header-text h1 { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; }
    .header-text p { font-size: 12px; opacity: 0.85; margin-top: 2px; }
    .rcp-badge { margin-left: auto; text-align: right; }
    .rcp-badge .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.75; }
    .rcp-badge .num { font-size: 18px; font-weight: 700; margin-top: 2px; }

    .body { padding: 28px 32px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; margin-bottom: 24px; }
    .info-item .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; }
    .info-item .value { font-size: 13px; font-weight: 600; color: #1f2937; margin-top: 2px; }

    .amount-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .amount-box .lbl { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #0f766e; }
    .amount-box .amt { font-size: 28px; font-weight: 800; color: #0f766e; }

    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .details-table th { background: #f9fafb; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    .details-table td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
    .details-table td.value { font-weight: 600; }

    .status-pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-paid { background: #d1fae5; color: #065f46; }

    .footer { padding: 16px 32px 28px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-left { font-size: 10px; color: #9ca3af; }
    .footer-right { text-align: right; }
    .footer-right .sign { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px; }
    .footer-right .line { width: 140px; border-top: 1px dashed #9ca3af; margin-bottom: 4px; }
    .footer-right .role { font-size: 10px; color: #9ca3af; }

    .print-bar { text-align: center; margin: 16px 0 0; }
    .print-bar button { background: #0f766e; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .print-bar button:hover { background: #115e59; }

    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; max-width: 100%; border-radius: 0; }
      .print-bar { display: none; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="header-logo">FMS</div>
      <div class="header-text">
        <h1>Demand &amp; Collection Center</h1>
        <p>Government Facilities Management System</p>
      </div>
      <div class="rcp-badge">
        <div class="label">Receipt No</div>
        <div class="num">${rcpNo}</div>
      </div>
    </div>

    <div class="body">
      <div class="section-title">Payer Information</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Owner / Payer</div>
          <div class="value">${tile.owner_name}</div>
        </div>
        <div class="info-item">
          <div class="label">Contact</div>
          <div class="value">${tile.owner_contact}</div>
        </div>
        <div class="info-item">
          <div class="label">Address</div>
          <div class="value">${ownerAddress || '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">Object Reference</div>
          <div class="value">${tile.object_ref}</div>
        </div>
      </div>

      <div class="section-title">Demand Information</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Demand Type</div>
          <div class="value">${tile.demand_type_label}</div>
        </div>
        <div class="info-item">
          <div class="label">Object Type</div>
          <div class="value">${tile.object_type}</div>
        </div>
        <div class="info-item">
          <div class="label">Demand Run Date</div>
          <div class="value">${fmtDate(tile.demand_run_date)}</div>
        </div>
        <div class="info-item">
          <div class="label">Due Date</div>
          <div class="value">${fmtDate(tile.due_date)}</div>
        </div>
        ${demand?.dispute_date ? `<div class="info-item"><div class="label">Dispute Date</div><div class="value">${fmtDate(demand.dispute_date)}</div></div>` : ''}
      </div>

      <div class="amount-box">
        <div class="lbl">Amount Paid</div>
        <div class="amt">${fmtINR(payment.amount)}</div>
      </div>

      <div class="section-title">Payment Details</div>
      <table class="details-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Receipt Number</td><td class="value">${rcpNo}</td></tr>
          <tr><td>Payment Date</td><td class="value">${fmtDate(payment.payment_date)}</td></tr>
          <tr><td>Payment Mode</td><td class="value">${modeLabel}</td></tr>
          <tr><td>Reference Number</td><td class="value">${payment.reference_number || '—'}</td></tr>
          <tr><td>Amount</td><td class="value">${fmtINR(payment.amount)}</td></tr>
          <tr><td>Remarks</td><td class="value">${payment.remarks || '—'}</td></tr>
          <tr><td>Recorded On</td><td class="value">${fmtDateTime(payment.created_at)}</td></tr>
          <tr><td>Payment Status</td><td><span class="status-pill status-paid">Confirmed</span></td></tr>
        </tbody>
      </table>

      <div class="section-title">Demand Summary</div>
      <table class="details-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Total Demand Amount</td><td class="value">${fmtINR(tile.total_amount)}</td></tr>
          <tr><td>Total Amount Paid</td><td class="value">${fmtINR(tile.amount_paid)}</td></tr>
          <tr><td>Outstanding Balance</td><td class="value">${fmtINR(tile.amount_due)}</td></tr>
          <tr><td>Demand Status</td><td><span class="status-pill ${tile.status === 'PAID' ? 'status-paid' : 'status-paid'}">${tile.status}</span></td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div class="footer-left">
        Generated on ${generatedAt}<br />
        This is a system-generated receipt and does not require a physical signature.
      </div>
      <div class="footer-right">
        <div class="sign">Authorized Signatory</div>
        <div class="line"></div>
        <div class="role">Estate Manager / DCC Admin</div>
      </div>
    </div>
  </div>

  <div class="print-bar">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Receipt_${rcpNo}.html`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
