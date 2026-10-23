import { formatMoney } from '../utils/format';

function Row({ label, value, tone, strong }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? 'text-base font-semibold' : 'text-sm'} ${tone === 'save' ? 'text-brand' : ''}`}>
      <dt className={strong || tone ? '' : 'text-muted'}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

// Renders the server's breakdown verbatim; nothing here is computed on the client.
export default function PriceSummary({ preview, loading }) {
  if (!preview) return null;
  return (
    <dl className={`space-y-2 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
      <Row label={`Subtotal (${preview.itemCount} ${preview.itemCount === 1 ? 'item' : 'items'})`} value={formatMoney(preview.subtotal)} />
      {preview.coupon && <Row label={`Coupon ${preview.coupon.code}`} value={`−${formatMoney(preview.discount)}`} tone="save" />}
      {preview.taxRatePercent > 0 && <Row label={`Tax (${preview.taxRatePercent}%)`} value={formatMoney(preview.tax)} />}
      <div className="border-t border-line pt-3">
        <Row label="Payable amount" value={formatMoney(preview.total)} strong />
      </div>
    </dl>
  );
}
