import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

// Auth
import Login from "./pages/Login.jsx";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminAlerts from "./pages/admin/AdminAlerts.jsx";
import AdminRescueStatus from "./pages/admin/AdminRescueStatus.jsx";
import AdminReliefCamps from "./pages/admin/AdminReliefCamps.jsx";
import AdminDonations from "./pages/admin/AdminDonations.jsx";
import AdminReports from "./pages/admin/AdminReports.jsx";
import AdminVolunteers from "./pages/admin/AdminVolunteers.jsx";
import AdminSOS from "./pages/admin/AdminSOS.jsx";
import AdminNotifications from "./pages/admin/AdminNotifications.jsx";
import AdminAnalytics from "./pages/admin/AdminAnalytics.jsx";
import AdminRiskZones from "./pages/admin/AdminRiskZones.jsx";
import AdminDisasterTypes from "./pages/admin/AdminDisasterTypes.jsx";
import AdminMissions from "./pages/admin/AdminMissions.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";
import NotificationListener from "./components/NotificationListener.jsx";

// Volunteer pages
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard.jsx";

// Public pages
import PublicHome from "./pages/public/PublicHome.jsx";
import PublicRisk from "./pages/public/PublicRisk.jsx";
import PublicAlerts from "./pages/public/PublicAlerts.jsx";
import PublicRequestHelp from "./pages/public/PublicRequestHelp.jsx";
import PublicReliefCamps from "./pages/public/PublicReliefCamps.jsx";
import PublicDonate from "./pages/public/PublicDonate.jsx";
import ReportDisaster from "./pages/public/ReportDisaster.jsx";
import SOSPage from "./pages/public/SOSPage.jsx";
import VolunteerPage from "./pages/public/VolunteerPage.jsx";
import DonationTransparency from "./pages/public/DonationTransparency.jsx";
import DisasterMap from "./pages/public/DisasterMap.jsx";
import UserDashboard from "./pages/public/UserDashboard.jsx";
import MediaGallery from "./pages/public/MediaGallery.jsx";
import DisasterTimeline from "./pages/public/DisasterTimeline.jsx";

const App = () => {
  return (
    <>
      <NotificationListener />
      <Routes>
      {/* ── Public Portal ── */}
      <Route path="/" element={<PublicHome />} />
      <Route path="/alerts" element={<PublicAlerts />} />
      <Route path="/risk" element={<PublicRisk />} />
      <Route path="/request-help" element={<PublicRequestHelp />} />
      <Route path="/camps" element={<PublicReliefCamps />} />
      <Route path="/donate" element={<PublicDonate />} />
      <Route path="/map" element={<DisasterMap />} />
      <Route path="/transparency" element={<DonationTransparency />} />
      <Route path="/report-disaster" element={<ReportDisaster />} />
      <Route path="/sos" element={<SOSPage />} />
      <Route path="/volunteer" element={<VolunteerPage />} />
      <Route path="/gallery" element={<MediaGallery />} />
      <Route path="/timeline/:id" element={<DisasterTimeline />} />

      {/* ── Auth ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ── User Dashboard (auth required, any role) ── */}
      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "rescue_team", "volunteer", "citizen", "admin", "rescue", "user"]}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer/dashboard"
        element={
          <ProtectedRoute allowedRoles={["volunteer", "super_admin", "emergency_admin"]}>
            <VolunteerDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── Admin Portal ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/alerts"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminAlerts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/rescue"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminRescueStatus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/missions"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminMissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/camps"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminReliefCamps />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/donations"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminDonations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/volunteers"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminVolunteers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sos"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminSOS />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/risk-zones"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminRiskZones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/disaster-types"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminDisasterTypes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "emergency_admin", "admin"]}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      {/* ── Redirects ── */}
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
};

export default App;
