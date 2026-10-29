import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout.jsx';
import { GoogleButton } from '../../components/auth.jsx';
import { Button, Checkbox, Field, Input, PasswordInput } from '../../components/ui.jsx';
import { superAdmin } from '../../data/mock.js';
import { supabase } from '../../lib/supabase.js';
import { destinationFor, resendVerification, sendPasswordReset, signInWithGoogle } from '../../lib/auth.js';

export default function SignIn() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(state?.error || '');
  const [notice, setNotice] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);

  const edit = (setter) => (e) => { setter(e.target.value); setError(''); setUnverified(false); };

  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) return setError('Enter the email you signed up with.');
    if (!password) return setError('Enter your password.');
    if (!supabase) return navigate(email.trim().toLowerCase() === superAdmin.email ? '/super' : '/student');
    setBusy(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setBusy(false);
      if (err.code === 'email_not_confirmed') return setUnverified(true);
      return setError(err.code === 'invalid_credentials' ? 'Wrong email or password.' : err.message);
    }
    navigate(await destinationFor(data.user));
  };

  const resend = async () => {
    const { error: err } = await resendVerification(email.trim());
    setUnverified(false);
    err ? setError(err.message) : setNotice(`We sent a new verification link to ${email.trim()}.`);
  };

  const forgot = async () => {
    setError('');
    if (!email.includes('@')) return setNotice('Enter your email above, then click “Forgot password?” again.');
    if (supabase) {
      const { error: err } = await sendPasswordReset(email.trim());
      if (err) return setError(err.message);
    }
    setNotice(`If an account exists for ${email.trim()}, we sent a link to reset the password.`);
  };

  const google = async () => {
    if (!supabase) {
      setError('Google sign-in needs the Supabase setup in the README.');
      return false;
    }
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(err.message);
      return false;
    }
  };

  return (
    <AuthLayout title="Welcome back" sub="Log in to book sessions and message your mentors.">
      <GoogleButton onClick={google} />
      <div className="auth-divider"><span>or log in with email</span></div>
      <form className="col gap-20" onSubmit={submit} noValidate>
        <Field label="Email">
          <Input type="email" autoComplete="email" value={email} onChange={edit(setEmail)} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" value={password} onChange={edit(setPassword)} placeholder="Your password" />
        </Field>
        <div className="row between">
          <Checkbox checked={remember} onChange={setRemember}>Remember me</Checkbox>
          <button type="button" className="link" onClick={forgot}>Forgot password?</button>
        </div>
        {unverified && (
          <p className="error" role="alert">
            Please verify your email first. Check your inbox for the link we sent. <button type="button" className="link" onClick={resend}>Resend link</button>
          </p>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="sm text-teal" role="status">{notice}</p>}
        <Button type="submit" size="lg" iconAfter="ArrowRight" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button>
      </form>
      <p className="sm muted center">New to M3allim? <Link to="/signup" className="semibold text-teal">Create a free account</Link></p>
    </AuthLayout>
  );
}
