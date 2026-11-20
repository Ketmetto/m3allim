// Help & support for students, mentors and applicants: write to the admin team and follow the replies.
// Banned accounts can still use this page to appeal.
import { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SiteLayout } from '../../components/layout';
import { NewTicketForm } from '../../components/support/NewTicketForm.jsx';
import { TicketThread } from '../../components/support/TicketThread.jsx';
import { Button, Card, EmptyState, Loading, PageHeading, StatusChip } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { listMyTickets } from '../../services/support.js';
import { timeAgo } from '../../utils/time.js';

export default function HelpCenter() {
  const { state } = useLocation();
  const [params, setParams] = useSearchParams();
  const { account } = useAuth();
  const { data: tickets, reload } = useAsync(() => listMyTickets(account.id), [account.id]);
  const [composing, setComposing] = useState(Boolean(state?.category));
  const openId = Number(params.get('ticket')) || null;
  const open = tickets?.find((t) => t.id === openId);

  return (
    <SiteLayout>
      <PageHeading title="Help & support" sub="Questions, problems or appeals: write to the M3allim team and we’ll reply here.">
        {!composing && <Button icon="Plus" onClick={() => { setComposing(true); setParams({}); }}>New request</Button>}
      </PageHeading>
      <div className="support-layout">
        <Card pad={0} className="list">
          <div className="card-head"><h2 className="h3">Your requests</h2></div>
          {!tickets ? <Loading /> : tickets.length === 0 ? <EmptyState icon="LifeBuoy" text="You haven’t contacted support yet." /> : tickets.map((t) => (
            <button type="button" key={t.id} className={`conv ${t.id === openId ? 'active' : ''}`} onClick={() => { setComposing(false); setParams({ ticket: t.id }); }}>
              <div className="col fill min0"><span className="semibold truncate">{t.subject}</span><span className="xs muted">{t.category} · updated {timeAgo(t.updated_at)}</span></div>
              <StatusChip status={t.status} />
            </button>
          ))}
        </Card>
        {composing ? (
          <Card className="col gap-16">
            <h2 className="h2-sm">New support request</h2>
            <NewTicketForm defaultCategory={state?.category} onCreated={async (id) => { await reload(); setComposing(false); setParams({ ticket: id }); }} onCancel={() => setComposing(false)} />
          </Card>
        ) : open ? (
          <TicketThread ticket={open} userId={account.id} viewer="user" onChanged={reload} onBack={() => setParams({})} />
        ) : (
          <Card><EmptyState icon="MessageCircle" title="How can we help?" text="Pick a request on the left, or start a new one."><Button variant="outline" icon="Plus" onClick={() => setComposing(true)}>New request</Button></EmptyState></Card>
        )}
      </div>
    </SiteLayout>
  );
}
