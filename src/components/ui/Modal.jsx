import { useEffect } from 'react';
import { Icon } from './Icon.jsx';

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
        <div className="row between"><h2 className="h2-sm">{title}</h2><button type="button" className="icon-btn muted" aria-label="Close" onClick={onClose}><Icon name="CircleX" size={20} /></button></div>
        {children}
      </div>
    </div>
  );
}
