// Reports from students and mentors (admins). Resolve, dismiss, ban the reported account, or message either side.
// The reported person never sees who reported them; the reporter is notified when the report is handled.
import { useState } from 'react';
import { AdminShell } from '../../components/layout';
import { BanDialog } from '../../components/moderation/BanDialog.jsx';
import { Avatar, Button, Card, DataTable, DetailList, Field, FormError, Loading, Person, StatusChip, Tabs, Textarea } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useLive } from '../../context/LiveContext.jsx';
import { decideReport, listReports } from '../../services/reports.js';
import { fmtDateTime } from '../../utils/time.js';
import { friendlyError } from '../../utils/format.js';

const roleLabel = (p) => (p?.role === 'mentor' ? 'Mentor' : 'Student');
const isBanned = (p) => p?.banned_at && (!p.banned_until || new Date(p.banned_until) > new Date());

export default function Reports() {
  const { refreshWaiting } = useLive();
  const { data: list, error: loadError, reload } = useAsync(() => listReports(), []);
  const [tab, setTab] = useState('Open');
  const [selectedId, setSelectedId] = useState();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [banning, setBanning] = useState(false);

  const all = list || [];
  const rows = all.filter((r) => r.status === tab);
  const selected = rows.find((r) => r.id === selectedId) || rows[0];
  const previous = selected ? all.filter((r) => r.reported_id === selected.reported_id && r.id !== selected.id).length : 0;

  const decide = async (status, extraNote) => {
    setBusy(true); setError('');
    try {
      await decideReport(selected.id, status, [note.trim(), extraNote].filter(Boolean).join(' · '));
      await reload();
      refreshWaiting();
      setNote(''); setSelectedId(undefined);
    } catch (e) {
      setError(friendlyError(e));
    }
    setBusy(false);
  };

  return (
    <AdminShell title="Reports" sub="Reports from students and mentors. The reported person never sees who reported them.">
      <Tabs items={['Open', 'Resolved', 'Dismissed'].map((s) => ({ id: s, label: `${s} (${all.filter((r) => r.status === s).length})` }))} active={tab} onChange={(t) => { setTab(t); setSelectedId(undefined); }} />
      {loadError && <p className="error" role="alert">{loadError}</p>}
      <div className="split-main-panel">
        <Card pad={0} className="table-card">
          {!list ? <Loading text="Loading reports…" /> : rows.length ? (
            <DataTable columns={[
              { key: 'reported', label: 'REPORTED', render: (r) => <Person name={r.reported?.full_name || 'Deleted account'} sub={roleLabel(r.reported)} src={r.reported?.avatar_url} /> },
              { key: 'reason', label: 'REASON', width: 170 },
              { key: 'created_at', label: 'FILED', width: 130, render: (r) => fmtDateTime(r.created_at) },
            ]} rows={rows} selectedId={selected?.id} onRowClick={(r) => { setSelectedId(r.id); setNote(''); setError(''); }} />
          ) : <div className="empty muted">No {tab.toLowerCase()} reports.</div>}
        </Card>
        {selected && (
          <Card pad={28} className="col gap-20 panel">
            <div className="row between"><h2 className="h3">Report #{selected.id}</h2><StatusChip status={selected.status} /></div>
            <div className="row gap-14">
              <Avatar name={selected.reported?.full_name || '?'} src={selected.reported?.avatar_url} size={56} />
              <div className="col gap-4 min0"><span className="h3">{selected.reported?.full_name}</span><span className="sm muted">{roleLabel(selected.reported)} · reported for “{selected.reason}”</span>{isBanned(selected.reported) && <StatusChip status="Banned" />}</div>
            </div>
            <DetailList rows={[
              ['Reported by', `${selected.reporter?.full_name || 'Deleted account'} (${roleLabel(selected.reporter).toLowerCase()})`],
              ['Filed', fmtDateTime(selected.created_at)],
              ['Session', selected.session_id ? `#${selected.session_id}` : null],
              ['Other reports about them', String(previous)],
            ]} />
            <div className="col gap-6"><span className="xs muted">What happened</span><p className="quote-box">{selected.details || 'No details given.'}</p></div>
            <div className="row gap-8 wrap">
              <Button variant="ghost-border" size="sm" icon="MessageCircle" to={`/messages?with=${selected.reported_id}`}>Message reported</Button>
              <Button variant="ghost-border" size="sm" icon="MessageCircle" to={`/messages?with=${selected.reporter_id}`}>Message reporter</Button>
            </div>
            {selected.status === 'Open' ? (
              <>
                <Field label="Internal note" hint="Saved with the report and in the audit log."><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you did, e.g. warned the user by message" /></Field>
                <FormError>{error}</FormError>
                {!isBanned(selected.reported) && <Button variant="danger" icon="Ban" disabled={busy} onClick={() => setBanning(true)}>Ban {roleLabel(selected.reported).toLowerCase()} and resolve</Button>}
                <div className="row gap-12"><Button className="fill" icon="Check" disabled={busy} onClick={() => decide('Resolved')}>Mark resolved</Button><Button variant="outline" disabled={busy} onClick={() => decide('Dismissed')}>Dismiss</Button></div>
              </>
            ) : selected.admin_note && <div className="col gap-6"><span className="xs muted">Note</span><p className="sm">{selected.admin_note}</p></div>}
          </Card>
        )}
      </div>
      {banning && selected && (
        <BanDialog
          person={{ id: selected.reported_id, name: selected.reported?.full_name || 'this account' }}
          defaultReason={selected.reason}
          onClose={() => setBanning(false)}
          onDone={() => decide('Resolved', 'Account banned')}
        />
      )}
    </AdminShell>
  );
}
