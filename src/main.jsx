// Entry point: global styles, the router, and the three app-wide providers.
//   AuthProvider      who is signed in and their role
//   SettingsProvider  platform settings (maintenance mode, sign-up rules…), live
//   LiveProvider      notification feed and unread counts for the menus, live
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { LiveProvider } from './context/LiveContext.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <SettingsProvider>
          <LiveProvider>
            <App />
          </LiveProvider>
        </SettingsProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
