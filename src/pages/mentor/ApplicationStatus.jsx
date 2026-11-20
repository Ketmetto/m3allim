// Where a mentor applicant follows their application: under review, approved, or declined (with a way to apply again).
import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout';
import { PageLoader } from '../../components/guards/RequireRole.jsx';
import { Button, DetailList, Icon, Person, StatusChip } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { myApplication } from '../../services/applications.js';
import { ROLES } from '../../config/roles.js';

const COPY = {
  Pending: { icon: 'Hourglass', title: 'Your application is under review', text: (a) => `We’re checking your identity document, CV and cover letter. You’ll get a notification and an email at ${a.email}, usually within 48 hours.` },
  Approved: { icon: 'BadgeCheck', title: 'You’re an approved mentor', text: () => 'Welcome to M3allim. Build your profile and set your availability so students can book you.' },
  Rejected: { icon: 'CircleX', title: 'Your application wasn’t approved', text: () => 'Thank you for applying. Read the note below, update your application and send it again.' },
};

export default function ApplicationStatus() {
  const navigate = useNavigate();
  const { account, role, signOut, refresh } = useAuth();
  const { data: app } = useAsync(() => myApplication(account.id), [account.id]);
  // Approved since the account was loaded: reload it so the mentor pages open.
  useEffect(() => {
    if (app?.status === 'Approved' && role === ROLES.APPLICANT) refresh();
  }, [app?.status, role]); // eslint-disable-line react-hooks/exhaustive-deps

  if (role === ROLES.MENTOR) return <Navigate to="/mentor" replace />;
  if (app === undefined) return <PageLoader />;
  if (app === null) return <Navigate to="/mentor/apply" replace />;

  const copy = COPY[app.status];
  return (
    <AuthLayout title={copy.title} sub={copy.text(app)}>
      <div className="row between"><Person name={account.name} sub={account.email} src={account.avatar} size={48} /><Button variant="ghost" size="sm" to="/account">Edit profile</Button></div>
      <div className="card col gap-16" style={{ padding: 24 }}>
        <div className="row between"><span className="row gap-10 semibold"><Icon name={copy.icon} size={20} color="var(--teal)" />Mentor application</span><StatusChip status={app.status === 'Rejected' ? 'Declined' : app.status} /></div>
        <hr className="hr" />
        <DetailList rows={[['Submitted', app.submitted], ['Role', app.headline], ['Field', app.field], ['Identity', app.idType], ['Documents', 'ID, CV and cover letter']]} />
        {app.note && app.status !== 'Pending' && <div className="col gap-6"><span className="xs muted">Note from the M3allim team</span><p className="sm">{app.note}</p></div>}
      </div>
      {app.status === 'Approved' && <Button size="lg" iconAfter="ArrowRight" to="/mentor">Go to my mentor dashboard</Button>}
      {app.status === 'Rejected' && <Button size="lg" icon="PenLine" to="/mentor/apply">Update and apply again</Button>}
      <div className="row gap-12">
        <Button variant="outline" className="fill" icon="LifeBuoy" to="/support">Ask the team</Button>
        <Button variant="outline" className="fill" icon="LogOut" onClick={async () => { await signOut(); navigate('/'); }}>Log out</Button>
      </div>
    </AuthLayout>
  );
}
