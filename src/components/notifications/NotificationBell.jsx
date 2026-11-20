// Bell icon with the unread count; opens the latest notifications. The full list is on /notifications.
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown, EmptyState, Icon } from '../ui';
import { useLive } from '../../context/LiveContext.jsx';
import { NotificationItem } from './NotificationItem.jsx';

export function NotificationBell({ light = false }) {
  const { notifications, unreadNotifications: unread, markRead, markAllRead } = useLive();
  const navigate = useNavigate();
  return (
    <Dropdown
      width={360}
      trigger={(open, toggle) => (
        <button type="button" className={`icon-circle ${light ? 'on-dark' : ''}`} aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-expanded={open} onClick={toggle}>
          <Icon name="Bell" size={18} />
          {unread > 0 && <span className="tab-badge">{unread > 9 ? '9+' : unread}</span>}
        </button>
      )}
    >
      {(close) => (
        <div className="col">
          <div className="row between dropdown-head">
            <span className="semibold">Notifications</span>
            {unread > 0 && <button type="button" className="link" onClick={markAllRead}>Mark all as read</button>}
          </div>
          {notifications.length === 0 ? (
            <EmptyState icon="BellOff" text="You’re all caught up." />
          ) : (
            <div className="notif-list">
              {notifications.slice(0, 8).map((n) => (
                <NotificationItem key={n.id} n={n} onOpen={() => { markRead(n.id); close(); if (n.link) navigate(n.link); }} />
              ))}
            </div>
          )}
          <Link to="/notifications" className="dropdown-foot" onClick={close}>See all notifications</Link>
        </div>
      )}
    </Dropdown>
  );
}
