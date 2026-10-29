import { useState } from 'react';
import { AdminShell } from '../../components/layout.jsx';
import { Button, Card, Chip, DataTable, Person, SearchBox, Select, StatusChip } from '../../components/ui.jsx';
import { users as seed } from '../../data/mock.js';

export default function Users() {
  const [list, setList] = useState(seed);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('All roles');
  const [status, setStatus] = useState('All statuses');

  const flip = (id) => setList((all) => all.map((u) => (u.id === id ? { ...u, status: u.status === 'Banned' ? 'Active' : 'Banned' } : u)));
  const rows = list.filter(
    (u) =>
      `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()) &&
      (role === 'All roles' || u.role === role.replace(/s$/, '')) &&
      (status === 'All statuses' || u.status === status)
  );

  const cols = [
    { key: 'name', label: 'USER', render: (u) => <Person name={u.name} sub={u.email} src={u.photo} /> },
    { key: 'role', label: 'ROLE', width: 110, render: (u) => <Chip kind={u.role === 'Mentor' ? 'gold' : 'teal'}>{u.role}</Chip> },
    { key: 'joined', label: 'JOINED', width: 120 },
    { key: 'sessions', label: 'SESSIONS', width: 90 },
    { key: 'status', label: 'STATUS', width: 110, render: (u) => <StatusChip status={u.status} /> },
    { key: 'actions', label: 'ACTIONS', width: 150, render: (u) => (
      <div className="row gap-8">
        <Button variant="outline" size="sm">View</Button>
        {u.status === 'Banned' ? <Button variant="green-outline" size="sm" onClick={() => flip(u.id)}>Unban</Button> : <Button variant="danger-outline" size="sm" onClick={() => flip(u.id)}>Ban</Button>}
      </div>
    ) },
  ];

  return (
    <AdminShell title="Users" sub="Manage student and mentor accounts">
      <div className="row gap-12 wrap">
        <SearchBox value={q} onChange={setQ} placeholder="Search by name or email" width={380} />
        <Select value={role} onChange={setRole} options={['All roles', 'Students', 'Mentors']} aria-label="Role" />
        <Select value={status} onChange={setStatus} options={['All statuses', 'Active', 'Banned']} aria-label="Status" />
      </div>
      <Card pad={0} className="table-card">{rows.length ? <DataTable columns={cols} rows={rows} /> : <div className="center muted" style={{ padding: 48 }}>No users match your filters.</div>}</Card>
      <div className="row between sm"><span className="muted">Showing {rows.length} of 2,418 users</span><span className="link">Page 1 of 346</span></div>
    </AdminShell>
  );
}
