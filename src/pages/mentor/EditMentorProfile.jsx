// Build my mentor profile: what students see on the directory and my public page, with a live preview.
// Name, field and years of experience come from the verified application and can't be changed here.
import { useEffect, useState } from 'react';
import { SiteLayout } from '../../components/layout';
import MentorCard from '../../components/mentors/MentorCard.jsx';
import { Button, Card, Field, FormError, FormNotice, Input, Loading, PageHeading, Textarea } from '../../components/ui';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMentor, getMyMentorProfile, updateMyMentorProfile } from '../../services/mentors.js';
import { LANGUAGES } from '../../config/constants.js';
import { friendlyError, splitList } from '../../utils/format.js';

const SUGGESTED_TOPICS = ['Career advice', 'CV review', 'Interview prep', 'Portfolio review', 'Study planning', 'Internships', 'Switching careers', 'Technical questions'];

export default function EditMentorProfile() {
  const { account } = useAuth();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [customTopic, setCustomTopic] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([getMyMentorProfile(account.id), getMentor(account.id)]).then(([row, mentor]) => {
      const f = { headline: row?.headline || '', bio: row?.bio || '', topics: splitList(row?.topics), languages: splitList(row?.languages), linkedin: row?.linkedin || '', availability: row?.availability || '' };
      setForm(f); setSaved(f); setPreview(mentor);
    }).catch((e) => setError(friendlyError(e)));
  }, [account.id]);

  if (!form) return <SiteLayout>{error ? <FormError>{error}</FormError> : <Loading />}</SiteLayout>;

  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setNotice(''); };
  const toggle = (key, value) => { setForm({ ...form, [key]: form[key].includes(value) ? form[key].filter((x) => x !== value) : [...form[key], value] }); setNotice(''); };
  const addTopic = () => {
    const t = customTopic.trim();
    if (t && !form.topics.includes(t)) setForm({ ...form, topics: [...form.topics, t] });
    setCustomTopic('');
  };
  const changed = JSON.stringify(form) !== JSON.stringify(saved);

  const save = async (e) => {
    e.preventDefault();
    if (!form.headline.trim()) return setError('Your headline can’t be empty.');
    setBusy(true); setError('');
    try {
      await updateMyMentorProfile(account.id, {
        headline: form.headline.trim(),
        bio: form.bio.trim() || null,
        topics: form.topics.join(', ') || null,
        languages: form.languages.join(', ') || null,
        linkedin: form.linkedin.trim() || null,
        availability: form.availability.trim() || null,
      });
      setSaved(form);
      setNotice('Your profile is saved. Students see the changes right away.');
    } catch (err) {
      setError(friendlyError(err));
    }
    setBusy(false);
  };

  const live = preview && { ...preview, headline: form.headline || preview.headline, topics: form.topics, languages: form.languages, photo: account.avatar, name: account.name };

  return (
    <SiteLayout>
      <PageHeading title="My mentor profile" sub="This is how students see you on M3allim.">
        <Button variant="outline" icon="Eye" to={`/mentors/${account.id}`}>View public page</Button>
      </PageHeading>
      <div className="profile-layout">
        <Card>
          <form className="col gap-20" onSubmit={save} noValidate>
            <Field label="Headline" hint="Your role and company, shown under your name."><Input value={form.headline} onChange={set('headline')} maxLength={120} /></Field>
            <Field label="About you" hint="Your background, what you enjoy helping with and how a session with you works."><Textarea rows={7} value={form.bio} onChange={set('bio')} maxLength={2000} /></Field>
            <div className="field">
              <span className="field-label">I can help with</span>
              <div className="row gap-8 wrap">
                {[...new Set([...SUGGESTED_TOPICS, ...form.topics])].map((t) => (
                  <button type="button" key={t} className={`filter-chip small ${form.topics.includes(t) ? 'active' : ''}`} aria-pressed={form.topics.includes(t)} onClick={() => toggle('topics', t)}>{t}</button>
                ))}
              </div>
              <div className="row gap-8">
                <Input value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder="Add your own topic" maxLength={40} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } }} />
                <Button variant="outline" size="sm" icon="Plus" onClick={addTopic}>Add</Button>
              </div>
            </div>
            <div className="field">
              <span className="field-label">Languages</span>
              <div className="row gap-8 wrap">{LANGUAGES.map((l) => <button type="button" key={l} className={`filter-chip small ${form.languages.includes(l) ? 'active' : ''}`} aria-pressed={form.languages.includes(l)} onClick={() => toggle('languages', l)}>{l}</button>)}</div>
            </div>
            <Field label="LinkedIn" hint="Optional."><Input value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/your-name" /></Field>
            <Field label="Availability note" hint="Optional, shown under your weekly hours. Set the hours themselves on the Availability page."><Input value={form.availability} onChange={set('availability')} maxLength={200} placeholder="Flexible on weekends if you message me first" /></Field>
            <FormError>{error}</FormError>
            <FormNotice>{notice}</FormNotice>
            <div className="row gap-12 wrap">
              <Button type="submit" disabled={busy || !changed}>{busy ? 'Saving…' : 'Save profile'}</Button>
              <Button variant="outline" to="/account">Change name or photo</Button>
            </div>
          </form>
        </Card>
        <aside className="col gap-16 sticky">
          <span className="xs semibold muted">PREVIEW ON “FIND A MENTOR”</span>
          {live && <MentorCard mentor={live} />}
          <p className="xs muted">Name, field and years of experience come from your verified application. Ask support to change them.</p>
        </aside>
      </div>
    </SiteLayout>
  );
}
