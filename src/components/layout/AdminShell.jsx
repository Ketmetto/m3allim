// The admin dashboard frame: sidebar on the left (slide-out on phones), page title and actions on top.
// Admins see the MANAGE section; the super admin also sees SYSTEM (config/navigation.js → ADMIN_MENU).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Icon, Logo } from '../ui';
import { NavItem } from './NavItem.jsx';
import { NotificationBell } from '../notifications/NotificationBell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLive } from '../../context/LiveContext.jsx';
import { ADMIN_MENU } from '../../config/navigation.js';
import { ROLE_LABELS } from '../../config/roles.js';

export function AdminShell({ title, sub, actions, children }) {
  const { account, role, isSuperAdmin, signOut } = useAuth();
  const { waiting, unreadMessages } = useLive();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const sections = ADMIN_MENU.filter((s) => s.roles.includes(role));
  const total = waiting.applications + waiting.reports + waiting.tickets + unreadMessages;
  const close = () => setMenuOpen(false);
  const logOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className={`shell ${isSuperAdmin ? 'shell-super' : ''}`}>
      <div className="shell-topbar">
        <button type="button" className="icon-btn" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <Icon name="Menu" size={24} />{total > 0 && <span className="tab-badge">{total}</span>}
        </button>
        <Logo light to="/admin" />
        <NotificationBell light />
      </div>
      {menuOpen && <div className="drawer-backdrop" onClick={close} />}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <button type="button" className="icon-btn drawer-close" aria-label="Close menu" onClick={close}><Icon name="X" size={22} /></button>
        <Logo light to="/admin" />
        <span className={`role-badge ${isSuperAdmin ? 'gold' : ''}`}>{ROLE_LABELS[role]?.toUpperCase()}</span>
        {sections.map((s) => (
          <div key={s.label} className="col gap-6 sidebar-section">
            <span className="sidebar-label">{s.label}</span>
            <nav className="col gap-4">{s.items.map((it) => <NavItem key={it.to} link={it} variant="side" onClick={close} />)}</nav>
          </div>
        ))}
        <div className="fill" />
        <Link to="/" className="sidebar-item" onClick={close}><Icon name="Globe" size={18} /><span className="fill">View the website</span><Icon name="ExternalLink" size={14} /></Link>
        <div className="sidebar-profile">
          <Link to="/account" className="row gap-12 fill min0" title="Account settings">
            <Avatar name={account?.name || ' '} src={account?.avatar} size={38} />
            <div className="col fill min0">
              <span className="semibold truncate">{account?.name}</span>
              <span className="xs truncate">{account?.email}</span>
            </div>
          </Link>
          <button type="button" className="icon-btn" aria-label="Log out" title="Log out" onClick={logOut}><Icon name="LogOut" size={16} /></button>
        </div>
      </aside>
      <main className="shell-main">
        <div className="row between page-heading">
          <div className="col gap-6">
            <h1 className="h1-sm">{title}</h1>
            {sub && <p className="muted">{sub}</p>}
          </div>
          <div className="row gap-12 wrap">
            {actions}
            <span className="desktop-only"><NotificationBell /></span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
