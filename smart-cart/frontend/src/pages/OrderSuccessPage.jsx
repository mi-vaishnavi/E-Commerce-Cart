import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatMoney } from '../utils/format';
import { ErrorState, Spinner } from '../components/States';

export default function OrderSuccessPage({ orderId, onContinue }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  // The confirmation is read back from the backend, proving the order was persisted.
  const load = useCallback(async () => {
    setError(null);
    try {
      setOrder((await api.getOrder(orderId)).order);
    } catch (e) {
      setError(e.message);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  if (error) return <main className="px-4 py-10"><ErrorState message={error} onRetry={load} /></main>;
  if (!order) return <main className="px-4 py-16 text-center"><Spinner label="Loading your confirmation" /></main>;

  const p = order.pricing;
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="card p-6 sm:p-8">
        <p className="text-sm font-semibold text-brand">Order placed (simulated)</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Thanks, {order.customer.name.split(' ')[0]}</h1>
        <p className="mt-3 text-sm text-muted">Your order ID</p>
        <p className="mt-1 break-all rounded-lg bg-raised px-3 py-2 font-mono text-lg font-semibold" data-testid="order-id">{order.orderId}</p>

        <h2 className="mt-8 text-lg font-semibold">Items</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3 py-2.5">
              <span>{i.name} <span className="text-muted">× {i.quantity} at {formatMoney(i.unitPrice)}</span></span>
              <span className="tabular-nums">{formatMoney(i.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatMoney(p.subtotal)}</dd></div>
          {p.couponCode && <div className="flex justify-between text-brand"><dt>Coupon {p.couponCode}</dt><dd className="tabular-nums">−{formatMoney(p.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="tabular-nums">{formatMoney(p.tax)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Amount payable</dt><dd className="tabular-nums">{formatMoney(p.total)}</dd></div>
        </dl>

        <div className="mt-6 rounded-lg bg-raised p-4 text-sm">
          <p className="font-medium">Shipping to</p>
          <p className="mt-1 whitespace-pre-line text-muted">{order.customer.shippingAddress}</p>
          <p className="mt-2 text-muted">{order.customer.email}</p>
        </div>

        <button type="button" className="btn-primary mt-8 w-full" onClick={onContinue}>Continue shopping</button>
      </div>
    </main>
  );
}
