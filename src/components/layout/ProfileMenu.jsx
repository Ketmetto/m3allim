// Avatar in the top bar; opens account links and Log out.
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Chip, Dropdown, Icon } from '../ui';
import { useAuth } from '../../context/AuthContext.jsx';
import { ACCOUNT_LINKS } from '../../config/navigation.js';
import { ROLES, ROLE_LABELS } from '../../config/roles.js';

export function ProfileMenu() {
  const { account, role, isStaff, signOut } = useAuth();
  const navigate = useNavigate();
  const links = [
    ...(role === ROLES.MENTOR ? [{ to: `/mentors/${account.id}`, icon: 'Eye', label: 'View my public page' }] : []),
    ...(isStaff ? [{ to: '/admin', icon: 'LayoutDashboard', label: 'Admin dashboard' }] : []),
    ...ACCOUNT_LINKS.filter((l) => !l.hideFor?.includes(role) && l.to !== '/notifications'),
  ];
  const logOut = async () => {
    await signOut();
    navigate('/');
  };
  return (
    <Dropdown
      width={280}
      trigger={(open, toggle) => (
        <button type="button" className="profile-trigger" aria-label="Your account" aria-expanded={open} onClick={toggle}>
          <Avatar name={account.name} src={account.avatar} size={38} />
          <span className="col start min0 profile-trigger-text">
            <span className="semibold truncate">{account.name}</span>
            <span className="xs muted truncate">{ROLE_LABELS[role]}{account.university && role === ROLES.STUDENT ? ` · ${account.university}` : ''}</span>
          </span>
          <Icon name="ChevronDown" size={14} />
        </button>
      )}
    >
      {(close) => (
        <div className="col">
          <div className="col gap-6 dropdown-head start">
            <span className="semibold truncate">{account.name}</span>
            <span className="xs muted truncate">{account.email}</span>
            <Chip kind={isStaff ? 'gold' : 'teal'}>{ROLE_LABELS[role]}</Chip>
          </div>
          <nav className="col dropdown-links">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="menu-item" onClick={close}><Icon name={l.icon} size={18} />{l.label}</Link>
            ))}
            <button type="button" className="menu-item" onClick={logOut}><Icon name="LogOut" size={18} />Log out</button>
          </nav>
        </div>
      )}
    </Dropdown>
  );
}
