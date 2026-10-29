import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PublicNav, Footer } from '../../components/layout.jsx';
import { Avatar, Breadcrumb, Button, Card, Chip, Field, Icon, Select, Stars } from '../../components/ui.jsx';
import { goals, mentorById, reviews, slotDays, slotTimes } from '../../data/mock.js';

export default function MentorProfile() {
  const { id } = useParams();
  const m = mentorById(id);
  const navigate = useNavigate();
  const [day, setDay] = useState(slotDays[0]);
  const [time, setTime] = useState(slotTimes[0]);
  const [goal, setGoal] = useState(goals[0]);

  return (
    <>
      <PublicNav />
      <div className="container page col gap-24">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Find a mentor', to: '/mentors' }, { label: m.name }]} />

        <Card pad={32} className="row gap-24 profile-head">
          <Avatar name={m.name} src={m.photo} size={120} />
          <div className="col gap-8 fill">
            <div className="row gap-8"><h1 className="h1">{m.name}</h1><Chip kind="teal" dot={false}><Icon name="BadgeCheck" size={14} /> Verified mentor</Chip></div>
            <p className="lead">{m.headline} · {m.company}</p>
            <div className="row gap-24 wrap sm">
              <span className="row gap-6"><Stars value={m.rating} /> <b>{m.rating.toFixed(1)}</b> <span className="muted">({m.reviews} reviews)</span></span>
              <span className="row gap-6"><Icon name="Video" size={15} color="var(--teal)" /> {m.sessions} sessions</span>
              <span className="row gap-6"><Icon name="Clock" size={15} color="var(--teal)" /> {m.response}</span>
              <span className="row gap-6"><Icon name="MapPin" size={15} color="var(--teal)" /> {m.location}</span>
            </div>
            <div className="row gap-8 wrap">{m.languages.map((l) => <Chip key={l} kind="gray" dot={false}>{l}</Chip>)}{m.tags.map((t) => <Chip key={t} kind="teal" dot={false}>{t}</Chip>)}</div>
          </div>
        </Card>

        <div className="profile-layout">
          <div className="col gap-24">
            <Card className="col gap-12"><h2 className="h2-sm">About</h2><p>{m.bio}</p><h3 className="semibold">Mentoring approach</h3><p className="muted">{m.approach}</p></Card>
            <Card className="col gap-20">
              <h2 className="h2-sm">Experience</h2>
              {m.experience.map((e) => (
                <div key={e.role} className="row gap-16"><span className="icon-box"><Icon name="Briefcase" size={18} /></span><div className="col"><span className="semibold">{e.role}</span><span className="sm muted">{e.place} · {e.period}</span></div></div>
              ))}
            </Card>
            <Card className="col gap-20">
              <h2 className="h2-sm">Reviews</h2>
              {reviews.map((r, i) => (
                <div key={r.name} className="col gap-8">
                  {i > 0 && <hr className="hr" />}
                  <div className="row between"><div className="row gap-12"><Avatar name={r.name} size={40} /><div className="col"><span className="semibold">{r.name}</span><span className="xs muted">{r.role}</span></div></div><Stars value={r.rating} /></div>
                  <p>{r.text}</p>
                </div>
              ))}
            </Card>
          </div>

          <aside className="col gap-20 sticky">
            <Card className="col gap-20">
              <div className="col gap-4"><h2 className="h2-sm">Request a session</h2><p className="sm muted">45-minute video call · <b className="text-teal">Free</b></p></div>
              <div className="col gap-8"><span className="field-label">Day</span><div className="slot-grid">{slotDays.map((d) => <button key={d} className={`slot ${day === d ? 'active' : ''}`} onClick={() => setDay(d)}>{d}</button>)}</div></div>
              <div className="col gap-8"><span className="field-label">Time (Beirut)</span><div className="slot-grid slot-grid-4">{slotTimes.map((t) => <button key={t} className={`slot ${time === t ? 'active' : ''}`} onClick={() => setTime(t)}>{t}</button>)}</div></div>
              <Field label="Session goal"><Select value={goal} onChange={setGoal} options={goals} /></Field>
              <Button size="lg" iconAfter="ArrowRight" onClick={() => navigate(`/book/${m.id}`, { state: { day, time, goal } })}>Request session</Button>
            </Card>
            <div className="reassure"><Icon name="ShieldCheck" size={22} color="var(--teal)" /><div className="col gap-4"><span className="semibold text-deep">Mentorship you can trust</span><span className="xs muted">Every mentor is verified. Mentorship on M3allim is always free, and you can cancel up to 24 hours before.</span></div></div>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
