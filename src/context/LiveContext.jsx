// Live numbers for the signed-in person, shared by every menu so each is only fetched once:
//   - the notification feed (bell icon) and how many are unread
//   - unread chat messages
//   - for admins: applications, reports and support tickets waiting
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { clearNotifications, listNotifications, markAllNotificationsRead, markNotificationRead, onNewNotification } from '../services/notifications.js';
import { countUnreadMessages } from '../services/chat.js';
import { countPendingApplications } from '../services/applications.js';
import { countOpenReports } from '../services/reports.js';
import { countOpenTickets } from '../services/support.js';
import { listen } from '../services/supabase.js';

const EMPTY = { notifications: [], unreadNotifications: 0, unreadMessages: 0, waiting: { applications: 0, reports: 0, tickets: 0 } };
export const LiveContext = createContext({ ...EMPTY, refreshWaiting: () => {}, refreshMessages: () => {}, markRead: () => {}, markAllRead: () => {}, clearAll: () => {} });

export function LiveProvider({ children }) {
  const { account, isStaff, refresh } = useAuth();
  const userId = account?.id;
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [waiting, setWaiting] = useState(EMPTY.waiting);

  const refreshMessages = useCallback(() => {
    if (userId) countUnreadMessages(userId).then(setUnreadMessages).catch(() => {});
  }, [userId]);

  const refreshWaiting = useCallback(() => {
    if (!isStaff) return;
    Promise.all([countPendingApplications(), countOpenReports(), countOpenTickets()])
      .then(([applications, reports, tickets]) => setWaiting({ applications, reports, tickets }))
      .catch(() => {});
  }, [isStaff]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadMessages(0);
      return;
    }
    listNotifications(userId, 30).then(setNotifications).catch(() => {});
    refreshMessages();
    refreshWaiting();
    const stopNotes = onNewNotification(userId, (n) => {
      setNotifications((all) => [n, ...all.filter((x) => x.id !== n.id)].slice(0, 30));
      if (['application', 'report', 'support'].includes(n.kind)) refreshWaiting();
      // Approved as a mentor, made an admin, banned or unbanned: reload the role straight away.
      if (n.kind === 'account' || (n.kind === 'application' && !isStaff)) refresh();
    });
    const stopMessages = listen('unread', 'messages', `recipient_id=eq.${userId}`, refreshMessages);
    return () => { stopNotes(); stopMessages(); };
  }, [userId, refreshMessages, refreshWaiting]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({
    notifications,
    unreadNotifications: notifications.filter((n) => !n.read_at).length,
    unreadMessages,
    waiting,
    refreshWaiting,
    refreshMessages,
    markRead: async (id) => {
      setNotifications((all) => all.map((n) => (n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n)));
      await markNotificationRead(id).catch(() => {});
    },
    markAllRead: async () => {
      setNotifications((all) => all.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      await markAllNotificationsRead(userId).catch(() => {});
    },
    clearAll: async () => {
      setNotifications([]);
      await clearNotifications(userId).catch(() => {});
    },
  }), [notifications, unreadMessages, waiting, refreshWaiting, refreshMessages, userId]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export const useLive = () => useContext(LiveContext);

/* Number for a menu badge: 'messages' | 'notifications' | 'applications' | 'reports' | 'tickets' */
export function useBadge(name) {
  const live = useLive();
  if (!name) return 0;
  if (name === 'messages') return live.unreadMessages;
  if (name === 'notifications') return live.unreadNotifications;
  return live.waiting[name] || 0;
}
