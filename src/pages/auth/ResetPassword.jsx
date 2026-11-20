// Reached from the password reset email (the link signs the person in first).
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout';
import { PageLoader } from '../../components/guards/RequireRole.jsx';
import { Button, Field, FormError, PasswordInput } from '../../components/ui';
import { useAuth } from '../../context/AuthContext.jsx';
import { updatePassword } from '../../services/auth.js';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { loading, account } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;
  if (!account) return <Navigate to="/login" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Your password needs at least 8 characters.');
    setBusy(true);
    const { error: err } = await updatePassword(password);
    if (err) {
      setBusy(false);
      return setError(err.message);
    }
    navigate('/continue');
  };

  return (
    <AuthLayout title="Choose a new password" sub={`For ${account.email}`}>
      <form className="col gap-20" onSubmit={submit} noValidate>
        <Field label="New password" hint="At least 8 characters."><PasswordInput autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} /></Field>
        <FormError>{error}</FormError>
        <Button type="submit" size="lg" disabled={busy}>Save password</Button>
      </form>
    </AuthLayout>
  );
}
