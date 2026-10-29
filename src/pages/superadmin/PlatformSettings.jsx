import { useState } from 'react';
import { AdminShell } from '../../components/layout.jsx';
import { Button, Card, Field, Icon, Input, Select, Textarea, Toggle } from '../../components/ui.jsx';

function SettingRow({ title, desc, children }) {
  return (
    <div className="setting-row">
      <div className="col gap-4 fill"><span className="semibold">{title}</span><span className="sm muted">{desc}</span></div>
      {children}
    </div>
  );
}

export default function PlatformSettings() {
  const initial = {
    name: 'M3allim', email: 'hello@m3allim.com',
    open: true, verify: true, guests: true, uniEmail: false,
    pending: '3', length: '45 minutes', cancel: '24 hours',
    maintenance: false, message: 'We’re making M3allim better and will be back shortly. Thank you for your patience.',
    chat: 'Keep for 12 months', audit: 'Keep for 24 months',
  };
  const [s, setS] = useState(initial);
  const [saved, setSaved] = useState(false);
  const set = (k) => (v) => { setS({ ...s, [k]: v }); setSaved(false); };
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);

  return (
    <AdminShell kind="super" title="Platform settings" sub="Control how M3allim works for everyone"
      actions={<><Button variant="ghost-border" size="sm" onClick={() => { setS(initial); setSaved(false); }}>Discard</Button><Button size="sm" onClick={() => setSaved(true)} disabled={!dirty && !saved}>{saved ? 'Saved' : 'Save changes'}</Button></>}>
      {saved && <p className="toast" role="status"><Icon name="Check" size={16} /> Settings saved. The change was recorded in the audit log.</p>}
      <div className="split-main-panel">
        <div className="col gap-24">
          <Card className="col gap-18">
            <h2 className="h3">General</h2>
            <div className="row gap-16"><div className="fill"><Field label="Platform name"><Input value={s.name} onChange={(e) => set('name')(e.target.value)} /></Field></div><div className="fill"><Field label="Support email"><Input value={s.email} onChange={(e) => set('email')(e.target.value)} /></Field></div></div>
          </Card>
          <Card className="col gap-20">
            <h2 className="h3">Access & registration</h2>
            <SettingRow title="Open student registration" desc="Anyone with a student account can sign up without an invite."><Toggle on={s.open} onChange={set('open')} label="Open student registration" /></SettingRow>
            <hr className="hr" />
            <SettingRow title="Require mentor verification" desc="Mentors appear on the platform only after an admin approves them."><Toggle on={s.verify} onChange={set('verify')} label="Require mentor verification" /></SettingRow>
            <hr className="hr" />
            <SettingRow title="Allow guests to browse mentors" desc="Visitors can view profiles and search without logging in."><Toggle on={s.guests} onChange={set('guests')} label="Allow guests to browse" /></SettingRow>
            <hr className="hr" />
            <SettingRow title="Require a university email for students" desc="Limit sign-ups to LIU, LAU, AUB and other partner domains."><Toggle on={s.uniEmail} onChange={set('uniEmail')} label="Require a university email" /></SettingRow>
          </Card>
          <Card className="col gap-20">
            <h2 className="h3">Sessions</h2>
            <SettingRow title="Pending requests per student" desc="Maximum open requests a student can have at once."><div style={{ width: 150 }}><Select value={s.pending} onChange={set('pending')} options={['1', '2', '3', '5', '10']} /></div></SettingRow>
            <hr className="hr" />
            <SettingRow title="Session length" desc="Default duration of a mentorship session."><div style={{ width: 150 }}><Select value={s.length} onChange={set('length')} options={['30 minutes', '45 minutes', '60 minutes']} /></div></SettingRow>
            <hr className="hr" />
            <SettingRow title="Cancellation window" desc="Students can cancel for free up to this long before a session."><div style={{ width: 150 }}><Select value={s.cancel} onChange={set('cancel')} options={['12 hours', '24 hours', '48 hours']} /></div></SettingRow>
          </Card>
        </div>

        <div className="col gap-24 panel">
          <Card pad={24} className="col gap-16 maintenance">
            <div className="row between"><h2 className="h3">Maintenance mode</h2><Toggle gold on={s.maintenance} onChange={set('maintenance')} label="Maintenance mode" /></div>
            <p className="sm muted">Only super admins can sign in while this is on. Visitors see the message below.</p>
            <Field label="Message to visitors"><Textarea rows={4} value={s.message} onChange={(e) => set('message')(e.target.value)} /></Field>
            <Button variant="gold-outline" icon="Wrench">Schedule maintenance window</Button>
          </Card>
          <Card pad={24} className="col gap-16">
            <h2 className="h3">Data retention</h2>
            <Field label="Chat history"><Select value={s.chat} onChange={set('chat')} options={['Keep for 6 months', 'Keep for 12 months', 'Keep for 24 months']} /></Field>
            <Field label="Audit log"><Select value={s.audit} onChange={set('audit')} options={['Keep for 12 months', 'Keep for 24 months', 'Keep forever']} /></Field>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
