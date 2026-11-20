// My reviews: average rating, breakdown, and every review students left after a session.
import { SiteLayout } from '../../components/layout';
import { RatingSummary } from '../../components/mentors/ReviewList.jsx';
import { Button, Card, EmptyState, Loading, PageHeading, Stars } from '../../components/ui';
import { useMySessions } from '../../hooks/useMySessions.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDate } from '../../utils/time.js';

export default function MentorReviews() {
  const { account } = useAuth();
  const { sessions } = useMySessions('mentor');
  const rated = (sessions || []).filter((s) => s.rating).sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  return (
    <SiteLayout>
      <PageHeading title="My reviews" sub="What students said after their sessions with you. Reviews appear on your public page without names.">
        <Button variant="outline" icon="Eye" to={`/mentors/${account.id}`}>View public page</Button>
      </PageHeading>
      {!sessions ? <Loading /> : rated.length === 0 ? (
        <Card><EmptyState icon="Star" title="No reviews yet" text="After each session, the student is asked to rate it. Reviews show up here." /></Card>
      ) : (
        <div className="profile-layout">
          <Card className="col gap-20">
            {rated.map((s, i) => (
              <div key={s.id} className="col gap-6">
                {i > 0 && <hr className="hr" />}
                <div className="row gap-10 wrap"><Stars value={s.rating} /><span className="sm semibold">{s.topic}</span><span className="xs muted">{fmtDate(s.starts_at)}</span></div>
                {s.review ? <p>{s.review}</p> : <p className="sm muted">No written review.</p>}
              </div>
            ))}
          </Card>
          <aside className="col gap-16 sticky">
            <Card><RatingSummary reviews={rated} /></Card>
          </aside>
        </div>
      )}
    </SiteLayout>
  );
}
