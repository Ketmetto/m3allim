import { useState } from 'react';
import { AdminShell } from '../../components/layout.jsx';
import { Button, Card, Checkbox, DataTable, Field, Icon, Input, Person, Select, StatusChip, Chip } from '../../components/ui.jsx';
import { admins as seed } from '../../data/mock.js';

const PERMS = ['Verify mentors', 'Handle reports', 'Ban and unban users', 'Send announcements', 'View statistics'];

export default function ManageAdmins() {
  const [list, setList] = useState(seed);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Admin');
  const [perms, setPerms] = useState(['Verify mentors', 'Handle reports', 'Ban and unban users', 'View statistics']);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const invite = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address, for example name@m3allim.com.');
    const name = email.split('@')[0].split('.').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
    setList([...list, { id: Date.now(), name, email, role, status: 'Invited' }]);
    setMsg(`Invitation sent to ${email}.`); setEmail(''); setError('');
  };
  const remove = (id) => setList((all) => all.filter((a) => a.id !== id));
  const suspend = (id) => setList((all) => all.map((a) => (a.id === id ? { ...a, status: a.status === 'Suspended' ? 'Active' : 'Suspended' } : a)));

  const cols = [
    { key: 'name', label: 'ADMIN', render: (a) => <Person name={a.name} sub={a.email} /> },
    { key: 'status', label: 'ROLE & STATUS', width: 120, render: (a) => <div className="col gap-6 start"><Chip kind={a.role === 'Super admin' ? 'gold' : 'teal'}>{a.role}</Chip><StatusChip status={a.status} /></div> },
    { key: 'actions', label: 'ACTIONS', width: 120, render: (a) => a.role === 'Super admin' ? <span className="xs muted">Owner</span> : (
      <div className="row gap-12"><button className="link" onClick={() => suspend(a.id)}>{a.status === 'Suspended' ? 'Restore' : 'Suspend'}</button><button className="link text-red" onClick={() => remove(a.id)}>Remove</button></div>
    ) },
  ];

  return (
    <AdminShell kind="super" title="Manage admins" sub="Invite, edit and remove people who moderate M3allim" actions={<Button variant="dark" size="sm" icon="UserPlus" onClick={() => document.getElementById('invite-email')?.focus()}>Invite admin</Button>}>
      <div className="split-main-panel">
        <Card pad={0} className="table-card"><DataTable columns={cols} rows={list} /></Card>
        <Card pad={28} className="col gap-18 panel">
          <div className="col gap-4"><h2 className="h3">Invite admin</h2><p className="sm muted">They’ll receive an email to set up their account.</p></div>
          <Field label="Email address"><Input id="invite-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="name@m3allim.com" /></Field>
          <Field label="Role"><Select value={role} onChange={setRole} options={['Admin', 'Super admin']} /></Field>
          <h3 className="semibold">Permissions</h3>
          <div className="col gap-12">{PERMS.map((p) => <Checkbox key={p} checked={perms.includes(p)} onChange={(v) => setPerms(v ? [...perms, p] : perms.filter((x) => x !== p))}>{p}</Checkbox>)}</div>
          {error && <p className="error" role="alert">{error}</p>}
          {msg && <p className="toast" role="status"><Icon name="Check" size={16} /> {msg}</p>}
          <Button variant="dark" size="lg" icon="UserPlus" onClick={invite}>Send invite</Button>
          <p className="xs muted">Only super admins can add or remove admins. Every change is recorded in the audit log.</p>
        </Card>
      </div>
    </AdminShell>
  );
}
