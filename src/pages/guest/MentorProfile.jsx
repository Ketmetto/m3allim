// A mentor's public profile. What the side panel shows depends on who is looking:
//   guest        → "create an account" (guests can browse but not book or chat)
//   student      → request a session (only times inside the mentor's availability), save, message, report
//   the mentor   → "this is your public profile" with links to edit it
//   other roles  → profile only
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SiteLayout } from '../../components/layout';
import { SlotPicker } from '../../components/mentors/SlotPicker.jsx';
import { ReviewList } from '../../components/mentors/ReviewList.jsx';
import { WeeklyHours } from '../../components/mentors/WeeklyHours.jsx';
import { ReportDialog } from '../../components/moderation/ReportDialog.jsx';
import { Avatar, Breadcrumb, Button, Card, Chip, EmptyState, Field, FormError, Icon, Input, Loading, Stars, Textarea } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useFavorites } from '../../hooks/useFavorites.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { getMentor, getMentorReviews } from '../../services/mentors.js';
import { getAvailability } from '../../services/availability.js';
import { requestSession } from '../../services/sessions.js';
import { ROLES } from '../../config/roles.js';
import { beirutToISO, fmtWhen } from '../../utils/time.js';
import { firstName, friendlyError } from '../../utils/format.js';

function RequestForm({ mentor, studentId }) {
  const { settings } = useSettings();
  const [slot, setSlot] = useState(null);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);
  const first = firstName(mentor.name);

  const submit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return setError('Tell your mentor what the session is about.');
    setBusy(true); setError('');
    try {
      setSent(await requestSession(studentId, { mentorId: mentor.id, topic: topic.trim(), message: message.trim(), startsAt: beirutToISO(slot.day, slot.time) }));
    } catch (err) {
      setError(friendlyError(err));
    }
    setBusy(false);
  };

  if (sent) {
    return (
      <>
        <div className="col gap-6"><Icon name="CircleCheck" size={28} color="var(--green)" /><h2 className="h2-sm">Request sent</h2><p className="sm muted">{first} will accept, decline or suggest another time. You asked for {fmtWhen(sent.starts_at)} (Beirut). You’ll get a notification.</p></div>
        <Button to="/student/sessions">Manage my requests</Button>
        <Button variant="outline" onClick={() => { setSent(null); setTopic(''); setMessage(''); }}>Request another time</Button>
      </>
    );
  }
  return (
    <form className="col gap-20" onSubmit={submit} noValidate>
      <div className="col gap-4"><h2 className="h2-sm">Request a session</h2><p className="sm muted">{settings.session_length_min}-minute video call · <b className="text-teal">Free</b></p></div>
      <SlotPicker mentorId={mentor.id} value={slot} onChange={setSlot} />
      <Field label="What do you want to talk about?"><Input value={topic} onChange={(e) => { setTopic(e.target.value); setError(''); }} placeholder="Portfolio review, career advice…" maxLength={120} /></Field>
      <Field label={`Message to ${first}`} hint="Optional. Share your background and goals."><Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} /></Field>
      <FormError>{error}</FormError>
      <Button type="submit" size="lg" iconAfter="ArrowRight" disabled={busy || !slot}>{busy ? 'Sending…' : 'Send request'}</Button>
      <p className="xs muted">You can have up to {settings.max_pending_requests} open requests at a time.</p>
    </form>
  );
}

export default function MentorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, role } = useAuth();
  const favorites = useFavorites();
  const [reporting, setReporting] = useState(false);
  const { data, error } = useAsync(() => Promise.all([getMentor(id), getMentorReviews(id, 20), getAvailability(id)]), [id]);

  if (error) return <SiteLayout><p className="error">{error}</p></SiteLayout>;
  if (!data) return <SiteLayout><Loading /></SiteLayout>;
  const [m, reviews, availability] = data;
  if (!m) {
    return (
      <SiteLayout footer>
        <Card><EmptyState icon="Search" title="This mentor isn’t available" text="They may no longer be mentoring on M3allim."><Button variant="outline" to="/mentors">Find another mentor</Button></EmptyState></Card>
      </SiteLayout>
    );
  }

  const own = account?.id === m.id;
  const isStudent = role === ROLES.STUDENT;
  const first = firstName(m.name);
  const saved = favorites.ids.has(m.id);

  return (
    <SiteLayout footer>
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
            {m.linkedin && <a className="row gap-6 text-teal" href={`https://${m.linkedin.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer"><Icon name="Linkedin" size={15} /> LinkedIn</a>}
          </div>
          <div className="row gap-8 wrap"><Chip kind="teal" dot={false}>{m.field}</Chip>{m.languages.map((l) => <Chip key={l} kind="gray" dot={false}>{l}</Chip>)}</div>
        </div>
        {isStudent && (
          <div className="col gap-8">
            <Button variant="outline" size="sm" icon="Bookmark" onClick={() => favorites.toggle(m.id)}>{saved ? 'Saved' : 'Save'}</Button>
            <Button variant="outline" size="sm" icon="MessageCircle" onClick={() => navigate(`/messages?with=${m.id}`)}>Message</Button>
            <button type="button" className="link danger xs" onClick={() => setReporting(true)}>Report mentor</button>
          </div>
        )}
      </Card>

      <div className="profile-layout">
        <div className="col gap-24">
          <Card className="col gap-12">
            <h2 className="h2-sm">About</h2>
            <p className={m.bio ? 'pre-line' : 'muted'}>{m.bio || `${first} hasn’t written a bio yet.`}</p>
            {m.topics.length > 0 && <><h3 className="semibold">Can help with</h3><div className="row gap-8 wrap">{m.topics.map((t) => <Chip key={t} kind="gray" dot={false}>{t}</Chip>)}</div></>}
          </Card>
          <Card className="col gap-12">
            <h2 className="h2-sm">Weekly availability</h2>
            <WeeklyHours availability={availability} />
            {m.availabilityNote && <p className="sm muted">{m.availabilityNote}</p>}
            <p className="xs muted">All times are Beirut time.</p>
          </Card>
          <Card className="col gap-20">
            <h2 className="h2-sm">Reviews</h2>
            <ReviewList reviews={reviews} />
          </Card>
        </div>

        <aside className="col gap-20 sticky">
          <Card className="col gap-20">
            {own ? (
              <>
                <h2 className="h2-sm">This is your public profile</h2>
                <p className="sm muted">Students see this page when they find you. Keep your bio and hours up to date.</p>
                <Button to="/mentor/profile" icon="PenLine">Edit my profile</Button>
                <Button to="/mentor/availability" variant="outline" icon="CalendarClock">Set my availability</Button>
              </>
            ) : isStudent ? (
              <RequestForm mentor={m} studentId={account.id} />
            ) : !account ? (
              <>
                <div className="col gap-6"><h2 className="h2-sm">Want a session with {first}?</h2><p className="sm muted">Create a free student account to request a video call, message {first} and save mentors.</p></div>
                <Button to="/signup" iconAfter="ArrowRight">Create a free account</Button>
                <Button to="/login" variant="outline" state={{ from: `/mentors/${m.id}` }}>I already have an account</Button>
              </>
            ) : (
              <>
                <h2 className="h2-sm">Sessions are for students</h2>
                <p className="sm muted">Only student accounts can request sessions with mentors.</p>
              </>
            )}
          </Card>
          <div className="reassure"><Icon name="ShieldCheck" size={22} color="var(--teal)" /><div className="col gap-4"><span className="semibold text-deep">Mentorship you can trust</span><span className="xs muted">Every mentor’s identity and experience is verified. Sessions are always free{isStudent ? <>, and you can reschedule or cancel from <Link to="/student/sessions" className="text-teal">My sessions</Link>.</> : '.'}</span></div></div>
        </aside>
      </div>
      {reporting && <ReportDialog reporterId={account.id} person={{ id: m.id, name: m.name }} onClose={() => setReporting(false)} />}
    </SiteLayout>
  );
}
