// Support inbox (admins): every request from students and mentors. Any admin can reply; the person is notified.
import { useState } from 'react';
import { AdminShell } from '../../components/layout';
import { TicketThread } from '../../components/support/TicketThread.jsx';
import { Avatar, Button, Card, EmptyState, Loading, SearchBox, StatusChip, Tabs } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLive } from '../../context/LiveContext.jsx';
import { listAllTickets } from '../../services/support.js';
import { timeAgo } from '../../utils/time.js';

export default function SupportInbox() {
  const { account } = useAuth();
  const { refreshWaiting } = useLive();
  const { data: tickets, reload } = useAsync(() => listAllTickets(), []);
  const [tab, setTab] = useState('Open');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);

  const all = tickets || [];
  const rows = all.filter((t) => t.status === tab && `${t.subject} ${t.user?.full_name || ''} ${t.category}`.toLowerCase().includes(q.toLowerCase()));
  const open = all.find((t) => t.id === openId) || rows[0];
  const changed = () => { reload(); refreshWaiting(); };

  return (
    <AdminShell title="Support" sub="Help requests from students and mentors, including ban appeals" actions={<SearchBox value={q} onChange={setQ} placeholder="Search requests" width={240} />}>
      <Tabs items={['Open', 'Answered', 'Closed'].map((s) => ({ id: s, label: `${s} (${all.filter((t) => t.status === s).length})` }))} active={tab} onChange={(t) => { setTab(t); setOpenId(null); }} />
      <div className="support-layout">
        <Card pad={0} className="list">
          {!tickets ? <Loading /> : rows.length === 0 ? <EmptyState icon="Inbox" text={`No ${tab.toLowerCase()} requests.`} /> : rows.map((t) => (
            <button type="button" key={t.id} className={`conv ${t.id === open?.id ? 'active' : ''}`} onClick={() => setOpenId(t.id)}>
              <Avatar name={t.user?.full_name || '?'} src={t.user?.avatar_url} size={40} />
              <div className="col fill min0">
                <span className="semibold truncate">{t.subject}</span>
                <span className="xs muted truncate">{t.user?.full_name} · {t.category} · {timeAgo(t.updated_at)}</span>
              </div>
              {t.category === 'Ban appeal' ? <StatusChip status="Banned" label="Appeal" /> : null}
            </button>
          ))}
        </Card>
        {open ? (
          <div className="col gap-12">
            <TicketThread key={open.id} ticket={open} userId={account.id} viewer="admin" onChanged={changed} />
            <div className="row gap-8 wrap">
              <Button variant="ghost-border" size="sm" icon="MessageCircle" to={`/messages?with=${open.user_id}`}>Message {open.user?.full_name || 'them'} directly</Button>
              <Button variant="ghost-border" size="sm" icon="Users" to="/admin/users" state={{ q: open.user?.full_name }}>Find in users</Button>
            </div>
          </div>
        ) : <Card><EmptyState icon="LifeBuoy" title="Nothing selected" text="Pick a request on the left." /></Card>}
      </div>
    </AdminShell>
  );
}
