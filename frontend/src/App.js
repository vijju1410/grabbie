import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VendorDashboardPage from './pages/VendorDashboardPage';
import ProfilePage from './pages/ProfilePage';
import CategoryPage from './pages/CategoryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import { CartProvider } from './components/CartContext';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AboutPage from './pages/AboutUsPage';
import ResubmitPage from './pages/ResubmitPage';
import CategoriesPage from "./pages/CategoriesPage";

// New role-specific pages
import DriverDashboardPage from './pages/DriverDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function AppWrapper() {
  <Toaster position="top-right" />
  const location = useLocation();

  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Update token & user state whenever location (route) changes
  useEffect(() => {
    const updatedToken = localStorage.getItem('token');
    const updatedUser = localStorage.getItem('user');
    setToken(updatedToken);
    setUser(updatedUser ? JSON.parse(updatedUser) : null);
  }, [location]);

  // Redirect logic for driver/admin on homepage
  if (token && user && location.pathname === "/") {
    if (user.role === "driver") return <Navigate to="/driver" replace />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "vendor") return <Navigate to="/vendor" replace />;
  }

  // Helper to check approval status
  const isApproved = (role) => {
    if (!user) return false;
    if (role === "vendor") return user.vendorStatus === "approved";
    if (role === "driver") return user.driverStatus === "approved";
    return true;
  };

  // Helper to check rejected status
  const isRejected = (role) => {
    if (!user) return false;
    if (role === "vendor") return user.vendorStatus === "rejected";
    if (role === "driver") return user.driverStatus === "rejected";
    return false;
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <Header />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/category/:name" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/resubmit" element={<ResubmitPage />} />
        <Route path="/categories" element={<CategoriesPage />} />


        {/* Authenticated user routes */}
        <Route path="/profile" element={token ? <ProfilePage /> : <Navigate to="/login" />} />

        {/* Vendor dashboard route */}
        <Route
          path="/vendor"
          element={
            token
              ? isApproved("vendor")
                ? <VendorDashboardPage />
                : isRejected("vendor")
                  ? <div className="text-center text-red-600 mt-20 font-semibold">Your vendor application has been rejected.</div>
                  : <div className="text-center text-orange-600 mt-20 font-semibold">Your vendor application is pending admin approval.</div>
              : <Navigate to="/vendor" />
          }
        />

        {/* Driver dashboard route */}
        <Route
          path="/driver"
          element={
            token
              ? isApproved("driver")
                ? <DriverDashboardPage />
                : isRejected("driver")
                  ? <div className="text-center text-red-600 mt-20 font-semibold">Your driver application has been rejected.</div>
                  : <div className="text-center text-orange-600 mt-20 font-semibold">Your driver application is pending admin approval.</div>
              : <Navigate to="/driver" />
          }
        />

        {/* Admin dashboard route */}
        <Route
          path="/admin"
          element={token && user?.role === "admin" ? <AdminDashboardPage /> : <Navigate to="/" />}
        />
      </Routes>
{token && user?.role === "customer" && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <CartProvider>
          <AppWrapper />
        </CartProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
