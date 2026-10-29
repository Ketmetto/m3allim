import { useLocation, useParams } from 'react-router-dom';
import { PublicNav, Footer } from '../../components/layout.jsx';
import { Avatar, Button, Card, Icon, Stepper } from '../../components/ui.jsx';
import { mentorById } from '../../data/mock.js';

const NEXT = [
  ['Layla reviews your request', 'She’ll read the goals you shared and respond within 24 hours.'],
  ['You get a confirmation', 'We’ll email you as soon as she accepts and share your private session link.'],
  ['Join your video session', 'Your private link appears in your dashboard and inbox before the session.'],
];

export default function BookingConfirmed() {
  const { id } = useParams();
  const m = mentorById(id);
  const first = m.name.split(' ')[0];
  const { state } = useLocation();
  const slot = { day: state?.day || 'Tue, Oct 20', time: state?.time || '17:00', goal: state?.goal || 'Portfolio review' };
  const details = [
    ['Calendar', `${slot.day} · ${slot.time} (Beirut time)`],
    ['Video', '1:1 video call · Link shared after confirmation'],
    ['Target', `Focus: ${slot.goal}`],
    ['CircleCheck', 'Free session · no payment needed'],
  ];
  return (
    <>
      <PublicNav />
      <div className="container page col gap-28 narrow-col">
        <Stepper current={4} />
        <Card pad={48} className="col gap-28 center-items">
          <span className="success-badge"><span><Icon name="Check" size={30} strokeWidth={3} /></span></span>
          <div className="col gap-12 center"><h1 className="h1">Your request is on its way!</h1><p className="lead muted">{first} will review your request and reply within 24 hours. Sessions on M3allim are always free.</p></div>
          <div className="summary-box col gap-18">
            <div className="row gap-16"><Avatar name={m.name} src={m.photo} size={48} /><div className="col"><span className="semibold">{m.name}</span><span className="sm muted">{m.headline} at {m.company}</span></div></div>
            <hr className="hr" />
            {details.map(([ic, t]) => <div key={t} className="row gap-12"><Icon name={ic} size={18} color="var(--teal)" /><span className="medium">{t}</span></div>)}
          </div>
          <div className="row gap-12"><Button icon="CalendarPlus">Add to calendar</Button><Button variant="outline" icon="MessageCircle" to="/student/messages">Message {first}</Button></div>
        </Card>
        <Card pad={32} className="col gap-24">
          <h2 className="h2-sm">What happens next</h2>
          {NEXT.map(([t, d], i) => (
            <div key={t} className="row gap-16 start"><span className="num-circle">{i + 1}</span><div className="col gap-2"><span className="semibold">{t.replace('Layla', first)}</span><span className="muted">{d}</span></div></div>
          ))}
        </Card>
        <Button to="/mentors" variant="ghost" iconAfter="ArrowRight" className="self-center">Back to mentors</Button>
      </div>
      <Footer />
    </>
  );
}
