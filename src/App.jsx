import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar, BottomNav } from "./components/Navbar";
import { ToastContainer, Spinner } from "./components/UI";

// Pages
import Home from "./pages/Home";
import { LoginPage, RegisterPage } from "./pages/Auth";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import { ServicesPage, ServiceDetail } from "./pages/Services";
import { RequestsPage, RequestDetail } from "./pages/Requests";
import { OrdersPage, OrderDetail } from "./pages/Orders";
import Wallet from "./pages/Wallet";
import { EscrowPage, InstallmentsPage } from "./pages/Escrow";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import SellerDashboard from "./pages/SellerDashboard";
import MyListings from "./pages/MyListings";
import MomoPayment from "./pages/MomoPayment";
import Manual from "./pages/Manual";
import { AdsPage, FeaturedPage } from "./pages/Ads";
import Subscriptions from "./pages/Subscriptions";
import StorePage from "./pages/Store";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";

// Admin
import AdminDashboard, { AdminLayout } from "./pages/admin/AdminDashboard";
import { AdminUsers, AdminSellers, AdminProducts, AdminServices, AdminVerification } from "./pages/admin/AdminManage";
import { AdminOrders, AdminPayments, AdminEscrow, AdminWithdrawals, AdminReports } from "./pages/admin/AdminTransactions";
import { AdminSettings, AdminAnalytics, AdminLogs, AdminAnnounce, AdminAds, AdminFeatured, AdminSuspiciousActivity } from "./pages/admin/AdminMisc";
import AdminMomo from "./pages/admin/AdminMomo";

import { AdminRequests } from "./pages/admin/AdminRequests";

import "./styles/global.css";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <Spinner center />;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  if (loading) return <Spinner center />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <AdminLayout>{children}</AdminLayout>;
};

function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/search" element={<Search />} />
        <Route path="/store/:uid" element={<StorePage />} />

        {/* Protected */}
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/escrow" element={<ProtectedRoute><EscrowPage /></ProtectedRoute>} />
        <Route path="/installments" element={<ProtectedRoute><InstallmentsPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/seller-dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
        <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
        <Route path="/momo-payment" element={<ProtectedRoute><MomoPayment /></ProtectedRoute>} />
        <Route path="/ads" element={<ProtectedRoute><AdsPage /></ProtectedRoute>} />
        <Route path="/featured" element={<ProtectedRoute><FeaturedPage /></ProtectedRoute>} />
        <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/sellers" element={<AdminRoute><AdminSellers /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path="/admin/services" element={<AdminRoute><AdminServices /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
        <Route path="/admin/escrow" element={<AdminRoute><AdminEscrow /></AdminRoute>} />
        <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawals /></AdminRoute>} />
        <Route path="/admin/ads" element={<AdminRoute><AdminAds /></AdminRoute>} />
        <Route path="/admin/featured" element={<AdminRoute><AdminFeatured /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
        <Route path="/admin/verification" element={<AdminRoute><AdminVerification /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
        <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
        <Route path="/admin/announce" element={<AdminRoute><AdminAnnounce /></AdminRoute>} />
        <Route path="/admin/momo" element={<AdminRoute><AdminMomo /></AdminRoute>} />
        <Route path="/admin/suspicious" element={<AdminRoute><AdminSuspiciousActivity /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
}
