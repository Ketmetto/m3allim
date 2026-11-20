// Every notification for the signed-in person: requests, confirmations, new times, reviews, announcements…
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleLayout } from '../../components/layout';
import { NotificationItem } from '../../components/notifications/NotificationItem.jsx';
import { Button, Card, EmptyState, Tabs } from '../../components/ui';
import { useLive } from '../../context/LiveContext.jsx';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadNotifications, markRead, markAllRead, clearAll } = useLive();
  const [tab, setTab] = useState('all');
  const list = notifications.filter((n) => tab === 'all' || (tab === 'unread' ? !n.read_at : n.kind === 'announcement'));
  return (
    <RoleLayout
      title="Notifications"
      sub="Updates about your sessions, account and announcements from the M3allim team."
      actions={<>
        <Button variant="outline" size="sm" icon="CheckCheck" disabled={!unreadNotifications} onClick={markAllRead}>Mark all as read</Button>
        <Button variant="ghost-border" size="sm" icon="Trash2" disabled={!notifications.length} onClick={clearAll}>Clear all</Button>
      </>}
    >
      <Tabs items={[{ id: 'all', label: `All (${notifications.length})` }, { id: 'unread', label: `Unread (${unreadNotifications})` }, { id: 'announcement', label: 'Announcements' }]} active={tab} onChange={setTab} />
      <Card pad={0} className="list">
        {list.length === 0 ? <EmptyState icon="BellOff" title="Nothing here" text="You’re all caught up." /> : (
          <div className="notif-list big">{list.map((n) => <NotificationItem key={n.id} n={n} onOpen={() => { markRead(n.id); if (n.link && n.link !== '/notifications') navigate(n.link); }} />)}</div>
        )}
      </Card>
    </RoleLayout>
  );
}
