export function Stars({ value = 5, size = 14 }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} out of 5`}>
      {'★★★★★'.slice(0, Math.round(value))}
      <span className="stars-off">{'★★★★★'.slice(Math.round(value))}</span>
    </span>
  );
}

/* Clickable 1–5 stars. */
export function StarPicker({ value, onChange }) {
  return (
    <div className="row gap-4 rate-pick big" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} stars`} className={n <= value ? 'on' : ''} onClick={() => onChange(n)}>★</button>
      ))}
    </div>
  );
}
