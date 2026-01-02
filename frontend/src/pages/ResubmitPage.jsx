// frontend/src/pages/ResubmitPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ResubmitPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ Fetch logged-in user info using token from localStorage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const { data } = await axios.get("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user", err);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const formDataObj = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataObj.append(key, formData[key]);
      });

      await axios.put("/api/users/resubmit", formDataObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Resubmission successful!");
      navigate("/dashboard"); // redirect after successful resubmit
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Resubmission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center mt-10">Loading...</div>;

  // Role-based form fields
  const isDriver = user.role === "driver";
  const isVendor = user.role === "vendor";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Resubmit {isDriver ? "Driver" : "Vendor"} Application
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isDriver && (
            <>
              <div>
                <label className="block mb-1 font-medium">License Number</label>
                <input
                  name="licenseNumber"
                  placeholder="Enter license number"
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Vehicle Number</label>
                <input
                  name="vehicleNumber"
                  placeholder="Enter vehicle number"
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Upload ID Proof</label>
                <input
                  type="file"
                  name="idProof"
                  accept="image/*,.pdf"
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                />
              </div>
            </>
          )}

          {isVendor && (
            <>
              <div>
                <label className="block mb-1 font-medium">Business Name</label>
                <input
                  name="businessName"
                  placeholder="Enter business name"
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Business Address</label>
                <input
                  name="businessAddress"
                  placeholder="Enter business address"
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Business Phone</label>
                <input
                  name="businessPhone"
                  placeholder="Enter business phone"
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Business Category</label>
                <input
                  name="businessCategory"
                  placeholder="Enter business category"
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Upload ID Proof</label>
                <input
                  type="file"
                  name="idProof"
                  accept="image/*,.pdf"
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Resubmit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResubmitPage;
