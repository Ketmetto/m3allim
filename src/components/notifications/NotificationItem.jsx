import { Icon } from '../ui';
import { NOTIFICATION_ICONS } from '../../services/notifications.js';
import { timeAgo } from '../../utils/time.js';

/* One notification row (bell dropdown and the notifications page). */
export function NotificationItem({ n, onOpen }) {
  return (
    <button type="button" className={`notif ${n.read_at ? '' : 'unread'}`} onClick={onOpen}>
      <span className={`icon-box ${n.kind === 'announcement' ? 'icon-box-gold' : ''}`}><Icon name={NOTIFICATION_ICONS[n.kind] || 'Bell'} size={17} /></span>
      <span className="col gap-2 fill min0">
        <span className="semibold sm">{n.title}</span>
        {n.body && <span className="sm muted clamp-2">{n.body}</span>}
        <span className="xs muted">{timeAgo(n.created_at)}</span>
      </span>
      {!n.read_at && <span className="unread-dot" aria-label="Unread" />}
    </button>
  );
}
