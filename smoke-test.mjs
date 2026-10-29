// Renders every route on the server to catch runtime errors. Run with: node smoke-test.mjs
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const routes = ['/', '/mentors', '/mentors/layla', '/book/layla', '/book/layla/confirmed', '/login', '/signup', '/mentor/apply', '/mentor/status', '/welcome', '/account', '/reset-password', '/student', '/student/sessions', '/student/messages', '/admin', '/admin/verification', '/admin/reports', '/admin/users', '/admin/announcements', '/super', '/super/verification', '/super/admins', '/super/settings', '/super/audit', '/screens'];
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { default: App } = await server.ssrLoadModule('/src/App.jsx');
let failed = 0;
for (const r of routes) {
  try {
    const html = renderToString(React.createElement(MemoryRouter, { initialEntries: [r] }, React.createElement(App)));
    console.log('ok  ', r.padEnd(26), html.length, 'chars');
  } catch (e) { failed++; console.log('FAIL', r, e.message); }
}
await server.close();
process.exit(failed ? 1 : 0);
