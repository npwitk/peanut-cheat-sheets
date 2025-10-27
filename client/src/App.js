import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CheatSheetDetail from './pages/CheatSheetDetail';
import MyPurchases from './pages/MyPurchases';
import AdminDashboard from './pages/AdminDashboard';
import UploadCheatSheet from './pages/UploadCheatSheet';
import EditCheatSheet from './pages/EditCheatSheet';
import AuthCallback from './pages/AuthCallback';
import Support from './pages/Support';
import Cart from './pages/Cart';
import ApplyToBeSeller from './pages/ApplyToBeSeller';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SellerApprovals from './pages/admin/SellerApprovals';
import CheatSheetApprovals from './pages/admin/CheatSheetApprovals';
import UserManagement from './pages/admin/UserManagement';
import Analytics from './pages/admin/Analytics';
import AllCheatSheets from './pages/admin/AllCheatSheets';
import GlobalStyles from './styles/GlobalStyles';

// Create a client with caching configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Cache persists for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Retry failed requests once
    },
  },
});

// Protected route wrapper
const ProtectedRoute = ({ children, adminOnly = false, uploaderOnly = false, staffOnly = false }) => {
  const { isAuthenticated, isAdmin, canUpload, canManageApprovals, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (staffOnly && !canManageApprovals) {
    return <Navigate to="/" />;
  }

  if (uploaderOnly && !canUpload) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cheatsheet/:id" element={<CheatSheetDetail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route
          path="/my-purchases"
          element={
            <ProtectedRoute>
              <MyPurchases />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute staffOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/seller-approvals"
          element={
            <ProtectedRoute staffOnly>
              <SellerApprovals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/cheatsheet-approvals"
          element={
            <ProtectedRoute staffOnly>
              <CheatSheetApprovals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute adminOnly>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/cheatsheets"
          element={
            <ProtectedRoute adminOnly>
              <AllCheatSheets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/upload"
          element={
            <ProtectedRoute uploaderOnly>
              <UploadCheatSheet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cheatsheet/:id/edit"
          element={
            <ProtectedRoute>
              <EditCheatSheet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/apply-seller"
          element={
            <ProtectedRoute>
              <ApplyToBeSeller />
            </ProtectedRoute>
          }
        />

        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg, #363636)',
            color: 'var(--toast-text, #fff)',
            borderRadius: '10px',
            padding: '12px 20px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#34C759',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF3B30',
              secondary: '#fff',
            },
            duration: 5000,
          },
          loading: {
            duration: Infinity,
            iconTheme: {
              primary: '#007AFF',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ThemeProvider>
            <GlobalStyles />
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
