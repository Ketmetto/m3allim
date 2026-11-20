// Create an account as a student or as a mentor (email + verification link, or Google).
// Mentors then upload their ID, CV and cover letter on /mentor/apply. The super admin can close either sign-up.
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/layout';
import { GoogleButton } from '../../components/auth/GoogleButton.jsx';
import { RolePicker } from '../../components/auth/RolePicker.jsx';
import { Button, Checkbox, Field, FormError, Icon, Input, PasswordInput, PhotoPicker, Select } from '../../components/ui';
import { useSettings } from '../../context/SettingsContext.jsx';
import { resendVerification, signInWithGoogle, signUpWithEmail } from '../../services/auth.js';
import { savePendingPhoto, squarePhoto } from '../../services/profiles.js';
import { FIELDS, UNIVERSITIES } from '../../config/constants.js';
import { hasFullName, isEmail } from '../../utils/format.js';

export default function SignUp() {
  const { state } = useLocation();
  const { settings } = useSettings();
  const closed = [!settings.student_signups_open && 'student', !settings.mentor_applications_open && 'mentor'].filter(Boolean);
  const [role, setRole] = useState(() => {
    const wanted = state?.role || 'student';
    return closed.includes(wanted) ? ['student', 'mentor'].find((r) => !closed.includes(r)) || wanted : wanted;
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState(UNIVERSITIES[0]);
  const [field, setField] = useState(FIELDS[0]);
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
    if (closed.includes(role)) return setError(role === 'student' ? 'Student sign-ups are closed for now.' : 'Mentor applications are closed for now.');
    if (!hasFullName(name)) return setError('Enter your first and last name.');
    if (!isEmail(email)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Your password needs at least 8 characters.');
    if (!agree) return setError('Please accept the terms to create your account.');
    setBusy(true);
    const profile = role === 'student' ? { university: school } : { field };
    const { data, error: err } = await signUpWithEmail({ email: email.trim(), password, full_name: name.trim(), role, ...profile });
    setBusy(false);
    if (err) return setError(err.message);
    // Supabase returns a user with no identities when the email is already registered.
    if (!data.user?.identities?.length) return setError('An account with this email already exists. Log in instead.');
    // The photo is uploaded on first sign-in, once the email is verified.
    if (photo) savePendingPhoto(email.trim(), photo);
    if (!data.session) setSentTo(email.trim()); // otherwise the GuestOnly guard takes them home
  };

  const google = async () => {
    if (closed.includes(role)) {
      setError('That sign-up is closed for now.');
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
              This confirms the address is yours. {role === 'mentor' ? 'After that you’ll verify your identity and upload your CV and cover letter.' : 'After that you can book your first session.'} Can’t find it? Check your spam folder.
            </span>
          </div>
        </div>
        {notice && <p className="sm text-teal" role="status">{notice}</p>}
        <Button variant="outline" size="lg" onClick={resend}>Resend link</Button>
        <p className="sm muted center">Wrong email? <button type="button" className="link" onClick={() => setSentTo('')}>Go back</button></p>
      </AuthLayout>
    );
  }

  if (closed.length === 2) {
    return (
      <AuthLayout title="Sign-ups are paused" sub="M3allim isn’t accepting new accounts right now. Please check back soon.">
        <Button to="/mentors" variant="outline">Browse mentors</Button>
        <p className="sm muted center">Already have an account? <Link to="/login" className="semibold text-teal">Log in</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" sub="Free, one-to-one mentorship with verified professionals in Lebanon.">
      <RolePicker value={role} onChange={(r) => { setRole(r); setError(''); }} disabled={closed} />
      <GoogleButton onClick={google}>Sign up with Google</GoogleButton>
      <div className="auth-divider"><span>or sign up with email</span></div>
      <form className="col gap-20" onSubmit={submit} noValidate>
        <div className="field">
          <span className="field-label">Profile photo</span>
          <PhotoPicker name={name} src={photo} onPick={pickPhoto} onRemove={() => setPhotoData(null)} />
        </div>
        <Field label="Full name"><Input autoComplete="name" value={name} onChange={edit(setName)} placeholder="Sarah Mansour" /></Field>
        <Field label="Email" hint="We’ll send a link to verify it’s yours."><Input type="email" autoComplete="email" value={email} onChange={edit(setEmail)} placeholder="you@example.com" /></Field>
        <Field label="Password" hint="At least 8 characters."><PasswordInput autoComplete="new-password" value={password} onChange={edit(setPassword)} placeholder="Create a password" /></Field>
        {role === 'student' ? (
          <Field label="University"><Select value={school} onChange={setSchool} options={UNIVERSITIES} /></Field>
        ) : (
          <Field label="Your field" hint="After verifying your email you’ll upload your ID or passport, CV and cover letter."><Select value={field} onChange={setField} options={FIELDS} /></Field>
        )}
        <Checkbox checked={agree} onChange={(v) => { setAgree(v); setError(''); }}>I agree to the <b className="text-teal">Terms of service</b> and <b className="text-teal">Community guidelines</b>.</Checkbox>
        <FormError>{error}</FormError>
        <Button type="submit" size="lg" iconAfter="ArrowRight" disabled={busy}>{busy ? 'Creating account…' : role === 'student' ? 'Create account' : 'Continue as a mentor'}</Button>
      </form>
      <p className="sm muted center">Already have an account? <Link to="/login" className="semibold text-teal">Log in</Link></p>
    </AuthLayout>
  );
}
