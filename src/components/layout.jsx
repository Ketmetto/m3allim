import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, Icon, Logo } from './ui.jsx';
import { student, superAdmin } from '../data/mock.js';
import { usePendingCount } from '../data/applications.js';
import { supabase } from '../lib/supabase.js';

/* ---------- Public navigation (guest) ---------- */
export function PublicNav() {
  const navigate = useNavigate();
  const go = (id) => navigate('/', { state: { scroll: id } });
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Logo />
        <nav className="row gap-32" aria-label="Main">
          <NavLink to="/" end className="nav-link">Home</NavLink>
          <NavLink to="/mentors" className="nav-link">Find a mentor</NavLink>
          <button className="nav-link nav-btn" onClick={() => go('how')}>How it works</button>
          <button className="nav-link nav-btn" onClick={() => go('become')}>Become a mentor</button>
          <span className="nav-divider" />
          <Link to="/login" className="semibold">Log in</Link>
          <Button to="/signup" size="sm">Get started</Button>
        </nav>
      </div>
    </header>
  );
}

/* ---------- Student navigation (logged in) ---------- */
export function StudentNav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Logo to="/student" />
        <nav className="row gap-32" aria-label="Student">
          <NavLink to="/student" end className="nav-link">Dashboard</NavLink>
          <NavLink to="/mentors" className="nav-link">Find a mentor</NavLink>
          <NavLink to="/student/sessions" className="nav-link">My sessions</NavLink>
          <NavLink to="/student/messages" className="nav-link">Messages</NavLink>
          <button className="icon-circle" aria-label="Notifications">
            <Icon name="Bell" size={18} />
            <span className="notif-dot" />
          </button>
          <div className="row gap-10">
            <Avatar name={student.name} src={student.photo} size={40} />
            <div className="col">
              <span className="semibold">{student.name}</span>
              <span className="xs muted">Student · {student.school}</span>
            </div>
            <Icon name="ChevronDown" size={16} />
          </div>
        </nav>
      </div>
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
  { to: '/super/admins', icon: 'ShieldCheck', label: 'Manage admins' },
  { to: '/super/settings', icon: 'SlidersHorizontal', label: 'Platform settings' },
  { to: '/super/audit', icon: 'History', label: 'Audit log & export' },
];

export function AdminShell({ kind = 'admin', title, sub, actions, children }) {
  const sup = kind === 'super';
  const items = sup ? SUPER_ITEMS : ADMIN_ITEMS;
  const pending = usePendingCount();
  const navigate = useNavigate();
  const badgeOf = (it) => (it.badge === 'pending' ? pending : it.badge);
  const logOut = async () => {
    await supabase?.auth.signOut();
    navigate('/');
  };
  return (
    <div className={`shell ${sup ? 'shell-super' : ''}`}>
      <aside className="sidebar">
        <Logo light to={sup ? '/super' : '/admin'} />
        <span className={`role-badge ${sup ? 'gold' : ''}`}>{sup ? 'SUPER ADMIN' : 'ADMIN'}</span>
        <span className="sidebar-label">{sup ? 'SYSTEM' : 'MANAGE'}</span>
        <nav className="col gap-6">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className="sidebar-item">
              <Icon name={it.icon} size={18} />
              <span className="fill">{it.label}</span>
              {badgeOf(it) > 0 && <span className="count">{badgeOf(it)}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="fill" />
        <div className="sidebar-profile">
          <Avatar name={sup ? superAdmin.name : 'Rana Khalil'} size={38} />
          <div className="col fill">
            <span className="semibold">{sup ? superAdmin.name : 'Rana Khalil'}</span>
            <span className="xs">{sup ? 'Super admin' : 'Platform admin'}</span>
          </div>
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
