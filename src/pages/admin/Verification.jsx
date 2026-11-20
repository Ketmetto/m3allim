// Mentor verification (admins): open the ID or passport, CV and cover letter, tick the checklist, approve or decline.
// Approving publishes the mentor (database trigger) and notifies them; a Gmail draft opens so you can email them too.
import { useState } from 'react';
import { AdminShell } from '../../components/layout';
import { Avatar, Button, Card, Checkbox, DataTable, DetailList, Field, FormError, Icon, Loading, Person, SearchBox, StatusChip, Tabs, Textarea } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLive } from '../../context/LiveContext.jsx';
import { decideApplication, documentUrl, listApplications } from '../../services/applications.js';
import { firstName, friendlyError } from '../../utils/format.js';

const NO_CHECKS = { id: false, cv: false, cover: false, exp: false };

// Opens a Gmail draft from the admin's own account, addressed to the applicant.
function gmailDraft(app, status, note, admin) {
  const first = firstName(app.name);
  const subject = status === 'Approved' ? 'Your M3allim mentor application is approved' : 'Your M3allim mentor application';
  const body = status === 'Approved'
    ? `Hi ${first},\n\nGreat news: your application to mentor on M3allim has been approved. You can now log in, build your profile, set your availability and start accepting sessions.\n\n${note ? `${note}\n\n` : ''}Thank you for giving back to students in Lebanon.\n\n${admin.name}\nM3allim`
    : `Hi ${first},\n\nThank you for applying to mentor on M3allim. After reviewing your application, we’re not able to approve it yet.\n\n${note ? `${note}\n\n` : ''}You can update your application and send it again from your account.\n\n${admin.name}\nM3allim`;
  // authuser picks the admin's inbox when several Google accounts are signed in.
  const params = new URLSearchParams({ authuser: admin.email, view: 'cm', fs: '1', to: app.email, su: subject, body });
  if (app.altEmail) params.set('cc', app.altEmail);
  return `https://mail.google.com/mail/?${params}`;
}

export default function Verification() {
  const { account } = useAuth();
  const { refreshWaiting } = useLive();
  const { data: list, error: loadError, setData: setList } = useAsync(() => listApplications(), []);
  const [tab, setTab] = useState('Pending');
  const [selectedId, setSelectedId] = useState();
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [checks, setChecks] = useState(NO_CHECKS);
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const all = list || [];
  const count = (s) => all.filter((a) => a.status === s).length;
  const rows = all.filter((a) => a.status === tab && `${a.name} ${a.headline} ${a.field}`.toLowerCase().includes(q.toLowerCase()));
  const selected = rows.find((a) => a.id === selectedId) || rows[0];

  const select = (id) => {
    setSelectedId(id); setChecks(NO_CHECKS); setNote(''); setError('');
  };

  const openDoc = async (path) => {
    // Open the tab right away so the browser doesn't block it, then point it at the signed link.
    const win = window.open('', '_blank');
    try {
      win.location = await documentUrl(path);
    } catch (e) {
      win.close();
      setError(`Couldn’t open the document: ${e.message}`);
    }
  };

  const decide = async (status) => {
    if (sendEmail) window.open(gmailDraft(selected, status, note.trim(), account), '_blank');
    setBusy(true);
    try {
      await decideApplication(selected.id, status, note.trim());
    } catch (e) {
      setBusy(false);
      return setError(`Couldn’t save the decision: ${friendlyError(e)}`);
    }
    const next = all.find((a) => a.status === 'Pending' && a.id !== selected.id);
    setList(all.map((a) => (a.id === selected.id ? { ...a, status, note: note.trim() } : a)));
    refreshWaiting();
    select(next?.id);
    setBusy(false);
  };

  const linkedinUrl = selected?.linkedin ? `https://${selected.linkedin.replace(/^https?:\/\//, '')}` : null;
  const ready = checks.id && checks.cv && checks.cover;

  return (
    <AdminShell title="Mentor verification" sub="Check identity and experience before mentors appear on M3allim" actions={<SearchBox value={q} onChange={setQ} placeholder="Search applicants" width={240} />}>
      <Tabs items={[{ id: 'Pending', label: `Pending (${count('Pending')})` }, { id: 'Approved', label: `Approved (${count('Approved')})` }, { id: 'Rejected', label: `Declined (${count('Rejected')})` }]} active={tab} onChange={(t) => { setTab(t); select(undefined); }} />
      {loadError && <p className="error" role="alert">Couldn’t load applications: {loadError}</p>}
      <div className="split-main-panel">
        <Card pad={0} className="table-card">
          {!list ? <Loading text="Loading applications…" />
            : rows.length ? <DataTable columns={[
              { key: 'name', label: 'APPLICANT', render: (r) => <Person name={r.name} sub={r.headline} src={r.avatar} /> },
              { key: 'field', label: 'FIELD', width: 110 },
              { key: 'submitted', label: 'SUBMITTED', width: 110 },
            ]} rows={rows} selectedId={selected?.id} onRowClick={(r) => select(r.id)} />
            : <div className="empty muted">No applications in this tab.</div>}
        </Card>

        {selected && (
          <Card pad={28} className="col gap-20 panel">
            <div className="row between"><h2 className="h3">Application review</h2><StatusChip status={selected.status === 'Rejected' ? 'Declined' : selected.status} /></div>
            <div className="row gap-14"><Avatar name={selected.name} src={selected.avatar} size={60} /><div className="col gap-4 min0"><span className="h3">{selected.name}</span><span className="sm muted">{selected.headline}</span></div></div>
            <DetailList rows={[
              ['Email', selected.email], ['Additional email', selected.altEmail], ['Phone', selected.phone], ['City', selected.city],
              ['Field', selected.field], ['Experience', selected.experienceYears != null ? `${selected.experienceYears} years` : null],
              ['Education', selected.education], ['Languages', selected.languages],
              ['LinkedIn', linkedinUrl && <a className="text-teal" href={linkedinUrl} target="_blank" rel="noreferrer">{selected.linkedin}</a>],
              ['Submitted', selected.submitted],
            ]} />
            <hr className="hr" />
            <h3 className="semibold">Documents</h3>
            {selected.docs.map((d) => (
              <div key={d.key} className="doc-row">
                <Icon name={d.key === 'id' ? 'IdCard' : 'FileText'} size={18} color="var(--teal)" />
                <div className="col fill min0"><span className="sm medium">{d.title}</span><span className="xs muted truncate">{d.file || 'Not provided (older application)'}</span></div>
                {d.path && <button type="button" className="link" onClick={() => openDoc(d.path)}>View</button>}
              </div>
            ))}
            <p className="xs muted">Links are private and expire after 10 minutes.</p>
            {selected.status === 'Pending' ? (
              <>
                <h3 className="semibold">Checklist</h3>
                <div className="col gap-10">
                  <Checkbox checked={checks.id} onChange={(v) => setChecks({ ...checks, id: v })}>Identity document matches the name</Checkbox>
                  <Checkbox checked={checks.cv} onChange={(v) => setChecks({ ...checks, cv: v })}>CV reviewed</Checkbox>
                  <Checkbox checked={checks.cover} onChange={(v) => setChecks({ ...checks, cover: v })}>Cover letter reviewed</Checkbox>
                  <Checkbox checked={checks.exp} onChange={(v) => setChecks({ ...checks, exp: v })}>Experience confirmed on LinkedIn (optional)</Checkbox>
                </div>
                <Field label="Note to the applicant" hint="Shown in their notification and the email draft."><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Feedback or next steps…" /></Field>
                <Checkbox checked={sendEmail} onChange={setSendEmail}>Also open a Gmail draft to the applicant</Checkbox>
                <FormError>{error}</FormError>
                <div className="row gap-12"><Button icon="Check" className="fill" onClick={() => decide('Approved')} disabled={!ready || busy}>Approve mentor</Button><Button variant="danger-outline" disabled={busy} onClick={() => decide('Rejected')}>Decline</Button></div>
                {!ready && <p className="xs muted center">Check the ID, CV and cover letter before approving.</p>}
              </>
            ) : (
              <>
                <FormError>{error}</FormError>
                {selected.note && <div className="col gap-6"><span className="xs muted">Note sent</span><p className="sm">{selected.note}</p></div>}
                <p className="sm muted center">This application was {selected.status === 'Rejected' ? 'declined' : 'approved'}.</p>
                {selected.status === 'Approved' && <Button variant="outline" size="sm" icon="Eye" to={`/mentors/${selected.userId}`}>View public profile</Button>}
              </>
            )}
            <Button variant="ghost-border" size="sm" icon="MessageCircle" to={`/messages?with=${selected.userId}`}>Message applicant</Button>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
