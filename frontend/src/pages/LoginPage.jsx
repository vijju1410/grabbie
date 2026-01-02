import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
const API_URL = process.env.REACT_APP_API_URL;

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Add this state at the top
const [showPassword, setShowPassword] = useState(false);



  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  console.log("API URL =", process.env.REACT_APP_API_URL);
  console.log("Submitting login:", email, password);

  try {
    const res = await axios.post(`${API_URL}/api/users/login`, { email, password });



    console.log("LOGIN RESPONSE =", res.data); // 👈 IMPORTANT

    const { token, user, code } = res.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('user_role', user.role);

    setSuccess('Login successful! Redirecting...');

    navigate('/');
  } catch (err) {
    console.error("LOGIN ERROR FULL =", err);              // 👈 IMPORTANT
    console.error("LOGIN ERROR RESPONSE =", err.response); // 👈 IMPORTANT

    setError(err.response?.data?.message || 'Login failed. Please try again.');
  }
};


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">Grabbie</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-600">Please sign in to your account</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 text-green-700 bg-green-100 border border-green-300 px-4 py-3 rounded text-sm text-center font-medium">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm font-medium text-center mb-4">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password */}
         {/* Password */}
<div>
  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
    Password
  </label>
  <div className="relative">
    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
    <input
      id="password"
      name="password"
      type={showPassword ? "text" : "password"}  // toggle
      required
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
      placeholder="Enter your password"
    />
    <button
      type="button"
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      onClick={() => setShowPassword(prev => !prev)}
    >
      {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
    </button>
  </div>
</div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Sign In
          </button>
        </form>

        {/* Switch to Register */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-orange-600 hover:text-orange-500 font-semibold">
              Sign up
            </Link>
          </p>
        </div>

        {/* Social Login */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                const idToken = credentialResponse?.credential;
                if (!idToken) return setError('Google login failed: no credential');

                try {
const res = await axios.post(`${API_URL}/api/users/google-login`, { idToken });


                  const { token, user, code } = res.data;

                  localStorage.setItem('token', token);
                  localStorage.setItem('user', JSON.stringify(user));
                  localStorage.setItem('user_role', user.role);

                  // Rejected user handling
                  if (code === 'APPLICATION_REJECTED') {
                    setError(res.data.message);
                    return; // do not redirect
                  }

                  // Pending check
                  if (
                    (user.role === 'driver' && user.driverStatus === 'pending') ||
                    (user.role === 'vendor' && user.vendorStatus === 'pending')
                  ) {
                    setError('Your application is pending admin approval. Please wait.');
                    return;
                  }

                  // Redirect by role
                  switch (user.role) {
                    case 'vendor': navigate('/vendor'); break;
                    case 'driver': navigate('/driver'); break;
                    case 'admin': navigate('/admin'); break;
                    default: navigate('/');
                  }
                } catch (err) {
                  setError(err.response?.data?.message || 'Google login failed');
                }
              }}
              onError={() => setError('Google login failed')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
