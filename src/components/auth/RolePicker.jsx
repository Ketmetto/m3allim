import { Icon } from '../ui';

const OPTIONS = [
  { id: 'student', icon: 'GraduationCap', label: 'I’m a student', sub: 'Find a mentor' },
  { id: 'mentor', icon: 'Briefcase', label: 'I want to mentor', sub: 'Give back' },
];

/* Student or mentor, picked at sign-up. disabled: ids that can't be picked right now (closed by the super admin). */
export function RolePicker({ value, onChange, disabled = [] }) {
  return (
    <div className="role-pick" role="radiogroup" aria-label="Account type">
      {OPTIONS.map((r) => (
        <button key={r.id} type="button" role="radio" aria-checked={value === r.id} disabled={disabled.includes(r.id)} className={`role-option ${value === r.id ? 'active' : ''}`} onClick={() => onChange(r.id)}>
          <Icon name={r.icon} size={20} />
          <span className="col">
            <span className="semibold">{r.label}</span>
            <span className="xs muted">{disabled.includes(r.id) ? 'Closed for now' : r.sub}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
