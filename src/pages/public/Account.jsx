import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout.jsx';
import { Button, Chip, Field, Input, PhotoPicker } from '../../components/ui.jsx';
import { supabase } from '../../lib/supabase.js';
import { destinationFor, isSuperAdminEmail } from '../../lib/auth.js';
import { removePhoto, setPhoto, squarePhoto, updateProfile, useProfile } from '../../lib/profile.js';

/* Name and photo for any signed-in person (student, mentor or super admin). */
export default function Account() {
  const navigate = useNavigate();
  const me = useProfile();
  const [name, setName] = useState('');
  const [photo, setPhotoData] = useState(); // undefined = unchanged, null = removed, string = new photo
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (me) setName(me.name);
  }, [me?.name]);

  if (!supabase || me === null) return <Navigate to="/login" replace />;
  if (!me) return null;

  const shown = photo === undefined ? me.avatar : photo;
  const role = isSuperAdminEmail(me.email) ? 'Super admin' : me.role === 'mentor' ? 'Mentor' : me.role === 'student' ? 'Student' : null;
  const changed = photo !== undefined || name.trim() !== me.name;

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
    if (name.trim().split(' ').length < 2) return setError('Enter your first and last name.');
    setBusy(true); setError(''); setNotice('');
    try {
      if (photo) await setPhoto(me.user, photo);
      if (photo === null) await removePhoto(me.user);
      if (name.trim() !== me.name) await updateProfile(me.user, { full_name: name.trim() });
      setPhotoData(undefined);
      setNotice('Your profile is saved.');
    } catch (err) {
      setError(`Couldn’t save: ${err.message}`);
    }
    setBusy(false);
  };

  return (
    <AuthLayout title="Your profile" sub="This is how you appear on M3allim.">
      <form className="col gap-20" onSubmit={save} noValidate>
        <div className="field">
          <span className="field-label">Profile photo</span>
          <PhotoPicker name={name} src={shown} onPick={pickPhoto} onRemove={() => { setPhotoData(null); setNotice(''); }} size={88} />
        </div>
        <Field label="Full name"><Input autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); setError(''); setNotice(''); }} /></Field>
        <Field label="Email" hint={me.user.app_metadata?.provider === 'google' ? 'Signed in with Google.' : 'Verified.'}><Input value={me.email} disabled /></Field>
        {role && <div className="row gap-8 sm"><span className="muted">Account type</span><Chip kind={role === 'Super admin' ? 'gold' : 'teal'}>{role}</Chip></div>}
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="sm text-teal" role="status">{notice}</p>}
        <div className="row gap-12">
          <Button type="submit" className="fill" disabled={busy || !changed}>{busy ? 'Saving…' : 'Save changes'}</Button>
          <Button variant="outline" onClick={async () => navigate(await destinationFor(me.user))}>Done</Button>
        </div>
      </form>
    </AuthLayout>
  );
}
