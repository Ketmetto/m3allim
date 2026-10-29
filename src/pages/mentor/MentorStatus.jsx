import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout.jsx';
import { Button, Icon, StatusChip } from '../../components/ui.jsx';
import { myApplication } from '../../data/applications.js';
import { supabase } from '../../lib/supabase.js';
import { useSession } from '../../lib/auth.js';

const COPY = {
  Pending: { icon: 'Hourglass', title: 'Your application is under review', text: (a) => `We’re reviewing your CV and cover letter. You’ll get an email at ${a.email} with our decision, usually within 48 hours.` },
  Approved: { icon: 'BadgeCheck', title: 'You’re an approved mentor', text: () => 'Welcome to M3allim. Students will be able to find you and request sessions.' },
  Rejected: { icon: 'CircleX', title: 'Your application wasn’t approved', text: () => 'Thank you for applying. Check your email for details from our team.' },
};

export default function MentorStatus() {
  const navigate = useNavigate();
  const session = useSession();
  const [app, setApp] = useState();

  useEffect(() => {
    if (session) myApplication(session.user.id).then(setApp);
  }, [session]);

  if (!supabase) return <Navigate to="/mentor/apply" replace />;
  if (session === null) return <Navigate to="/login" replace />;
  if (app === null) return <Navigate to="/mentor/apply" replace />;
  if (!app) return null;

  const copy = COPY[app.status];
  const logOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <AuthLayout title={copy.title} sub={copy.text(app)}>
      <div className="card col gap-16" style={{ padding: 24 }}>
        <div className="row between"><span className="row gap-10 semibold"><Icon name={copy.icon} size={20} color="var(--teal)" />Mentor application</span><StatusChip status={app.status === 'Rejected' ? 'Declined' : app.status} /></div>
        <hr className="hr" />
        {[['Submitted', app.submitted], ['Role', app.headline], ['Field', app.field], ['Phone', app.phone], ['Documents', 'CV and cover letter']].map(([k, v]) => (
          <div key={k} className="row between gap-12 sm"><span className="muted">{k}</span><span className="medium truncate">{v}</span></div>
        ))}
        {app.note && app.status !== 'Pending' && <div className="col gap-6"><span className="xs muted">Note from the M3allim team</span><p className="sm">{app.note}</p></div>}
      </div>
      <Button variant="outline" size="lg" icon="LogOut" onClick={logOut}>Log out</Button>
    </AuthLayout>
  );
}
