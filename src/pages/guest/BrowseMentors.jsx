// Find a mentor (everyone). Students can also save mentors and filter to their saved ones.
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SiteLayout } from '../../components/layout';
import MentorCard from '../../components/mentors/MentorCard.jsx';
import { Button, Card, EmptyState, Icon, Loading, PageHeading, SearchBox } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useFavorites } from '../../hooks/useFavorites.js';
import { listMentors } from '../../services/mentors.js';

export default function BrowseMentors() {
  const { state } = useLocation();
  const { data: mentors, error } = useAsync(() => listMentors(), []);
  const [q, setQ] = useState(state?.q || '');
  const [field, setField] = useState(state?.field || '');
  const [language, setLanguage] = useState('');
  const [savedOnly, setSavedOnly] = useState(Boolean(state?.saved));
  const favorites = useFavorites();

  const all = mentors || [];
  const fields = useMemo(() => [...new Set(all.map((m) => m.field))].sort(), [all]);
  const languages = useMemo(() => [...new Set(all.flatMap((m) => m.languages))].sort(), [all]);
  const results = all.filter((m) =>
    `${m.name} ${m.headline} ${m.field} ${m.bio || ''} ${m.topics.join(' ')}`.toLowerCase().includes(q.toLowerCase()) &&
    (!field || m.field === field) &&
    (!language || m.languages.includes(language)) &&
    (!savedOnly || favorites.ids.has(m.id)));
  const reset = () => { setQ(''); setField(''); setLanguage(''); setSavedOnly(false); };

  return (
    <SiteLayout footer>
      <PageHeading title="Find a mentor" sub="Every mentor is verified by our team. Every session is free." />
      <div className="row gap-12 wrap">
        <SearchBox value={q} onChange={setQ} placeholder="Search by name, role or topic" width={420} />
        <button type="button" className={`filter-chip ${!field ? 'active' : ''}`} onClick={() => setField('')}>All fields</button>
        {fields.map((f) => <button type="button" key={f} className={`filter-chip ${field === f ? 'active' : ''}`} onClick={() => setField(field === f ? '' : f)}>{f}</button>)}
        {favorites.canSave && (
          <button type="button" className={`filter-chip save-btn ${savedOnly ? 'active' : ''}`} onClick={() => setSavedOnly(!savedOnly)}>
            <Icon name="Bookmark" size={14} fill={savedOnly ? 'var(--teal)' : 'none'} /> Saved ({favorites.ids.size})
          </button>
        )}
      </div>
      {languages.length > 1 && (
        <div className="row gap-8 wrap">
          <span className="sm muted">Language:</span>
          {languages.map((l) => <button type="button" key={l} className={`filter-chip small ${language === l ? 'active' : ''}`} onClick={() => setLanguage(language === l ? '' : l)}>{l}</button>)}
        </div>
      )}
      {error && <p className="error" role="alert">Couldn’t load mentors: {error}</p>}
      {!mentors ? <Loading text="Loading mentors…" /> : results.length ? (
        <>
          <p className="muted" aria-live="polite">{results.length} {results.length === 1 ? 'mentor' : 'mentors'}</p>
          <div className="grid-3 grid-3-tight">
            {results.map((m) => <MentorCard key={m.id} mentor={m} saved={favorites.ids.has(m.id)} onToggleSave={favorites.canSave ? favorites.toggle : undefined} />)}
          </div>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={savedOnly ? 'Bookmark' : 'Search'}
            title={all.length === 0 ? 'Our first mentors are being verified' : savedOnly ? 'No saved mentors yet' : 'No mentors match your search'}
            text={all.length === 0 ? 'Check back soon, or apply to become one of them.' : savedOnly ? 'Tap the bookmark on a mentor to save them here.' : 'Try another name, role, field or language.'}
          >
            {all.length === 0 ? <Button variant="outline" to="/signup">Become a mentor</Button> : <Button variant="outline" onClick={reset}>Show all mentors</Button>}
          </EmptyState>
        </Card>
      )}
    </SiteLayout>
  );
}
