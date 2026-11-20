// Route guards used in App.jsx.
//   <RequireRole allow={[ROLES.STUDENT]}>  only students; guests go to log in, other roles to their own home
//   <GuestOnly>                            log in / sign up pages; signed-in people are sent home
// The database enforces the same rules, so these only decide which page to show.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { homeFor } from '../../config/roles.js';

export const PageLoader = () => <div className="page-loader" role="status" aria-label="Loading"><span className="spinner" /></div>;

export function RequireRole({ allow, children }) {
  const { loading, account, role } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!account) return <Navigate to="/login" replace state={{ from: location.pathname + location.search, notice: 'Log in to continue.' }} />;
  if (!allow.includes(role)) return <Navigate to={homeFor(account)} replace />;
  return children;
}

export function GuestOnly({ children }) {
  const { loading, account } = useAuth();
  const { state } = useLocation();
  if (loading) return <PageLoader />;
  if (account) return <Navigate to={state?.from || homeFor(account)} replace />;
  return children;
}

/* /continue: where sign-in links land; sends the person to their home page once their account has loaded. */
export function ContinueHome() {
  const { loading, account } = useAuth();
  const { state } = useLocation();
  if (loading) return <PageLoader />;
  return <Navigate to={account ? state?.from || homeFor(account) : '/login'} replace />;
}
