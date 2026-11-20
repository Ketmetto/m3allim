// Loads data once (and again when `deps` change), with loading and error states.
//   const { data, error, loading, reload } = useAsync(() => listMentors(), []);
import { useCallback, useEffect, useRef, useState } from 'react';
import { friendlyError } from '../utils/format.js';

export function useAsync(load, deps = []) {
  const [state, setState] = useState({ data: undefined, error: '', loading: true });
  const latest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    const call = ++latest.current;
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await load();
      if (call === latest.current) setState({ data, error: '', loading: false });
      return data;
    } catch (e) {
      if (call === latest.current) setState((s) => ({ ...s, error: friendlyError(e), loading: false }));
      return undefined;
    }
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  const setData = useCallback((next) => setState((s) => ({ ...s, data: typeof next === 'function' ? next(s.data) : next })), []);
  return { ...state, reload: run, setData };
}
