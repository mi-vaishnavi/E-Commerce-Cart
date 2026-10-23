import { useCart } from '../context/CartContext';
import { formatMoney } from '../utils/format';
import ProductVisual from './ProductVisual';

export function stockLabel(product) {
  if (product.stockQuantity === 0) return { text: 'Out of stock', cls: 'text-danger' };
  if (product.stockQuantity <= 5) return { text: `Only ${product.stockQuantity} left`, cls: 'text-sun' };
  return { text: 'In stock', cls: 'text-brand' };
}

export default function ProductCard({ product, onOpen }) {
  const { cart, addItem, busy } = useCart();
  const inCart = cart.items.find((i) => i.productId === product.id)?.quantity || 0;
  const stock = stockLabel(product);
  const maxed = inCart >= product.stockQuantity;

  return (
    <article className="card flex flex-col overflow-hidden">
      <button type="button" onClick={() => onOpen(product)} aria-label={`View details for ${product.name}`}>
        <ProductVisual product={product} />
      </button>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-muted">{product.category}</p>
        <h3 className="mt-0.5 text-lg font-semibold leading-snug">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p>
        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-xl font-bold tabular-nums">{formatMoney(product.price)}</p>
          <p className={`text-sm font-medium ${stock.cls}`}>{stock.text}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-primary flex-1" disabled={busy || product.stockQuantity === 0 || maxed}
            onClick={() => addItem(product)}>
            {product.stockQuantity === 0 ? 'Unavailable' : maxed ? 'Max in cart' : 'Add to cart'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => onOpen(product)}>Details</button>
        </div>
        {inCart > 0 && <p className="mt-2 text-xs text-muted">{inCart} in your cart</p>}
      </div>
    </article>
  );
}
