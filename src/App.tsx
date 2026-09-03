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
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const MapSearchPage = lazy(() => import('./pages/MapSearchPage').then(m => ({ default: m.MapSearchPage })));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage').then(m => ({ default: m.PropertyDetailPage })));
const PropertiesPage = lazy(() => import('./pages/PropertiesPage').then(m => ({ default: m.PropertiesPage })));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage').then(m => ({ default: m.UserDashboardPage })));
const ManagerPage = lazy(() => import('./pages/ManagerPage').then(m => ({ default: m.ManagerPage })));
const CreatePropertyPage = lazy(() => import('./pages/CreatePropertyPage').then(m => ({ default: m.CreatePropertyPage })));
const PaymentGatewayPage = lazy(() => import('./pages/PaymentGatewayPage').then(m => ({ default: m.PaymentGatewayPage })));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage').then(m => ({ default: m.BookingConfirmationPage })));
const BookingTrackingPage = lazy(() => import('./pages/BookingTrackingPage').then(m => ({ default: m.BookingTrackingPage })));
const CheckInPage = lazy(() => import('./pages/CheckInPage').then(m => ({ default: m.CheckInPage })));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage').then(m => ({ default: m.MaintenancePage })));
const AdHocLinksPage = lazy(() => import('./pages/AdHocLinksPage').then(m => ({ default: m.AdHocLinksPage })));
const BookingHistoryPage = lazy(() => import('./pages/BookingHistoryPage').then(m => ({ default: m.BookingHistoryPage })));
const BookingDetailPage = lazy(() => import('./pages/BookingDetailPage').then(m => ({ default: m.BookingDetailPage })));
const AdHocBookingPage = lazy(() => import('./pages/AdHocBookingPage').then(m => ({ default: m.AdHocBookingPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const QuarterFreeviewPage = lazy(() => import('./pages/QuarterFreeviewPage').then(m => ({ default: m.QuarterFreeviewPage })));
const QuarterDetailPage = lazy(() => import('./pages/QuarterDetailPage').then(m => ({ default: m.QuarterDetailPage })));
const QuarterRequestsPage = lazy(() => import('./pages/QuarterRequestsPage').then(m => ({ default: m.QuarterRequestsPage })));
const QuarterManagerPage = lazy(() => import('./pages/QuarterManagerPage').then(m => ({ default: m.QuarterManagerPage })));
const QuarterRentPage = lazy(() => import('./pages/QuarterRentPage').then(m => ({ default: m.QuarterRentPage })));
const MTSetupPage = lazy(() => import('./pages/MTSetupPage').then(m => ({ default: m.MTSetupPage })));
const DCCPage = lazy(() => import('./pages/DCCPage').then(m => ({ default: m.DCCPage })));
const DCCRuleSetupPage = lazy(() => import('./pages/DCCRuleSetupPage').then(m => ({ default: m.DCCRuleSetupPage })));
const DCCDemandGenerationPage = lazy(() => import('./pages/DCCDemandGenerationPage').then(m => ({ default: m.DCCDemandGenerationPage })));
const DCCDemandDetailPage = lazy(() => import('./pages/DCCDemandDetailPage').then(m => ({ default: m.DCCDemandDetailPage })));
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

    // Catch chunk-load promise rejections that escape the React tree.
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
              {/* ── Public routes (no sidebar) ── */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/map-search" element={<MapSearchPage />} />
              <Route path="/track-booking" element={<BookingTrackingPage />} />
              <Route path="/payment" element={<PaymentGatewayPage />} />
              <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
              <Route path="/book/:token" element={<AdHocBookingPage />} />

              {/* ── Protected routes (with sidebar layout) ── */}
              <Route
                path="/properties"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AppLayout><PropertiesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AppLayout><ManagerPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* Static /properties/* routes MUST come before the :id wildcard */}
              <Route
                path="/properties/create"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AppLayout>
                      <ErrorBoundary><CreatePropertyPage /></ErrorBoundary>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AppLayout>
                      <ErrorBoundary><CreatePropertyPage /></ErrorBoundary>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* Wildcard property detail — must come after all static /properties/* routes */}
              <Route
                path="/properties/:id"
                element={
                  <AppLayout>
                    <ErrorBoundary><PropertyDetailPage /></ErrorBoundary>
                  </AppLayout>
                }
              />
              <Route
                path="/check-in"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AppLayout><CheckInPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['public', 'dept_user', 'govt_official', 'admin', 'manager']}>
                    <AppLayout><UserDashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maintenance"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AppLayout><MaintenancePage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ad-hoc-links"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AppLayout><AdHocLinksPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings/history"
                element={
                  <ProtectedRoute>
                    <AppLayout><BookingHistoryPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout><AdminPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/bookings" element={<Navigate to="/bookings/history" replace />} />
              <Route
                path="/bookings/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout><BookingDetailPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quarters"
                element={
                  <ProtectedRoute allowedRoles={['govt_official', 'admin', 'manager']}>
                    <AppLayout><QuarterFreeviewPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* Static /quarters/* routes MUST come before the :id wildcard */}
              <Route
                path="/quarters/requests"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin', 'govt_official']}>
                    <AppLayout><QuarterRequestsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quarters/manager"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout><QuarterManagerPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quarters/rent"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin', 'govt_official', 'dept_user', 'public']}>
                    <AppLayout><QuarterRentPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mt-setup"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AppLayout><MTSetupPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dcc"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin', 'govt_official', 'dept_user', 'public']}>
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
                path="/dcc/demand/:demandId"
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin', 'govt_official', 'dept_user', 'public']}>
                    <AppLayout><DCCDemandDetailPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* Wildcard quarter detail — must come after all static /quarters/* routes */}
              <Route
                path="/quarters/:id"
                element={
                  <ProtectedRoute allowedRoles={['govt_official', 'admin', 'manager']}>
                    <AppLayout>
                      <ErrorBoundary><QuarterDetailPage /></ErrorBoundary>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AppLayout><ProfilePage /></AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
