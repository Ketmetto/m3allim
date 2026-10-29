import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout.jsx';
import { Button, Chip, Field, FileInput, Icon, Input, Select } from '../../components/ui.jsx';
import { fields } from '../../data/mock.js';
import { myApplication, submitApplication } from '../../data/applications.js';
import { supabase } from '../../lib/supabase.js';
import { useSession } from '../../lib/auth.js';

const DOC_TYPES = '.pdf,.doc,.docx';
const MAX_BYTES = 5 * 1024 * 1024;

export default function MentorApply() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const session = useSession();
  const user = session?.user;
  const [form, setForm] = useState({ name: state?.name || '', altEmail: '', phone: '', field: state?.field || fields[0], headline: '', experience: '', linkedin: '' });
  const [cv, setCv] = useState(null);
  const [cover, setCover] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(Boolean(supabase));

  // Prefill from the account, and skip this page if the application was already sent.
  useEffect(() => {
    if (!user) return;
    (async () => {
      if (await myApplication(user.id)) return navigate('/mentor/status', { replace: true });
      const { data: profile } = await supabase.from('profiles').select('full_name, field').eq('id', user.id).maybeSingle();
      setForm((f) => ({ ...f, name: f.name || profile?.full_name || user.user_metadata?.full_name || '', field: profile?.field || f.field }));
      setChecking(false);
    })();
  }, [user, navigate]);

  if (supabase && session === null) return <Navigate to="/login" replace />;

  const email = user?.email || state?.email || '';
  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setError(''); };
  const pickFile = (setter) => (file) => {
    setError('');
    if (file && file.size > MAX_BYTES) return setError(`${file.name} is larger than 5 MB.`);
    setter(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.name.trim().split(' ').length < 2) return setError('Enter your first and last name.');
    if (!/^\+?[\d\s-]{7,}$/.test(form.phone.trim())) return setError('Enter a phone number, for example +961 70 123 456.');
    if (form.altEmail && !/^\S+@\S+\.\S+$/.test(form.altEmail.trim())) return setError('The additional email doesn’t look right.');
    if (form.altEmail && form.altEmail.trim().toLowerCase() === email.toLowerCase()) return setError('Use a different address for the additional email, or leave it empty.');
    if (!form.headline.trim()) return setError('Tell us your current role and company.');
    if (!cv) return setError('Upload your CV.');
    if (!cover) return setError('Upload your cover letter.');
    setBusy(true);
    try {
      const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
      await submitApplication(user, { ...trimmed, email }, cv, cover);
    } catch (err) {
      setBusy(false);
      return setError(`Couldn’t send your application: ${err.message}`);
    }
    if (supabase) return navigate('/mentor/status');
    setDone(true);
  };

  if (done) {
    return (
      <AuthLayout title="Application received" sub={`Thanks, ${form.name.split(' ')[0]}. We verify every mentor to keep M3allim safe for students.`}>
        <div className="reassure">
          <Icon name="BadgeCheck" size={22} color="var(--teal)" />
          <div className="col gap-4">
            <span className="semibold text-deep">What happens next</span>
            <span className="xs muted">We’ll review your CV and cover letter within 48 hours and email {email} with our decision.</span>
          </div>
        </div>
        <Button to="/" size="lg" variant="outline">Back to home</Button>
      </AuthLayout>
    );
  }

  if (checking) return null;

  return (
    <AuthLayout title="Finish your mentor application" sub="Our team reviews every application before a mentor appears on M3allim.">
      {user && <Chip kind="green">Email verified · {email}</Chip>}
      <form className="col gap-20" onSubmit={submit} noValidate>
        <Field label="Full name"><Input autoComplete="name" value={form.name} onChange={set('name')} /></Field>
        <div className="grid-2 tight">
          <Field label="Phone number"><Input type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+961 70 123 456" /></Field>
          <Field label="Additional email" hint="Optional"><Input type="email" value={form.altEmail} onChange={set('altEmail')} placeholder="work@company.com" /></Field>
        </div>
        <Field label="Current role and company"><Input value={form.headline} onChange={set('headline')} placeholder="Senior Product Designer at Murex" /></Field>
        <div className="grid-2 tight">
          <Field label="Field"><Select value={form.field} onChange={(v) => setForm({ ...form, field: v })} options={fields} /></Field>
          <Field label="Years of experience"><Input type="number" min="0" max="60" value={form.experience} onChange={set('experience')} placeholder="5" /></Field>
        </div>
        <Field label="LinkedIn profile" hint="Optional, but it speeds up verification."><Input type="url" value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/your-name" /></Field>
        <Field label="CV"><FileInput file={cv} onChange={pickFile(setCv)} accept={DOC_TYPES} label="Upload your CV" /></Field>
        <Field label="Cover letter" hint="Tell us why you want to mentor and what students can learn from you."><FileInput file={cover} onChange={pickFile(setCover)} accept={DOC_TYPES} label="Upload your cover letter" /></Field>
        {error && <p className="error" role="alert">{error}</p>}
        <Button type="submit" size="lg" iconAfter="Send" disabled={busy}>{busy ? 'Uploading…' : 'Submit application'}</Button>
        <p className="xs muted center">Only the M3allim review team can see your documents.</p>
      </form>
    </AuthLayout>
  );
}
