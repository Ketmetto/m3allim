// Form controls: text boxes, selects, checkboxes, toggles, file and photo pickers.
import { useState } from 'react';
import { Icon } from './Icon.jsx';
import { Avatar } from './Avatar.jsx';
import { fileSize } from '../../utils/format.js';

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
export const Textarea = (props) => <textarea className="input textarea" {...props} />;

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

/* options: ['A', 'B'] or [{ value, label }] */
export function Select({ value, onChange, options, ...rest }) {
  const list = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  return (
    <span className="select-wrap">
      <select className="input select" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
        {list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icon name="ChevronDown" size={14} />
    </span>
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

export function Toggle({ on, onChange, gold = false, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} className={`toggle ${on ? 'on' : ''} ${gold ? 'gold' : ''}`} onClick={() => onChange(!on)}>
      <span className="toggle-knob" />
    </button>
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

/* File picker that shows the chosen file. accept: e.g. ".pdf,.doc,.docx" */
export function FileInput({ file, onChange, accept, label = 'Choose a file', hint = 'PDF or Word, up to 5 MB', current }) {
  return (
    <label className={`file-input ${file || current ? 'has-file' : ''}`}>
      <input type="file" accept={accept} onChange={(e) => onChange(e.target.files[0] || null)} />
      <Icon name={file || current ? 'FileText' : 'Upload'} size={18} />
      <span className="col fill min0">
        <span className="sm medium truncate">{file ? file.name : current || label}</span>
        <span className="xs muted">{file ? `${fileSize(file.size)} · click to replace` : current ? 'Already uploaded · click to replace' : hint}</span>
      </span>
    </label>
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

/* Error and success lines under a form. */
export const FormError = ({ children }) => (children ? <p className="error" role="alert">{children}</p> : null);
export const FormNotice = ({ children }) => (children ? <p className="toast" role="status"><Icon name="Check" size={16} /> {children}</p> : null);
