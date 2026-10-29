import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Landing from './pages/public/Landing.jsx';
import Browse from './pages/public/Browse.jsx';
import MentorProfile from './pages/public/MentorProfile.jsx';
import ConfirmBooking from './pages/public/ConfirmBooking.jsx';
import BookingConfirmed from './pages/public/BookingConfirmed.jsx';
import SignIn from './pages/public/SignIn.jsx';
import SignUp from './pages/public/SignUp.jsx';
import Welcome from './pages/public/Welcome.jsx';
import ResetPassword from './pages/public/ResetPassword.jsx';
import Account from './pages/public/Account.jsx';

import MentorApply from './pages/mentor/MentorApply.jsx';
import MentorStatus from './pages/mentor/MentorStatus.jsx';

import StudentDashboard from './pages/student/StudentDashboard.jsx';
import MySessions from './pages/student/MySessions.jsx';
import Messages from './pages/student/Messages.jsx';

import AdminOverview from './pages/admin/AdminOverview.jsx';
import Verification from './pages/admin/Verification.jsx';
import Reports from './pages/admin/Reports.jsx';
import Users from './pages/admin/Users.jsx';
import Announcements from './pages/admin/Announcements.jsx';

import PlatformOverview from './pages/superadmin/PlatformOverview.jsx';
import ManageAdmins from './pages/superadmin/ManageAdmins.jsx';
import PlatformSettings from './pages/superadmin/PlatformSettings.jsx';
import AuditLog from './pages/superadmin/AuditLog.jsx';

import ScreenIndex from './pages/ScreenIndex.jsx';
import { AuthRedirect, RequireAuth } from './components/auth.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AuthRedirect />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/mentors" element={<Browse />} />
        <Route path="/mentors/:id" element={<MentorProfile />} />
        <Route path="/book/:id" element={<ConfirmBooking />} />
        <Route path="/book/:id/confirmed" element={<BookingConfirmed />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/account" element={<Account />} />

        {/* Mentor onboarding */}
        <Route path="/mentor/apply" element={<MentorApply />} />
        <Route path="/mentor/status" element={<MentorStatus />} />

        {/* Student */}
        <Route path="/student" element={<RequireAuth><StudentDashboard /></RequireAuth>} />
        <Route path="/student/sessions" element={<RequireAuth><MySessions /></RequireAuth>} />
        <Route path="/student/messages" element={<RequireAuth><Messages /></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth superAdmin><AdminOverview /></RequireAuth>} />
        <Route path="/admin/verification" element={<RequireAuth superAdmin><Verification /></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth superAdmin><Reports /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth superAdmin><Users /></RequireAuth>} />
        <Route path="/admin/announcements" element={<RequireAuth superAdmin><Announcements /></RequireAuth>} />

        {/* Super admin */}
        <Route path="/super" element={<RequireAuth superAdmin><PlatformOverview /></RequireAuth>} />
        <Route path="/super/verification" element={<RequireAuth superAdmin><Verification kind="super" /></RequireAuth>} />
        <Route path="/super/admins" element={<RequireAuth superAdmin><ManageAdmins /></RequireAuth>} />
        <Route path="/super/settings" element={<RequireAuth superAdmin><PlatformSettings /></RequireAuth>} />
        <Route path="/super/audit" element={<RequireAuth superAdmin><AuditLog /></RequireAuth>} />

        {/* Dev helper: list of every screen */}
        <Route path="/screens" element={<ScreenIndex />} />
        <Route path="*" element={<ScreenIndex />} />
      </Routes>
    </>
  );
}
