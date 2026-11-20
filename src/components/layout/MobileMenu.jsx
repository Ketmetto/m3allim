// ☰ button and slide-out menu, shown instead of the top links on tablets and phones.
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Button, Icon, Logo } from '../ui';
import { NavItem } from './NavItem.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLive } from '../../context/LiveContext.jsx';
import { ACCOUNT_LINKS } from '../../config/navigation.js';

export function MobileMenu({ links, logoTo }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { account, role, signOut } = useAuth();
  const { unreadMessages, unreadNotifications } = useLive();
  const close = () => setOpen(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('menu-open');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('menu-open'); };
  }, [open]);
  const waiting = account ? unreadMessages + unreadNotifications : 0;
  const logOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <button type="button" className="icon-btn nav-burger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <Icon name="Menu" size={24} />
        {waiting > 0 && <span className="tab-badge">{waiting > 9 ? '9+' : waiting}</span>}
      </button>
      <div className={`menu-backdrop ${open ? 'open' : ''}`} onClick={close} />
      <aside className={`menu-drawer ${open ? 'open' : ''}`} aria-label="Menu" aria-hidden={!open} inert={open ? undefined : ''}>
        <div className="row between">
          <Logo to={logoTo} />
          <button type="button" className="icon-btn" aria-label="Close menu" onClick={close}><Icon name="X" size={22} /></button>
        </div>
        {account && (
          <Link to="/account" className="menu-profile" onClick={close}>
            <Avatar name={account.name} src={account.avatar} size={44} />
            <span className="col min0"><span className="semibold truncate">{account.name}</span><span className="xs muted truncate">{account.email}</span></span>
          </Link>
        )}
        <nav className="col gap-4">
          {links.map((l) => <NavItem key={l.label} link={l} variant="menu" onClick={close} />)}
          {account && <hr className="hr menu-sep" />}
          {account && ACCOUNT_LINKS.filter((l) => !l.hideFor?.includes(role)).map((l) => <NavItem key={l.to} link={l} variant="menu" onClick={close} />)}
        </nav>
        <div className="menu-foot col gap-10">
          {account ? (
            <button type="button" className="menu-item" onClick={logOut}><Icon name="LogOut" size={20} />Log out</button>
          ) : (
            <>
              <Button to="/signup" onClick={close}>Get started</Button>
              <Button to="/login" variant="outline" onClick={close}>Log in</Button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
