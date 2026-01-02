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
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-2xl font-bold">Grabbie</span>
            </div>

            <p className="text-gray-400 mb-4">
              Grab local deals, delivered quick. Your favorite local stores and
              vendors, right at your doorstep.
            </p>

            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/vijju.prajapati.90"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-orange-500"
              >
                <Facebook />
              </a>

              <a
                href="https://www.instagram.com/vijju_1410"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-orange-500"
              >
                <Instagram />
              </a>

              <a
                href="https://github.com/vijju1410"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-orange-500"
              >
                <Github />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:text-center">
  <h3 className="text-lg font-semibold mb-4">Quick Links For Easy Access</h3>

  <ul className="space-y-2 inline-block text-left">
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


          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us </h3>

            <div className="space-y-3">
              <a
  href="https://mail.google.com/mail/?view=cm&fs=1&to=vijayprajapati1410@gmail.com&su=Support%20Request&body=Hello%20Grabbie%20Team"
  target="_blank"
  rel="noreferrer"
  className="flex items-center space-x-3 text-gray-400 hover:text-white"
>
  <Mail className="w-4 h-4 text-orange-500" />
  <span>Email Us</span>
</a>


              <a
                href="tel:+917490983889"
                className="flex items-center space-x-3 text-gray-400 hover:text-white"
              >
                <Phone className="w-4 h-4 text-orange-500" />
                <span>+91 74909 83889</span>
              </a>

              <div className="flex items-center space-x-3 text-gray-400">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>Ahmedabad, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Grabbie. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
