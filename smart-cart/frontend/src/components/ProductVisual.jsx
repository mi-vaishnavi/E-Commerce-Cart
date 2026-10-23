// Polished local "image": an emoji on a category-tinted panel. No external image requests needed.
const ICONS = {
  headphones: '🎧', speaker: '🔊', earbuds: '🎶', watch: '⌚', tracker: '🏃', backpack: '🎒',
  charger: '🔌', keyboard: '⌨️', lamp: '💡', kettle: '☕', mat: '🧘', bottle: '💧',
};
const TINTS = {
  Audio: ['#0E7C7B', '#7FD1C7'],
  Wearables: ['#3B5BDB', '#A5B4FC'],
  Accessories: ['#B7791F', '#F6D58A'],
  Home: ['#9C4A6B', '#F2B8CF'],
  Fitness: ['#2F855A', '#A7E3B9'],
};

export default function ProductVisual({ product, size = 'card' }) {
  const [from, to] = TINTS[product.category] || ['#475569', '#CBD5E1'];
  const tall = size === 'modal' ? 'h-56 text-7xl' : 'h-40 text-6xl';
  return (
    <div role="img" aria-label={product.name}
      className={`flex items-center justify-center ${tall}`}
      style={{ background: `linear-gradient(135deg, ${from}33, ${to}88)` }}>
      <span aria-hidden="true" className="drop-shadow-sm">{ICONS[product.imageUrl] || '📦'}</span>
    </div>
  );
}
