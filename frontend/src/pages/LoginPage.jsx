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
const [loading, setLoading] = useState(false);
const [loginMode, setLoginMode] = useState("email"); // email | otp

// OTP states
const [phone, setPhone] = useState("");
const [otp, setOtp] = useState("");
const [otpStep, setOtpStep] = useState(1);
const [fieldErrors, setFieldErrors] = useState({
  email: '',
  password: ''
});
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  let errors = { email: '', password: '' };

if (!email) {
  errors.email = 'Email is required';
}

if (!password) {
  errors.password = 'Password is required';
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (email && !emailRegex.test(email)) {
  errors.email = 'Enter valid email address';
}

if (errors.email || errors.password) {
  setFieldErrors(errors);
  return;
}



  setLoading(true);

  console.log("API URL =", process.env.REACT_APP_API_URL);
  console.log("Submitting login:", email, password);

  try {
    const res = await axios.post(`${API_URL}/api/users/login`, { email, password });



    console.log("LOGIN RESPONSE =", res.data); // 👈 IMPORTANT

   const { token, user, code, message } = res.data;

// ✅ Handle rejected user
if (code === 'APPLICATION_REJECTED') {
  setError(message || 'Your application was rejected. Please resubmit.');
  return;
}

// ✅ Handle pending user
if (
  (user.role === 'driver' && user.driverStatus === 'pending') ||
  (user.role === 'vendor' && user.vendorStatus === 'pending')
) {
  setError('Your account is pending admin approval.');
  return;
}

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('user_role', user.role);

    setSuccess('Login successful! Redirecting...');

    switch (user.role) {
  case 'vendor':
    navigate('/vendor');
    break;
  case 'driver':
    navigate('/driver');
    break;
  case 'admin':
    navigate('/admin');
    break;
  default:
    navigate('/');
}
  } catch (err) {
  console.error("LOGIN ERROR FULL =", err);
  console.error("LOGIN ERROR RESPONSE =", err.response);

  if (err.response?.status === 404) {
  setError('User not found');
} else if (err.response?.status === 401) {
  setError('Invalid email or password');
} else if (err.response?.status === 403) {
  setError(err.response.data.message); // pending approval
} else {
  setError('Something went wrong. Please try again.');
}
} finally {
  setLoading(false); // ✅ IMPORTANT
}
};
const handleSendOtp = async () => {
  setError("");

  if (!phone) return setError("Phone is required");

  try {
    setLoading(true);

    await axios.post(`${API_URL}/api/users/send-otp`, {
      phone: phone.startsWith("+91") ? phone : `+91${phone}`,
    });

    setOtpStep(2);
  } catch (err) {
    setError(err.response?.data?.message || "Failed to send OTP");
  } finally {
    setLoading(false);
  }
};

const handleVerifyOtp = async () => {
  setError("");

  if (!otp) return setError("Enter OTP");

  try {
    setLoading(true);

    const res = await axios.post(`${API_URL}/api/users/verify-otp`, {
      phone: phone.startsWith("+91") ? phone : `+91${phone}`,
      otp,
    });

    const { token, user } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("user_role", user.role);

    navigate("/");
  } catch (err) {
    setError(err.response?.data?.message || "Invalid OTP");
  } finally {
    setLoading(false);
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
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
  ⚠️ {error}
</div>
        )}

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
  <button
    onClick={() => setLoginMode("email")}
    className={`flex-1 py-2 rounded-md text-sm font-medium ${
      loginMode === "email"
        ? "bg-white shadow text-orange-600"
        : "text-gray-500"
    }`}
  >
    Email Login
  </button>

  <button
    onClick={() => setLoginMode("otp")}
    className={`flex-1 py-2 rounded-md text-sm font-medium ${
      loginMode === "otp"
        ? "bg-white shadow text-orange-600"
        : "text-gray-500"
    }`}
  >
    OTP Login
  </button>
</div>

    {loginMode === "email" && (
  <form
    className="space-y-6"
    onSubmit={loading ? (e) => e.preventDefault() : handleLogin}
  >
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
                
                value={email}
        onChange={(e) => {
  setEmail(e.target.value.trim().toLowerCase());
  setError('');
  setFieldErrors(prev => ({ ...prev, email: '' }));
}}
className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 transition-colors duration-200 ${
  fieldErrors.email ? 'border-red-500' : 'border-gray-300'
}`}                placeholder="Enter your email"
              />
             
            </div>
            {fieldErrors.email && (
  <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
)}
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
      type={showPassword ? "text" : "password"}
      
      value={password}
   onChange={(e) => {
  setPassword(e.target.value);
  setError('');
  setFieldErrors(prev => ({ ...prev, password: '' }));
}}
className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 transition-colors duration-200 ${
  fieldErrors.password ? 'border-red-500' : 'border-gray-300'
}`}      placeholder="Enter your password"
    />

    <button
      type="button"
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      onClick={() => setShowPassword(prev => !prev)}
    >
      {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
    </button>
  </div>
  
{fieldErrors.password && (
  <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
)}

  {/* ✅ Correct position */}
  <div className="text-right mt-2">
    <Link
      to="/forgot-password"
      className="text-sm text-orange-600 hover:underline"
    >
      Forgot Password?
    </Link>
  </div>
</div>

          {/* Submit */}
        <button
  type="submit"
  disabled={loading}
  className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? 'Signing in...' : 'Sign In'}
</button>

 
         </form>
)}
{loginMode === "otp" && (
  <div className="space-y-4">
    
    {/* Step 1: Phone */}
    {otpStep === 1 && (
  <>
    <p className="text-sm text-gray-600 mb-2">
      Enter your phone number to receive OTP on your registered email
    </p>
        <input
          type="text"
          placeholder="Enter your registered phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500"
        />
        <p className="text-xs text-gray-500 mt-1">
  OTP will be sent to the email linked with this phone number
</p>

        <button
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded-lg"
        >
          {loading ? "Sending OTP..." : "Send OTP to Email"}
        </button>
      </>
    )}

    {/* Step 2: OTP */}
  {otpStep === 2 && (
  <>
    <p className="text-sm text-gray-600 mb-2">
      Enter the OTP sent to your registered email
    </p>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500"
        />

        <button
          onClick={handleVerifyOtp}
          disabled={loading}
          className="w-full bg-green-500 text-white py-3 rounded-lg"
        >
          {loading ? "Verifying..." : "Verify & Login"}
        </button>

        <button
          onClick={handleSendOtp}
          className="text-sm text-orange-600 hover:underline"
        >
          Resend OTP
        </button>
      </>
    )}
  </div>
)}

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
