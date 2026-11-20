// Account settings (every signed-in role): name, photo, and for students their university and "about me".
// Mentors edit their public profile on /mentor/profile.
import { useEffect, useState } from 'react';
import { RoleLayout } from '../../components/layout';
import { Button, Card, Chip, Field, FormError, FormNotice, Input, PhotoPicker, Select, Textarea } from '../../components/ui';
import { useAuth } from '../../context/AuthContext.jsx';
import { removePhoto, setPhoto, squarePhoto, updateProfile } from '../../services/profiles.js';
import { sendPasswordReset } from '../../services/auth.js';
import { ROLES, ROLE_LABELS } from '../../config/roles.js';
import { UNIVERSITIES } from '../../config/constants.js';
import { friendlyError, hasFullName } from '../../utils/format.js';

export default function Account() {
  const { account, role, isStaff, refresh } = useAuth();
  const isStudent = role === ROLES.STUDENT;
  const initial = { name: account.name, university: account.university || '', bio: account.bio || '' };
  const [form, setForm] = useState(initial);
  const [photo, setPhotoData] = useState(); // undefined = unchanged, null = removed, string = new photo
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({ name: account.name, university: account.university || '', bio: account.bio || '' });
  }, [account.name, account.university, account.bio]);

  const shown = photo === undefined ? account.avatar : photo;
  const changed = photo !== undefined || JSON.stringify(form) !== JSON.stringify(initial);
  const set = (key) => (e) => { setForm({ ...form, [key]: typeof e === 'string' ? e : e.target.value }); setError(''); setNotice(''); };

  const pickPhoto = async (file) => {
    setError(''); setNotice('');
    try {
      setPhotoData(await squarePhoto(file));
    } catch (err) {
      setError(err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!hasFullName(form.name)) return setError('Enter your first and last name.');
    setBusy(true); setError(''); setNotice('');
    try {
      if (photo) await setPhoto(account.id, photo);
      if (photo === null) await removePhoto(account.id);
      const fields = { full_name: form.name.trim() };
      if (isStudent) Object.assign(fields, { university: form.university || null, bio: form.bio.trim() || null });
      await updateProfile(account.id, fields);
      await refresh();
      setPhotoData(undefined);
      setNotice('Your profile is saved.');
    } catch (err) {
      setError(`Couldn’t save: ${friendlyError(err)}`);
    }
    setBusy(false);
  };

  const resetPassword = async () => {
    const { error: err } = await sendPasswordReset(account.email);
    err ? setError(err.message) : setNotice(`We sent a link to ${account.email} to set a new password.`);
  };

  return (
    <RoleLayout title="Account settings" sub="This is how you appear on M3allim.">
      <div className="profile-layout">
        <Card>
          <form className="col gap-20" onSubmit={save} noValidate>
            <div className="field">
              <span className="field-label">Profile photo</span>
              <PhotoPicker name={form.name} src={shown} onPick={pickPhoto} onRemove={() => { setPhotoData(null); setNotice(''); }} size={88} />
            </div>
            <Field label="Full name"><Input autoComplete="name" value={form.name} onChange={set('name')} /></Field>
            <Field label="Email" hint={account.provider === 'google' ? 'Signed in with Google.' : 'Verified.'}><Input value={account.email} disabled /></Field>
            {isStudent && (
              <>
                <Field label="University"><Select value={form.university} onChange={set('university')} options={['', ...UNIVERSITIES].map((u) => ({ value: u, label: u || 'Not set' }))} aria-label="University" /></Field>
                <Field label="About me" hint="What you study and what you want to learn. Mentors see this with your requests."><Textarea rows={4} value={form.bio} onChange={set('bio')} maxLength={1000} /></Field>
              </>
            )}
            <FormError>{error}</FormError>
            <FormNotice>{notice}</FormNotice>
            <Button type="submit" disabled={busy || !changed}>{busy ? 'Saving…' : 'Save changes'}</Button>
          </form>
        </Card>
        <aside className="col gap-16">
          <Card className="col gap-12">
            <span className="xs muted">Account type</span>
            <Chip kind={isStaff ? 'gold' : 'teal'}>{ROLE_LABELS[role]}</Chip>
            {role === ROLES.MENTOR && <Button variant="outline" size="sm" icon="PenLine" to="/mentor/profile">Edit my public mentor profile</Button>}
          </Card>
          {account.provider !== 'google' && (
            <Card className="col gap-12">
              <span className="semibold">Password</span>
              <p className="sm muted">We’ll email you a secure link to choose a new password.</p>
              <Button variant="outline" size="sm" icon="KeyRound" onClick={resetPassword}>Send reset link</Button>
            </Card>
          )}
        </aside>
      </div>
    </RoleLayout>
  );
}
