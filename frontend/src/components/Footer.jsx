import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Github,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      {/* Top Divider */}
      <div className="border-t border-gray-800"></div>

      {/* 🔥 Reduced padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 🔥 4 COLUMN GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">

          {/* ================= BRAND ================= */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold">Grabbie</span>
            </div>

            <p className="text-gray-400 text-sm leading-snug mb-3">
              Grab local deals, delivered quick.
            </p>

            {/* Social Icons */}
            <div className="flex space-x-3">
              <a
                href="https://www.facebook.com/vijju.prajapati.90"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-orange-500 transition"
              >
                <Facebook size={18} />
              </a>

              <a
                href="https://www.instagram.com/vijju_1410"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-orange-500 transition"
              >
                <Instagram size={18} />
              </a>

              <a
                href="https://github.com/vijju1410"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-orange-500 transition"
              >
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* ================= QUICK LINKS ================= */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-300 uppercase tracking-wide">
              Quick Links
            </h3>

            <ul className="space-y-1 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white">
                  Home
                </Link>
              </li>

              <li>
                <Link to="/cart" className="text-gray-400 hover:text-white">
                  Cart
                </Link>
              </li>

              <li>
                <Link to="/orders" className="text-gray-400 hover:text-white">
                  My Orders
                </Link>
              </li>

              <li>
                <Link to="/register" className="text-gray-400 hover:text-white">
                  Become a Vendor
                </Link>
              </li>
            </ul>
          </div>

          {/* ================= CONTACT ================= */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-300 uppercase tracking-wide">
              Contact
            </h3>

            <div className="space-y-2 text-sm">
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=vijayprajapati1410@gmail.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-white"
              >
                <Mail className="w-4 h-4 text-orange-500" />
                <span>Email</span>
              </a>

              <a
                href="tel:+917490983889"
                className="flex items-center space-x-2 text-gray-400 hover:text-white"
              >
                <Phone className="w-4 h-4 text-orange-500" />
                <span>Call</span>
              </a>

              <div className="flex items-center space-x-2 text-gray-400">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>Ahmedabad</span>
              </div>
            </div>
          </div>

          {/* ================= EXTRA (NEW WIDTH USAGE) ================= */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-300 uppercase tracking-wide">
              About
            </h3>

            <p className="text-gray-400 text-sm leading-snug">
              Your favorite local stores & vendors, delivered fast at your doorstep.
            </p>
          </div>

        </div>

        {/* ================= BOTTOM ================= */}
        <div className="border-t border-gray-800 mt-6 pt-4 text-center">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} Grabbie. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;