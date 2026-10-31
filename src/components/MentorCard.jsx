import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Chip, Icon, Stars } from './ui.jsx';

/* saved / onToggleSave come from the real favorites; without them the bookmark is local (demo data). */
export default function MentorCard({ mentor, saved: savedProp, onToggleSave }) {
  const [savedLocal, setSaved] = useState(false);
  const saved = onToggleSave ? savedProp : savedLocal;
  return (
    <article className="card mentor-card">
      <div className="row between">
        <Avatar name={mentor.name} src={mentor.photo} size={72} />
        <button className="icon-circle sm-circle" aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save mentor'} onClick={() => (onToggleSave ? onToggleSave(mentor.id) : setSaved(!saved))}>
          <Icon name="Bookmark" size={16} color={saved ? 'var(--teal)' : undefined} fill={saved ? 'var(--teal)' : 'none'} />
        </button>
      </div>
      <div className="col gap-4">
        <div className="row gap-8">
          <h3 className="h3">{mentor.name}</h3>
          <Icon name="BadgeCheck" size={16} color="var(--teal)" />
        </div>
        <span className="sm muted">{mentor.headline}</span>
        {mentor.reviews ? (
          <div className="row gap-6">
            <Stars value={mentor.rating} />
            <span className="sm semibold">{mentor.rating.toFixed(1)}</span>
            <span className="xs muted">({mentor.reviews})</span>
          </div>
        ) : <span className="xs muted">New mentor · no reviews yet</span>}
      </div>
      <div className="row wrap gap-8">
        <Chip kind="teal" dot={false}>{mentor.field}</Chip>
        {mentor.tags.slice(0, 2).map((t) => <Chip key={t} kind="gray" dot={false}>{t}</Chip>)}
      </div>
      <div className="row between mentor-card-foot">
        <span className="semibold text-teal">Free</span>
        <Button to={`/mentors/${mentor.id}`} size="sm" variant="outline">View profile</Button>
      </div>
    </article>
  );
}
