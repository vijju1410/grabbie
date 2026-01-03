import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VendorDashboardPage from "./pages/VendorDashboardPage";
import DriverDashboardPage from "./pages/DriverDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProfilePage from "./pages/ProfilePage";
import CategoryPage from "./pages/CategoryPage";
import CategoriesPage from "./pages/CategoriesPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AboutPage from "./pages/AboutUsPage";
import ResubmitPage from "./pages/ResubmitPage";

import { CartProvider } from "./components/CartContext";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";

function AppWrapper() {
  const location = useLocation();

  const [authReady, setAuthReady] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // 🔑 ONE-TIME auth hydration
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    setToken(storedToken);
    setUser(storedUser ? JSON.parse(storedUser) : null);

    setAuthReady(true);
  }, []);

  // ⏳ Wait until auth is ready
  if (!authReady) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading application…
      </div>
    );
  }

  // 🔁 Role redirect on home
  if (token && user && location.pathname === "/") {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "vendor") return <Navigate to="/vendor" replace />;
    if (user.role === "driver") return <Navigate to="/driver" replace />;
  }

  const isApproved = (role) => {
    if (!user) return false;
    if (role === "vendor") return user.vendorStatus === "approved";
    if (role === "driver") return user.driverStatus === "approved";
    return true;
  };

  const isRejected = (role) => {
    if (!user) return false;
    if (role === "vendor") return user.vendorStatus === "rejected";
    if (role === "driver") return user.driverStatus === "rejected";
    return false;
  };

  return (
    <>
      <Toaster position="top-right" />
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/category/:name" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />

        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />

        <Route
          path="/profile"
          element={token ? <ProfilePage /> : <Navigate to="/login" />}
        />

        <Route
          path="/vendor"
          element={
            token
              ? isApproved("vendor")
                ? <VendorDashboardPage />
                : isRejected("vendor")
                ? <div className="text-center mt-20 text-red-600">Vendor rejected</div>
                : <div className="text-center mt-20 text-orange-600">Vendor pending</div>
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/driver"
          element={
            token
              ? isApproved("driver")
                ? <DriverDashboardPage />
                : isRejected("driver")
                ? <div className="text-center mt-20 text-red-600">Driver rejected</div>
                : <div className="text-center mt-20 text-orange-600">Driver pending</div>
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/admin"
          element={token && user?.role === "admin"
            ? <AdminDashboardPage />
            : <Navigate to="/" />}
        />

        <Route path="/resubmit" element={<ResubmitPage />} />
      </Routes>

      {/* ✅ Footer should always render */}
      <Footer />
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
