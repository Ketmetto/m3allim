import { Logo } from '../ui';

/* Sign in, sign up, mentor application: brand panel on the left, form on the right. */
export function AuthLayout({ title, sub, children, wide = false }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <Logo light />
        <div className="col gap-16">
          <h2 className="auth-quote">“One conversation with my mentor changed how I saw my whole career.”</h2>
          <span className="auth-quote-by">Lara, LAU graduate · now a UX designer in Beirut</span>
        </div>
        <div className="row gap-32 auth-stats">
          <div className="col"><span className="auth-stat">Verified</span><span className="xs">Every mentor</span></div>
          <div className="col"><span className="auth-stat">1-to-1</span><span className="xs">Video sessions</span></div>
          <div className="col"><span className="auth-stat">Free</span><span className="xs">Always</span></div>
        </div>
      </aside>
      <main className="auth-main">
        <div className={`auth-form col gap-24 ${wide ? 'wide' : ''}`}>
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
