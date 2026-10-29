import { useState } from 'react';
import { AdminShell } from '../../components/layout.jsx';
import { Button, Card, Chip, DataTable, Field, Icon, Person, Select, StatusChip, Tabs } from '../../components/ui.jsx';
import { reports as seed } from '../../data/mock.js';

export default function Reports() {
  const [list, setList] = useState(seed);
  const [tab, setTab] = useState('Open');
  const [selectedId, setSelectedId] = useState(1045);
  const [duration, setDuration] = useState('7 days');
  const [toast, setToast] = useState('');

  const count = (s) => list.filter((r) => r.status === s).length;
  const tabs = [
    { id: 'Open', label: `Open (${count('Open')})` },
    { id: 'Under review', label: `Under review (${2 + count('Under review')})` },
    { id: 'Resolved', label: `Resolved (${31 + count('Resolved')})` },
  ];
  const rows = list.filter((r) => r.status === tab);
  const selected = list.find((r) => r.id === selectedId) || rows[0];

  const act = (status, message) => {
    setList((all) => all.map((r) => (r.id === selected.id ? { ...r, status } : r)));
    setToast(message);
    const next = list.find((r) => r.status === 'Open' && r.id !== selected.id);
    if (next) setSelectedId(next.id);
  };

  const cols = [
    { key: 'user', label: 'REPORTED USER', width: 190, render: (r) => <Person name={r.user} sub={r.role} size={36} /> },
    { key: 'reason', label: 'REASON' },
    { key: 'date', label: 'DATE', width: 110 },
    { key: 'priority', label: 'PRIORITY', width: 100, render: (r) => <StatusChip status={r.priority} /> },
  ];

  return (
    <AdminShell title="Reports" sub="Review reports from students and mentors and take action">
      <Tabs items={tabs} active={tab} onChange={setTab} />
      {toast && <div className="toast" role="status"><Icon name="Check" size={16} /> {toast}<button className="link" onClick={() => setToast('')}>Dismiss</button></div>}
      <div className="split-main-panel">
        <Card pad={0} className="table-card">
          {rows.length ? <DataTable columns={cols} rows={rows} selectedId={selected?.id} onRowClick={(r) => setSelectedId(r.id)} /> : <div className="center muted" style={{ padding: 48 }}>No reports in this tab.</div>}
        </Card>

        {selected && (
          <Card pad={28} className="col gap-18 panel">
            <div className="row between"><h2 className="h3">Report #{selected.id}</h2><Chip kind={selected.priority === 'High' ? 'red' : selected.priority === 'Medium' ? 'gold' : 'gray'}>{selected.priority} priority</Chip></div>
            <Person name={selected.user} sub={`${selected.role} · joined ${selected.joined} · ${selected.previous} previous reports`} size={48} />
            <hr className="hr" />
            <div className="col gap-10 sm">
              <div className="row between"><span className="muted">Reason</span><span className="medium">{selected.reason}</span></div>
              <div className="row between"><span className="muted">Reported by</span><span className="medium">{selected.by}</span></div>
              <div className="row between"><span className="muted">Submitted</span><span className="medium">{selected.date}</span></div>
            </div>
            <h3 className="semibold">Description</h3>
            <p className="quote-box">“{selected.description}”</p>
            <div className="doc-row"><Icon name="FileText" size={18} color="var(--teal)" /><div className="col fill"><span className="sm medium">Evidence</span><span className="xs muted">{selected.evidence}</span></div><button className="link">View</button></div>
            <Field label="Ban duration (if applicable)"><Select value={duration} onChange={setDuration} options={['24 hours', '7 days', '30 days', 'Permanent']} /></Field>
            {selected.status === 'Open' ? (
              <>
                <Button variant="danger" size="lg" icon="Ban" onClick={() => act('Resolved', `${selected.user} banned for ${duration.toLowerCase()}.`)}>Ban user</Button>
                <div className="row gap-12"><Button variant="outline" className="fill" onClick={() => act('Resolved', `Warning sent to ${selected.user}.`)}>Send warning</Button><Button variant="ghost-border" className="fill" onClick={() => act('Resolved', `Report #${selected.id} dismissed.`)}>Dismiss</Button></div>
              </>
            ) : <p className="sm muted center">This report is {selected.status.toLowerCase()}.</p>}
            <p className="xs muted center">Every action is recorded in the audit log.</p>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
