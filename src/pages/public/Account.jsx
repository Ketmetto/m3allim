import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout, TabBar } from '../../components/layout.jsx';
import { Button, Chip, Field, Input, PhotoPicker, Select, Textarea } from '../../components/ui.jsx';
import { getMyMentorProfile, updateMyMentorProfile } from '../../data/mentorship.js';
import { supabase } from '../../lib/supabase.js';
import { destinationFor, isSuperAdminEmail } from '../../lib/auth.js';
import { removePhoto, setPhoto, squarePhoto, updateProfile, useProfile } from '../../lib/profile.js';

const UNIVERSITIES = ['', 'AUB', 'LAU', 'LIU', 'USJ', 'LU', 'USEK', 'NDU', 'BAU', 'Other'];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* Edit my profile: name and photo for everyone, plus student details or the public mentor profile. */
export default function Account() {
  const navigate = useNavigate();
  const me = useProfile();
  const [name, setName] = useState('');
  const [photo, setPhotoData] = useState(); // undefined = unchanged, null = removed, string = new photo
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [student, setStudent] = useState(null); // { university, bio } as edited
  const [mentor, setMentor] = useState(null); // public mentor profile as edited
  const [saved, setSaved] = useState({ student: null, mentor: null }); // last saved, to detect changes

  useEffect(() => {
    if (me) setName(me.name);
  }, [me?.name]);

  const userId = me?.user.id;
  useEffect(() => {
    if (!userId) return;
    if (me.role === 'student') {
      const s = { university: me.university || '', bio: me.bio || '' };
      setStudent(s); setSaved((x) => ({ ...x, student: s }));
    }
    if (me.role === 'mentor') {
      getMyMentorProfile(userId).then((row) => {
        if (!row) return;
        const m = { headline: row.headline || '', bio: row.bio || '', languages: row.languages || '', availability: row.availability || '' };
        setMentor(m); setSaved((x) => ({ ...x, mentor: m }));
      });
    }
  }, [userId, me?.role]);

  if (!supabase || me === null) return <Navigate to="/login" replace />;
  if (!me) return null;

  const shown = photo === undefined ? me.avatar : photo;
  const role = isSuperAdminEmail(me.email) ? 'Super admin' : me.role === 'mentor' ? 'Mentor' : me.role === 'student' ? 'Student' : null;
  const changed = photo !== undefined || name.trim() !== me.name || !same(student, saved.student) || !same(mentor, saved.mentor);
  const edit = (setter) => (key) => (e) => { setter((x) => ({ ...x, [key]: typeof e === 'string' ? e : e.target.value })); setNotice(''); };
  const editStudent = edit(setStudent);
  const editMentor = edit(setMentor);

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
      if (student && !same(student, saved.student)) await updateProfile(me.user, { university: student.university || null, bio: student.bio.trim() || null });
      if (mentor && !same(mentor, saved.mentor)) {
        if (!mentor.headline.trim()) throw new Error('Your headline can’t be empty.');
        await updateMyMentorProfile(me.user.id, { headline: mentor.headline.trim(), bio: mentor.bio.trim() || null, languages: mentor.languages.trim() || null, availability: mentor.availability.trim() || null });
      }
      setSaved({ student, mentor });
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
        {student && (
          <>
            <hr className="hr" />
            <Field label="University"><Select value={student.university} onChange={editStudent('university')} options={UNIVERSITIES} aria-label="University" /></Field>
            <Field label="About me" hint="What you study and what you want to learn. Mentors see this with your requests."><Textarea rows={4} value={student.bio} onChange={editStudent('bio')} maxLength={1000} /></Field>
          </>
        )}
        {mentor && (
          <>
            <hr className="hr" />
            <h2 className="h3">Public mentor profile</h2>
            <Field label="Headline" hint="Your role and company, shown under your name."><Input value={mentor.headline} onChange={editMentor('headline')} maxLength={120} /></Field>
            <Field label="About" hint="Your background and how you can help students."><Textarea rows={5} value={mentor.bio} onChange={editMentor('bio')} maxLength={2000} /></Field>
            <Field label="Languages" hint="Separate with commas, e.g. Arabic, English, French."><Input value={mentor.languages} onChange={editMentor('languages')} /></Field>
            <Field label="Usually available" hint="e.g. Weekday evenings after 18:00, Saturday mornings."><Input value={mentor.availability} onChange={editMentor('availability')} maxLength={200} /></Field>
          </>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="sm text-teal" role="status">{notice}</p>}
        <div className="row gap-12">
          <Button type="submit" className="fill" disabled={busy || !changed}>{busy ? 'Saving…' : 'Save changes'}</Button>
          <Button variant="outline" onClick={async () => navigate(await destinationFor(me.user))}>Done</Button>
        </div>
      </form>
      <TabBar />
    </AuthLayout>
  );
}
