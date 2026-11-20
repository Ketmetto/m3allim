// Saved mentors for the signed-in student. toggle() updates the screen at once and undoes it if saving fails.
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../config/roles.js';
import { listFavoriteIds, saveMentor, unsaveMentor } from '../services/mentors.js';

export function useFavorites() {
  const { account, role } = useAuth();
  const userId = account?.id;
  const canSave = role === ROLES.STUDENT;
  const [ids, setIds] = useState(new Set());

  useEffect(() => {
    if (!canSave) return;
    listFavoriteIds().then((list) => setIds(new Set(list))).catch(() => {});
  }, [canSave, userId]);

  const toggle = useCallback(async (mentorId) => {
    const saved = ids.has(mentorId);
    const flip = (on) => setIds((prev) => { const next = new Set(prev); on ? next.add(mentorId) : next.delete(mentorId); return next; });
    flip(!saved);
    try {
      await (saved ? unsaveMentor(userId, mentorId) : saveMentor(userId, mentorId));
    } catch {
      flip(saved);
    }
  }, [ids, userId]);

  return { ids, toggle, canSave };
}
