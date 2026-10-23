export default function QuantityStepper({ value, max, onChange, disabled, label }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-line bg-surface" role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" className="h-8 w-8 rounded-l-lg text-lg hover:bg-raised disabled:opacity-40"
        aria-label={`Decrease quantity of ${label}`} disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>−</button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className="h-8 w-8 rounded-r-lg text-lg hover:bg-raised disabled:opacity-40"
        aria-label={`Increase quantity of ${label}`} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
