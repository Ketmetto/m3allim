// Support tickets: students and mentors (even banned ones, to appeal) write to the admin team,
// and any admin can answer. Each ticket is a small chat thread.
import { supabase, must, listen } from './supabase.js';

const TICKET_FIELDS = '*, user:profiles!support_tickets_user_id_fkey(id, full_name, avatar_url, role)';

export const openTicket = ({ subject, category, body }) =>
  supabase.rpc('open_support_ticket', { p_subject: subject, p_category: category, p_body: body }).then(must);

export const listMyTickets = (userId) =>
  supabase.from('support_tickets').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).then(must);

export const listAllTickets = () => supabase.from('support_tickets').select(TICKET_FIELDS).order('updated_at', { ascending: false }).then(must);

export const listTicketMessages = (ticketId) =>
  supabase.from('support_messages').select('*, sender:profiles!support_messages_sender_id_fkey(id, full_name, avatar_url)').eq('ticket_id', ticketId).order('created_at').then(must);

export const replyToTicket = (ticketId, senderId, body) =>
  supabase.from('support_messages').insert({ ticket_id: ticketId, sender_id: senderId, body }).then(must);

export const setTicketStatus = (ticketId, status) => supabase.from('support_tickets').update({ status }).eq('id', ticketId).then(must);

export const onTicketMessage = (ticketId, callback) => listen('ticket', 'support_messages', `ticket_id=eq.${ticketId}`, callback, 'INSERT');

export const countOpenTickets = () =>
  supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'Open').then(({ count }) => count || 0);
