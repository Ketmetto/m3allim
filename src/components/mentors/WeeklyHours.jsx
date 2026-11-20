import { WEEKDAYS } from '../../config/constants.js';
import { describeAvailability } from '../../utils/slots.js';

/* A mentor's weekly hours on their public profile. */
export function WeeklyHours({ availability }) {
  if (!availability?.length) return <p className="sm muted">No fixed hours. Request any time and the mentor will confirm.</p>;
  return (
    <div className="col gap-6 sm">
      {describeAvailability(availability, WEEKDAYS).map((a, i) => (
        <div key={i} className="row between gap-12"><span className="muted">{a.day}</span><span className="medium">{a.hours}</span></div>
      ))}
    </div>
  );
}
