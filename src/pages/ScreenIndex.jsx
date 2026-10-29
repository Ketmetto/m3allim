import { Link } from 'react-router-dom';
import { Logo } from '../components/ui.jsx';

const GROUPS = [
  ['Public & booking flow', [['/', 'Landing page'], ['/mentors', 'Browse mentors'], ['/mentors/layla', 'Mentor profile'], ['/book/layla', 'Confirm booking'], ['/book/layla/confirmed', 'Booking confirmed'], ['/login', 'Sign in'], ['/signup', 'Sign up'], ['/mentor/apply', 'Mentor application']]],
  ['Student', [['/student', 'Dashboard'], ['/student/sessions', 'My sessions'], ['/student/messages', 'Messages']]],
  ['Admin', [['/admin', 'Overview'], ['/admin/verification', 'Mentor verification'], ['/admin/reports', 'Reports'], ['/admin/users', 'Users'], ['/admin/announcements', 'Announcements']]],
  ['Super admin', [['/super', 'Platform overview'], ['/super/verification', 'Mentor verification'], ['/super/admins', 'Manage admins'], ['/super/settings', 'Platform settings'], ['/super/audit', 'Audit log & export']]],
];

export default function ScreenIndex() {
  return (
    <div className="container page col gap-32">
      <Logo />
      <div className="col gap-8"><h1 className="h1">M3allim · all screens</h1><p className="lead muted">Development index. Every screen from the Figma file is a route.</p></div>
      <div className="grid-2">
        {GROUPS.map(([title, links]) => (
          <section key={title} className="card col gap-12" style={{ padding: 24 }}>
            <h2 className="h3">{title}</h2>
            {links.map(([to, label]) => <Link key={to} to={to} className="index-link">{label}<span className="xs muted">#{to}</span></Link>)}
          </section>
        ))}
      </div>
    </div>
  );
}
