import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/* A button that opens a small panel below it. Closes on a click outside, Escape, or navigation.
   trigger: (open, toggle) => button element; children: (close) => panel content */
export function Dropdown({ trigger, children, align = 'right', width = 320 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="dropdown" ref={ref}>
      {trigger(open, () => setOpen(!open))}
      {open && <div className={`dropdown-panel card ${align}`} style={{ width }}>{children(() => setOpen(false))}</div>}
    </div>
  );
}
