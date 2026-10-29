import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PublicNav, Footer } from '../../components/layout.jsx';
import { Avatar, Breadcrumb, Button, Card, Checkbox, Chip, Field, Icon, Stepper, Stars, Textarea } from '../../components/ui.jsx';
import { mentorById } from '../../data/mock.js';

const QUICK = ['Case study feedback', 'Portfolio structure', 'Interview practice'];

export default function ConfirmBooking() {
  const { id } = useParams();
  const m = mentorById(id);
  const { state } = useLocation();
  const navigate = useNavigate();
  const slot = { day: state?.day || 'Tue, Oct 20', time: state?.time || '17:00', goal: state?.goal || 'Portfolio review' };
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!agree) return setError('Please accept the terms to send your request.');
    navigate(`/book/${m.id}/confirmed`, { state: { ...slot, message } });
  };

  const rows = [
    ['Calendar', 'Date & time', `${slot.day} · ${slot.time} – ${Number(slot.time.slice(0, 2)) ? `${String(Number(slot.time.slice(0, 2))).padStart(2, '0')}:45` : ''}`],
    ['Video', 'Format', '1:1 video call · Link shared after confirmation'],
    ['Clock', 'Time zone', 'Beirut time (GMT+3)'],
    ['Target', 'Session focus', slot.goal],
  ];

  return (
    <>
      <PublicNav />
      <div className="container page col gap-24">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Find a mentor', to: '/mentors' }, { label: m.name, to: `/mentors/${m.id}` }, { label: 'Confirm booking' }]} />
        <div className="col gap-8"><h1 className="h1">Confirm your mentorship request</h1><p className="lead muted">Review the details below. {m.name.split(' ')[0]} will reply within 24 hours.</p></div>
        <Stepper current={2} />

        <div className="booking-layout">
          <div className="col gap-24">
            <Card className="col gap-24" pad={32}>
              <div className="row between"><h2 className="h2-sm">Your session</h2><Chip kind="teal" dot={false}>VERIFIED MENTOR</Chip></div>
              <div className="row gap-16"><Avatar name={m.name} src={m.photo} size={64} /><div className="col gap-4"><span className="h3">{m.name}</span><span className="sm muted">{m.headline} at {m.company}</span><span className="row gap-6 xs"><Stars value={m.rating} /> <b>{m.rating.toFixed(1)}</b> <span className="muted">({m.reviews} reviews)</span></span></div></div>
              <hr className="hr" />
              {rows.map(([ic, label, value]) => (
                <div key={label} className="row gap-16"><span className="icon-box neutral"><Icon name={ic} size={18} /></span><div className="col fill"><span className="xs muted">{label}</span><span className="semibold">{value}</span></div><button className="link" onClick={() => navigate(`/mentors/${m.id}`)}>Change</button></div>
              ))}
            </Card>

            <Card className="col gap-20" pad={32}>
              <div className="row between"><div className="col gap-4"><h2 className="h2-sm">Share your goals with {m.name.split(' ')[0]}</h2><p className="sm muted">The more she knows, the more tailored your session will be.</p></div><Chip kind="teal" dot={false}>OPTIONAL</Chip></div>
              <Field label="Message"><Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell your mentor about your background, what you’re working on, and what you’d like to leave the session with…" /></Field>
              <div className="row gap-8 wrap"><span className="xs muted">Quick add:</span>{QUICK.map((q) => <button key={q} className="filter-chip small" onClick={() => setMessage((t) => (t ? `${t}\n${q}` : q))}>{q}</button>)}</div>
            </Card>

            <div className="col gap-8">
              <Checkbox checked={agree} onChange={(v) => { setAgree(v); setError(''); }}>I agree to the <b className="text-teal">Terms of service</b> and <b className="text-teal">Community guidelines</b>, and understand that {m.name.split(' ')[0]} will see the goals I share.</Checkbox>
              {error && <p className="error" role="alert">{error}</p>}
            </div>
          </div>

          <aside className="col gap-20">
            <Card className="col gap-20">
              <h2 className="h2-sm">Request summary</h2>
              <div className="row gap-12"><Avatar name={m.name} src={m.photo} size={48} /><div className="col"><span className="semibold">Mentorship session</span><span className="sm muted">with {m.name} · 45 min</span></div></div>
              <hr className="hr" />
              <div className="row between sm"><span className="muted">45-minute session</span><span className="semibold">Free</span></div>
              <hr className="hr" />
              <div className="row between"><span className="semibold">Total cost</span><span className="total">Free</span></div>
              <Button size="lg" iconAfter="ArrowRight" onClick={submit}>Send request</Button>
              <p className="xs muted center">Free for students. If {m.name.split(' ')[0]} can’t make it, you’ll be notified so you can book another mentor.</p>
            </Card>
            <div className="reassure"><Icon name="ShieldCheck" size={22} color="var(--teal)" /><div className="col gap-4"><span className="semibold text-deep">Free cancellation</span><span className="xs muted">Reschedule or cancel up to 24 hours before your session at no cost.</span></div></div>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
