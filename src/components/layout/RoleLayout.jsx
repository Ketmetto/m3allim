import { AdminShell } from './AdminShell.jsx';
import { SiteLayout } from './SiteLayout.jsx';
import { PageHeading } from '../ui';
import { useAuth } from '../../context/AuthContext.jsx';

/* For pages every role uses (messages, notifications, account): admins see them inside the admin dashboard,
   everyone else inside the normal website. */
export function RoleLayout({ title, sub, actions, children }) {
  const { isStaff } = useAuth();
  if (isStaff) return <AdminShell title={title} sub={sub} actions={actions}>{children}</AdminShell>;
  return (
    <SiteLayout>
      <PageHeading title={title} sub={sub}>{actions}</PageHeading>
      {children}
    </SiteLayout>
  );
}
