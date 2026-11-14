import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PublicNav, Footer } from '../../components/layout.jsx';
import MentorCard from '../../components/MentorCard.jsx';
import { Avatar, Button, Icon, Select, Stars } from '../../components/ui.jsx';
import { fields, mentors as sampleMentors, reviews } from '../../data/mock.js';
import { hasBackend } from '../../lib/supabase.js';
import { listMentors } from '../../data/mentorship.js';

const fmt = (n) => n.toLocaleString('en-US');

/* Mentors for the home page: the real directory when Supabase is connected, the sample ones otherwise. */
function useHomeMentors() {
  const [list, setList] = useState(hasBackend ? null : sampleMentors);
  useEffect(() => {
    if (hasBackend) listMentors().then(setList).catch(() => setList([]));
  }, []);
  return list;
}

function statsFor(list) {
  if (!hasBackend) return [['186', 'Verified mentors'], ['2,418', 'Students and graduates'], ['742', 'Sessions this month'], ['6', 'Fields to explore']];
  const sum = (key) => (list || []).reduce((n, m) => n + m[key], 0);
  const show = (n) => (list ? fmt(n) : '–');
  return [
    [show(list?.length), 'Verified mentors'],
    [show(sum('sessions')), 'Sessions held'],
    [show(sum('reviews')), 'Reviews from students'],
    [show(new Set((list || []).map((m) => m.field).filter(Boolean)).size), 'Fields to explore'],
  ];
}

const STEPS = [
  { icon: 'Search', title: 'Find your mentor', text: 'Browse verified professionals by field, language and rating.' },
  { icon: 'Calendar', title: 'Send a request', text: 'Pick a time that suits you and tell your mentor what you want to work on.' },
  { icon: 'Video', title: 'Meet and grow', text: 'Join a one-to-one video session, then leave a review to help others.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [q, setQ] = useState('');
  const [field, setField] = useState('All fields');
  const all = useHomeMentors();
  // Best rated first; new mentors without reviews still show when there are few.
  const featured = [...(all || [])].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 3);

  useEffect(() => {
    if (state?.scroll) document.getElementById(state.scroll)?.scrollIntoView({ behavior: 'smooth' });
  }, [state]);

  const search = (e) => {
    e.preventDefault();
    navigate('/mentors', { state: { q, field: field === 'All fields' ? '' : field } });
  };

  return (
    <>
      <PublicNav />

      <section className="hero">
        <div className="container hero-grid">
          <div className="col gap-24">
            <h1 className="hero-title">Learn from people who have been where you want to go.</h1>
            <p className="hero-sub">M3allim connects students and graduates in Lebanon with verified professionals for free, one-to-one mentorship.</p>
            <form className="hero-search" onSubmit={search}>
              <span className="row gap-8 fill">
                <Icon name="Search" size={18} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or topic" aria-label="Search mentors" />
              </span>
              <Select value={field} onChange={setField} options={['All fields', ...fields]} aria-label="Field" />
              <Button size="md">Search</Button>
            </form>
            <div className="row gap-12">
              <Button to="/signup" size="lg">Get started</Button>
              <Button to="/mentors" size="lg" variant="outline">Browse mentors</Button>
            </div>
          </div>
          <div className="col gap-16 hero-stack">
            {featured.map((m) => (
              <div key={m.id} className="card row gap-16 hero-mini">
                <Avatar name={m.name} src={m.photo} size={56} />
                <div className="col fill">
                  <span className="semibold">{m.name}</span>
                  <span className="sm muted">{m.headline}</span>
                </div>
                {m.reviews > 0 && <span className="row gap-6 sm"><Stars value={m.rating} /> {m.rating.toFixed(1)}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tint">
        <div className="container">
          <h2 className="h2 center">Our community in numbers</h2>
          <div className="grid-4 metrics">
            {statsFor(all).map(([n, l]) => (
              <div key={l} className="col center gap-4"><span className="metric">{n}</span><span className="muted">{l}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container col gap-32">
          <div className="row between">
            <div className="col gap-6"><h2 className="h2">Featured mentors</h2><p className="muted">Highly rated professionals ready to help this week.</p></div>
            <Button to="/mentors" variant="outline">See all mentors</Button>
          </div>
          {all && featured.length === 0 ? (
            <p className="muted">Our first mentors are being verified. Check back soon.</p>
          ) : (
            <div className="grid-3">{featured.map((m) => <MentorCard key={m.id} mentor={m} canSave={!hasBackend} />)}</div>
          )}
        </div>
      </section>

      <section id="how" className="section section-white">
        <div className="container col gap-32">
          <h2 className="h2 center">How it works</h2>
          <div className="grid-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="col gap-12 step-card">
                <span className="icon-box big"><Icon name={s.icon} size={22} /></span>
                <h3 className="h3">{i + 1}. {s.title}</h3>
                <p className="muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container testimonial card">
          <span className="quote-mark" aria-hidden="true">“</span>
          <p className="quote">{reviews[0].text}</p>
          <div className="row gap-12">
            <Avatar name={reviews[0].name} src="/avatars/sarah.jpg" size={48} />
            <div className="col"><span className="semibold">{reviews[0].name}</span><span className="sm muted">{reviews[0].role}</span></div>
          </div>
        </div>
      </section>

      <section id="become" className="container section-banner-wrap">
        <div className="banner">
          <div className="col gap-8">
            <h2 className="banner-title">Been there? Help someone get there.</h2>
            <p className="banner-sub">Share your experience with the next generation. Apply in minutes, we verify every mentor.</p>
          </div>
          <Button variant="gold" size="lg" onClick={() => { window.location.href = 'mailto:hello@m3allim.com?subject=I want to become a mentor'; }}>Become a mentor</Button>
        </div>
      </section>

      <Footer />
    </>
  );
}
