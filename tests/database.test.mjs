// Database tests: runs supabase/schema.sql in an in-memory Postgres (PGlite), then acts as each role
// (guest, student, mentor, applicant, admin, super admin, banned) and checks what the database allows.
// Run with: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const SCHEMA = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');

const STUBS = readFileSync(new URL('./support/supabase-stubs.sql', import.meta.url), 'utf8');

let failures = 0, passes = 0;
const ok = (cond, label, extra = '') => { if (cond) { passes++; } else { failures++; console.log('  FAIL', label, extra); } };

async function setup(withData) {
  const db = new PGlite();
  await db.exec(STUBS);
  await db.exec(SCHEMA);
  await db.exec(SCHEMA); // safe to run twice
  const U = {};
  if (withData) {
    // Sample accounts: sign-ups create profiles through the database trigger.
    const mk = async (key, email, meta) => {
      const r = await db.query(`insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`, [email, meta]);
      U[key] = { id: r.rows[0].id, email };
    };
    await mk('super', 'kitmittofam@gmail.com', { full_name: 'Omar Kitmitto' });
    await mk('admin', 'admin@m3allim.test', { full_name: 'Rana Admin', role: 'student' });
    await mk('s1', 's1@test.com', { full_name: 'Sara Student', role: 'student' });
    await mk('s2', 's2@test.com', { full_name: 'Sami Student', role: 'student' });
    await mk('m1', 'm1@test.com', { full_name: 'Maya Mentor', role: 'mentor' });
    await mk('m2', 'm2@test.com', { full_name: 'Marc Mentor', role: 'mentor' });
    await mk('app', 'app@test.com', { full_name: 'Adam Applicant', role: 'mentor' });
    await mk('app2', 'app2@test.com', { full_name: 'Aya Applicant', role: 'mentor' });
    const apply = (k, status) => db.query(
      `insert into public.mentor_applications (user_id, full_name, email, phone, field, headline, cv_path, cover_letter_path, id_type, id_document_path, status)
       values ($1::uuid, $2, $3, '+961 70 000 000', 'Design', 'Designer at X', $1::text || '/cv.pdf', $1::text || '/cl.pdf', 'Passport', $1::text || '/id.jpg', 'Pending')`, [U[k].id, k, U[k].email])
      .then(() => status === 'Approved' && db.query(`update public.mentor_applications set status = 'Approved' where user_id = $1`, [U[k].id]));
    await apply('m1', 'Approved');
    await apply('m2', 'Approved');
    await apply('app', 'Pending');
    await db.query(`insert into public.sessions (student_id, mentor_id, topic, starts_at, status) values ($1, $2, 'Past talk', now() - interval '3 days', 'Accepted')`, [U.s1.id, U.m1.id]);
    await db.query(`insert into public.messages (sender_id, recipient_id, body) values ($1, $2, 'hello')`, [U.s1.id, U.m1.id]);
  }
  return { db, U };
}

// Run SQL as a user (null = guest). Returns { rows, error }.
async function as(db, user, sql, params = []) {
  const claims = user ? JSON.stringify({ sub: user.id, email: user.email }) : '{}';
  await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`, [user?.id ?? '', claims]);
  await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
  try {
    const r = await db.query(sql, params);
    return { rows: r.rows, count: r.affectedRows };
  } catch (e) {
    return { error: e.message, rows: [] };
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false)");
  }
}

console.log('Schema installs (run twice) and sample data loads');
let db, U;
try {
  ({ db, U } = await setup(true));
  ok(true);
} catch (e) {
  ok(false, 'schema install', e.message);
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(1);
}

const tue = async (hhmm, weeks = 1) => (await db.query(
  `select ((date_trunc('week', now() at time zone 'Asia/Beirut') + make_interval(days => 7 * $2 + 1) + $1::time) at time zone 'Asia/Beirut') as t`, [hhmm, weeks])).rows[0].t;
const notes = async (key) => (await db.query(`select kind, title, body, link from public.notifications where user_id = $1 order by id`, [U[key].id])).rows;
const audit = async () => (await db.query(`select action, target from public.audit_log order by id`)).rows.map((r) => r.action);

console.log('Guests');
{
  const m = await as(db, null, `select id from public.mentors`);
  ok(m.rows.length === 2, 'guest sees 2 mentors', JSON.stringify(m));
  const p = await as(db, null, `select id from public.profiles`);
  ok(p.rows.length === 2, 'guest sees only mentor profiles', p.rows.length);
  ok((await as(db, null, `select * from public.sessions`)).rows.length === 0, 'guest sees no sessions');
  ok((await as(db, null, `select * from public.platform_settings`)).rows.length === 1, 'guest reads settings');
  ok((await as(db, null, `select * from public.mentor_busy`)).error, 'guest cannot read busy times');
  ok((await as(db, null, `insert into public.messages (sender_id, recipient_id, body) values ($1, $2, 'x')`, [U.s1.id, U.m1.id])).error, 'guest cannot chat');
  ok((await as(db, null, `insert into public.sessions (student_id, mentor_id, topic, starts_at) values ($1, $2, 'x', now() + interval '3 days')`, [U.s1.id, U.m1.id])).error, 'guest cannot request');
}

console.log('Roles (whoami)');
{
  const w = async (k) => (await as(db, U[k], `select public.whoami() as w`)).rows[0].w;
  ok((await w('super')).is_super_admin === true, 'super admin recognised');
  ok((await w('s1')).role === 'student' && (await w('s1')).is_admin === false, 'student recognised');
  ok((await w('m1')).is_mentor === true, 'mentor recognised');
  ok((await w('app')).application_status === 'Pending' && (await w('app')).is_mentor === false, 'applicant recognised');
}

console.log('Profiles');
{
  const r = await as(db, U.s1, `update public.profiles set banned_at = null where id = $1`, [U.s1.id]);
  ok(r.error?.includes('permission denied'), 'student cannot touch ban columns', JSON.stringify(r));
  const r2 = await as(db, U.s1, `update public.profiles set role = 'mentor' where id = $1`, [U.s1.id]);
  ok(r2.error?.includes('already set'), 'student cannot switch account type', JSON.stringify(r2));
  const r3 = await as(db, U.s1, `update public.profiles set bio = 'hi' where id = $1`, [U.s1.id]);
  ok(!r3.error && r3.count === 1, 'student edits own bio', JSON.stringify(r3));
  ok((await as(db, U.s1, `select id from public.profiles`)).rows.length >= 3, 'student sees own + contacts + mentors');
}

console.log('Availability and requests');
{
  ok(!(await as(db, U.m1, `insert into public.mentor_availability (mentor_id, weekday, start_time, end_time) values ($1, 2, '17:00', '20:00')`, [U.m1.id])).error, 'mentor sets availability');
  ok((await as(db, U.m1, `insert into public.mentor_availability (mentor_id, weekday, start_time, end_time) values ($1, 2, '17:00', '20:00')`, [U.m2.id])).error, 'mentor cannot set another mentor’s availability');
  ok((await as(db, null, `select * from public.mentor_availability`)).rows.length === 1, 'guest sees availability');

  const req = (who, mentor, t, topic = 'Portfolio') => as(db, U[who], `insert into public.sessions (student_id, mentor_id, topic, starts_at) values ($1, $2, $3, $4) returning id, duration_min`, [U[who].id, U[mentor].id, topic, t]);
  const a = await req('s1', 'm1', await tue('17:00'));
  ok(!a.error && a.rows[0].duration_min === 45, 'request inside availability', JSON.stringify(a));
  const b = await req('s1', 'm1', await tue('16:00'));
  ok(b.error?.includes('outside'), 'request outside availability rejected', JSON.stringify(b));
  const b2 = await req('s1', 'm1', await tue('19:30'));
  ok(b2.error?.includes('outside'), 'request running past the end rejected', JSON.stringify(b2));
  const c = await as(db, U.s1, `insert into public.sessions (student_id, mentor_id, topic, starts_at) values ($1, $2, 'x', now() + interval '2 hours')`, [U.s1.id, U.m2.id]);
  ok(c.error?.includes('12 hours'), 'request too soon rejected', JSON.stringify(c));
  ok((await req('m2', 'm1', await tue('18:00'))).error, 'mentors cannot request sessions');
  ok((await notes('m1')).some((n) => n.kind === 'request'), 'mentor notified of request');

  // Accept, then a clash
  const accept = await as(db, U.m1, `update public.sessions set status = 'Accepted' where id = $1`, [a.rows[0].id]);
  ok(!accept.error && accept.count === 1, 'mentor accepts', JSON.stringify(accept));
  ok((await notes('s1')).some((n) => n.title === 'Session confirmed'), 'student notified of acceptance');
  const clash = await req('s2', 'm1', await tue('17:30'));
  ok(clash.error?.includes('already has a session'), 'clashing request rejected', JSON.stringify(clash));
  ok((await as(db, U.s2, `select * from public.mentor_busy`)).rows.length === 1, 'students see busy times');

  // Max pending (3)
  const p1 = await req('s2', 'm1', await tue('18:00'));
  const p2 = await req('s2', 'm1', await tue('18:45'));
  const p3 = await req('s2', 'm1', await tue('17:00', 2));
  ok(!p1.error && !p2.error && !p3.error, 'three open requests allowed', JSON.stringify([p1, p2, p3]));
  const p4 = await req('s2', 'm1', await tue('18:00', 2));
  ok(p4.error?.includes('3 open requests'), 'fourth open request rejected', JSON.stringify(p4));

  // Mentor accepting a request that overlaps a confirmed one: p1 at 18:00 does not overlap 17:00-17:45. Make one that does via direct insert.
  const overlap = await db.query(`insert into public.sessions (student_id, mentor_id, topic, starts_at) values ($1, $2, 'seeded', $3) returning id`, [U.s2.id, U.m1.id, await tue('17:15')]);
  const acc2 = await as(db, U.m1, `update public.sessions set status = 'Accepted' where id = $1`, [overlap.rows[0].id]);
  ok(acc2.error?.includes('clashes'), 'mentor cannot accept an overlapping request', JSON.stringify(acc2));

  // Reschedule proposals on the accepted session
  const out = await as(db, U.s1, `update public.sessions set proposed_starts_at = $2, proposed_by = 'student' where id = $1`, [a.rows[0].id, await tue('12:00')]);
  ok(out.error?.includes('outside'), 'student proposal outside availability rejected', JSON.stringify(out));
  const prop = await as(db, U.s1, `update public.sessions set proposed_starts_at = $2, proposed_by = 'student' where id = $1`, [a.rows[0].id, await tue('19:00')]);
  ok(!prop.error, 'student proposes a new time', JSON.stringify(prop));
  ok((await notes('m1')).some((n) => n.kind === 'reschedule'), 'mentor notified of proposal');
  const direct = await as(db, U.s1, `update public.sessions set starts_at = $2 where id = $1`, [a.rows[0].id, await tue('18:00')]);
  ok(direct.error?.includes('Propose'), 'student cannot move a confirmed session directly', JSON.stringify(direct));
  const agree = await as(db, U.m1, `update public.sessions set starts_at = proposed_starts_at, proposed_starts_at = null, proposed_by = null where id = $1`, [a.rows[0].id]);
  ok(!agree.error, 'mentor accepts the new time', JSON.stringify(agree));
  ok((await notes('s1')).some((n) => n.title === 'New time accepted'), 'student told the new time was accepted');

  // Rating
  const past = (await db.query(`select id from public.sessions where topic = 'Past talk'`)).rows[0].id;
  ok(!(await as(db, U.s1, `update public.sessions set rating = 5, review = 'Great' where id = $1`, [past])).error, 'student rates a past session');
  ok((await notes('m1')).some((n) => n.kind === 'review'), 'mentor notified of review');
  ok((await as(db, U.s1, `update public.sessions set rating = 4 where id = $1`, [a.rows[0].id])).error, 'cannot rate a future session');
  ok((await as(db, null, `select * from public.mentor_reviews`)).rows.length === 1, 'reviews are public');
}

console.log('Chat');
{
  ok(!(await as(db, U.s1, `insert into public.messages (sender_id, recipient_id, body) values ($1, $2, 'hi')`, [U.s1.id, U.m2.id])).error, 'student messages a mentor');
  ok((await as(db, U.s1, `insert into public.messages (sender_id, recipient_id, body) values ($1, $2, 'hi')`, [U.s1.id, U.s2.id])).error, 'student cannot message a random student');
  ok(!(await as(db, U.m1, `insert into public.messages (sender_id, recipient_id, body) values ($1, $2, 'hi')`, [U.m1.id, U.s2.id])).error, 'mentor messages a student who requested');
}

console.log('Admins');
{
  ok((await as(db, U.admin, `select public.whoami() as w`)).rows[0].w.is_admin === false, 'not an admin before being added');
  ok((await as(db, U.s1, `insert into public.admins (email) values ('s1@test.com')`)).error, 'student cannot add admins');
  ok(!(await as(db, U.super, `insert into public.admins (email, added_by) values ('admin@m3allim.test', $1)`, [U.super.id])).error, 'super admin adds an admin');
  ok((await as(db, U.super, `insert into public.admins (email) values ('kitmittofam@gmail.com')`)).error?.includes('already'), 'cannot add the super admin as admin');
  const w = (await as(db, U.admin, `select public.whoami() as w`)).rows[0].w;
  ok(w.is_admin === true && w.is_super_admin === false, 'admin recognised', JSON.stringify(w));
  ok((await notes('admin')).some((n) => n.title.includes('admin')), 'new admin notified');
  ok((await as(db, U.admin, `insert into public.admins (email) values ('x@test.com')`)).error, 'admin cannot add admins');
  const st = await as(db, U.admin, `update public.platform_settings set maintenance_mode = true`);
  ok(st.count === 0, 'admin cannot change settings', JSON.stringify(st));
  ok((await as(db, U.admin, `select public.system_health() as h`)).rows[0].h === null, 'admin has no system health');
  ok((await as(db, U.admin, `select public.list_admins()`)).rows.length === 0, 'admin cannot list the team via RPC');
  ok((await as(db, U.super, `select * from public.list_admins()`)).rows.length === 2, 'super admin lists the team');

  // Verification
  ok((await as(db, U.admin, `select id from public.mentor_applications`)).rows.length === 3, 'admin reads all applications');
  ok((await as(db, U.s1, `select id from public.mentor_applications`)).rows.length === 0, 'student reads no applications');
  const appr = await as(db, U.admin, `update public.mentor_applications set status = 'Approved', admin_note = 'Welcome' where user_id = $1`, [U.app.id]);
  ok(!appr.error && appr.count === 1, 'admin approves', JSON.stringify(appr));
  ok((await db.query(`select 1 from public.mentors where id = $1`, [U.app.id])).rows.length === 1, 'approved mentor published');
  ok((await notes('app')).some((n) => n.kind === 'application'), 'applicant notified');
  ok((await db.query(`select reviewed_by from public.mentor_applications where user_id = $1`, [U.app.id])).rows[0].reviewed_by === U.admin.id, 'reviewer stamped');

  // New application with identity document
  const base = [U.app2.id, 'Aya Applicant', 'app2@test.com'];
  const noId = await as(db, U.app2, `insert into public.mentor_applications (user_id, full_name, email, phone, field, headline, cv_path, cover_letter_path)
      values ($1::uuid, $2, $3, '1', 'Data', 'Analyst', $1::text || '/cv.pdf', $1::text || '/cl.pdf')`, base);
  ok(noId.error, 'application without ID rejected');
  const other = await as(db, U.app2, `insert into public.mentor_applications (user_id, full_name, email, phone, field, headline, cv_path, cover_letter_path, id_type, id_document_path)
      values ($1::uuid, $2, $3, '1', 'Data', 'Analyst', 'someone-else/cv.pdf', $1::text || '/cl.pdf', 'Passport', $1::text || '/id.jpg')`, base);
  ok(other.error, 'application pointing at someone else’s file rejected');
  const good = await as(db, U.app2, `insert into public.mentor_applications (user_id, full_name, email, phone, field, headline, cv_path, cover_letter_path, id_type, id_document_path, city, education, languages)
      values ($1::uuid, $2, $3, '1', 'Data', 'Analyst', $1::text || '/cv.pdf', $1::text || '/cl.pdf', 'Passport', $1::text || '/id.jpg', 'Beirut', 'BS, AUB', 'Arabic, English')`, base);
  ok(!good.error, 'complete application accepted', JSON.stringify(good));
  ok((await notes('admin')).some((n) => n.title === 'New mentor application'), 'admins notified of application');
  ok(!(await as(db, U.admin, `update public.mentor_applications set status = 'Rejected', admin_note = 'Add LinkedIn' where user_id = $1`, [U.app2.id])).error, 'admin declines');
  const again = await as(db, U.app2, `update public.mentor_applications set status = 'Pending', linkedin = 'linkedin.com/in/aya' where user_id = $1`, [U.app2.id]);
  ok(!again.error && again.count === 1, 'applicant resubmits after decline', JSON.stringify(again));
  const row = (await db.query(`select status, admin_note from public.mentor_applications where user_id = $1`, [U.app2.id])).rows[0];
  ok(row.status === 'Pending' && row.admin_note === null, 'resubmission resets the review', JSON.stringify(row));
  ok((await as(db, U.app2, `update public.mentor_applications set status = 'Approved' where user_id = $1`, [U.app2.id])).count === 0, 'applicant cannot approve themself');

  // Bans
  ok((await as(db, U.admin, `select public.admin_set_ban($1, true, 'Spam', 7)`, [U.admin.id])).error?.includes('own'), 'admin cannot ban self');
  ok((await as(db, U.admin, `select public.admin_set_ban($1, true, 'x', null)`, [U.super.id])).error?.includes('Admins'), 'admin cannot ban the super admin');
  ok((await as(db, U.s1, `select public.admin_set_ban($1, true, 'x', null)`, [U.s2.id])).error?.includes('Only admins'), 'student cannot ban');
  const ban = await as(db, U.admin, `select public.admin_set_ban($1, true, 'Spam requests', 7)`, [U.s2.id]);
  ok(!ban.error, 'admin bans a student', JSON.stringify(ban));
  ok((await db.query(`select count(*)::int as n from public.sessions where student_id = $1 and status = 'Pending' and starts_at > now()`, [U.s2.id])).rows[0].n === 0, 'banned student’s open requests cancelled');
  ok((await notes('m1')).some((n) => n.body?.includes('M3allim team cancelled')), 'mentor told the team cancelled');
  ok((await as(db, U.s2, `select public.whoami() as w`)).rows[0].w.banned === true, 'banned flag in whoami');
  ok((await as(db, U.s2, `insert into public.messages (sender_id, recipient_id, body) values ($1, $2, 'x')`, [U.s2.id, U.m1.id])).error, 'banned student cannot chat');
  ok((await as(db, U.s2, `insert into public.favorites (student_id, mentor_id) values ($1, $2)`, [U.s2.id, U.m1.id])).error, 'banned student cannot save mentors');

  // Support (banned people can appeal)
  const t = await as(db, U.s2, `select public.open_support_ticket('Ban appeal please', 'Ban appeal', 'I was not spamming') as id`);
  ok(!t.error, 'banned student opens a support ticket', JSON.stringify(t));
  const tid = t.rows[0].id;
  ok((await notes('admin')).some((n) => n.title === 'New support request'), 'admins notified of ticket');
  ok((await notes('super')).some((n) => n.title === 'New support request'), 'super admin notified of ticket');
  ok((await as(db, U.s1, `select * from public.support_messages where ticket_id = $1`, [tid])).rows.length === 0, 'other students cannot read the ticket');
  ok(!(await as(db, U.admin, `insert into public.support_messages (ticket_id, sender_id, body) values ($1, $2, 'Looking into it')`, [tid, U.admin.id])).error, 'admin replies');
  ok((await db.query(`select status from public.support_tickets where id = $1`, [tid])).rows[0].status === 'Answered', 'ticket marked answered');
  ok((await notes('s2')).some((n) => n.kind === 'support'), 'student notified of reply');
  ok((await as(db, U.s2, `update public.support_tickets set status = 'Answered' where id = $1`, [tid])).error, 'student cannot mark answered');
  ok(!(await as(db, U.s2, `update public.support_tickets set status = 'Closed' where id = $1`, [tid])).error, 'student closes own ticket');

  ok(!(await as(db, U.admin, `select public.admin_set_ban($1, false)`, [U.s2.id])).error, 'admin unbans');
  ok((await notes('s2')).some((n) => n.title.includes('active again')), 'unbanned student notified');

  // Admin chat
  ok(!(await as(db, U.admin, `insert into public.messages (sender_id, recipient_id, body) values ($1, $2, 'Hello from the team')`, [U.admin.id, U.s1.id])).error, 'admin messages any student');
  ok(!(await as(db, U.s1, `insert into public.messages (sender_id, recipient_id, body) values ($1, $2, 'Thanks')`, [U.s1.id, U.admin.id])).error, 'student replies to admin');
  ok((await as(db, U.s1, `select * from public.staff_among($1)`, [[U.admin.id, U.m1.id]])).rows.length === 1, 'chat can tell who is staff');

  // Reports
  const rep = await as(db, U.s1, `insert into public.reports (reporter_id, reported_id, reason) values ($1, $2, 'Didn’t show up') returning id`, [U.s1.id, U.m1.id]);
  ok(!rep.error, 'student reports a mentor', JSON.stringify(rep));
  ok((await notes('admin')).some((n) => n.title === 'New report'), 'admins notified of report');
  ok((await as(db, U.m1, `select * from public.reports`)).rows.length === 0, 'reported mentor cannot see the report');
  ok(!(await as(db, U.admin, `update public.reports set status = 'Resolved', admin_note = 'Warned' where id = $1`, [rep.rows[0].id])).error, 'admin resolves report');
  ok((await notes('s1')).some((n) => n.title === 'Your report was reviewed'), 'reporter notified');

  // Announcements
  const ann = await as(db, U.admin, `insert into public.announcements (title, body, audience, sent_by) values ('Hello students', 'Welcome', 'Students', $1) returning id`, [U.admin.id]);
  ok(!ann.error, 'admin sends announcement', JSON.stringify(ann));
  const rec = (await db.query(`select recipients from public.announcements where id = $1`, [ann.rows[0].id])).rows[0].recipients;
  ok(rec === 2, 'delivered to students only (s1, s2)', rec);
  ok((await as(db, U.s1, `insert into public.announcements (title, body, audience, sent_by) values ('Hey', 'x', 'Everyone', $1)`, [U.s1.id])).error, 'student cannot send announcements');

  // Notifications privacy
  ok((await as(db, U.s1, `insert into public.notifications (user_id, kind, title) values ($1, 'x', 'fake')`, [U.s2.id])).error, 'nobody can create notifications directly');
  ok((await as(db, U.s1, `select public.notify($1, 'x', 'fake')`, [U.s2.id])).error, 'notify() not callable from the website');
  ok((await as(db, U.s1, `select public.log_action('fake')`)).error, 'log_action() not callable from the website');
  ok((await as(db, U.s1, `update public.notifications set title = 'x' where user_id = $1`, [U.s1.id])).error, 'notification text is read-only');
  ok(!(await as(db, U.s1, `update public.notifications set read_at = now() where user_id = $1`, [U.s1.id])).error, 'student marks notifications read');
  ok((await as(db, U.s1, `select * from public.notifications where user_id <> $1`, [U.s1.id])).rows.length === 0, 'student sees only own notifications');

  // Stats, users, audit
  ok((await as(db, U.admin, `select * from public.admin_list_users()`)).rows.length === 8, 'admin lists users with emails');
  ok((await as(db, U.s1, `select * from public.admin_list_users()`)).rows.length === 0, 'student lists no users');
  const stats = (await as(db, U.admin, `select public.admin_stats() as s`)).rows[0].s;
  ok(stats && stats.weekly.length === 8 && stats.mentors === 3, 'admin stats', JSON.stringify(stats));
  ok((await as(db, U.s1, `select public.admin_stats() as s`)).rows[0].s === null, 'student gets no stats');
  ok((await as(db, U.s1, `select * from public.audit_log`)).rows.length === 0, 'student cannot read the audit log');
  ok((await as(db, U.admin, `select * from public.audit_log`)).rows.length > 0, 'admin reads the audit log');

  // Suspension
  ok(!(await as(db, U.super, `update public.admins set status = 'Suspended' where email = 'admin@m3allim.test'`)).error, 'super admin suspends an admin');
  ok((await as(db, U.admin, `select public.whoami() as w`)).rows[0].w.is_admin === false, 'suspended admin loses access');
  ok((await as(db, U.admin, `select id from public.mentor_applications`)).rows.length === 0, 'suspended admin sees no applications');

  // Settings, maintenance, health
  const sm = await as(db, U.super, `update public.platform_settings set maintenance_mode = true, max_pending_requests = 5`);
  ok(!sm.error && sm.count === 1, 'super admin changes settings', JSON.stringify(sm));
  const h = (await as(db, U.super, `select public.system_health() as h`)).rows[0].h;
  ok(h && h.tables.length === 10 && h.storage.length === 2, 'system health', JSON.stringify(h)?.slice(0, 200));
  const actions = await audit();
  for (const a of ['Added admin', 'Approved mentor application', 'Declined mentor application', 'Banned user', 'Unbanned user', 'Resolved report #1', 'Sent announcement', 'Suspended admin', 'Turned maintenance mode on']) {
    ok(actions.includes(a), `audit log has "${a}"`, JSON.stringify(actions));
  }

  // Banned mentors leave the directory
  await as(db, U.super, `select public.admin_set_ban($1, true, 'Fake profile', null)`, [U.m2.id]);
  ok((await as(db, null, `select id from public.mentors where id = $1`, [U.m2.id])).rows.length === 0, 'banned mentor hidden from guests');
  ok((await as(db, U.s1, `select id from public.mentors where id = $1`, [U.m2.id])).rows.length === 1, 'past contacts still see the name');
  const leak = await as(db, U.s1, `select ban_reason from public.profiles where id = $1`, [U.m2.id]);
  ok(leak.error?.includes('permission denied'), 'contacts cannot read the ban reason', JSON.stringify(leak));
  ok((await as(db, U.m2, `select public.whoami() as w`)).rows[0].w.ban_reason === 'Fake profile', 'banned person sees own reason via whoami');
  ok((await notes('m2')).some((n) => n.title === 'Your account was suspended'), 'banned person notified');
  ok((await as(db, U.super, `select ban_reason from public.admin_list_users() where id = $1`, [U.m2.id])).rows[0]?.ban_reason === 'Fake profile', 'admins see the reason in the user list');
  const reqBanned = await as(db, U.s1, `insert into public.sessions (student_id, mentor_id, topic, starts_at) values ($1, $2, 'x', now() + interval '3 days')`, [U.s1.id, U.m2.id]);
  ok(reqBanned.error, 'cannot request a banned mentor');
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
