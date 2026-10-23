import { useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../utils/format';
import QuantityStepper from './QuantityStepper';
import CouponPanel from './CouponPanel';
import PriceSummary from './PriceSummary';
import { EmptyState, ErrorState, Spinner } from './States';

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { cart, cartLoading, cartError, busy, preview, pricingLoading, updateQuantity, removeItem, reloadCart } = useCart();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const empty = cart.items.length === 0;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label="Shopping cart"
        className="drawer-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-page shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-xl font-bold">Your cart</h2>
          <button ref={closeRef} type="button" className="btn-ghost h-9 w-9 !p-0" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {cartLoading && <Spinner label="Loading your cart" />}
          {cartError && <ErrorState message={cartError} onRetry={reloadCart} />}
          {!cartLoading && !cartError && empty && (
            <EmptyState title="Your cart is empty" text="Add a product and your totals will show up here."
              action={<button type="button" className="btn-primary mt-4" onClick={onClose}>Keep shopping</button>} />
          )}

          {!empty && (
            <>
              <ul className="space-y-3">
                {cart.items.map((item) => (
                  <li key={item.productId} className="card p-3">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-medium leading-snug">{item.name}</p>
                        <p className="text-sm text-muted">{formatMoney(item.unitPrice)} each</p>
                      </div>
                      <p className="font-semibold tabular-nums">{formatMoney(item.lineTotal)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <QuantityStepper value={item.quantity} max={item.stockQuantity} label={item.name} disabled={busy}
                        onChange={(q) => updateQuantity(item.productId, q)} />
                      <button type="button" className="text-sm text-muted underline underline-offset-2 hover:text-danger" disabled={busy}
                        onClick={() => removeItem(item)} aria-label={`Remove ${item.name} from cart`}>Remove</button>
                    </div>
                    {item.quantity >= item.stockQuantity && <p className="mt-2 text-xs text-muted">Maximum available quantity in your cart.</p>}
                  </li>
                ))}
              </ul>
              <CouponPanel />
            </>
          )}
        </div>

        {!empty && (
          <div className="space-y-4 border-t border-line bg-surface px-5 py-4">
            <PriceSummary preview={preview} loading={pricingLoading} />
            <button type="button" className="btn-primary w-full" onClick={onCheckout} disabled={pricingLoading || !preview}>Go to checkout</button>
          </div>
        )}
      </aside>
    </div>
  );
}
