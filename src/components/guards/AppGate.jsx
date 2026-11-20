// Runs before every page and decides whether the page may be shown at all:
//   1. the backend isn't configured           → setup instructions
//   2. the account couldn't be loaded         → error with "try again"
//   3. maintenance mode is on (not for admins) → maintenance page
//   4. the account is banned                  → ban notice (support stays open, to appeal)
import { useLocation } from 'react-router-dom';
import { Icon } from '../ui';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { hasBackend } from '../../services/supabase.js';
import Maintenance from '../../pages/system/Maintenance.jsx';
import Banned from '../../pages/system/Banned.jsx';
import { AccountError, SetupNeeded } from '../../pages/system/SetupNeeded.jsx';

const OPEN_DURING_MAINTENANCE = ['/login', '/reset-password']; // so admins can still sign in
const OPEN_WHEN_BANNED = ['/support'];

export function AppGate({ children }) {
  const { pathname } = useLocation();
  const { loading, account, error, isStaff } = useAuth();
  const { settings, loaded } = useSettings();

  if (!hasBackend) return <SetupNeeded />;
  if (error && !account) return <AccountError message={error} />;
  if (settings.maintenance_mode && !isStaff && !OPEN_DURING_MAINTENANCE.includes(pathname)) {
    return loading || !loaded ? null : <Maintenance message={settings.maintenance_message} />;
  }
  if (account?.ban && !OPEN_WHEN_BANNED.includes(pathname)) return <Banned ban={account.ban} />;
  return (
    <>
      {settings.maintenance_mode && isStaff && (
        <div className="maintenance-banner" role="status"><Icon name="Construction" size={16} /> Maintenance mode is on. Only admins can use the website right now.</div>
      )}
      {children}
    </>
  );
}
