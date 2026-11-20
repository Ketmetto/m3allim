// Developer-facing screens: the backend isn't configured, or the account couldn't be loaded.
import { useNavigate } from 'react-router-dom';
import { Button, Icon, Logo } from '../../components/ui';
import { useAuth } from '../../context/AuthContext.jsx';

export function SetupNeeded() {
  return (
    <div className="system-screen">
      <div className="system-card card col gap-16">
        <Logo />
        <h1 className="h1-sm">Connect the backend</h1>
        <p className="muted">M3allim needs its Supabase project. Copy <code>.env.example</code> to <code>.env.local</code>, fill in <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then restart <code>npm run dev</code>. The README has the full setup.</p>
      </div>
    </div>
  );
}

export function AccountError({ message }) {
  const { refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const outdated = /whoami|function|schema cache/i.test(message);
  return (
    <div className="system-screen">
      <div className="system-card card col gap-16">
        <Logo />
        <span className="icon-box big tone-red"><Icon name="CircleAlert" size={26} /></span>
        <h1 className="h1-sm">We couldn’t load your account</h1>
        <p className="muted">{outdated ? 'The database is missing the latest setup. Run supabase/schema.sql in the Supabase SQL editor, then try again.' : 'Check your connection and try again.'}</p>
        <p className="xs muted">Details: {message}</p>
        <div className="row gap-12 wrap">
          <Button icon="RefreshCw" onClick={() => refresh()}>Try again</Button>
          <Button variant="outline" icon="LogOut" onClick={async () => { await signOut(); navigate('/'); }}>Log out</Button>
        </div>
      </div>
    </div>
  );
}
