// Mentor application, right after sign-up: details, identity document (ID or passport), CV and cover letter.
// After a decline the same form is used to fix things and send it again (files can be kept or replaced).
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout';
import { PageLoader } from '../../components/guards/RequireRole.jsx';
import { Button, Checkbox, Chip, Field, FileInput, FormError, Input, Select } from '../../components/ui';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { myApplication, resubmitApplication, submitApplication } from '../../services/applications.js';
import { DOC_TYPES, FIELDS, ID_DOC_TYPES, ID_TYPES, LANGUAGES, MAX_UPLOAD_BYTES } from '../../config/constants.js';
import { hasFullName, isEmail, splitList } from '../../utils/format.js';

const EMPTY = { name: '', altEmail: '', phone: '', city: '', field: FIELDS[0], headline: '', experience: '', education: '', languages: [], linkedin: '', idType: ID_TYPES[0] };

function Section({ step, title, sub, children }) {
  return (
    <fieldset className="form-section">
      <legend className="col gap-4"><span className="step-pill">Step {step}</span><span className="h3">{title}</span>{sub && <span className="xs muted">{sub}</span>}</legend>
      <div className="col gap-18">{children}</div>
    </fieldset>
  );
}

export default function MentorApply() {
  const navigate = useNavigate();
  const { account, refresh } = useAuth();
  const { settings } = useSettings();
  const [existing, setExisting] = useState(); // undefined = loading, null = first application
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState({ id: null, cv: null, cover: null });
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    myApplication(account.id).then((app) => {
      setExisting(app);
      setForm(app ? {
        name: app.name, altEmail: app.altEmail || '', phone: app.phone, city: app.city || '', field: app.field, headline: app.headline,
        experience: app.experienceYears ?? '', education: app.education || '', languages: splitList(app.languages), linkedin: app.linkedin || '', idType: app.idType || ID_TYPES[0],
      } : { ...EMPTY, name: account.name, field: account.field || FIELDS[0] });
    }).catch((e) => { setError(e.message); setExisting(null); });
  }, [account.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (existing === undefined) return <PageLoader />;
  if (existing && existing.status !== 'Rejected') return <Navigate to="/mentor/status" replace />;
  if (!existing && !settings.mentor_applications_open) {
    return (
      <AuthLayout title="Applications are closed" sub="M3allim isn’t accepting new mentors right now. We’ll reopen soon.">
        <Button to="/support" variant="outline">Contact support</Button>
      </AuthLayout>
    );
  }

  const again = Boolean(existing);
  const set = (key) => (e) => { setForm({ ...form, [key]: typeof e === 'string' ? e : e.target.value }); setError(''); };
  const toggleLanguage = (l) => setForm({ ...form, languages: form.languages.includes(l) ? form.languages.filter((x) => x !== l) : [...form.languages, l] });
  const pickFile = (key) => (file) => {
    setError('');
    if (file && file.size > MAX_UPLOAD_BYTES) return setError(`${file.name} is larger than 5 MB.`);
    setFiles({ ...files, [key]: file });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!hasFullName(form.name)) return setError('Enter your first and last name, as on your ID.');
    if (!/^\+?[\d\s-]{7,}$/.test(form.phone.trim())) return setError('Enter a phone number, for example +961 70 123 456.');
    if (form.altEmail && !isEmail(form.altEmail)) return setError('The additional email doesn’t look right.');
    if (form.altEmail && form.altEmail.trim().toLowerCase() === account.email.toLowerCase()) return setError('Use a different address for the additional email, or leave it empty.');
    if (!form.headline.trim()) return setError('Tell us your current role and company.');
    if (!form.languages.length) return setError('Pick at least one language you can mentor in.');
    if (!files.id && !existing?.paths.id) return setError(`Upload a photo of your ${form.idType.toLowerCase()}.`);
    if (!files.cv && !existing?.paths.cv) return setError('Upload your CV.');
    if (!files.cover && !existing?.paths.cover) return setError('Upload your cover letter.');
    if (!confirm) return setError('Confirm that the information is accurate.');
    setBusy(true);
    const details = { ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])), languages: form.languages.join(', ') };
    try {
      if (again) await resubmitApplication(account, existing, details, files);
      else await submitApplication(account, details, files);
      await refresh();
      navigate('/mentor/status');
    } catch (err) {
      setBusy(false);
      setError(`Couldn’t send your application: ${err.message}`);
    }
  };

  return (
    <AuthLayout wide title={again ? 'Update your application' : 'Finish your mentor application'} sub="Our team verifies every mentor’s identity and experience before they appear on M3allim.">
      <Chip kind="green">Email verified · {account.email}</Chip>
      {again && existing.note && <div className="proposal"><span className="sm"><b>Note from the team:</b> {existing.note}</span></div>}
      <form className="col gap-28" onSubmit={submit} noValidate>
        <Section step={1} title="About you" sub="This becomes the start of your public mentor profile.">
          <Field label="Full name (as on your ID)"><Input autoComplete="name" value={form.name} onChange={set('name')} /></Field>
          <div className="grid-2 tight">
            <Field label="Phone number"><Input type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+961 70 123 456" /></Field>
            <Field label="City"><Input value={form.city} onChange={set('city')} placeholder="Beirut" /></Field>
          </div>
          <Field label="Additional email" hint="Optional, e.g. your work email. We copy it on our decision."><Input type="email" value={form.altEmail} onChange={set('altEmail')} placeholder="work@company.com" /></Field>
          <Field label="Current role and company"><Input value={form.headline} onChange={set('headline')} placeholder="Senior Product Designer at Murex" maxLength={120} /></Field>
          <div className="grid-2 tight">
            <Field label="Field"><Select value={form.field} onChange={set('field')} options={FIELDS} /></Field>
            <Field label="Years of experience"><Input type="number" min="0" max="60" value={form.experience} onChange={set('experience')} placeholder="5" /></Field>
          </div>
          <Field label="Education" hint="Highest degree and university."><Input value={form.education} onChange={set('education')} placeholder="BS Computer Science, AUB" /></Field>
          <div className="field">
            <span className="field-label">Languages you can mentor in</span>
            <div className="row gap-8 wrap">{LANGUAGES.map((l) => <button type="button" key={l} className={`filter-chip small ${form.languages.includes(l) ? 'active' : ''}`} aria-pressed={form.languages.includes(l)} onClick={() => toggleLanguage(l)}>{l}</button>)}</div>
          </div>
          <Field label="LinkedIn profile" hint="Optional, but it speeds up verification."><Input type="url" value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/your-name" /></Field>
        </Section>

        <Section step={2} title="Verify your identity" sub="A clear photo of your national ID card or passport. Only the M3allim review team can see it.">
          <Field label="Document type"><Select value={form.idType} onChange={set('idType')} options={ID_TYPES} /></Field>
          <Field label={form.idType === 'Passport' ? 'Passport photo page' : 'Front of your ID card'}>
            <FileInput file={files.id} current={again ? existing.docs[0].file : undefined} onChange={pickFile('id')} accept={ID_DOC_TYPES} label={`Upload your ${form.idType.toLowerCase()}`} hint="JPG, PNG or PDF, up to 5 MB" />
          </Field>
        </Section>

        <Section step={3} title="CV and cover letter" sub="Tell us about your experience and why you want to mentor.">
          <Field label="CV"><FileInput file={files.cv} current={again ? existing.docs[1].file : undefined} onChange={pickFile('cv')} accept={DOC_TYPES} label="Upload your CV" /></Field>
          <Field label="Cover letter"><FileInput file={files.cover} current={again ? existing.docs[2].file : undefined} onChange={pickFile('cover')} accept={DOC_TYPES} label="Upload your cover letter" /></Field>
        </Section>

        <Checkbox checked={confirm} onChange={(v) => { setConfirm(v); setError(''); }}>I confirm this information is accurate and the documents are mine.</Checkbox>
        <FormError>{error}</FormError>
        <Button type="submit" size="lg" iconAfter="Send" disabled={busy}>{busy ? 'Uploading…' : again ? 'Send for review again' : 'Submit application'}</Button>
        <p className="xs muted center">Documents are stored privately and only opened by the review team.</p>
      </form>
    </AuthLayout>
  );
}
