// Platform settings (super admin only). Saved in the platform_settings table; the database enforces them
// (session length, open-request limit, booking notice, applications) and every change goes to the audit log.
// Maintenance mode takes effect in every open browser within a second.
import { useEffect, useState } from 'react';
import { AdminShell } from '../../components/layout';
import { Button, Card, Field, FormError, FormNotice, Input, Select, Textarea, Toggle } from '../../components/ui';
import { useSettings } from '../../context/SettingsContext.jsx';
import { updateSettings } from '../../services/superAdmin.js';
import { fmtDateTime } from '../../utils/time.js';
import { friendlyError } from '../../utils/format.js';

const EDITABLE = ['platform_name', 'support_email', 'student_signups_open', 'mentor_applications_open', 'session_length_min', 'max_pending_requests', 'min_notice_hours', 'maintenance_mode', 'maintenance_message'];
const pick = (s) => Object.fromEntries(EDITABLE.map((k) => [k, s[k]]));

function SettingRow({ title, desc, children }) {
  return (
    <div className="setting-row">
      <div className="col gap-4 fill"><span className="semibold">{title}</span><span className="sm muted">{desc}</span></div>
      {children}
    </div>
  );
}

export default function PlatformSettings() {
  const { settings, setSettings } = useSettings();
  const [s, setS] = useState(pick(settings));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => setS(pick(settings)), [settings]);

  const dirty = JSON.stringify(s) !== JSON.stringify(pick(settings));
  const set = (k) => (v) => { setS({ ...s, [k]: v }); setNotice(''); setError(''); };

  const save = async (fields = s) => {
    setBusy(true); setError('');
    try {
      setSettings(await updateSettings(fields));
      setNotice('Settings saved and recorded in the audit log.');
    } catch (e) {
      setError(friendlyError(e));
    }
    setBusy(false);
  };

  // Maintenance mode is saved straight away, so it's never left "on" by accident without saving.
  const toggleMaintenance = (on) => save({ maintenance_mode: on, maintenance_message: s.maintenance_message });

  return (
    <AdminShell
      title="Platform settings"
      sub={`Control how M3allim works for everyone · last changed ${fmtDateTime(settings.updated_at || new Date().toISOString())}`}
      actions={<><Button variant="ghost-border" size="sm" disabled={!dirty} onClick={() => setS(pick(settings))}>Discard</Button><Button size="sm" disabled={!dirty || busy} onClick={() => save()}>Save changes</Button></>}
    >
      <FormError>{error}</FormError>
      <FormNotice>{notice}</FormNotice>
      <div className="split-main-panel">
        <div className="col gap-24">
          <Card className="col gap-18">
            <h2 className="h3">General</h2>
            <div className="grid-2 tight">
              <Field label="Platform name"><Input value={s.platform_name} onChange={(e) => set('platform_name')(e.target.value)} /></Field>
              <Field label="Support email" hint="Shown in the footer."><Input value={s.support_email} onChange={(e) => set('support_email')(e.target.value)} /></Field>
            </div>
          </Card>
          <Card className="col gap-20">
            <h2 className="h3">Registration</h2>
            <SettingRow title="Open student sign-ups" desc="New students can create accounts."><Toggle on={s.student_signups_open} onChange={set('student_signups_open')} label="Open student sign-ups" /></SettingRow>
            <hr className="hr" />
            <SettingRow title="Accept mentor applications" desc="New mentors can sign up and send their ID, CV and cover letter. Enforced by the database."><Toggle on={s.mentor_applications_open} onChange={set('mentor_applications_open')} label="Accept mentor applications" /></SettingRow>
          </Card>
          <Card className="col gap-20">
            <h2 className="h3">Sessions</h2>
            <SettingRow title="Session length" desc="Length of every new session. Booking times adapt automatically."><div style={{ width: 150 }}><Select value={String(s.session_length_min)} onChange={(v) => set('session_length_min')(Number(v))} options={['30', '45', '60', '90'].map((v) => ({ value: v, label: `${v} minutes` }))} /></div></SettingRow>
            <hr className="hr" />
            <SettingRow title="Open requests per student" desc="How many unanswered requests a student can have at once."><div style={{ width: 150 }}><Select value={String(s.max_pending_requests)} onChange={(v) => set('max_pending_requests')(Number(v))} options={['1', '2', '3', '5', '10']} /></div></SettingRow>
            <hr className="hr" />
            <SettingRow title="Booking notice" desc="How far ahead students must book, so mentors have time to answer."><div style={{ width: 150 }}><Select value={String(s.min_notice_hours)} onChange={(v) => set('min_notice_hours')(Number(v))} options={['2', '6', '12', '24', '48'].map((v) => ({ value: v, label: `${v} hours` }))} /></div></SettingRow>
          </Card>
        </div>

        <div className="col gap-24 panel">
          <Card pad={24} className="col gap-16 maintenance">
            <div className="row between"><h2 className="h3">Maintenance mode</h2><Toggle gold on={settings.maintenance_mode} disabled={busy} onChange={toggleMaintenance} label="Maintenance mode" /></div>
            <p className="sm muted">{settings.maintenance_mode ? 'On: visitors, students and mentors see the message below. Admins can still sign in and use everything.' : 'Off. When on, only admins can use the website; everyone else sees the message below.'}</p>
            <Field label="Message to visitors"><Textarea rows={4} value={s.maintenance_message} onChange={(e) => set('maintenance_message')(e.target.value)} /></Field>
            <p className="xs muted">The switch saves immediately. Edit the message, then Save changes.</p>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
