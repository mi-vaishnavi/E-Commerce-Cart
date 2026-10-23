import { useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../utils/format';
import ProductVisual from './ProductVisual';
import { stockLabel } from './ProductCard';

export default function ProductModal({ product, onClose }) {
  const { cart, addItem, busy } = useCart();
  const closeRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!product) return null;
  const inCart = cart.items.find((i) => i.productId === product.id)?.quantity || 0;
  const stock = stockLabel(product);
  const maxed = inCart >= product.stockQuantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="product-title" className="card relative w-full max-w-lg overflow-hidden shadow-2xl">
        <ProductVisual product={product} size="modal" />
        <button ref={closeRef} type="button" className="btn-ghost absolute right-3 top-3 h-9 w-9 !p-0" onClick={onClose} aria-label="Close details">✕</button>
        <div className="p-6">
          <p className="text-sm text-muted">{product.category}</p>
          <h2 id="product-title" className="text-2xl font-bold">{product.name}</h2>
          <p className="mt-3 text-muted">{product.description}</p>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-2xl font-bold tabular-nums">{formatMoney(product.price)}</p>
            <p className={`font-medium ${stock.cls}`}>{stock.text}</p>
          </div>
          <button type="button" className="btn-primary mt-5 w-full" disabled={busy || product.stockQuantity === 0 || maxed} onClick={() => addItem(product)}>
            {product.stockQuantity === 0 ? 'Unavailable' : maxed ? 'Max quantity in cart' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
