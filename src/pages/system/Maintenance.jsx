// Shown to everyone except admins while the super admin has maintenance mode on (Platform settings).
import { Link } from 'react-router-dom';
import { Icon, Logo } from '../../components/ui';

export default function Maintenance({ message }) {
  return (
    <div className="system-screen">
      <div className="system-card card col gap-20 center-items">
        <Logo />
        <span className="icon-box big icon-box-gold"><Icon name="Construction" size={26} /></span>
        <div className="col gap-8">
          <h1 className="h1-sm center">We’ll be right back</h1>
          <p className="muted center">{message}</p>
        </div>
        <Link to="/login" className="xs muted">Team member? Log in</Link>
      </div>
    </div>
  );
}
