import React, { useEffect, useState } from "react";
import axios from "axios";
const API = process.env.REACT_APP_API_URL;

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState({});

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get(`${API}/api/users/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const phone = res.data.phone
          ? res.data.phone.replace("+91", "")
          : "";

        setUser(res.data);
        setFormData({ ...res.data, phone });
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    fetchProfile();
  }, []);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setFormData({ ...formData, phone: value });
      setErrors({ ...errors, phone: "" });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Only image type validation (NO SIZE LIMIT)
    if (!file.type.startsWith("image/")) {
      setErrors({
        ...errors,
        profileImage: "Only image files are allowed",
      });
      return;
    }

    setErrors({ ...errors, profileImage: "" });
    setProfileImageFile(file);
  };

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    const newErrors = {};

    // Name
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      newErrors.name = "Name can contain only letters";
    }

    // Phone
    if (!formData.phone) {
      newErrors.phone = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Enter valid 10-digit mobile number";
    }

    // Vendor validation
    if (user.role === "vendor") {
      if (!formData.businessName) {
        newErrors.businessName = "Business name is required";
      }
      if (!formData.businessAddress || formData.businessAddress.length < 10) {
        newErrors.businessAddress =
          "Business address must be at least 10 characters";
      }
      if (!formData.businessCategory) {
        newErrors.businessCategory = "Business category is required";
      }
    }

    // Driver validation
    if (user.role === "driver") {
      if (!formData.vehicleNumber) {
        newErrors.vehicleNumber = "Vehicle number is required";
      } else if (
        !/^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/i.test(formData.vehicleNumber)
      ) {
        newErrors.vehicleNumber = "Invalid vehicle number format";
      }

      if (!formData.licenseNumber || formData.licenseNumber.length < 6) {
        newErrors.licenseNumber =
          "License number must be at least 6 characters";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= UPDATE PROFILE ================= */
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("token");

    try {
      const data = new FormData();
      data.append("userId", user._id);
      data.append("name", formData.name);
      data.append("phone", `+91${formData.phone}`);

      if (user.role === "vendor") {
        data.append("businessName", formData.businessName);
        data.append("businessAddress", formData.businessAddress);
        data.append("businessCategory", formData.businessCategory);
      }

      if (user.role === "driver") {
        data.append("vehicleNumber", formData.vehicleNumber);
        data.append("licenseNumber", formData.licenseNumber);
      }

      if (profileImageFile) {
        data.append("profileImage", profileImageFile);
      }

      const res = await axios.put(`${API}/api/users/profile`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUser(res.data.user);
      setEditMode(false);
      setProfileImageFile(null);
      setStatusMessage("✅ Profile updated successfully!");
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
  console.error("Update failed", err);

  const backendMessage =
    err.response?.data?.message || "❌ Profile update failed!";

  // If backend says phone issue → show it under phone field
  if (err.response?.data?.field === "phone") {
    setErrors((prev) => ({
      ...prev,
      phone: backendMessage,
    }));
  }

  setStatusMessage(backendMessage);
  setTimeout(() => setStatusMessage(""), 4000);
}

  };

  if (!user) {
    return (
      <div className="flex justify-center mt-20">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 p-6 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-orange-600">My Profile</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg"
        >
          {editMode ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {statusMessage && (
        <div className="mb-4 text-center text-sm text-white bg-gray-800 py-2 rounded">
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-4">
        {/* PROFILE IMAGE */}
        <div className="flex justify-center">
         <img
  src={
    profileImageFile
      ? URL.createObjectURL(profileImageFile)
      : user.profileImage
      ? user.profileImage
      : "https://via.placeholder.com/150"
  }
  alt="Profile"
  className="w-32 h-32 rounded-full object-cover border-2 border-orange-500"
/>

        </div>

        {editMode && (
          <div className="text-center">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {errors.profileImage && (
              <p className="text-red-500 text-sm mt-1">
                {errors.profileImage}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Image files only (jpg,png,jpeg)
            </p>
          </div>
        )}

        {/* NAME */}
        <div>
          <label>Name</label>
          {editMode ? (
            <>
              <input
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </>
          ) : (
            <p>{user.name}</p>
          )}
        </div>

        {/* EMAIL */}
        <div>
          <label>Email</label>
          <p>{user.email}</p>
        </div>

        {/* PHONE */}
        <div>
          <label>Mobile Number</label>
          {editMode ? (
            <>
              <div className="flex">
                <span className="px-3 flex items-center border border-r-0 rounded-l bg-gray-100">
                  +91
                </span>
                <input
                  type="text"
                  value={formData.phone || ""}
                  onChange={handlePhoneChange}
                  placeholder="10-digit number"
                  className="w-full border rounded-r p-2"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}
            </>
          ) : (
            <p>+91 {user.phone?.replace("+91", "") || "-"}</p>
          )}
        </div>

        {/* ROLE */}
        <div>
          <label>Role</label>
          <p className="capitalize">{user.role}</p>
        </div>

        {/* VENDOR */}
        {user.role === "vendor" && (
          <>
            <input
              name="businessName"
              placeholder="Business Name"
              value={formData.businessName || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {errors.businessName && (
              <p className="text-red-500 text-sm">{errors.businessName}</p>
            )}

            <input
              name="businessAddress"
              placeholder="Business Address"
              value={formData.businessAddress || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {errors.businessAddress && (
              <p className="text-red-500 text-sm">
                {errors.businessAddress}
              </p>
            )}

            <input
              name="businessCategory"
              placeholder="Business Category"
              value={formData.businessCategory || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {errors.businessCategory && (
              <p className="text-red-500 text-sm">
                {errors.businessCategory}
              </p>
            )}
          </>
        )}

        {/* DRIVER */}
        {user.role === "driver" && (
          <>
            <input
              name="vehicleNumber"
              placeholder="Vehicle Number"
              value={formData.vehicleNumber || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {errors.vehicleNumber && (
              <p className="text-red-500 text-sm">
                {errors.vehicleNumber}
              </p>
            )}

            <input
              name="licenseNumber"
              placeholder="License Number"
              value={formData.licenseNumber || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {errors.licenseNumber && (
              <p className="text-red-500 text-sm">
                {errors.licenseNumber}
              </p>
            )}
          </>
        )}

        {editMode && (
          <button className="w-full bg-orange-500 text-white py-2 rounded">
            Save Changes
          </button>
        )}
      </form>
    </div>
  );
};

export default ProfilePage;
