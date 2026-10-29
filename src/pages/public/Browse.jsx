import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicNav, Footer } from '../../components/layout.jsx';
import MentorCard from '../../components/MentorCard.jsx';
import { Button, Card, Checkbox, Icon, PageHeading, SearchBox } from '../../components/ui.jsx';
import { fields, languages, mentors } from '../../data/mock.js';

const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function Browse() {
  const { state } = useLocation();
  const [q, setQ] = useState(state?.q || '');
  const [selFields, setSelFields] = useState(state?.field ? [state.field] : []);
  const [selLangs, setSelLangs] = useState([]);
  const [minRating, setMinRating] = useState(0);

  const results = useMemo(
    () =>
      mentors.filter((m) => {
        const text = `${m.name} ${m.headline} ${m.tags.join(' ')}`.toLowerCase();
        return (
          text.includes(q.toLowerCase()) &&
          (!selFields.length || selFields.includes(m.field)) &&
          (!selLangs.length || selLangs.some((l) => m.languages.includes(l))) &&
          m.rating >= minRating
        );
      }),
    [q, selFields, selLangs, minRating]
  );

  const reset = () => { setQ(''); setSelFields([]); setSelLangs([]); setMinRating(0); };

  return (
    <>
      <PublicNav />
      <div className="container page">
        <PageHeading title="Find a mentor" sub="Every mentor is verified. Every session is free." />
        <div className="row gap-12 wrap" style={{ marginTop: 24 }}>
          <SearchBox value={q} onChange={setQ} placeholder="Search by name, topic or field" width={420} />
          {fields.map((f) => (
            <button key={f} className={`filter-chip ${selFields.includes(f) ? 'active' : ''}`} onClick={() => setSelFields(toggle(selFields, f))}>{f}</button>
          ))}
        </div>

        <div className="browse-layout">
          <Card pad={24} className="col gap-24 filters">
            <div className="row between"><h2 className="h3">Filters</h2><button className="link" onClick={reset}>Reset</button></div>
            <div className="col gap-12"><h3 className="semibold">Field</h3>{fields.map((f) => <Checkbox key={f} checked={selFields.includes(f)} onChange={() => setSelFields(toggle(selFields, f))}>{f}</Checkbox>)}</div>
            <div className="col gap-12"><h3 className="semibold">Language</h3>{languages.map((l) => <Checkbox key={l} checked={selLangs.includes(l)} onChange={() => setSelLangs(toggle(selLangs, l))}>{l}</Checkbox>)}</div>
            <div className="col gap-12">
              <h3 className="semibold">Minimum rating</h3>
              {[0, 4, 4.5, 4.8].map((r) => (
                <label key={r} className="radio"><input type="radio" name="rating" checked={minRating === r} onChange={() => setMinRating(r)} /><span className="radio-dot" /><span>{r === 0 ? 'Any rating' : `${r}+ stars`}</span></label>
              ))}
            </div>
          </Card>

          <div className="col gap-20">
            <p className="muted" aria-live="polite">{results.length} {results.length === 1 ? 'mentor' : 'mentors'} found</p>
            {results.length ? (
              <div className="grid-3 grid-3-tight">{results.map((m) => <MentorCard key={m.id} mentor={m} />)}</div>
            ) : (
              <Card className="center col gap-12" pad={48}>
                <Icon name="Search" size={28} color="var(--gray)" />
                <h3 className="h3">No mentors match those filters</h3>
                <p className="muted">Try removing a filter or searching for a different topic.</p>
                <div><Button variant="outline" onClick={reset}>Reset filters</Button></div>
              </Card>
            )}
            <div className="row gap-8 pagination"><button className="page-btn" aria-label="Previous"><Icon name="ChevronLeft" size={16} /></button><button className="page-btn active">1</button><button className="page-btn">2</button><button className="page-btn">3</button><button className="page-btn" aria-label="Next"><Icon name="ChevronRight" size={16} /></button></div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
