import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../utils/format';

export default function CouponPanel() {
  const { appliedCode, preview, assistant, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const rec = assistant.recommendation;

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    const result = await applyCoupon(code);
    setSubmitting(false);
    if (result.ok) { setCode(''); setError(''); } else setError(result.message);
  }

  return (
    <section aria-label="Coupons" className="space-y-3">
      {appliedCode && preview?.coupon ? (
        <div className="flex items-center justify-between rounded-lg border border-brand bg-brand/10 px-3 py-2.5 text-sm">
          <div>
            <p className="font-semibold text-brand">{appliedCode} applied</p>
            <p className="text-muted">You save {formatMoney(preview.discount)}</p>
          </div>
          <button type="button" className="text-sm font-semibold underline underline-offset-2" onClick={removeCoupon}>Remove</button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <label htmlFor="coupon-code" className="mb-1 block text-sm font-medium">Coupon code</label>
          <div className="flex gap-2">
            <input id="coupon-code" className="field uppercase" value={code} placeholder="e.g. SAVE10" autoComplete="off"
              aria-invalid={Boolean(error)} aria-describedby={error ? 'coupon-error' : undefined}
              onChange={(e) => { setCode(e.target.value); setError(''); }} />
            <button type="submit" className="btn-ghost shrink-0" disabled={!code.trim() || submitting}>{submitting ? 'Checking' : 'Apply'}</button>
          </div>
          {error && <p id="coupon-error" role="alert" className="mt-1.5 text-sm text-danger">{error}</p>}
        </form>
      )}

      {rec && (
        <div className="rounded-lg border border-sun bg-sunsoft p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="rounded bg-sun px-1.5 py-0.5 text-xs font-bold text-black">Suggested</span>
            <span className="font-semibold">Smart Savings Assistant</span>
          </div>
          <p className="mt-2">{rec.explanation}</p>
          {rec.applied ? (
            <p className="mt-2 font-semibold text-brand">✓ Applied. This is your best saving.</p>
          ) : (
            <button type="button" className="btn-ghost mt-3 !py-1.5" onClick={() => applyCoupon(rec.code)}>
              {appliedCode ? `Switch to ${rec.code}` : `Apply ${rec.code}`}
            </button>
          )}
          <p className="mt-2 text-xs text-muted">A suggestion only. Nothing changes until you apply it.</p>
        </div>
      )}

      {assistant.hint && <p className="text-sm text-muted">💡 {assistant.hint.message}</p>}
    </section>
  );
}
