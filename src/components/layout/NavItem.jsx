import { Link, NavLink } from 'react-router-dom';
import { Icon } from '../ui';
import { useBadge } from '../../context/LiveContext.jsx';

/* One link from config/navigation.js. variant: 'top' (desktop bar) | 'menu' (☰ drawer) | 'tab' (phone taskbar) | 'side' (admin sidebar) */
export function NavItem({ link, variant, onClick }) {
  const count = useBadge(link.badge);
  const cls = { top: 'nav-link', menu: 'menu-item', tab: 'tab-item', side: 'sidebar-item' }[variant];
  const badge = count > 0 && (variant === 'top' || variant === 'tab'
    ? <span className="tab-badge">{count > 9 ? '9+' : count}</span>
    : <span className="count">{count}</span>);

  const inner = variant === 'tab' ? (
    <>
      <span className="tab-icon"><Icon name={link.icon} size={22} />{badge}</span>
      <span>{link.label}</span>
    </>
  ) : variant === 'top' ? (
    <span className="nav-link-inner">{link.label}{badge}</span>
  ) : (
    <>
      <Icon name={link.icon} size={variant === 'side' ? 18 : 20} />
      <span className="fill">{link.label}</span>
      {badge}
    </>
  );

  // "How it works" and "Become a mentor" scroll to a section of the home page.
  if (link.scroll) {
    return <Link to={link.to} state={{ scroll: link.scroll }} className={cls} onClick={onClick}>{inner}</Link>;
  }
  return <NavLink to={link.to} end={link.end} className={cls} onClick={onClick}>{inner}</NavLink>;
}
