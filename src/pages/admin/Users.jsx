// Users & bans (admins): every account with its email and activity. Ban or unban, message, or open a mentor's page.
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminShell } from '../../components/layout';
import { BanDialog } from '../../components/moderation/BanDialog.jsx';
import { Button, Card, Chip, DataTable, FormError, Loading, Person, SearchBox, Select, StatusChip } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { listUsers, unbanUser } from '../../services/admin.js';
import { fmtDate, fmtDateTime } from '../../utils/time.js';
import { friendlyError } from '../../utils/format.js';

const ACCOUNT = { student: ['Student', 'teal'], mentor: ['Mentor', 'gold'], applicant: ['Applicant', 'gray'], admin: ['Admin', 'gold'], new: ['New', 'gray'] };
const ROLE_FILTERS = ['All roles', 'Students', 'Mentors', 'Applicants', 'Admins'];
const FILTER_TO_ACCOUNT = { Students: 'student', Mentors: 'mentor', Applicants: 'applicant', Admins: 'admin' };

export default function Users() {
  const { state } = useLocation();
  const { data: users, error: loadError, reload } = useAsync(() => listUsers(), []);
  const [q, setQ] = useState(state?.q || '');
  const [role, setRole] = useState('All roles');
  const [status, setStatus] = useState('All statuses');
  const [banning, setBanning] = useState(null);
  const [error, setError] = useState('');

  const rows = (users || []).filter((u) =>
    `${u.full_name || ''} ${u.email}`.toLowerCase().includes(q.toLowerCase()) &&
    (role === 'All roles' || u.account === FILTER_TO_ACCOUNT[role]) &&
    (status === 'All statuses' || (status === 'Banned') === u.banned));

  const unban = async (u) => {
    setError('');
    try {
      await unbanUser(u.id);
      reload();
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const cols = [
    { key: 'name', label: 'USER', render: (u) => <Person name={u.full_name || u.email} sub={u.email} src={u.avatar_url} /> },
    { key: 'account', label: 'ROLE', width: 110, render: (u) => <Chip kind={ACCOUNT[u.account]?.[1]}>{ACCOUNT[u.account]?.[0] || u.account}</Chip> },
    { key: 'created_at', label: 'JOINED', width: 110, render: (u) => fmtDate(u.created_at) },
    { key: 'sessions', label: 'SESSIONS', width: 80 },
    { key: 'reports', label: 'REPORTS', width: 75, render: (u) => (u.reports ? <span className="text-red semibold">{u.reports}</span> : 0) },
    { key: 'status', label: 'STATUS', width: 150, render: (u) => (u.banned
      ? <div className="col gap-2 start"><StatusChip status="Banned" /><span className="xs muted">{u.banned_until ? `until ${fmtDateTime(u.banned_until)}` : 'permanent'}</span></div>
      : <StatusChip status="Active" />) },
    { key: 'actions', label: 'ACTIONS', width: 200, render: (u) => u.account === 'admin' ? <span className="xs muted">Managed by the super admin</span> : (
      <div className="row gap-8">
        <Button variant="outline" size="sm" icon="MessageCircle" to={`/messages?with=${u.id}`} aria-label={`Message ${u.full_name}`} />
        {u.account === 'mentor' && <Button variant="outline" size="sm" icon="Eye" to={`/mentors/${u.id}`} aria-label="View mentor page" />}
        {u.banned
          ? <Button variant="green-outline" size="sm" onClick={() => unban(u)}>Unban</Button>
          : <Button variant="danger-outline" size="sm" onClick={() => setBanning(u)}>Ban</Button>}
      </div>
    ) },
  ];

  return (
    <AdminShell title="Users & bans" sub="Every student and mentor account. Bans take effect immediately.">
      <div className="row gap-12 wrap">
        <SearchBox value={q} onChange={setQ} placeholder="Search by name or email" width={380} />
        <Select value={role} onChange={setRole} options={ROLE_FILTERS} aria-label="Role" />
        <Select value={status} onChange={setStatus} options={['All statuses', 'Active', 'Banned']} aria-label="Status" />
      </div>
      {(loadError || error) && <FormError>{loadError || error}</FormError>}
      <Card pad={0} className="table-card">
        {!users ? <Loading text="Loading users…" /> : rows.length ? <DataTable columns={cols} rows={rows} /> : <div className="empty muted">No users match your filters.</div>}
      </Card>
      {users && <p className="sm muted">Showing {rows.length} of {users.length} accounts</p>}
      {banning && <BanDialog person={{ id: banning.id, name: banning.full_name || banning.email }} onClose={() => setBanning(null)} onDone={reload} />}
    </AdminShell>
  );
}
