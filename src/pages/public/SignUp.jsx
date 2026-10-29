import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout.jsx';
import { GoogleButton, RolePicker } from '../../components/auth.jsx';
import { Button, Checkbox, Field, Icon, Input, PasswordInput, PhotoPicker, Select } from '../../components/ui.jsx';
import { fields } from '../../data/mock.js';
import { supabase } from '../../lib/supabase.js';
import { destinationFor, resendVerification, signInWithGoogle, signUpWithEmail } from '../../lib/auth.js';
import { savePendingPhoto, squarePhoto } from '../../lib/profile.js';

const UNIVERSITIES = ['AUB', 'LAU', 'USJ', 'LU', 'USEK', 'NDU', 'BAU', 'Other'];

export default function SignUp() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState(UNIVERSITIES[0]);
  const [field, setField] = useState(fields[0]);
  const [photo, setPhotoData] = useState(null); // resized JPEG data URL
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const edit = (setter) => (e) => { setter(e.target.value); setError(''); };
  const pickPhoto = async (file) => {
    try {
      setPhotoData(await squarePhoto(file));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (name.trim().split(' ').length < 2) return setError('Enter your first and last name.');
    if (!email.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Your password needs at least 8 characters.');
    if (!agree) return setError('Please accept the terms to create your account.');
    if (!supabase) return navigate(role === 'student' ? '/student' : '/mentor/apply', { state: { name: name.trim(), email: email.trim(), field } });

    setBusy(true);
    const profile = role === 'student' ? { university: school } : { field };
    const { data, error: err } = await signUpWithEmail({ email: email.trim(), password, full_name: name.trim(), role, ...profile });
    setBusy(false);
    if (err) return setError(err.message);
    // Supabase returns a user with no identities when the email is already registered.
    if (!data.user?.identities?.length) return setError('An account with this email already exists. Log in instead.');
    // The photo is uploaded on first sign-in, once the email is verified.
    if (photo) savePendingPhoto(email.trim(), photo);
    if (data.session) return navigate(await destinationFor(data.user));
    setSentTo(email.trim());
  };

  const google = async () => {
    if (!supabase) {
      setError('Google sign-in needs the Supabase setup in the README.');
      return false;
    }
    const { error: err } = await signInWithGoogle(role);
    if (err) {
      setError(err.message);
      return false;
    }
  };

  const resend = async () => {
    const { error: err } = await resendVerification(sentTo);
    setNotice(err ? err.message : `We sent another link to ${sentTo}.`);
  };

  if (sentTo) {
    return (
      <AuthLayout title="Verify your email" sub={`We sent a verification link to ${sentTo}.`}>
        <div className="reassure">
          <Icon name="Mail" size={22} color="var(--teal)" />
          <div className="col gap-4">
            <span className="semibold text-deep">Open the email and click the link</span>
            <span className="xs muted">
              This confirms the address is yours. {role === 'mentor' ? 'After that you’ll upload your CV and cover letter to finish your mentor application.' : 'After that you can book your first session.'} Can’t find it? Check your spam folder.
            </span>
          </div>
        </div>
        {notice && <p className="sm text-teal" role="status">{notice}</p>}
        <Button variant="outline" size="lg" onClick={resend}>Resend link</Button>
        <p className="sm muted center">Wrong email? <button type="button" className="link" onClick={() => setSentTo('')}>Go back</button></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" sub="Free, one-to-one mentorship with verified professionals in Lebanon.">
      <RolePicker value={role} onChange={setRole} />
      <GoogleButton onClick={google}>Sign up with Google</GoogleButton>
      <div className="auth-divider"><span>or sign up with email</span></div>
      <form className="col gap-20" onSubmit={submit} noValidate>
        <div className="field">
          <span className="field-label">Profile photo</span>
          <PhotoPicker name={name} src={photo} onPick={pickPhoto} onRemove={() => setPhotoData(null)} />
        </div>
        <Field label="Full name">
          <Input autoComplete="name" value={name} onChange={edit(setName)} placeholder="Sarah Mansour" />
        </Field>
        <Field label="Email" hint="We’ll send a link to verify it’s yours.">
          <Input type="email" autoComplete="email" value={email} onChange={edit(setEmail)} placeholder="you@example.com" />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <PasswordInput autoComplete="new-password" value={password} onChange={edit(setPassword)} placeholder="Create a password" />
        </Field>
        {role === 'student' ? (
          <Field label="University"><Select value={school} onChange={setSchool} options={UNIVERSITIES} /></Field>
        ) : (
          <Field label="Your field" hint="After verifying your email you’ll upload your CV and cover letter."><Select value={field} onChange={setField} options={fields} /></Field>
        )}
        <Checkbox checked={agree} onChange={(v) => { setAgree(v); setError(''); }}>I agree to the <b className="text-teal">Terms of service</b> and <b className="text-teal">Community guidelines</b>.</Checkbox>
        {error && <p className="error" role="alert">{error}</p>}
        <Button type="submit" size="lg" iconAfter="ArrowRight" disabled={busy}>{busy ? 'Creating account…' : role === 'student' ? 'Create account' : 'Continue as a mentor'}</Button>
      </form>
      <p className="sm muted center">Already have an account? <Link to="/login" className="semibold text-teal">Log in</Link></p>
    </AuthLayout>
  );
}
