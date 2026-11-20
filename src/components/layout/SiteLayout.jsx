import { TopNav } from './TopNav.jsx';
import { Footer } from './Footer.jsx';

/* Page frame for guests, students, mentors and applicants: top bar, centered content, optional footer. */
export function SiteLayout({ children, footer = false, className = 'gap-24' }) {
  return (
    <>
      <TopNav />
      <main className={`container page col ${className}`}>{children}</main>
      {footer && <Footer />}
    </>
  );
}
