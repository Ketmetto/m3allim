import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, Icon, Logo } from './ui.jsx';
import { student, superAdmin } from '../data/mock.js';
import { usePendingCount } from '../data/applications.js';
import { supabase } from '../lib/supabase.js';
import { useProfile } from '../lib/profile.js';
import { destinationFor, isSuperAdminEmail } from '../lib/auth.js';
import { useOpenReportsCount, useUnreadCount } from '../data/mentorship.js';

function useLogOut() {
  const navigate = useNavigate();
  return async () => {
    await supabase?.auth.signOut();
    navigate('/');
  };
}

/* ---------- Taskbar (phones): fixed bottom navigation, depends on who is signed in ---------- */
function tabsFor(me) {
  if (!me) return [
    { to: '/', end: true, icon: 'Home', label: 'Home' },
    { to: '/mentors', icon: 'Search', label: 'Mentors' },
    { to: '/login', icon: 'User', label: 'Log in' },
    { to: '/signup', icon: 'UserPlus', label: 'Join' },
  ];
  if (isSuperAdminEmail(me.email)) return [
    { to: '/super', icon: 'LayoutDashboard', label: 'Admin' },
    { to: '/super/verification', icon: 'BadgeCheck', label: 'Verify' },
    { to: '/super/reports', icon: 'Flag', label: 'Reports' },
    { to: '/mentors', icon: 'Search', label: 'Mentors' },
    { to: '/account', icon: 'User', label: 'Profile' },
  ];
  if (me.role === 'mentor') return [
    { to: '/mentor', end: true, icon: 'Home', label: 'Home' },
    { to: '/mentor/messages', icon: 'MessageCircle', label: 'Messages', unread: true },
    { to: `/mentors/${me.user.id}`, icon: 'BadgeCheck', label: 'My page' },
    { to: '/account', icon: 'User', label: 'Profile' },
  ];
  return [
    { to: '/student', end: true, icon: 'Home', label: 'Home' },
    { to: '/mentors', icon: 'Search', label: 'Mentors' },
    { to: '/student/sessions', icon: 'Calendar', label: 'Sessions' },
    { to: '/student/messages', icon: 'MessageCircle', label: 'Messages', unread: true },
    { to: '/account', icon: 'User', label: 'Profile' },
  ];
}

export function TabBar() {
  const me = useProfile();
  const unread = useUnreadCount();
  if (me === undefined) return null;
  return (
    <nav className="tabbar" aria-label="Quick navigation">
      {tabsFor(me).map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className="tab-item">
          <span className="tab-icon"><Icon name={t.icon} size={22} />{t.unread && unread > 0 && <span className="tab-badge">{unread > 9 ? '9+' : unread}</span>}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/* Right side of the top bar on phones, where the links are replaced by the taskbar. */
function MobileNavEnd({ me }) {
  if (me) return <Link to="/account" className="nav-mobile" aria-label="Your profile"><Avatar name={me.name} src={me.avatar} size={36} /></Link>;
  return <Button to="/login" size="sm" className="nav-mobile">Log in</Button>;
}

/* ---------- Public navigation (guest) ---------- */
export function PublicNav() {
  const navigate = useNavigate();
  const me = useProfile();
  const go = (id) => navigate('/', { state: { scroll: id } });
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Logo />
        <MobileNavEnd me={me} />
        <nav className="row gap-32 nav-links" aria-label="Main">
          <NavLink to="/" end className="nav-link">Home</NavLink>
          <NavLink to="/mentors" className="nav-link">Find a mentor</NavLink>
          <button className="nav-link nav-btn" onClick={() => go('how')}>How it works</button>
          <button className="nav-link nav-btn" onClick={() => go('become')}>Become a mentor</button>
          <span className="nav-divider" />
          {me ? (
            <Button size="sm" icon="LayoutDashboard" onClick={async () => navigate(await destinationFor(me.user))}>My dashboard</Button>
          ) : (
            <>
              <Link to="/login" className="semibold">Log in</Link>
              <Button to="/signup" size="sm">Get started</Button>
            </>
          )}
        </nav>
      </div>
      <TabBar />
    </header>
  );
}

/* ---------- Student navigation (logged in) ---------- */
export function StudentNav() {
  const me = useProfile({ name: student.name, avatar: student.photo, university: student.school });
  const logOut = useLogOut();
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Logo to="/student" />
        {me && <MobileNavEnd me={me} />}
        <nav className="row gap-32 nav-links" aria-label="Student">
          <NavLink to="/student" end className="nav-link">Dashboard</NavLink>
          <NavLink to="/mentors" className="nav-link">Find a mentor</NavLink>
          <NavLink to="/student/sessions" className="nav-link">My sessions</NavLink>
          <NavLink to="/student/messages" className="nav-link">Messages</NavLink>
          <button className="icon-circle" aria-label="Notifications">
            <Icon name="Bell" size={18} />
            <span className="notif-dot" />
          </button>
          {me && (
            <div className="row gap-10">
              <Link to="/account" className="row gap-10 nav-profile" title="Your profile">
                <Avatar name={me.name} src={me.avatar} size={40} />
                <div className="col">
                  <span className="semibold">{me.name}</span>
                  <span className="xs muted">{me.university ? `Student · ${me.university}` : 'Student'}</span>
                </div>
              </Link>
              <button className="icon-btn muted" aria-label="Log out" title="Log out" onClick={logOut}><Icon name="LogOut" size={16} /></button>
            </div>
          )}
        </nav>
      </div>
      <TabBar />
    </header>
  );
}

/* ---------- Sign in / sign up (brand panel + form) ---------- */
export function AuthLayout({ title, sub, children }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <Logo light />
        <div className="col gap-16">
          <h2 className="auth-quote">“One conversation with my mentor changed how I saw my whole career.”</h2>
          <span className="auth-quote-by">Lara, LAU graduate · now a UX designer in Beirut</span>
        </div>
        <div className="row gap-32 auth-stats">
          <div className="col"><span className="auth-stat">186</span><span className="xs">Verified mentors</span></div>
          <div className="col"><span className="auth-stat">2,418</span><span className="xs">Students</span></div>
          <div className="col"><span className="auth-stat">Free</span><span className="xs">Always</span></div>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-form col gap-24">
          <div className="auth-logo"><Logo /></div>
          <div className="col gap-6">
            <h1 className="h1-sm">{title}</h1>
            {sub && <p className="muted">{sub}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

/* ---------- Mentor navigation (approved mentors) ---------- */
export function MentorNav() {
  const me = useProfile();
  const logOut = useLogOut();
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Logo to="/mentor" />
        {me && <MobileNavEnd me={me} />}
        <nav className="row gap-32 nav-links" aria-label="Mentor">
          <NavLink to="/mentor" end className="nav-link">Dashboard</NavLink>
          <NavLink to="/mentor/messages" className="nav-link">Messages</NavLink>
          {me && <NavLink to={`/mentors/${me.user.id}`} className="nav-link">My public profile</NavLink>}
          {me && (
            <div className="row gap-10">
              <Link to="/account" className="row gap-10 nav-profile" title="Your profile">
                <Avatar name={me.name} src={me.avatar} size={40} />
                <div className="col">
                  <span className="semibold">{me.name}</span>
                  <span className="xs muted">Mentor</span>
                </div>
              </Link>
              <button className="icon-btn muted" aria-label="Log out" title="Log out" onClick={logOut}><Icon name="LogOut" size={16} /></button>
            </div>
          )}
        </nav>
      </div>
      <TabBar />
    </header>
  );
}

/* Picks the navigation for whoever is looking: guests and the super admin get the public bar. */
export function RoleNav() {
  const me = useProfile();
  if (!me || isSuperAdminEmail(me.email)) return <PublicNav />;
  return me.role === 'mentor' ? <MentorNav /> : <StudentNav />;
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="col gap-16">
            <Logo light />
            <p className="footer-text">Local experience. Limitless possibilities. Connecting Lebanon’s next generation with people who’ve been there.</p>
            <span className="footer-ar" lang="ar">معاً نبني المستقبل</span>
          </div>
          <div className="col gap-12">
            <h3 className="footer-head">Explore</h3>
            <Link to="/mentors">Find a mentor</Link>
            <Link to="/" state={{ scroll: 'how' }}>How it works</Link>
            <Link to="/" state={{ scroll: 'become' }}>Become a mentor</Link>
          </div>
          <div className="col gap-12">
            <h3 className="footer-head">M3allim</h3>
            <span>Our story</span>
            <span>Community guidelines</span>
            <span>Contact us</span>
          </div>
          <div className="col gap-12">
            <h3 className="footer-head">Stay connected</h3>
            <span>Instagram</span>
            <span>LinkedIn</span>
            <span>hello@m3allim.com</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 M3allim. Made for Lebanon, with purpose.</span>
          <span className="row gap-24"><span>Privacy policy</span><span>Terms of service</span><span>English / العربية</span></span>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Admin + super admin shell (sidebar layout) ---------- */
const ADMIN_ITEMS = [
  { to: '/admin', end: true, icon: 'LayoutDashboard', label: 'Overview' },
  { to: '/admin/verification', icon: 'BadgeCheck', label: 'Verification', badge: 'pending' },
  { to: '/admin/reports', icon: 'Flag', label: 'Reports', badge: 4 },
  { to: '/admin/users', icon: 'Users', label: 'Users' },
  { to: '/admin/announcements', icon: 'Megaphone', label: 'Announcements' },
];
const SUPER_ITEMS = [
  { to: '/super', end: true, icon: 'LayoutDashboard', label: 'Platform overview' },
  { to: '/super/verification', icon: 'BadgeCheck', label: 'Mentor verification', badge: 'pending' },
  { to: '/super/reports', icon: 'Flag', label: 'Reports', badge: 'reports' },
  { to: '/super/admins', icon: 'ShieldCheck', label: 'Manage admins' },
  { to: '/super/settings', icon: 'SlidersHorizontal', label: 'Platform settings' },
  { to: '/super/audit', icon: 'History', label: 'Audit log & export' },
];

export function AdminShell({ kind = 'admin', title, sub, actions, children }) {
  const sup = kind === 'super';
  const items = sup ? SUPER_ITEMS : ADMIN_ITEMS;
  const pending = usePendingCount();
  const me = useProfile({ name: sup ? superAdmin.name : 'Rana Khalil' });
  const logOut = useLogOut();
  const openReports = useOpenReportsCount(sup);
  const badgeOf = (it) => (it.badge === 'pending' ? pending : it.badge === 'reports' ? openReports : it.badge);
  const [menuOpen, setMenuOpen] = useState(false);
  const waiting = items.reduce((n, it) => n + (typeof it.badge === 'string' ? badgeOf(it) : 0), 0);
  return (
    <div className={`shell ${sup ? 'shell-super' : ''}`}>
      <div className="shell-topbar">
        <button className="icon-btn" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Icon name="Menu" size={24} />{waiting > 0 && <span className="tab-badge">{waiting}</span>}</button>
        <Logo light to={sup ? '/super' : '/admin'} />
        <Link to="/account" aria-label="Your profile"><Avatar name={me?.name || ' '} src={me?.avatar} size={34} /></Link>
      </div>
      {menuOpen && <div className="drawer-backdrop" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <button className="icon-btn drawer-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><Icon name="X" size={22} /></button>
        <Logo light to={sup ? '/super' : '/admin'} />
        <span className={`role-badge ${sup ? 'gold' : ''}`}>{sup ? 'SUPER ADMIN' : 'ADMIN'}</span>
        <span className="sidebar-label">{sup ? 'SYSTEM' : 'MANAGE'}</span>
        <nav className="col gap-6">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className="sidebar-item" onClick={() => setMenuOpen(false)}>
              <Icon name={it.icon} size={18} />
              <span className="fill">{it.label}</span>
              {badgeOf(it) > 0 && <span className="count">{badgeOf(it)}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="fill" />
        <div className="sidebar-profile">
          <Link to="/account" className="row gap-12 fill min0" title="Your profile">
            <Avatar name={me?.name || ' '} src={me?.avatar} size={38} />
            <div className="col fill min0">
              <span className="semibold truncate">{me?.name}</span>
              <span className="xs">{sup ? 'Super admin' : 'Platform admin'}</span>
            </div>
          </Link>
          <button className="icon-btn" aria-label="Log out" onClick={logOut}><Icon name="LogOut" size={16} /></button>
        </div>
      </aside>
      <main className="shell-main">
        <div className="row between page-heading">
          <div className="col gap-6">
            <h1 className="h1-sm">{title}</h1>
            <p className="muted">{sub}</p>
          </div>
          <div className="row gap-12">
            {actions}
            <button className="icon-circle" aria-label="Notifications"><Icon name="Bell" size={18} /></button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
