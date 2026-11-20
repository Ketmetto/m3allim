import { Icon } from './Icon.jsx';

export function Card({ className = '', pad = 28, children, style, ...rest }) {
  return <section className={`card ${className}`} style={{ padding: pad, ...style }} {...rest}>{children}</section>;
}

/* A number tile on dashboards. */
export function Stat({ icon, label, value, sub, subKind, gold = false }) {
  return (
    <Card pad={22} className="col gap-12">
      <div className="row between">
        <span className="sm muted">{label}</span>
        <span className={`icon-box ${gold ? 'icon-box-gold' : ''}`}><Icon name={icon} size={18} /></span>
      </div>
      <span className="stat-value">{value}</span>
      {sub && <span className={`xs ${subKind === 'good' ? 'text-green' : subKind === 'bad' ? 'text-red' : 'muted'}`}>{sub}</span>}
    </Card>
  );
}

/* "Nothing here yet" message with an optional action. */
export function EmptyState({ icon = 'Inbox', title, text, children }) {
  return (
    <div className="empty">
      <Icon name={icon} size={28} color="var(--gray)" />
      {title && <h3 className="h3">{title}</h3>}
      {text && <p className="muted">{text}</p>}
      {children}
    </div>
  );
}

export const Loading = ({ text = 'Loading…' }) => <div className="empty muted" role="status">{text}</div>;

/* Label + value rows, e.g. in review panels. rows: [[label, value]] – empty values are skipped. */
export function DetailList({ rows }) {
  return (
    <div className="col gap-10 sm">
      {rows.filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => (
        <div key={k} className="row between gap-12"><span className="muted">{k}</span><span className="medium truncate right">{v}</span></div>
      ))}
    </div>
  );
}
