import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const API = process.env.REACT_APP_API_URL;

const RegisterPage = () => {

  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    role: "customer",
    name: "",
    email: "",
    password: "",
    phone: "", // only 10 digits
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    businessCategory: "",
    vehicleNumber: "",
    licenseNumber: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isValid, setIsValid] = useState(false);

  // Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/;
  const passwordRegex = /^\d{4}$/;

  /* ================= VALIDATION FUNCTION ================= */
  const validateForm = () => {
    const e = {}; // ✅ SINGLE SOURCE OF TRUTH

    // ----- Common -----
    if (!form.name.trim()) e.name = "Name is required";

    if (!form.email.trim()) e.email = "Email is required";
    else if (!emailRegex.test(form.email))
      e.email = "Enter a valid email address";

    if (!form.password.trim()) e.password = "Password is required";
    else if (!passwordRegex.test(form.password))
      e.password = "Password must be exactly 4 digits";

    if (!form.phone) e.phone = "Phone number is required";
    else if (!phoneRegex.test(form.phone))
      e.phone = "Enter valid 10 digit number";

    // ----- Vendor -----
    if (form.role === "vendor") {
      if (!form.businessName.trim())
        e.businessName = "Business name is required";

      if (!form.businessAddress.trim())
        e.businessAddress = "Business address is required";

      if (!form.businessPhone || form.businessPhone.length !== 10)
        e.businessPhone = "Business phone must be exactly 10 digits";

      if (!form.businessCategory.trim())
        e.businessCategory = "Business category is required";

      if (!idProof)
        e.idProof = "ID proof is required";
    }

    // ----- Driver -----
    if (form.role === "driver") {

  // Vehicle Number (min realistic check)
  if (!form.vehicleNumber.trim()) {
    e.vehicleNumber = "Vehicle number is required";
  } 
  else if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/i.test(form.vehicleNumber)) {
    e.vehicleNumber = "Enter a valid vehicle number (e.g. GJ01AB1234)";
  }

  // License Number (min length + alphanumeric)
  if (!form.licenseNumber.trim()) {
    e.licenseNumber = "License number is required";
  } 
  else if (!/^[A-Z0-9]{10,16}$/i.test(form.licenseNumber)) {
    e.licenseNumber = "Enter a valid license number";
  }

  if (!idProof)
    e.idProof = "ID proof is required";
}
    setErrors(e);
    setIsValid(Object.keys(e).length === 0);
  };

  /* ================= LIVE VALIDATION ================= */
  useEffect(() => {
    validateForm();
    // eslint-disable-next-line
  }, [form, idProof]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      const data = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key]) data.append(key, form[key]);
      });

      // attach +91
      data.set("phone", `+91${form.phone}`);

      if (profileImage) data.append("profileImage", profileImage);
      if (idProof) data.append("idProof", idProof);

     await axios.post(`${API}/api/users/register`, data, {
  headers: { "Content-Type": "multipart/form-data" },
});



      setSuccessMessage("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

        {serverError && (
          <p className="text-red-600 text-sm text-center mb-4">
            {serverError}
          </p>
        )}

        {successMessage && (
          <p className="text-green-600 text-sm text-center mb-4">
            {successMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Role */}
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          >
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="driver">Driver</option>
          </select>

          {/* Name */}
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className="w-full p-3 border rounded-lg" />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}

          {/* Email */}
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full p-3 border rounded-lg" />
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}

          {/* Password */}
          <input type="password" name="password" placeholder="4-digit Password" value={form.password} onChange={handleChange} className="w-full p-3 border rounded-lg" />
          {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}

          {/* Phone */}
          <div className="flex">
            <span className="px-3 py-3 bg-gray-100 border border-r-0 rounded-l-lg">+91</span>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
              placeholder="10 digit number"
              className="w-full p-3 border rounded-r-lg"
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}

          {/* Profile Picture */}
          <div>
            <label className="text-sm font-medium">Profile Picture (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setProfileImage(file);
                setProfilePreview(file ? URL.createObjectURL(file) : null);
              }}
            />
            {profilePreview && (
              <img src={profilePreview} alt="preview" className="w-20 h-20 rounded-full mt-2" />
            )}
          </div>

          {/* Vendor */}
          {form.role === "vendor" && (
            <>
              <input name="businessName" placeholder="Business Name" value={form.businessName} onChange={handleChange} className="w-full p-3 border rounded-lg" />
              {errors.businessName && <p className="text-red-500 text-xs">{errors.businessName}</p>}

              <input name="businessAddress" placeholder="Business Address" value={form.businessAddress} onChange={handleChange} className="w-full p-3 border rounded-lg" />
              {errors.businessAddress && <p className="text-red-500 text-xs">{errors.businessAddress}</p>}

              <input
                value={form.businessPhone}
                onChange={(e) =>
                  setForm({ ...form, businessPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                }
                placeholder="Business phone (10 digits)"
                className="w-full p-3 border rounded-lg"
              />
              {errors.businessPhone && <p className="text-red-500 text-xs">{errors.businessPhone}</p>}

              <input name="businessCategory" placeholder="Business Category" value={form.businessCategory} onChange={handleChange} className="w-full p-3 border rounded-lg" />
              {errors.businessCategory && <p className="text-red-500 text-xs">{errors.businessCategory}</p>}
            </>
          )}

          {/* Driver */}
          {form.role === "driver" && (
            <>
<input
  name="vehicleNumber"
  value={form.vehicleNumber}
  onChange={(e) =>
    setForm({
      ...form,
      vehicleNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    })
  }
  placeholder="Vehicle Number (e.g. GJ01AB1234)"
  className="w-full p-3 border rounded-lg"
/>
              {errors.vehicleNumber && <p className="text-red-500 text-xs">{errors.vehicleNumber}</p>}

<input
  name="licenseNumber"
  value={form.licenseNumber}
  onChange={(e) =>
    setForm({
      ...form,
      licenseNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    })
  }
  placeholder="Driving License Number"
  className="w-full p-3 border rounded-lg"
/>
              {errors.licenseNumber && <p className="text-red-500 text-xs">{errors.licenseNumber}</p>}
            </>
          )}

          {/* ID Proof */}
          {(form.role === "vendor" || form.role === "driver") && (
            <div>
             <input
    type="file"
    accept="image/*,.pdf"
    onChange={(e) => {
      setIdProof(e.target.files[0]);
      setErrors({ ...errors, idProof: "" });
    }}
    className="w-full p-2 border border-gray-300 rounded-lg"
  />

  <p className="text-xs text-gray-500 mt-1">
    Upload valid ID proof (Aadhaar / PAN / Driving License – Image or PDF)
  </p>

  {errors.idProof && (
    <p className="text-red-500 text-xs mt-1">{errors.idProof}</p>
  )}

            </div>
          )}

          <button
            disabled={!isValid}
            className={`w-full py-3 rounded-lg font-semibold ${
              isValid
                ? "bg-orange-500 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Register
          </button>
        </form>
        <p className="text-center text-sm mt-4">
  Already have an account?{" "}
  <Link
    to="/login"
    className="text-orange-500 font-semibold hover:underline"
  >
    Login
  </Link>
</p>

      </div>
    </div>
  );
};

export default RegisterPage;
