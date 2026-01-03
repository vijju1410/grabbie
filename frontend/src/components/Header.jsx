import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "./CartContext"; // ✅ correct import
import axios from "axios";
const API = process.env.REACT_APP_API_URL;

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [categories, setCategories] = useState([]);

  const categoryRef = useRef(null);
  const { cart, fetchCart } = useCart(); // ✅ get cart from context

  const isActive = (path) => location.pathname === path;

  // Handle authentication and redirection
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      const parsedUser = JSON.parse(user);
      setIsAuthenticated(true);
      setUserRole(parsedUser.role);

      if (location.pathname === "/") {
        if (parsedUser.role === "driver") navigate("/driver");
        else if (parsedUser.role === "admin") navigate("/admin");
      }
    } else {
      setIsAuthenticated(false);
      setUserRole("");
    }
  }, [location, navigate]);

  const isCustomer =
    userRole !== "vendor" && userRole !== "driver" && userRole !== "admin";

  // Fetch categories for dropdown
 // Fetch categories for dropdown
useEffect(() => {
  if (isCustomer) {
    axios
      .get(`${API}/api/categories`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Failed to fetch categories", err));
  }
}, [isCustomer]);


  // Close category dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUserRole("");
    navigate("/login");
  };

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold">
              G
            </div>
            <span className="text-xl font-bold text-gray-900">Grabbie</span>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated &&
              (userRole === "vendor" ? (
                <Link
                  to="/vendor"
                  className={isActive("/vendor") ? "text-orange-600" : "text-gray-700 hover:text-orange-600"}
                >
                  Vendor
                </Link>
              ) : userRole === "driver" ? (
                <Link
                  to="/driver"
                  className={isActive("/driver") ? "text-orange-600" : "text-gray-700 hover:text-orange-600"}
                >
                  Driver Dashboard
                </Link>
              ) : userRole === "admin" ? (
                <Link
                  to="/admin"
                  className={isActive("/admin") ? "text-orange-600" : "text-gray-700 hover:text-orange-600"}
                >
                  Admin Panel
                </Link>
              ) : (
                <>
                  <Link
                    to="/"
                    className={isActive("/") ? "text-orange-600" : "text-gray-700 hover:text-orange-600"}
                  >
                    Home
                  </Link>
                  

                  {/* Categories dropdown */}
                  <div className="relative" ref={categoryRef}>
                    <button
                      onClick={() => setCategoryOpen(!categoryOpen)}
                      className="text-gray-700 hover:text-orange-600"
                    >
                      Categories
                    </button>
                    {categoryOpen && (
                      <div className="absolute bg-white shadow-lg rounded-lg mt-2 z-50">
                        {categories.map((c) => (
                          <Link
                            key={c._id}
                            to={`/category/${c.name}`}
                            className="block px-4 py-2 hover:bg-gray-100"
                            onClick={() => setCategoryOpen(false)}
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
{/* Inside Desktop Menu (customer visible section) */}
<Link
  to="/about"
  className={isActive("/about") ? "text-orange-600" : "text-gray-700 hover:text-orange-600"}
>
  About Us
</Link>


                  <Link
                    to="/orders"
                    className={isActive("/orders") ? "text-orange-600" : "text-gray-700 hover:text-orange-600"}
                  >
                    My Orders
                  </Link>
                </>
              ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart (only for customers) */}
            {isAuthenticated && isCustomer && (
  <Link
    to="/cart"
    className="relative text-gray-600 hover:text-orange-600"
  >
    <ShoppingCart className="w-6 h-6" />
    {cart.length > 0 && (
      <span className="absolute -top-2 -right-2 text-xs bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
        {cart.length}
      </span>
    )}
  </Link>
)}


            {!isAuthenticated ? (
              <>
                <Link to="/login" className="hidden md:block text-gray-700 hover:text-orange-600">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="hidden md:block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/profile" className="text-gray-700 hover:text-orange-600">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-700"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
            {/* ================= MOBILE MENU ================= */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t shadow">
          <nav className="flex flex-col px-4 py-4 space-y-4">

            {/* CUSTOMER LINKS */}
            {isAuthenticated && isCustomer && (
              <>
                <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>

                <button
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className="text-left"
                >
                  Categories
                </button>

                {categoryOpen && (
                  <div className="ml-4 space-y-2">
                    {categories.map((c) => (
                      <Link
                        key={c._id}
                        to={`/category/${c.name}`}
                        onClick={() => {
                          setMenuOpen(false);
                          setCategoryOpen(false);
                        }}
                        className="block text-gray-600"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}

                <Link to="/about" onClick={() => setMenuOpen(false)}>
                  About Us
                </Link>

                <Link to="/orders" onClick={() => setMenuOpen(false)}>
                  My Orders
                </Link>

                <Link to="/cart" onClick={() => setMenuOpen(false)}>
                  Cart ({cart.length})
                </Link>
              </>
            )}

            {/* ROLE BASED */}
            {isAuthenticated && userRole === "vendor" && (
              <Link to="/vendor" onClick={() => setMenuOpen(false)}>
                Vendor Dashboard
              </Link>
            )}

            {isAuthenticated && userRole === "driver" && (
              <Link to="/driver" onClick={() => setMenuOpen(false)}>
                Driver Dashboard
              </Link>
            )}

            {isAuthenticated && userRole === "admin" && (
              <Link to="/admin" onClick={() => setMenuOpen(false)}>
                Admin Panel
              </Link>
            )}

            {/* AUTH */}
            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="bg-orange-500 text-white px-4 py-2 rounded text-center"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="text-left text-red-600"
                >
                  Logout
                </button>
              </>
            )}

          </nav>
        </div>
      )}

    </header>
  );
};

export default Header;
