import { useCart } from '../context/CartContext';

export default function Header({ dark, onToggleTheme, onOpenCart, onHome }) {
  const { cart } = useCart();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <button type="button" onClick={onHome} className="font-display text-2xl font-bold tracking-tight">
          Cartwise
        </button>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost h-10 w-10 !p-0" onClick={onToggleTheme}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} aria-pressed={dark}>
            <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
          </button>
          <button type="button" className="btn-primary relative h-10" onClick={onOpenCart} aria-label={`Open cart, ${cart.itemCount} items`}>
            Cart
            <span className="min-w-6 rounded-full bg-onbrand px-1.5 text-center text-xs font-bold text-brand tabular-nums">{cart.itemCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
