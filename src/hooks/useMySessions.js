// The signed-in person's sessions as 'student' or 'mentor', kept up to date live.
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listMySessions, onMySessionsChange } from '../services/sessions.js';
import { useAsync } from './useAsync.js';

export function useMySessions(role) {
  const { account } = useAuth();
  const userId = account?.id;
  const { data, error, reload } = useAsync(() => (userId ? listMySessions(role, userId) : new Promise(() => {})), [role, userId]);
  useEffect(() => (userId ? onMySessionsChange(role, userId, reload) : undefined), [role, userId, reload]);
  return { sessions: data, error, reload, userId };
}
