import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Footer, RoleNav } from '../../components/layout.jsx';
import MentorCard from '../../components/MentorCard.jsx';
import { Button, Card, Icon, PageHeading, SearchBox } from '../../components/ui.jsx';
import { listMentors, useFavorites } from '../../data/mentorship.js';

/* Find a mentor, with the real approved mentors. */
export default function BrowseLive() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState();
  const [error, setError] = useState('');
  const [q, setQ] = useState(state?.q || '');
  const [field, setField] = useState(state?.field || '');
  const [savedOnly, setSavedOnly] = useState(false);
  const favorites = useFavorites();

  useEffect(() => {
    listMentors().then(setMentors).catch((e) => setError(e.message));
  }, []);

  const fields = useMemo(() => [...new Set((mentors || []).map((m) => m.field))].sort(), [mentors]);
  const results = (mentors || []).filter((m) =>
    `${m.name} ${m.headline} ${m.field} ${m.bio || ''}`.toLowerCase().includes(q.toLowerCase()) &&
    (!field || m.field === field) &&
    (!savedOnly || favorites.ids.has(m.id)));
  const toggleSave = (id) => (favorites.signedIn ? favorites.toggle(id) : navigate('/login'));

  return (
    <>
      <RoleNav />
      <div className="container page col gap-24">
        <PageHeading title="Find a mentor" sub="Every mentor is verified by our team. Every session is free." />
        <div className="row gap-12 wrap">
          <SearchBox value={q} onChange={setQ} placeholder="Search by name, role or topic" width={420} />
          <button className={`filter-chip ${!field ? 'active' : ''}`} onClick={() => setField('')}>All fields</button>
          {fields.map((f) => <button key={f} className={`filter-chip ${field === f ? 'active' : ''}`} onClick={() => setField(field === f ? '' : f)}>{f}</button>)}
          {favorites.signedIn && <button className={`filter-chip save-btn ${savedOnly ? 'active' : ''}`} onClick={() => setSavedOnly(!savedOnly)}><Icon name="Bookmark" size={14} fill={savedOnly ? 'var(--teal)' : 'none'} /> Saved ({favorites.ids.size})</button>}
        </div>
        {error && <p className="error" role="alert">Couldn’t load mentors: {error}</p>}
        {!mentors ? <p className="muted">Loading mentors…</p> : results.length ? (
          <>
            <p className="muted" aria-live="polite">{results.length} {results.length === 1 ? 'mentor' : 'mentors'}</p>
            <div className="grid-3 grid-3-tight">{results.map((m) => <MentorCard key={m.id} mentor={m} saved={favorites.ids.has(m.id)} onToggleSave={toggleSave} />)}</div>
          </>
        ) : (
          <Card className="empty">
            <Icon name={savedOnly ? 'Bookmark' : 'Search'} size={28} color="var(--gray)" />
            <h3 className="h3">{mentors.length === 0 ? 'Our first mentors are being verified' : savedOnly ? 'No saved mentors yet' : 'No mentors match your search'}</h3>
            <p className="muted">{mentors.length === 0 ? 'Check back soon, or apply to become one of them.' : savedOnly ? 'Tap the bookmark on a mentor to save them here.' : 'Try another name, role or field.'}</p>
            {mentors.length === 0 ? <Button variant="outline" to="/signup">Become a mentor</Button> : <Button variant="outline" onClick={() => { setQ(''); setField(''); setSavedOnly(false); }}>Show all mentors</Button>}
          </Card>
        )}
      </div>
      <Footer />
    </>
  );
}
