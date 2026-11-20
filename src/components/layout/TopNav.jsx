// The top bar on every page outside the admin dashboard. It adapts to whoever is looking:
// guests see Log in / Get started; signed-in people see their role's links, the bell and their profile menu.
import { Link } from 'react-router-dom';
import { Button, Logo } from '../ui';
import { NavItem } from './NavItem.jsx';
import { MobileMenu } from './MobileMenu.jsx';
import { ProfileMenu } from './ProfileMenu.jsx';
import { TabBar } from './TabBar.jsx';
import { NotificationBell } from '../notifications/NotificationBell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { SITE_LINKS } from '../../config/navigation.js';
import { homeFor } from '../../config/roles.js';

export function TopNav() {
  const { account, role, loading } = useAuth();
  const links = SITE_LINKS[role] || SITE_LINKS.guest;
  const logoTo = account ? homeFor(account) : '/';
  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="nav-start">
          <MobileMenu links={links} logoTo={logoTo} />
          <Logo to={logoTo} />
        </div>
        <nav className="row gap-28 nav-links" aria-label="Main">
          {links.map((l) => <NavItem key={l.label} link={l} variant="top" />)}
        </nav>
        <div className="row gap-12 nav-end">
          {loading ? null : account ? (
            <>
              <NotificationBell />
              <ProfileMenu />
            </>
          ) : (
            <>
              <Link to="/login" className="semibold nav-login">Log in</Link>
              <Button to="/signup" size="sm" className="nav-join">Get started</Button>
            </>
          )}
        </div>
      </div>
      <TabBar />
    </header>
  );
}
