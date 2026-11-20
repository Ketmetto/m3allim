import { Link } from 'react-router-dom';
import { ICONS } from './icons.js';

/* <Icon name="Search" /> – any name listed in icons.js */
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
