import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useAuthStore } from './stores/authStore';
import { SidebarProvider } from './contexts/SidebarContext';
import { AppLayout } from './components/layout/AppLayout';

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DCCPage = lazy(() => import('./pages/DCCPage').then(m => ({ default: m.DCCPage })));
const DCCRuleSetupPage = lazy(() => import('./pages/DCCRuleSetupPage').then(m => ({ default: m.DCCRuleSetupPage })));
const DCCDemandGenerationPage = lazy(() => import('./pages/DCCDemandGenerationPage').then(m => ({ default: m.DCCDemandGenerationPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();

    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg: string = event.reason?.message ?? '';
      if (
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        /Loading chunk \d+ failed/.test(msg)
      ) {
        const key = 'chunk_reload_attempted';
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
        }
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  return (
    <BrowserRouter>
      <SidebarProvider>
        <ToastContainer />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['public', 'dept_user', 'govt_official', 'admin', 'manager']}>
                    <AppLayout><DCCPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dcc/rule-setup"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AppLayout><DCCRuleSetupPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dcc/generate"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AppLayout><DCCDemandGenerationPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AppLayout><ProfilePage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Legacy /dcc redirect to dashboard */}
              <Route path="/dcc" element={<Navigate to="/dashboard" replace />} />

              {/* Wildcard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
