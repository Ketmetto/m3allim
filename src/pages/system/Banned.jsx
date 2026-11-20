// Shown to a banned account on every page except Help & support, where they can appeal.
import { useNavigate } from 'react-router-dom';
import { Button, Icon, Logo } from '../../components/ui';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDateTime } from '../../utils/time.js';

export default function Banned({ ban }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="system-screen">
      <div className="system-card card col gap-20 center-items">
        <Logo />
        <span className="icon-box big tone-red"><Icon name="ShieldAlert" size={26} /></span>
        <div className="col gap-8">
          <h1 className="h1-sm center">Your account is suspended</h1>
          <p className="muted center">{ban.until ? `Until ${fmtDateTime(ban.until)} (Beirut time).` : 'This suspension has no end date.'}</p>
        </div>
        {ban.reason && <p className="quote-box full">Reason: {ban.reason}</p>}
        <p className="sm muted center">While suspended you can’t request sessions, chat or appear in the mentor directory. If you think this is a mistake, write to the M3allim team.</p>
        <div className="row gap-12 wrap">
          <Button icon="LifeBuoy" onClick={() => navigate('/support', { state: { category: 'Ban appeal' } })}>Contact support</Button>
          <Button variant="outline" icon="LogOut" onClick={async () => { await signOut(); navigate('/'); }}>Log out</Button>
        </div>
      </div>
    </div>
  );
}
