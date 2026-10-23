import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { EmptyState, ErrorState, ProductSkeletons } from '../components/States';

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts((await api.getProducts()).products);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category))], [products]);
  const visible = category === 'All' ? products : products.filter((p) => p.category === category);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Gear that earns its place on your desk</h1>
        <p className="mt-2 max-w-xl text-muted">Add what you like. Cartwise checks every coupon against your cart and tells you which one saves the most.</p>
      </div>

      {!loading && !error && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${category === c ? 'border-brand bg-brand text-onbrand' : 'border-line bg-surface hover:bg-raised'}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {loading && <ProductSkeletons />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && visible.length === 0 && <EmptyState title="No products here yet" text="Try a different category." />}
      {!loading && !error && visible.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => <ProductCard key={p.id} product={p} onOpen={setSelected} />)}
        </div>
      )}

      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
