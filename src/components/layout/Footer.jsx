import { Link } from 'react-router-dom';
import { Logo } from '../ui';
import { useSettings } from '../../context/SettingsContext.jsx';

export function Footer() {
  const { settings } = useSettings();
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
            <Link to="/support">Help & support</Link>
            <span>Community guidelines</span>
            <a href={`mailto:${settings.support_email}`}>{settings.support_email}</a>
          </div>
          <div className="col gap-12">
            <h3 className="footer-head">Stay connected</h3>
            <span>Instagram</span>
            <span>LinkedIn</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 M3allim. Made for Lebanon, with purpose.</span>
          <span className="row gap-24"><span>Privacy policy</span><span>Terms of service</span></span>
        </div>
      </div>
    </footer>
  );
}
