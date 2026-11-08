import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ClerkProvider } from '@clerk/react';
import { theme } from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { wakeUpServer } from './services/server-health';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { LinksListPage } from './pages/LinksListPage';
import { LinkAnalyticsPage } from './pages/LinkAnalyticsPage';
import { DashboardAnalyticsPage } from './pages/DashboardAnalyticsPage';
import { DashboardQrPage } from './pages/DashboardQrPage';
import { DashboardDomainsPage } from './pages/DashboardDomainsPage';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  useEffect(() => {
    wakeUpServer();
  }, []);

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <ErrorBoundary>
              <BrowserRouter>
                <Routes>
                  {/* Public Marketing Landing Page (Option B: Shows landing page with dynamic dashboard CTA if logged in) */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Public Auth Routes */}
                  <Route path="/login/*" element={<LoginPage />} />
                  <Route path="/register/*" element={<RegisterPage />} />

                  {/* Protected Dashboard Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<DashboardPage />} />
                    <Route path="links" element={<LinksListPage />} />
                    <Route path="qr" element={<DashboardQrPage />} />
                    <Route path="domains" element={<DashboardDomainsPage />} />
                    <Route path="analytics" element={<DashboardAnalyticsPage />} />
                    <Route path="analytics/:id" element={<LinkAnalyticsPage />} />
                  </Route>

                  {/* Backward compatibility redirects for legacy routes */}
                  <Route path="/qr" element={<Navigate to="/dashboard/qr" replace />} />
                  <Route path="/links" element={<Navigate to="/dashboard/links" replace />} />
                  <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
                  <Route path="/analytics/:id" element={<Navigate to="/dashboard/analytics" replace />} />

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;
