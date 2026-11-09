import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline, GlobalStyles, Box, CircularProgress } from '@mui/material';
import { ClerkProvider } from '@clerk/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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

// Lazy-loaded heavy dashboard views for instant landing page and initial chunk loading
const LinksListPage = React.lazy(() =>
  import('./pages/LinksListPage').then((m) => ({ default: m.LinksListPage })),
);
const DashboardQrPage = React.lazy(() =>
  import('./pages/DashboardQrPage').then((m) => ({ default: m.DashboardQrPage })),
);
const DashboardDomainsPage = React.lazy(() =>
  import('./pages/DashboardDomainsPage').then((m) => ({ default: m.DashboardDomainsPage })),
);
const DashboardAnalyticsPage = React.lazy(() =>
  import('./pages/DashboardAnalyticsPage').then((m) => ({ default: m.DashboardAnalyticsPage })),
);
const LinkAnalyticsPage = React.lazy(() =>
  import('./pages/LinkAnalyticsPage').then((m) => ({ default: m.LinkAnalyticsPage })),
);
const DashboardSettingsPage = React.lazy(() =>
  import('./pages/DashboardSettingsPage').then((m) => ({ default: m.DashboardSettingsPage })),
);

// Lazy-loaded targeted public solution & tool landing pages for SEO intent
const AgencySolutionPage = React.lazy(() =>
  import('./pages/AgencySolutionPage').then((m) => ({ default: m.AgencySolutionPage })),
);
const BulkDynamicQrPage = React.lazy(() =>
  import('./pages/BulkDynamicQrPage').then((m) => ({ default: m.BulkDynamicQrPage })),
);
const UpiQrToolPage = React.lazy(() =>
  import('./pages/UpiQrToolPage').then((m) => ({ default: m.UpiQrToolPage })),
);

const PageLoaderFallback: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress size={36} sx={{ color: '#587529' }} />
  </Box>
);

const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_bWFnaWNhbC10dXJrZXktMjIxNS5jbGVyay5hY2NvdW50cy5kZXYk';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh data window prevents duplicate calls across tab switches
      gcTime: 1000 * 60 * 30, // 30 minutes in-memory cache retention
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const toastGlobalStyles = (
  <GlobalStyles
    styles={{
      '.Toastify__toast': {
        borderRadius: '9px !important',
        fontFamily: 'Manrope, -apple-system, sans-serif !important',
        border: '1px solid #E4E9DC !important',
        boxShadow: '0 8px 24px -4px rgba(28, 36, 17, 0.1) !important',
        color: '#1C2411 !important',
        fontSize: '0.875rem !important',
      },
      '.Toastify__progress-bar--success': {
        background: '#587529 !important',
      },
      '.Toastify__progress-bar--info': {
        background: '#587529 !important',
      },
      '.Toastify__progress-bar--error': {
        background: '#D9483B !important',
      },
      '.Toastify__progress-bar--warning': {
        background: '#F4BE38 !important',
      },
      '.Toastify__toast--success .Toastify__toast-icon svg': {
        fill: '#71951E !important',
      },
    }}
  />
);

export const App: React.FC = () => {
  useEffect(() => {
    wakeUpServer();
  }, []);

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {toastGlobalStyles}
          <AuthProvider>
            <ErrorBoundary>
              <BrowserRouter>
                <Routes>
                  {/* Public Marketing Landing Page (Option B: Shows landing page with dynamic dashboard CTA if logged in) */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Public SEO & Solution Landing Pages */}
                  <Route
                    path="/solutions/agencies"
                    element={
                      <Suspense fallback={<PageLoaderFallback />}>
                        <AgencySolutionPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/solutions/bulk-dynamic-qr"
                    element={
                      <Suspense fallback={<PageLoaderFallback />}>
                        <BulkDynamicQrPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/tools/upi-qr-generator"
                    element={
                      <Suspense fallback={<PageLoaderFallback />}>
                        <UpiQrToolPage />
                      </Suspense>
                    }
                  />

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
                    <Route
                      path="links"
                      element={
                        <Suspense fallback={<PageLoaderFallback />}>
                          <LinksListPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="qr"
                      element={
                        <Suspense fallback={<PageLoaderFallback />}>
                          <DashboardQrPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="domains"
                      element={
                        <Suspense fallback={<PageLoaderFallback />}>
                          <DashboardDomainsPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="analytics"
                      element={
                        <Suspense fallback={<PageLoaderFallback />}>
                          <DashboardAnalyticsPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="analytics/:id"
                      element={
                        <Suspense fallback={<PageLoaderFallback />}>
                          <LinkAnalyticsPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="settings"
                      element={
                        <Suspense fallback={<PageLoaderFallback />}>
                          <DashboardSettingsPage />
                        </Suspense>
                      }
                    />
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
              <ToastContainer
                position="bottom-right"
                autoClose={3500}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                theme="light"
              />
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;
