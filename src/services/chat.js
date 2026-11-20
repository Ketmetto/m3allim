// One-to-one chat between students, mentors and admins (rules: can_message in schema.sql).
import { supabase, must, listen } from './supabase.js';

export const sendMessage = (senderId, recipientId, body) =>
  supabase.from('messages').insert({ sender_id: senderId, recipient_id: recipientId, body }).select().single().then(must);

export const markConversationRead = (userId, otherId) =>
  supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('recipient_id', userId).eq('sender_id', otherId).is('read_at', null).then(must);

export const listMyMessages = (userId) =>
  supabase.from('messages').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at').then(must);

/* Calls back with every new or updated message sent to or by this person. */
export function onMyMessages(userId, callback) {
  const stopIn = listen('messages-in', 'messages', `recipient_id=eq.${userId}`, ({ new: m }) => callback(m));
  const stopOut = listen('messages-out', 'messages', `sender_id=eq.${userId}`, ({ new: m }) => callback(m));
  return () => { stopIn(); stopOut(); };
}

export const countUnreadMessages = (userId) =>
  supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', userId).is('read_at', null).then(({ count }) => count || 0);
