// Mentors the student bookmarked.
import { SiteLayout } from '../../components/layout';
import MentorCard from '../../components/mentors/MentorCard.jsx';
import { Button, Card, EmptyState, Loading, PageHeading } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useFavorites } from '../../hooks/useFavorites.js';
import { listMentors } from '../../services/mentors.js';

export default function SavedMentors() {
  const { data: mentors } = useAsync(() => listMentors(), []);
  const favorites = useFavorites();
  const saved = (mentors || []).filter((m) => favorites.ids.has(m.id));
  return (
    <SiteLayout>
      <PageHeading title="Saved mentors" sub="Your shortlist. Request a session when you’re ready."><Button to="/mentors" variant="outline" icon="Search">Find more</Button></PageHeading>
      {!mentors ? <Loading /> : saved.length === 0 ? (
        <Card><EmptyState icon="Bookmark" title="No saved mentors yet" text="Tap the bookmark on a mentor’s card or profile to save them here."><Button to="/mentors">Browse mentors</Button></EmptyState></Card>
      ) : (
        <div className="grid-3 grid-3-tight">{saved.map((m) => <MentorCard key={m.id} mentor={m} saved onToggleSave={favorites.toggle} />)}</div>
      )}
    </SiteLayout>
  );
}
