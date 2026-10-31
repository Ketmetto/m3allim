import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from './icons.js';

/* Icon: pass any lucide-react icon name, e.g. <Icon name="Search" /> */
export function Icon({ name, size = 18, color, strokeWidth = 2, ...rest }) {
  const Cmp = ICONS[name];
  return Cmp ? <Cmp size={size} color={color} strokeWidth={strokeWidth} aria-hidden="true" {...rest} /> : null;
}

export function Logo({ light = false, to = '/' }) {
  return (
    <Link to={to} className={`logo ${light ? 'logo-light' : ''}`} aria-label="M3allim home">
      <span className="logo-mark"><Icon name="GraduationCap" size={22} /></span>
      <span className="logo-word">M3allim</span>
      <span className="logo-divider" />
      <span className="logo-ar" lang="ar">معلّم</span>
    </Link>
  );
}

/* Avatar shows a photo if the file exists, otherwise the person's initials. */
export function Avatar({ name, src, size = 40 }) {
  const [brokenSrc, setBrokenSrc] = useState(null);
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  if (src && src !== brokenSrc) {
    // no-referrer: Google profile pictures can refuse requests that send a referrer.
    return <img className="avatar" style={style} src={src} alt={name} referrerPolicy="no-referrer" onError={() => setBrokenSrc(src)} />;
  }
  return <span className="avatar avatar-initials" style={style} aria-label={name}>{initials}</span>;
}

export function Person({ name, sub, src, size = 40 }) {
  return (
    <div className="row gap-12 min0">
      <Avatar name={name} src={src} size={size} />
      <div className="col min0">
        <span className="semibold truncate">{name}</span>
        {sub && <span className="xs muted truncate">{sub}</span>}
      </div>
    </div>
  );
}

/* variant: primary | outline | danger | danger-outline | ghost | dark | gold-outline */
export function Button({ variant = 'primary', size = 'md', icon, iconAfter, to, children, className = '', ...rest }) {
  const cls = `btn btn-${variant} btn-${size} ${className}`;
  const px = size === 'sm' ? 14 : 17;
  const content = (
    <>
      {icon && <Icon name={icon} size={px} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={px} />}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  return <button type="button" className={cls} {...rest}>{content}</button>;
}

/* kind: teal | green | gold | gray | red */
export function Chip({ kind = 'teal', dot = true, children }) {
  return (
    <span className={`chip chip-${kind}`}>
      {dot && <span className="chip-dot" />}
      {children}
    </span>
  );
}

const STATUS_KIND = {
  Confirmed: 'green', Accepted: 'green', Active: 'green', Approved: 'green', Operational: 'green', Resolved: 'green',
  Pending: 'gold', Invited: 'gold', Open: 'gold', Medium: 'gold',
  Completed: 'gray', Low: 'gray', Cancelled: 'gray', Dismissed: 'gray',
  'New time proposed': 'gold',
  Declined: 'red', Banned: 'red', Suspended: 'red', Rejected: 'red', High: 'red',
};
export const StatusChip = ({ status }) => <Chip kind={STATUS_KIND[status] || 'gray'}>{status}</Chip>;

export function Card({ className = '', pad = 28, children, style, ...rest }) {
  return <section className={`card ${className}`} style={{ padding: pad, ...style }} {...rest}>{children}</section>;
}

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

export function Stars({ value = 5, size = 14 }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} out of 5`}>
      {'★★★★★'.slice(0, Math.round(value))}
      <span className="stars-off">{'★★★★★'.slice(Math.round(value))}</span>
    </span>
  );
}

export function Tabs({ items, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((t) => (
        <button key={t.id} role="tab" aria-selected={active === t.id} className={`tab ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, gold = false, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'on' : ''} ${gold ? 'gold' : ''}`} onClick={() => onChange(!on)}>
      <span className="toggle-knob" />
    </button>
  );
}

export function Checkbox({ checked, onChange, children }) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="checkbox-box">{checked && <Icon name="Check" size={13} strokeWidth={3} />}</span>
      <span>{children}</span>
    </label>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="xs muted">{hint}</span>}
    </label>
  );
}

export const Input = (props) => <input className="input" {...props} />;
export function PasswordInput(props) {
  const [shown, setShown] = useState(false);
  return (
    <span className="password-wrap">
      <input className="input" type={shown ? 'text' : 'password'} {...props} />
      <button type="button" className="password-toggle" aria-label={shown ? 'Hide password' : 'Show password'} onClick={() => setShown(!shown)}>
        <Icon name={shown ? 'EyeOff' : 'Eye'} size={18} />
      </button>
    </span>
  );
}
/* Profile photo with change / remove controls. onPick receives the chosen image file. */
export function PhotoPicker({ name, src, onPick, onRemove, size = 72 }) {
  return (
    <div className="row gap-16">
      <Avatar name={name || ''} src={src} size={size} />
      <div className="col gap-6 start">
        <label className="btn btn-outline btn-sm photo-btn">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onPick(f); }} />
          <Icon name="Upload" size={14} />
          {src ? 'Change photo' : 'Add a photo'}
        </label>
        {src && onRemove ? <button type="button" className="link" onClick={onRemove}>Remove photo</button> : <span className="xs muted">Optional · JPG, PNG or WebP</span>}
      </div>
    </div>
  );
}

/* File picker that shows the chosen file. accept: e.g. ".pdf,.doc,.docx" */
export function FileInput({ file, onChange, accept, label = 'Choose a file' }) {
  return (
    <label className={`file-input ${file ? 'has-file' : ''}`}>
      <input type="file" accept={accept} onChange={(e) => onChange(e.target.files[0] || null)} />
      <Icon name={file ? 'FileText' : 'Upload'} size={18} />
      <span className="col fill min0">
        <span className="sm medium truncate">{file ? file.name : label}</span>
        <span className="xs muted">{file ? `${file.size < 1048576 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / 1048576).toFixed(1)} MB`} · click to replace` : 'PDF or Word, up to 5 MB'}</span>
      </span>
    </label>
  );
}
export const Textarea = (props) => <textarea className="input textarea" {...props} />;
export function Select({ value, onChange, options, ...rest }) {
  return (
    <span className="select-wrap">
      <select className="input select" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <Icon name="ChevronDown" size={14} />
    </span>
  );
}

export function SearchBox({ value, onChange, placeholder, width }) {
  return (
    <span className="searchbox" style={{ width }}>
      <Icon name="Search" size={16} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </span>
  );
}

/* Generic table. columns: [{ key, label, width (px, omit = flexible), render(row) }] */
export function DataTable({ columns, rows, selectedId, onRowClick }) {
  const tpl = columns.map((c) => (c.width ? `${c.width}px` : 'minmax(0, 1fr)')).join(' ');
  return (
    <div className="table" role="table">
      <div className="table-row table-head" role="row" style={{ gridTemplateColumns: tpl }}>
        {columns.map((c) => <div key={c.key} role="columnheader">{c.label}</div>)}
      </div>
      {rows.map((r) => (
        <div
          key={r.id}
          role="row"
          className={`table-row ${selectedId === r.id ? 'selected' : ''} ${onRowClick ? 'clickable' : ''}`}
          style={{ gridTemplateColumns: tpl }}
          onClick={() => onRowClick && onRowClick(r)}
        >
          {columns.map((c) => <div key={c.key} role="cell" className="cell">{c.render ? c.render(r) : r[c.key]}</div>)}
        </div>
      ))}
    </div>
  );
}

export function Stepper({ current }) {
  const steps = ['Choose a time', 'Confirm details', 'Request sent'];
  return (
    <ol className="stepper" aria-label="Booking progress">
      {steps.map((s, i) => {
        const state = i + 1 < current ? 'done' : i + 1 === current ? 'active' : 'todo';
        return (
          <li key={s} className={`step step-${state}`}>
            <span className="step-marker">{state === 'done' ? <Icon name="Check" size={16} strokeWidth={2.5} /> : i + 1}</span>
            <span className="step-label">{s}</span>
            {i < steps.length - 1 && <span className={`step-line ${state === 'done' ? 'done' : ''}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export function PageHeading({ title, sub, children }) {
  return (
    <div className="row between page-heading">
      <div className="col gap-6">
        <h1 className="h1">{title}</h1>
        {sub && <p className="lead muted">{sub}</p>}
      </div>
      {children && <div className="row gap-12">{children}</div>}
    </div>
  );
}

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

/* Dialog box. Closes on Escape or a click outside. */
export function Modal({ title, onClose, children, width = 480 }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal card col gap-20" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <div className="row between"><h2 className="h2-sm">{title}</h2><button className="icon-btn muted" aria-label="Close" onClick={onClose}><Icon name="CircleX" size={20} /></button></div>
        {children}
      </div>
    </div>
  );
}
