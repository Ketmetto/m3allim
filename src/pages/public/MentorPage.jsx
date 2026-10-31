import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Footer, RoleNav } from '../../components/layout.jsx';
import { ReportDialog, TimePicker, defaultSlot } from '../../components/mentorship.jsx';
import { Avatar, Breadcrumb, Button, Card, Chip, Field, Icon, Input, Stars, Textarea } from '../../components/ui.jsx';
import { getMentor, requestSession, useFavorites } from '../../data/mentorship.js';
import { supabase } from '../../lib/supabase.js';
import { useProfile } from '../../lib/profile.js';
import { beirutToISO, fmtWhen } from '../../lib/time.js';

/* A real mentor's public profile, where students request a session. */
export default function MentorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useProfile();
  const favorites = useFavorites();
  const [m, setM] = useState();
  const [reviews, setReviews] = useState([]);
  const [slot, setSlot] = useState(defaultSlot);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    getMentor(id).then((x) => setM(x ?? null)).catch(() => setM(null));
    supabase.from('mentor_reviews').select('*').eq('mentor_id', id).order('starts_at', { ascending: false }).limit(10).then(({ data }) => setReviews(data || []));
  }, [id]);

  if (m === undefined) return <><RoleNav /><div className="container page muted">Loading…</div></>;
  if (m === null) {
    return (
      <>
        <RoleNav />
        <div className="container page"><Card className="empty"><Icon name="Search" size={28} color="var(--gray)" /><h1 className="h3">This mentor isn’t available</h1><p className="muted">They may no longer be mentoring on M3allim.</p><Button variant="outline" to="/mentors">Find another mentor</Button></Card></div>
      </>
    );
  }

  const own = me?.user.id === m.id;
  const first = m.name.split(' ')[0];
  const saved = favorites.ids.has(m.id);
  const needLogin = () => navigate('/login', { state: { error: 'Log in or create a free account to continue.' } });

  const submit = async (e) => {
    e.preventDefault();
    if (!me) return needLogin();
    if (!topic.trim()) return setError('Tell your mentor what the session is about.');
    setBusy(true); setError('');
    try {
      const s = await requestSession(me.user.id, { mentorId: m.id, topic: topic.trim(), message: message.trim(), startsAt: beirutToISO(slot.day, slot.time) });
      setSent(s);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <>
      <RoleNav />
      <div className="container page col gap-24">
        <Breadcrumb items={[{ label: 'Find a mentor', to: '/mentors' }, { label: m.name }]} />
        <Card pad={32} className="row gap-24 profile-head">
          <Avatar name={m.name} src={m.photo} size={120} />
          <div className="col gap-8 fill">
            <div className="row gap-8 wrap"><h1 className="h1">{m.name}</h1><Chip kind="teal" dot={false}><Icon name="BadgeCheck" size={14} /> Verified mentor</Chip></div>
            <p className="lead">{m.headline}</p>
            <div className="row gap-24 wrap sm">
              {m.reviews ? <span className="row gap-6"><Stars value={m.rating} /> <b>{m.rating.toFixed(1)}</b> <span className="muted">({m.reviews} reviews)</span></span> : <span className="muted">New mentor</span>}
              <span className="row gap-6"><Icon name="Video" size={15} color="var(--teal)" /> {m.sessions} sessions</span>
              {m.experienceYears != null && <span className="row gap-6"><Icon name="Briefcase" size={15} color="var(--teal)" /> {m.experienceYears} years of experience</span>}
            </div>
            <div className="row gap-8 wrap"><Chip kind="teal" dot={false}>{m.field}</Chip>{m.languages.map((l) => <Chip key={l} kind="gray" dot={false}>{l}</Chip>)}</div>
          </div>
          {!own && (
            <div className="col gap-8">
              <Button variant="outline" size="sm" icon="Bookmark" onClick={() => (favorites.signedIn ? favorites.toggle(m.id) : needLogin())}>{saved ? 'Saved' : 'Save'}</Button>
              <Button variant="outline" size="sm" icon="MessageCircle" onClick={() => (me ? navigate(`/${me.role === 'mentor' ? 'mentor' : 'student'}/messages?with=${m.id}`) : needLogin())}>Message</Button>
              {me && <button className="link danger xs" onClick={() => setReporting(true)}>Report</button>}
            </div>
          )}
        </Card>

        <div className="profile-layout">
          <div className="col gap-24">
            <Card className="col gap-12">
              <h2 className="h2-sm">About</h2>
              <p className={m.bio ? '' : 'muted'}>{m.bio || `${first} hasn’t written a bio yet.`}</p>
              {m.availability && <><h3 className="semibold">Usually available</h3><p className="muted">{m.availability}</p></>}
            </Card>
            <Card className="col gap-20">
              <h2 className="h2-sm">Reviews</h2>
              {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
              {reviews.map((r, i) => (
                <div key={i} className="col gap-6">{i > 0 && <hr className="hr" />}<Stars value={r.rating} />{r.review && <p>{r.review}</p>}<span className="xs muted">Student · {new Date(r.starts_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span></div>
              ))}
            </Card>
          </div>

          <aside className="col gap-20 sticky">
            <Card className="col gap-20">
              {own ? (
                <>
                  <h2 className="h2-sm">This is your public profile</h2>
                  <p className="sm muted">Students see this page when they find you. Keep your bio and availability up to date.</p>
                  <Button to="/account" icon="SlidersHorizontal">Edit my profile</Button>
                </>
              ) : sent ? (
                <>
                  <div className="col gap-6"><Icon name="CircleCheck" size={28} color="var(--green)" /><h2 className="h2-sm">Request sent</h2><p className="sm muted">{first} will accept or suggest another time. You asked for {fmtWhen(sent.starts_at)} (Beirut).</p></div>
                  <Button to="/student/sessions">Manage my requests</Button>
                  <Button variant="outline" onClick={() => { setSent(null); setTopic(''); setMessage(''); }}>Request another time</Button>
                </>
              ) : (
                <form className="col gap-20" onSubmit={submit} noValidate>
                  <div className="col gap-4"><h2 className="h2-sm">Request a session</h2><p className="sm muted">45-minute video call · <b className="text-teal">Free</b></p></div>
                  <TimePicker value={slot} onChange={setSlot} />
                  <Field label="What do you want to talk about?"><Input value={topic} onChange={(e) => { setTopic(e.target.value); setError(''); }} placeholder="Portfolio review, career advice…" maxLength={120} /></Field>
                  <Field label={`Message to ${first}`} hint="Optional. Share your background and goals."><Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
                  {error && <p className="error" role="alert">{error}</p>}
                  {me?.role === 'mentor' ? <p className="sm muted">Mentor accounts can’t request sessions.</p> : <Button type="submit" size="lg" iconAfter="ArrowRight" disabled={busy}>{me ? (busy ? 'Sending…' : 'Send request') : 'Log in to request'}</Button>}
                </form>
              )}
            </Card>
            <div className="reassure"><Icon name="ShieldCheck" size={22} color="var(--teal)" /><div className="col gap-4"><span className="semibold text-deep">Mentorship you can trust</span><span className="xs muted">Every mentor is verified. Sessions are always free, and you can reschedule or cancel from <Link to="/student/sessions" className="text-teal">My sessions</Link>.</span></div></div>
          </aside>
        </div>
      </div>
      {reporting && <ReportDialog reporterId={me.user.id} person={{ id: m.id, name: m.name }} onClose={() => setReporting(false)} />}
      <Footer />
    </>
  );
}
