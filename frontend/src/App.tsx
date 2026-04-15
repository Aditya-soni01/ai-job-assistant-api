import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import OAuthCallbackPage from '@/pages/OAuthCallbackPage';
import LandingPage from '@/pages/LandingPage';
import DashboardPage from '@/pages/DashboardPage';
import ResumePage from '@/pages/ResumePage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import SupportPage from '@/pages/SupportPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import OnboardingTour from '@/components/OnboardingTour';
import { isAuthenticated } from '@/store/authStore';
import apiClient from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// Wraps the authenticated layout and injects the onboarding tour for new users
const AuthenticatedLayout: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await apiClient.get('/profile')).data,
    enabled: isAuthenticated(),
  });

  useEffect(() => {
    if (profile && !checked) {
      setChecked(true);
      if (!profile.is_profile_complete) {
        setShowOnboarding(true);
      }
    }
  }, [profile, checked]);

  return (
    <>
      <AppLayout />
      {showOnboarding && <OnboardingTour onDismiss={() => setShowOnboarding(false)} />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute><AuthenticatedLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="resume" element={<ResumePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
