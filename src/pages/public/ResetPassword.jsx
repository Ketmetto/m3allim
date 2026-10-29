import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout.jsx';
import { Button, Field, PasswordInput } from '../../components/ui.jsx';
import { supabase } from '../../lib/supabase.js';
import { destinationFor, useSession } from '../../lib/auth.js';

/* Reached from the password reset email (the link signs the person in first). */
export default function ResetPassword() {
  const navigate = useNavigate();
  const session = useSession();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!supabase || session === null) return <Navigate to="/login" replace />;
  if (!session) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Your password needs at least 8 characters.');
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setBusy(false);
      return setError(err.message);
    }
    navigate(await destinationFor(session.user));
  };

  return (
    <AuthLayout title="Choose a new password" sub={`For ${session.user.email}`}>
      <form className="col gap-20" onSubmit={submit} noValidate>
        <Field label="New password" hint="At least 8 characters."><PasswordInput autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} /></Field>
        {error && <p className="error" role="alert">{error}</p>}
        <Button type="submit" size="lg" disabled={busy}>Save password</Button>
      </form>
    </AuthLayout>
  );
}
