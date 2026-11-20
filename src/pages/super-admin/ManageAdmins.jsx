// Manage admins (super admin only): add someone by email (they get admin access when they sign in with it),
// suspend or restore them, or remove them. Every change is written to the audit log by the database.
import { useState } from 'react';
import { AdminShell } from '../../components/layout';
import { Button, Card, Chip, DataTable, Field, FormError, FormNotice, Input, Loading, Person, StatusChip } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { addAdmin, listAdmins, removeAdmin, setAdminStatus } from '../../services/superAdmin.js';
import { fmtDate, timeAgo } from '../../utils/time.js';
import { friendlyError, isEmail } from '../../utils/format.js';

const POWERS = ['Verify mentors (ID, CV, cover letter)', 'Handle reports and support requests', 'Chat with students and mentors', 'Ban and unban accounts', 'Send announcements'];

export default function ManageAdmins() {
  const { account } = useAuth();
  const { data: team, reload } = useAsync(() => listAdmins(), []);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [removing, setRemoving] = useState(null);

  const run = async (action, message) => {
    setBusy(true); setError(''); setNotice('');
    let ok = false;
    try {
      await action();
      await reload();
      setNotice(message);
      ok = true;
    } catch (e) {
      setError(friendlyError(e) === 'That already exists.' ? 'That email is already an admin.' : friendlyError(e));
    }
    setBusy(false);
    return ok;
  };

  const add = async () => {
    if (!isEmail(email)) return setError('Enter a valid email address, for example name@m3allim.com.');
    const ok = await run(() => addAdmin(email, name.trim(), account.id), `${email.trim().toLowerCase()} is now an admin. They get access the next time they sign in with that email.`);
    if (ok) { setEmail(''); setName(''); }
  };

  const cols = [
    { key: 'email', label: 'ADMIN', render: (a) => <Person name={a.full_name || a.email} sub={a.email} src={a.avatar_url} /> },
    { key: 'role', label: 'ROLE & STATUS', width: 150, render: (a) => <div className="col gap-6 start"><Chip kind={a.role === 'Super admin' ? 'gold' : 'teal'}>{a.role}</Chip><StatusChip status={a.has_account ? a.status : 'No account yet'} /></div> },
    { key: 'last', label: 'LAST SIGN-IN', width: 120, render: (a) => <span className="xs muted">{a.last_sign_in_at ? timeAgo(a.last_sign_in_at) : '–'}{a.added_at ? <><br />added {fmtDate(a.added_at)}</> : ''}</span> },
    { key: 'actions', label: 'ACTIONS', width: 150, render: (a) => a.role === 'Super admin' ? <span className="xs muted">Owner</span> : removing === a.email ? (
      <div className="row gap-8"><Button size="sm" variant="danger" disabled={busy} onClick={() => run(() => removeAdmin(a.email), `${a.email} was removed.`).then(() => setRemoving(null))}>Remove</Button><button type="button" className="link" onClick={() => setRemoving(null)}>Keep</button></div>
    ) : (
      <div className="row gap-12">
        <button type="button" className="link" disabled={busy} onClick={() => run(() => setAdminStatus(a.email, a.status === 'Suspended' ? 'Active' : 'Suspended'), `${a.email} was ${a.status === 'Suspended' ? 'restored' : 'suspended'}.`)}>{a.status === 'Suspended' ? 'Restore' : 'Suspend'}</button>
        <button type="button" className="link danger" onClick={() => setRemoving(a.email)}>Remove</button>
      </div>
    ) },
  ];

  return (
    <AdminShell title="Manage admins" sub="Add, suspend and remove the people who moderate M3allim">
      <FormNotice>{notice}</FormNotice>
      <div className="split-main-panel">
        <Card pad={0} className="table-card">{!team ? <Loading /> : <DataTable columns={cols} rows={team} rowKey="email" />}</Card>
        <Card pad={28} className="col gap-18 panel">
          <div className="col gap-4"><h2 className="h3">Add an admin</h2><p className="sm muted">They can use an existing M3allim account or sign up with this email. Admin access starts at their next sign-in.</p></div>
          <Field label="Email address"><Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="name@m3allim.com" /></Field>
          <Field label="Name" hint="Optional, shown until they sign in."><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rana Khalil" /></Field>
          <div className="col gap-8">
            <span className="field-label">Admins can</span>
            {POWERS.map((p) => <span key={p} className="row gap-8 sm"><span className="chip-dot text-teal" />{p}</span>)}
            <span className="xs muted">Only you can manage admins, change platform settings, see system health and export data.</span>
          </div>
          <FormError>{error}</FormError>
          <Button variant="dark" size="lg" icon="UserPlus" disabled={busy} onClick={add}>Add admin</Button>
        </Card>
      </div>
    </AdminShell>
  );
}
