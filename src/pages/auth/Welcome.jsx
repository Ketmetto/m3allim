// First visit after signing in with Google from the log-in page: pick student or mentor (once).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout';
import { RolePicker } from '../../components/auth/RolePicker.jsx';
import { Button, FormError } from '../../components/ui';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { chooseAccountType } from '../../services/auth.js';
import { firstName, friendlyError } from '../../utils/format.js';

export default function Welcome() {
  const navigate = useNavigate();
  const { account, refresh } = useAuth();
  const { settings } = useSettings();
  const closed = [!settings.student_signups_open && 'student', !settings.mentor_applications_open && 'mentor'].filter(Boolean);
  const [role, setRole] = useState(closed.includes('student') ? 'mentor' : 'student');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await chooseAccountType(account.id, role);
      await refresh();
      navigate('/continue');
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <AuthLayout title={`Welcome, ${firstName(account.name)}`} sub="How will you use M3allim? You can’t change this later.">
      <RolePicker value={role} onChange={setRole} disabled={closed} />
      <FormError>{error}</FormError>
      <Button size="lg" iconAfter="ArrowRight" onClick={save} disabled={busy || closed.includes(role)}>Continue</Button>
    </AuthLayout>
  );
}
