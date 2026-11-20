// Every page of M3allim and who may open it. Read this file top to bottom for a map of the website.
// <RequireRole allow={[...]}> sends guests to log in and other roles to their own home page.
// The same rules are enforced again by the database (supabase/schema.sql).
import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { ROLES, CAN_ASK_SUPPORT, CAN_CHAT, SIGNED_IN, STAFF } from './config/roles.js';
import { AppGate } from './components/guards/AppGate.jsx';
import { AuthRedirect } from './components/guards/AuthRedirect.jsx';
import { ContinueHome, GuestOnly, RequireRole } from './components/guards/RequireRole.jsx';

// Guest (everyone)
import Landing from './pages/guest/Landing.jsx';
import BrowseMentors from './pages/guest/BrowseMentors.jsx';
import MentorProfile from './pages/guest/MentorProfile.jsx';
// Accounts
import SignIn from './pages/auth/SignIn.jsx';
import SignUp from './pages/auth/SignUp.jsx';
import Welcome from './pages/auth/Welcome.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
// Student
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import MySessions from './pages/student/MySessions.jsx';
import SavedMentors from './pages/student/SavedMentors.jsx';
// Mentor
import MentorApply from './pages/mentor/MentorApply.jsx';
import ApplicationStatus from './pages/mentor/ApplicationStatus.jsx';
import MentorDashboard from './pages/mentor/MentorDashboard.jsx';
import EditMentorProfile from './pages/mentor/EditMentorProfile.jsx';
import Availability from './pages/mentor/Availability.jsx';
import MentorReviews from './pages/mentor/MentorReviews.jsx';
// Every signed-in role
import Account from './pages/shared/Account.jsx';
import Messages from './pages/shared/Messages.jsx';
import Notifications from './pages/shared/Notifications.jsx';
import HelpCenter from './pages/shared/HelpCenter.jsx';
// Admin (admins and the super admin)
import AdminOverview from './pages/admin/AdminOverview.jsx';
import Verification from './pages/admin/Verification.jsx';
import Reports from './pages/admin/Reports.jsx';
import SupportInbox from './pages/admin/SupportInbox.jsx';
import Users from './pages/admin/Users.jsx';
import Announcements from './pages/admin/Announcements.jsx';
// Super admin only
import ManageAdmins from './pages/super-admin/ManageAdmins.jsx';
import PlatformSettings from './pages/super-admin/PlatformSettings.jsx';
import SystemHealth from './pages/super-admin/SystemHealth.jsx';
import AuditLog from './pages/super-admin/AuditLog.jsx';
// System
import NotFound from './pages/system/NotFound.jsx';

const only = (allow, page) => <RequireRole allow={allow}>{page}</RequireRole>;

function ScrollToTop() {
  const { pathname } = useLocation();
  // Braces matter: Chrome's scrollTo returns a Promise, and an effect may only return a clean-up function.
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
      <AppGate>
        <Routes>
          {/* ---------- Guest: browse mentors and read profiles, no booking or chat ---------- */}
          <Route path="/" element={<Landing />} />
          <Route path="/mentors" element={<BrowseMentors />} />
          <Route path="/mentors/:id" element={<MentorProfile />} />

          {/* ---------- Accounts: log in, sign up, verify, reset password ---------- */}
          <Route path="/login" element={<GuestOnly><SignIn /></GuestOnly>} />
          <Route path="/signup" element={<GuestOnly><SignUp /></GuestOnly>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/continue" element={<ContinueHome />} />
          <Route path="/welcome" element={only([ROLES.NEW], <Welcome />)} />

          {/* ---------- Student ---------- */}
          <Route path="/student" element={only([ROLES.STUDENT], <StudentDashboard />)} />
          <Route path="/student/sessions" element={only([ROLES.STUDENT], <MySessions />)} />
          <Route path="/student/saved" element={only([ROLES.STUDENT], <SavedMentors />)} />

          {/* ---------- Mentor: apply and get verified, then mentor ---------- */}
          <Route path="/mentor/apply" element={only([ROLES.APPLICANT], <MentorApply />)} />
          <Route path="/mentor/status" element={only([ROLES.APPLICANT, ROLES.MENTOR], <ApplicationStatus />)} />
          <Route path="/mentor" element={only([ROLES.MENTOR], <MentorDashboard />)} />
          <Route path="/mentor/profile" element={only([ROLES.MENTOR], <EditMentorProfile />)} />
          <Route path="/mentor/availability" element={only([ROLES.MENTOR], <Availability />)} />
          <Route path="/mentor/reviews" element={only([ROLES.MENTOR], <MentorReviews />)} />

          {/* ---------- Every signed-in role ---------- */}
          <Route path="/account" element={only(SIGNED_IN, <Account />)} />
          <Route path="/notifications" element={only(SIGNED_IN, <Notifications />)} />
          <Route path="/messages" element={only(CAN_CHAT, <Messages />)} />
          <Route path="/support" element={only(CAN_ASK_SUPPORT, <HelpCenter />)} />

          {/* ---------- Admin (the super admin can open these too) ---------- */}
          <Route path="/admin" element={only(STAFF, <AdminOverview />)} />
          <Route path="/admin/verification" element={only(STAFF, <Verification />)} />
          <Route path="/admin/reports" element={only(STAFF, <Reports />)} />
          <Route path="/admin/support" element={only(STAFF, <SupportInbox />)} />
          <Route path="/admin/users" element={only(STAFF, <Users />)} />
          <Route path="/admin/announcements" element={only(STAFF, <Announcements />)} />

          {/* ---------- Super admin only ---------- */}
          <Route path="/super/admins" element={only([ROLES.SUPER_ADMIN], <ManageAdmins />)} />
          <Route path="/super/settings" element={only([ROLES.SUPER_ADMIN], <PlatformSettings />)} />
          <Route path="/super/health" element={only([ROLES.SUPER_ADMIN], <SystemHealth />)} />
          <Route path="/super/audit" element={only([ROLES.SUPER_ADMIN], <AuditLog />)} />

          {/* ---------- Old addresses, kept so existing links still work ---------- */}
          <Route path="/super" element={<Navigate to="/super/health" replace />} />
          <Route path="/super/verification" element={<Navigate to="/admin/verification" replace />} />
          <Route path="/super/reports" element={<Navigate to="/admin/reports" replace />} />
          <Route path="/student/messages" element={<Navigate to="/messages" replace />} />
          <Route path="/mentor/messages" element={<Navigate to="/messages" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppGate>
    </>
  );
}
