// All of the signed-in person's chat messages, kept up to date live.
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listMyMessages, onMyMessages } from '../services/chat.js';

const upsert = (all, m) => [...all.filter((x) => x.id !== m.id), m].sort((a, b) => a.created_at.localeCompare(b.created_at));

export function useMessages() {
  const { account } = useAuth();
  const userId = account?.id;
  const [messages, setMessages] = useState();

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    listMyMessages(userId).then((m) => alive && setMessages(m)).catch(() => alive && setMessages([]));
    const stop = onMyMessages(userId, (m) => setMessages((all) => (all ? upsert(all, m) : all)));
    return () => { alive = false; stop(); };
  }, [userId]);

  const add = useCallback((m) => setMessages((all) => upsert(all || [], m)), []);
  return { messages, userId, add };
}
