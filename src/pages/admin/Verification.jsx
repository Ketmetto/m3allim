import { useEffect, useState } from 'react';
import { AdminShell } from '../../components/layout.jsx';
import { Avatar, Button, Card, Checkbox, DataTable, Field, Icon, Person, SearchBox, StatusChip, Tabs, Textarea } from '../../components/ui.jsx';
import { decideApplication, documentUrl, listApplications } from '../../data/applications.js';
import { superAdmin } from '../../data/mock.js';
import { supabase } from '../../lib/supabase.js';

const NO_CHECKS = { cv: false, cover: false, exp: false };

// Opens a Gmail draft from the super admin's account, addressed to the applicant.
function gmailDraft(app, status, note) {
  const first = app.name.split(' ')[0];
  const subject = status === 'Approved' ? 'Your M3allim mentor application is approved' : 'Your M3allim mentor application';
  const body = status === 'Approved'
    ? `Hi ${first},\n\nGreat news: your application to mentor on M3allim has been approved. You can now log in, complete your profile and start accepting sessions.\n\n${note ? `${note}\n\n` : ''}Thank you for giving back to students in Lebanon.\n\n${superAdmin.name}\nM3allim`
    : `Hi ${first},\n\nThank you for applying to mentor on M3allim. After reviewing your application, we’re not able to approve it at this time.\n\n${note ? `${note}\n\n` : ''}You’re welcome to apply again in the future.\n\n${superAdmin.name}\nM3allim`;
  // authuser picks the super admin's inbox when several Google accounts are signed in.
  const params = new URLSearchParams({ authuser: superAdmin.email, view: 'cm', fs: '1', to: app.email, su: subject, body });
  if (app.altEmail) params.set('cc', app.altEmail);
  return `https://mail.google.com/mail/?${params}`;
}

export default function Verification({ kind = 'admin' }) {
  const [list, setList] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('Pending');
  const [selectedId, setSelectedId] = useState();
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [checks, setChecks] = useState(NO_CHECKS);
  const [error, setError] = useState('');

  useEffect(() => {
    listApplications().then(setList).catch((e) => setLoadError(e.message));
  }, []);

  const all = list || [];
  // The demo data stands in for a larger history; real data shows real counts.
  const offset = (n) => (supabase ? 0 : n);
  const count = (s) => all.filter((a) => a.status === s).length;
  const tabs = [
    { id: 'Pending', label: `Pending (${count('Pending')})` },
    { id: 'Approved', label: `Approved (${offset(179) + count('Approved')})` },
    { id: 'Rejected', label: `Declined (${offset(12) + count('Rejected')})` },
  ];
  const rows = all.filter((a) => a.status === tab && a.name.toLowerCase().includes(q.toLowerCase()));
  const selected = rows.find((a) => a.id === selectedId) || rows[0];

  const select = (id) => {
    setSelectedId(id);
    setChecks(NO_CHECKS);
    setNote('');
    setError('');
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
    window.open(gmailDraft(selected, status, note.trim()), '_blank');
    try {
      await decideApplication(selected.id, status, note.trim());
    } catch (e) {
      return setError(`Couldn’t save the decision: ${e.message}`);
    }
    const next = all.find((a) => a.status === 'Pending' && a.id !== selected.id);
    setList(all.map((a) => (a.id === selected.id ? { ...a, status, note: note.trim() } : a)));
    select(next?.id);
  };

  const cols = [
    { key: 'name', label: 'APPLICANT', render: (r) => <Person name={r.name} sub={r.headline} src={r.avatar} /> },
    { key: 'field', label: 'FIELD', width: 110 },
    { key: 'submitted', label: 'SUBMITTED', width: 110 },
    { key: 'status', label: 'STATUS', width: 110, render: (r) => <StatusChip status={r.status} /> },
  ];

  const details = selected && [
    ['Email', selected.email],
    ['Additional email', selected.altEmail],
    ['Phone', selected.phone],
    ['Field', selected.field],
    ['Experience', selected.experience],
    ['Education', selected.education],
    ['Languages', selected.languages],
  ].filter(([, v]) => v);
  const linkedinUrl = selected?.linkedin?.includes('linkedin.com') ? `https://${selected.linkedin.replace(/^https?:\/\//, '')}` : null;
  const ready = checks.cv && checks.cover;

  return (
    <AdminShell kind={kind} title="Mentor verification" sub="Review applications before mentors appear on the platform" actions={<SearchBox value={q} onChange={setQ} placeholder="Search applicants" width={240} />}>
      <Tabs items={tabs} active={tab} onChange={(t) => { setTab(t); select(undefined); }} />
      {loadError && <p className="error" role="alert">Couldn’t load applications: {loadError}</p>}
      <div className="split-main-panel">
        <Card pad={0} className="table-card">
          {!list ? <div className="center muted" style={{ padding: 48 }}>Loading applications…</div>
            : rows.length ? <DataTable columns={cols} rows={rows} selectedId={selected?.id} onRowClick={(r) => select(r.id)} />
            : <div className="center muted" style={{ padding: 48 }}>No applications in this tab.</div>}
        </Card>

        {selected && (
          <Card pad={28} className="col gap-20 panel">
            <div className="row between"><h2 className="h3">Application review</h2><StatusChip status={selected.status} /></div>
            <div className="row gap-14"><Avatar name={selected.name} src={selected.avatar} size={60} /><div className="col gap-4 min0"><span className="h3">{selected.name}</span><span className="sm muted">{selected.headline}</span></div></div>
            <div className="col gap-10 sm">
              {details.map(([k, v]) => <div key={k} className="row between gap-12"><span className="muted">{k}</span><span className="medium truncate">{v}</span></div>)}
              <div className="row between gap-12"><span className="muted">LinkedIn</span>{linkedinUrl ? <a className="medium text-teal truncate" href={linkedinUrl} target="_blank" rel="noreferrer">{selected.linkedin}</a> : <span className="medium">{selected.linkedin}</span>}</div>
            </div>
            <hr className="hr" />
            <h3 className="semibold">Submitted documents</h3>
            {!selected.docs.length && <p className="sm muted">No documents uploaded yet.</p>}
            {selected.docs.map(([title, sub, path]) => (
              <div key={title} className="doc-row">
                <Icon name="FileText" size={18} color="var(--teal)" />
                <div className="col fill"><span className="sm medium">{title}</span><span className="xs muted truncate">{sub}</span></div>
                {path ? <button className="link" onClick={() => openDoc(path)}>View</button> : <span className="xs muted">Demo file</span>}
              </div>
            ))}
            {selected.status === 'Pending' ? (
              <>
                <h3 className="semibold">Checklist</h3>
                <div className="col gap-10">
                  <Checkbox checked={checks.cv} onChange={(v) => setChecks({ ...checks, cv: v })}>CV reviewed</Checkbox>
                  <Checkbox checked={checks.cover} onChange={(v) => setChecks({ ...checks, cover: v })}>Cover letter reviewed</Checkbox>
                  <Checkbox checked={checks.exp} onChange={(v) => setChecks({ ...checks, exp: v })}>Experience confirmed on LinkedIn</Checkbox>
                </div>
                <Field label="Note to applicant" hint="Included in the Gmail draft that opens when you approve or decline."><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add feedback or next steps…" /></Field>
                {error && <p className="error" role="alert">{error}</p>}
                <div className="row gap-12"><Button icon="Check" className="fill" onClick={() => decide('Approved')} disabled={!ready}>Approve mentor</Button><Button variant="danger-outline" onClick={() => decide('Rejected')}>Decline</Button></div>
                {!ready && <p className="xs muted center">Review the CV and cover letter before approving.</p>}
              </>
            ) : (
              <>
                {error && <p className="error" role="alert">{error}</p>}
                {selected.note && <div className="col gap-6"><span className="xs muted">Your note</span><p className="sm">{selected.note}</p></div>}
                <p className="sm muted center">This application was {selected.status === 'Rejected' ? 'declined' : 'approved'}.</p>
              </>
            )}
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
