// src/pages/CheckoutPage.jsx
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useCart } from "../components/CartContext";
const API = process.env.REACT_APP_API_URL;

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
const handleOnlinePayment = async () => {
  const loaded = await loadRazorpay();

  if (!loaded) {
    alert("Razorpay SDK failed to load");
    return;
  }

  // 1️⃣ Create order from backend
  let order;
try {
 const res = await axios.post(
  `${API}/api/payment/create-order`,
  { amount: Math.round(grandTotal * 100) }
);

  order = res.data;
} catch (err) {
  Swal.fire({
    icon: "error",
    title: "Payment Init Failed",
    text: err.response?.data?.message || "Server error",
  });
  return;
}


  // 2️⃣ Razorpay options
  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY, // ✅ now valid

  amount: order.amount,
  currency: "INR",
  name: "Grabbie",
  description: "Order Payment",
  order_id: order.id,

  prefill: {
    name: formData.name,
    email: formData.email,
    contact: formData.phone,
  },

  handler: async (response) => {
    try {
      const verifyRes = await axios.post(
  `${API}/api/payment/verify`,
  response
);


      if (!verifyRes.data.success) {
        Swal.fire({ 
          icon: "error",
          title: "Payment Verification Failed",
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }

      // set payment mode safely
      setFormData(prev => ({ ...prev, payment: "online" }));

      // place order (ONLY final success alert will show)
      await handleOrder();

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text: "Something went wrong during payment",
        timer: 2500,
        showConfirmButton: false,
      });
    }
  },

  theme: {
    color: "#16a34a",
  },
};


  // 4️⃣ Open Razorpay
  const rzp = new window.Razorpay(options);
  rzp.open();
};

  // Charges
  const SERVICE_CHARGE_PERCENT = 5;
  const GST_PERCENT = 5;
  const PLATFORM_FEE_PERCENT = 2;
  const DEFAULT_DELIVERY_CHARGE = 30;

  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    payment: "cod",
  });

  // 🔹 NEW: field-level errors
  const [errors, setErrors] = useState({});

  const [tip, setTip] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(DEFAULT_DELIVERY_CHARGE);
  const [deliverySource, setDeliverySource] = useState("local-fallback");

  /* ================= DELIVERY CHARGE ================= */
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const res = await axios.get(
  `${API}/api/admin/settings/delivery-charge`,
  { headers: token ? { Authorization: `Bearer ${token}` } : {} }
);

        if (res?.data?.deliveryCharge != null) {
          setDeliveryCharge(Number(res.data.deliveryCharge));
          setDeliverySource("server");
        }
      } catch {
        setDeliverySource("local-fallback");
      }
    };
    fetchDelivery();
    // eslint-disable-next-line
  }, []);

  /* ================= CART TOTALS ================= */
  const itemsTotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + (item.productId.price || 0) * (item.quantity || 1),
      0
    );
  }, [cart]);

  const serviceCharge = useMemo(
    () => +(itemsTotal * SERVICE_CHARGE_PERCENT) / 100,
    [itemsTotal]
  );

  const gst = useMemo(
    () => +((itemsTotal + serviceCharge) * GST_PERCENT) / 100,
    [itemsTotal, serviceCharge]
  );

  const platformFee = useMemo(
    () => +(itemsTotal * PLATFORM_FEE_PERCENT) / 100,
    [itemsTotal]
  );

  const grandTotal = useMemo(() => {
    const total =
      itemsTotal +
      serviceCharge +
      gst +
      platformFee +
      Number(deliveryCharge || 0) +
      Number(tip || 0);
    return +total.toFixed(2);
  }, [itemsTotal, serviceCharge, gst, platformFee, deliveryCharge, tip]);

  /* ================= INPUT HANDLER ================= */
  const onChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: "" })); // clear error live
  };

  /* ================= FIELD VALIDATION ================= */
  const validateFields = () => {
    const e = {};
    const { name, email, phone, street, address2, city, state, pincode, country } = formData;

    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Invalid email address";

    if (!phone) e.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(phone)) e.phone = "Enter valid 10-digit number";

    if (!street.trim()) e.street = "Street address required";
    if (!address2.trim()) e.address2 = "Address line 2 required";
    if (!city.trim()) e.city = "City required";
    if (!state.trim()) e.state = "State required";

    if (!pincode) e.pincode = "Pincode required";
    else if (!/^\d{6}$/.test(pincode)) e.pincode = "6-digit pincode required";

    if (!country.trim()) e.country = "Country required";

    setErrors(e);
    setIsFormValid(Object.keys(e).length === 0 && cart.length > 0);
  };

  // 🔹 LIVE validation
  useEffect(() => {
    validateFields();
    // eslint-disable-next-line
  }, [formData, cart]);

  /* ================= PLACE ORDER ================= */
  const handleOrder = async () => {
    validateFields();
    if (!isFormValid) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Details",
        text: "⚠️ Please fix highlighted fields",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setLoading(true);

    const charges = {
      itemsTotal: +itemsTotal.toFixed(2),
      serviceCharge: +serviceCharge.toFixed(2),
      gst: +gst.toFixed(2),
      platformFee: +platformFee.toFixed(2),
      deliveryCharge: +Number(deliveryCharge || 0).toFixed(2),
      tip: +Number(tip || 0).toFixed(2),
      grandTotal: +grandTotal.toFixed(2),
    };

    try {
      await axios.post(
  `${API}/api/orders/place`,
        {
          products: cart.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
          })),
          totalAmount: charges.grandTotal,
          deliveryDetails: {
            fullName: formData.name,
            phone: formData.phone,
            email: formData.email,
            addressLine1: formData.street,
            addressLine2: formData.address2,
            city: formData.city,
            state: formData.state,
            postalCode: formData.pincode,
            country: formData.country,
          },
          paymentMethod: formData.payment,
          charges,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await clearCart();

      Swal.fire({
        icon: "success",
        title: "Order Placed!",
        text: "✅ Your order has been placed successfully.",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => navigate("/"));
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Order Failed",
        text: err.response?.data?.message || "❌ Failed to place order",
        timer: 2500,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-6">
      {/* LEFT FORM */}
      <div>
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        {/* PAYMENT METHOD SELECTION */}




        <div className="space-y-3">
          {[
            ["name", "Full Name"],
            ["email", "Email"],
            ["street", "Street Address"],
            ["address2", "Apartment / Address Line 2"],
            ["city", "City"],
            ["state", "State"],
          ].map(([key, label]) => (
            <div key={key}>
              <input
                placeholder={label}
                value={formData[key]}
                onChange={(e) => onChange(key, e.target.value)}
                className={`w-full border p-2 rounded-lg ${errors[key] ? "border-red-500" : ""}`}
              />
              {errors[key] && <p className="text-red-500 text-xs">{errors[key]}</p>}
            </div>
          ))}

          {/* Phone */}
          <div>
            <input
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) =>
                onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className={`w-full border p-2 rounded-lg ${errors.phone ? "border-red-500" : ""}`}
            />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
          </div>

          {/* Pincode & Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                placeholder="Pincode"
                value={formData.pincode}
                onChange={(e) =>
                  onChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className={`w-full border p-2 rounded-lg ${errors.pincode ? "border-red-500" : ""}`}
              />
              {errors.pincode && <p className="text-red-500 text-xs">{errors.pincode}</p>}
            </div>

            <div>
              <input
                placeholder="Country"
                value={formData.country}
                onChange={(e) => onChange("country", e.target.value)}
                className={`w-full border p-2 rounded-lg ${errors.country ? "border-red-500" : ""}`}
              />
              {errors.country && <p className="text-red-500 text-xs">{errors.country}</p>}
            </div>
          </div>
        </div>
      </div>
      

     {/* RIGHT ORDER SUMMARY */}
<div className="border rounded-lg p-4 bg-gray-50 shadow-sm">
  <h2 className="font-bold text-lg mb-3">Order Summary</h2>

  {/* CART ITEMS */}
  <div className="space-y-3 mb-4">
    {cart.map((item) => (
      <div
        key={item.productId._id}
        className="flex gap-3 items-center border-b pb-2"
      >
        <img
          src={item.productId.image}
          alt={item.productId.name}
          className="w-14 h-14 object-contain rounded"
        />

        <div className="flex-1">
          <p className="font-medium text-sm">{item.productId.name}</p>
          <p className="text-xs text-gray-500">
            {item.productId.category}
          </p>
          <p className="text-xs text-gray-500">
            Qty: {item.quantity}
          </p>
        </div>

        <p className="text-sm font-semibold">
          ₹{(item.productId.price * item.quantity).toFixed(2)}
        </p>
      </div>
    ))}
  </div>

  {/* PRICE BREAKDOWN */}
  <div className="text-sm space-y-2">
    <div className="flex justify-between">
      <span>Items subtotal</span>
      <span>₹{itemsTotal.toFixed(2)}</span>
    </div>
    <div className="flex justify-between">
      <span>Service charge</span>
      <span>₹{serviceCharge.toFixed(2)}</span>
    </div>
    <div className="flex justify-between">
      <span>GST</span>
      <span>₹{gst.toFixed(2)}</span>
    </div>
    <div className="flex justify-between">
      <span>Platform fee</span>
      <span>₹{platformFee.toFixed(2)}</span>
    </div>
    <div className="flex justify-between">
      <span>Delivery</span>
      <span>₹{deliveryCharge.toFixed(2)}</span>
    </div>

    <div className="flex justify-between font-bold border-t pt-2">
      <span>Grand Total</span>
      <span>₹{grandTotal.toFixed(2)}</span>
    </div>
  </div>

  {/* PAYMENT METHOD */}
  <hr className="my-4" />
  <h3 className="text-sm font-semibold mb-2">Choose Payment Method</h3>

  <div className="space-y-2">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="payment"
        checked={formData.payment === "cod"}
        onChange={() => onChange("payment", "cod")}
      />
      Cash on Delivery
    </label>

    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="payment"
        checked={formData.payment === "online"}
        onChange={() => onChange("payment", "online")}
      />
      Online Payment (Razorpay)
    </label>
  </div>

  <p className="text-xs text-gray-400 mt-2">
    🔒 Payments are 100% secure and encrypted
  </p>

  {/* PLACE ORDER BUTTON */}
  <button
    onClick={
      formData.payment === "online"
        ? handleOnlinePayment
        : handleOrder
    }
    disabled={!isFormValid || loading || cart.length === 0}
    className={`mt-4 w-full py-3 rounded-lg font-semibold text-white ${
      !isFormValid || loading
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-green-600 hover:bg-green-700"
    }`}
  >
    {loading ? "Placing..." : `Place Order - ₹${grandTotal.toFixed(2)}`}
  </button>
</div>

    </div>
  );
};

export default CheckoutPage;
