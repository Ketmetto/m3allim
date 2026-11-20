// The bell icon. Notifications are created by the database (triggers in schema.sql) when something happens:
// a request, an acceptance, a new time, a review, an application decision, an announcement, a support reply…
import { supabase, must, listen } from './supabase.js';

export const listNotifications = (userId, limit = 50) =>
  supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit).then(must);

export const markNotificationRead = (id) =>
  supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null).then(must);

export const markAllNotificationsRead = (userId) =>
  supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null).then(must);

export const clearNotifications = (userId) => supabase.from('notifications').delete().eq('user_id', userId).then(must);

export const onNewNotification = (userId, callback) =>
  listen('notifications', 'notifications', `user_id=eq.${userId}`, ({ new: n }) => callback(n), 'INSERT');

/* Icon for each kind of notification. */
export const NOTIFICATION_ICONS = {
  request: 'CalendarPlus',
  session: 'Calendar',
  reschedule: 'CalendarClock',
  review: 'Star',
  application: 'BadgeCheck',
  announcement: 'Megaphone',
  report: 'Flag',
  support: 'LifeBuoy',
  account: 'ShieldCheck',
};
