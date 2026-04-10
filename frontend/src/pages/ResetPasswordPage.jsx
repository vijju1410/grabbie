import React, { useState } from "react";
import axios from "axios";
import { Lock } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

const ResetPasswordPage = () => {
  const { token } = useParams(); // get token from URL
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/users/reset-password/${token}`,
        { password }
      );

      setMessage(res.data.message || "Password reset successful");

      // redirect after success
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Reset Password
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Enter your new password
          </p>
        </div>

        {/* Success */}
        {message && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm text-center">
            {message}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Enter new password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        {/* Back to login */}
        <div className="mt-5 text-center">
          <Link
            to="/login"
            className="text-sm text-orange-600 hover:underline"
          >
            Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPasswordPage;