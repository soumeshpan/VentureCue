import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { SessionLayout } from './layouts/SessionLayout';
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage, SignupPage } from './pages/auth/AuthPages';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DiscoverySetupPage } from './pages/discovery/DiscoverySetupPage';
import { DiscoveryPrepPage } from './pages/discovery/DiscoveryPrepPage';
import { DiscoverySessionPage } from './pages/discovery/DiscoverySessionPage';
import { DiscoveryDebriefPage } from './pages/discovery/DiscoveryDebriefPage';
import { PitchSetupPage } from './pages/pitch/PitchSetupPage';
import { PitchAnalysisPage } from './pages/pitch/PitchAnalysisPage';
import { PitchSessionPage } from './pages/pitch/PitchSessionPage';
import { PitchDebriefPage } from './pages/pitch/PitchDebriefPage';
import { SessionsPage } from './pages/sessions/SessionsPage';
import { InsightsPage } from './pages/insights/InsightsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ReviewQueuePage } from './pages/review/ReviewQueuePage';
import { ReviewDetailPage } from './pages/review/ReviewDetailPage';
import { ProgressPage } from './pages/progress/ProgressPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth — redirect logged-in users to dashboard */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Onboarding (authenticated but not onboarded) */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Live avatar sessions — full-screen, no sidebar */}
        <Route element={<SessionLayout />}>
          <Route path="/discovery/session/:id" element={<DiscoverySessionPage />} />
          <Route path="/pitch/session/:id" element={<PitchSessionPage />} />
        </Route>

        {/* Main app — authenticated, sidebar nav */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Discovery flow */}
          <Route path="/discovery/new" element={<DiscoverySetupPage />} />
          <Route path="/discovery/prep/:id" element={<DiscoveryPrepPage />} />
          <Route path="/discovery/debrief/:id" element={<DiscoveryDebriefPage />} />

          {/* Pitch flow */}
          <Route path="/pitch/new" element={<PitchSetupPage />} />
          <Route path="/pitch/analysis/:id" element={<PitchAnalysisPage />} />
          <Route path="/pitch/debrief/:id" element={<PitchDebriefPage />} />

          {/* Review flow */}
          <Route path="/reviews" element={<ReviewQueuePage />} />
          <Route path="/reviews/:id" element={<ReviewDetailPage />} />

          {/* Progress & Analytics */}
          <Route path="/progress" element={<ProgressPage />} />

          {/* Other pages */}
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
