import { useState } from 'react';
import { initials } from '../../utils/format.js';

/* A photo if there is one (and it loads), otherwise the person's initials. */
export function Avatar({ name = '', src, size = 40 }) {
  const [brokenSrc, setBrokenSrc] = useState(null);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  if (src && src !== brokenSrc) {
    // no-referrer: Google profile pictures can refuse requests that send a referrer.
    return <img className="avatar" style={style} src={src} alt={name} referrerPolicy="no-referrer" onError={() => setBrokenSrc(src)} />;
  }
  return <span className="avatar avatar-initials" style={style} aria-label={name}>{initials(name) || '?'}</span>;
}

/* Avatar + name + one line below. */
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
