import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout.jsx';
import { RolePicker } from '../../components/auth.jsx';
import { Button } from '../../components/ui.jsx';
import { supabase } from '../../lib/supabase.js';
import { destinationFor, useSession } from '../../lib/auth.js';

/* First visit after signing in with Google from the log-in page: pick an account type. */
export default function Welcome() {
  const navigate = useNavigate();
  const session = useSession();
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!supabase) return <Navigate to="/signup" replace />;
  if (session === null) return <Navigate to="/login" replace />;
  if (!session) return null;

  const name = session.user.user_metadata?.full_name?.split(' ')[0];
  const save = async () => {
    setBusy(true);
    const { error: err } = await supabase.from('profiles').update({ role }).eq('id', session.user.id);
    if (err) {
      setBusy(false);
      return setError(err.message);
    }
    navigate(await destinationFor(session.user));
  };

  return (
    <AuthLayout title={name ? `Welcome, ${name}` : 'Welcome to M3allim'} sub="How will you use M3allim?">
      <RolePicker value={role} onChange={setRole} />
      {error && <p className="error" role="alert">{error}</p>}
      <Button size="lg" iconAfter="ArrowRight" onClick={save} disabled={busy}>Continue</Button>
    </AuthLayout>
  );
}
