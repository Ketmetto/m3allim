import { Stars } from '../ui';
import { fmtDate } from '../../utils/time.js';

/* Reviews without names (mentor_reviews view). */
export function ReviewList({ reviews, empty = 'No reviews yet.' }) {
  if (!reviews?.length) return <p className="muted">{empty}</p>;
  return (
    <div className="col gap-16">
      {reviews.map((r, i) => (
        <div key={`${r.starts_at}-${i}`} className="col gap-6">
          {i > 0 && <hr className="hr" />}
          <div className="row gap-10"><Stars value={r.rating} /><span className="xs muted">{fmtDate(r.starts_at)}</span></div>
          {r.review ? <p>{r.review}</p> : <p className="sm muted">No written review.</p>}
        </div>
      ))}
    </div>
  );
}

/* Average and how many reviews gave each number of stars. */
export function RatingSummary({ reviews }) {
  const total = reviews.length;
  const avg = total ? reviews.reduce((n, r) => n + r.rating, 0) / total : 0;
  return (
    <div className="rating-summary">
      <div className="col center-items gap-4">
        <span className="metric">{total ? avg.toFixed(1) : '–'}</span>
        <Stars value={avg} size={16} />
        <span className="xs muted">{total} {total === 1 ? 'review' : 'reviews'}</span>
      </div>
      <div className="col gap-6 fill">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = reviews.filter((r) => r.rating === n).length;
          return (
            <div key={n} className="row gap-10 xs">
              <span className="muted" style={{ width: 14 }}>{n}★</span>
              <span className="meter fill"><span style={{ width: `${total ? (count / total) * 100 : 0}%` }} /></span>
              <span className="muted" style={{ width: 22, textAlign: 'right' }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
