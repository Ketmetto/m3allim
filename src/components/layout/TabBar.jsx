// Bottom taskbar on phones and tablets, within thumb reach. Items per role: config/navigation.js (TAB_BAR).
import { NavItem } from './NavItem.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { TAB_BAR } from '../../config/navigation.js';

export function TabBar() {
  const { role, loading } = useAuth();
  if (loading) return null;
  return (
    <nav className="tabbar" aria-label="Quick navigation">
      {(TAB_BAR[role] || TAB_BAR.guest).map((t) => <NavItem key={t.label} link={t} variant="tab" />)}
    </nav>
  );
}
