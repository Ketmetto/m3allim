import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

export function PageHeading({ title, sub, children }) {
  return (
    <div className="row between page-heading">
      <div className="col gap-6">
        <h1 className="h1">{title}</h1>
        {sub && <p className="lead muted">{sub}</p>}
      </div>
      {children && <div className="row gap-12 wrap">{children}</div>}
    </div>
  );
}

/* items: [{ label, to? }] – the last one is the current page */
export function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={it.label} className="row gap-8">
          {i > 0 && <Icon name="ChevronRight" size={12} />}
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span className="current">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
