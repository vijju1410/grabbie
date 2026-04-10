import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, CheckCircle } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  DirectionsRenderer
} from "@react-google-maps/api";
const API = process.env.REACT_APP_API_URL;



/* ================= TIMELINE CONFIG ================= */
const TIMELINE_STEPS = [
  "Placed",
  "Confirmed",
  "Packed",
  "Ready for Pickup",
  "Out for Delivery",
  "Delivered",
];

/* ================= STATUS BADGE COLORS ================= */
const statusBadge = {
  Placed: "bg-gray-100 text-gray-700",
  Preparing: "bg-blue-100 text-blue-700",
  "Out for Delivery": "bg-orange-100 text-orange-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const OrderHistoryPage = () => {
  const token = localStorage.getItem("token");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ rating states
  const [ratingModalOrder, setRatingModalOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [driverLocations, setDriverLocations] = useState({});
const [routes, setRoutes] = useState({});
const [etas, setEtas] = useState({});

// ================= CANCEL ORDER =================
const handleCancelOrder = async (orderId, status, paymentMethod) => {
  // 🎯 Show popup with reason selection
  const { value: reason } = await Swal.fire({
    title: "Cancel Order",
    html: `
      <select id="cancel-reason" class="swal2-input">
        <option value="">Select reason</option>
        <option value="Ordered by mistake">Ordered by mistake</option>
        <option value="Found better price">Found better price</option>
        <option value="Delivery taking too long">Delivery taking too long</option>
        <option value="Changed my mind">Changed my mind</option>
      </select>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Cancel Order",
    confirmButtonColor: "#ef4444",
    preConfirm: () => {
      const reason = document.getElementById("cancel-reason").value;
      if (!reason) {
        Swal.showValidationMessage("Please select a reason");
      }
      return reason;
    }
  });

  if (!reason) return;

  try {
    await axios.put(
      `${API}/api/orders/${orderId}/cancel`,
      { reason }, // 🔥 send reason to backend (optional future use)
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 🎉 SUCCESS POPUP
    Swal.fire({
      icon: "success",
      title: "Order Cancelled",
      text:
        paymentMethod === "online"
          ? "Refund will be processed in 3-5 business days 💰"
          : "Your order has been cancelled successfully",
      timer: 2000,
      showConfirmButton: false,
    });

    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, status: "Cancelled" } : o
      )
    );
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Cancel Failed",
      text: err.response?.data?.message || "Something went wrong",
    });
  }
};
// ================= REORDER =================
const handleReorder = async (order) => {
  try {
    const payload = {
      products: order.products.map((p) => ({
        productId: p.productId._id,
        quantity: p.quantity,
      })),
      totalAmount: order.totalAmount,
      deliveryDetails: order.deliveryDetails,
      paymentMethod: "cod",
      charges: order.charges || {},
    };

    await axios.post(
      `${API}/api/orders/place`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success("Order placed again!");
  } catch (err) {
    toast.error("Reorder failed");
  }
};
const [animatedDriverLocations, setAnimatedDriverLocations] = useState({});
  const { isLoaded } = useJsApiLoader({
  googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
});
const fetchDriverLocation = async (order) => {
  if (!order.assignedDriver) return;

  try {
    const res = await axios.get(
      `${API}/api/users/driver/location/${order.assignedDriver._id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

   const driverLoc = {
  lat: res.data.lat,
  lng: res.data.lng
};

setAnimatedDriverLocations((prev) => {
  const oldLoc = prev[order._id];

  if (!oldLoc) {
    return { ...prev, [order._id]: driverLoc };
  }

  const lat = oldLoc.lat + (driverLoc.lat - oldLoc.lat) * 0.2;
  const lng = oldLoc.lng + (driverLoc.lng - oldLoc.lng) * 0.2;

  return {
    ...prev,
    [order._id]: { lat, lng }
  };
});

const customerLoc = {
  lat: order.deliveryDetails?.latitude || 23.0225,
  lng: order.deliveryDetails?.longitude || 72.5714
};

if (isLoaded) {
  calculateRoute(order._id, driverLoc, customerLoc);
}
  } catch (err) {
    console.error("Failed to fetch driver location");
  }
};
const calculateRoute = (orderId, driverLoc, customerLoc) => {

  if (!window.google) return;

const directionsService = new window.google.maps.DirectionsService();

  directionsService.route(
    {
      origin: driverLoc,
      destination: customerLoc,
      travelMode: window.google.maps.TravelMode.DRIVING
    },
    (result, status) => {

      if (status === "OK") {

        setRoutes((prev) => ({
          ...prev,
          [orderId]: result
        }));

        const leg = result.routes[0].legs[0];

        setEtas((prev) => ({
          ...prev,
          [orderId]: {
            distance: leg.distance.text,
            duration: leg.duration.text
          }
        }));

      }

    }
  );
};
  /* ================= STATUS NORMALIZER ================= */
 const getTimelineStatus = (status) => {
  const s = status?.toLowerCase();

  if (s === "placed") return "Placed";
  if (["confirmed", "accepted"].includes(s)) return "Confirmed";
  if (["packed", "preparing"].includes(s)) return "Packed";
  if (s === "ready for pickup") return "Ready for Pickup";
  if (s === "out for delivery") return "Out for Delivery";
  if (s === "delivered") return "Delivered";

  return "Placed";
};

  /* ================= FETCH ORDERS ================= */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `${API}/api/orders/my-orders`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // ✅ sort latest first
        const sorted = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setOrders(sorted);
      } catch {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  useEffect(() => {

  const interval = setInterval(() => {

    orders.forEach((order) => {
      if (order.status === "Out for Delivery") {
        fetchDriverLocation(order);
      }
    });

  }, 5000);

  return () => clearInterval(interval);

}, [orders]);
  /* ================= DOWNLOAD INVOICE ================= */
  const handleDownloadInvoice = async (orderId) => {
    try {
      const res = await axios.get(
        `${API}/api/orders/${orderId}/invoice`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download invoice");
    }
  };

  /* ================= SUBMIT RATING ================= */
  const handleRatingSubmit = async () => {
    try {
      await axios.post(
        `${API}/api/orders/${ratingModalOrder._id}/rate`,
        { rating, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o._id === ratingModalOrder._id
            ? { ...o, customerRating: { rating, review } }
            : o
        )
      );

      toast.success("Thanks for rating!");
      setRatingModalOrder(null);
    } catch {
      toast.error("Rating failed");
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Fetching your orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">Order History</h1>
        <p className="text-gray-600 mb-6">
          Track your past and current orders
        </p>

        {orders.length ? (
          <div className="space-y-6">
            {orders.map((order) => {
              const isCancelled = order.status === "Cancelled";
              const timelineStatus = getTimelineStatus(order.status);
              const currentIndex =
                TIMELINE_STEPS.indexOf(timelineStatus);
              const progress =
                ((currentIndex + 1) / TIMELINE_STEPS.length) * 100;

              return (
                <div key={order._id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="p-6">
                    {/* HEADER */}
                  <div className="flex justify-between mb-4 items-center">
  <div className="flex items-center gap-3">
    <div className="bg-green-100 p-2 rounded-full">
      <CheckCircle className="text-green-600" size={20} />
    </div>

    <div>
      <h3 className="font-semibold text-lg">
        Order #{order._id.slice(-6)}
      </h3>
      <p className="text-sm text-gray-500">
        {new Date(order.createdAt).toLocaleString()}
      </p>
    </div>
  </div>

  <span
    className={`px-3 py-1 rounded-full text-xs font-medium ${
      statusBadge[order.status]
    }`}
  >
    {order.status}
  </span>
</div>

                    {/* TIMELINE */}
                    {isCancelled ? (
                      <p className="text-center text-red-600 font-semibold mb-6">
                        This order was cancelled
                      </p>
                    ) : (
                    <div className="relative mb-6">
  <div className="absolute top-3 left-0 w-full h-1 bg-gray-200 rounded">
    <div
      className="h-1 bg-green-500 rounded transition-all duration-500"
      style={{ width: `${progress}%` }}
    />
  </div>

  <div className="flex justify-between relative z-10">
    {TIMELINE_STEPS.map((step, i) => (
      <div key={step} className="flex flex-col items-center w-full">
        <div
          className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full border-2 ${
            i <= currentIndex
              ? "bg-green-500 text-white border-green-500"
              : "bg-white text-gray-400 border-gray-300"
          }`}
        >
          {i + 1}
        </div>

        <span
          className={`mt-2 text-xs text-center ${
            i <= currentIndex
              ? "text-green-600 font-semibold"
              : "text-gray-400"
          }`}
        >
          {step}
        </span>
      </div>
    ))}
  </div>
</div>
                    )}
                    {order.status === "Out for Delivery" && isLoaded && (
  <div className="mt-6">
    <h4 className="font-semibold mb-2">Live Delivery Tracking</h4>
{etas[order._id] && (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3">

    <div className="flex justify-between items-center">

      <div>
        <p className="font-semibold text-orange-700">
          🚚 Driver is on the way
        </p>

        <p className="text-sm text-gray-600">
          Arriving in <b>{etas[order._id].duration}</b>
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm text-gray-600">Distance</p>
        <p className="font-semibold">{etas[order._id].distance}</p>
      </div>

    </div>

    <div className="mt-2 text-xs text-gray-500">
      📍 Delivering to: {order.deliveryDetails.addressLine1}
    </div>

  </div>
)}
{order.status === "Out for Delivery" && order.assignedDriver && (
  <div className="bg-gray-50 border rounded-lg p-3 mb-3 text-sm">

    <p className="font-semibold text-gray-700 mb-1">
      🚚 Driver Details
    </p>

    <p>👤 {order.assignedDriver.name}</p>

    <p>🚗 Vehicle: {order.assignedDriver.vehicleNumber}</p>

    <p>📞 {order.assignedDriver.phone}</p>

  </div>
)}
<div className="w-full bg-gray-200 rounded-full h-2 mb-4">
  <div
    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
    style={{
      width: etas[order._id]
        ? "70%"
        : "20%"
    }}
  />
</div>
  <GoogleMap
  mapContainerStyle={{ width: "100%", height: "320px", borderRadius: "12px" }}
  center={
  animatedDriverLocations[order._id]
    ? animatedDriverLocations[order._id]
    : {
        lat: order.deliveryDetails?.latitude || 23.0225,
        lng: order.deliveryDetails?.longitude || 72.5714
      }
}
  zoom={14}
  onLoad={(map) => {
  if (animatedDriverLocations[order._id]) {
    const bounds = new window.google.maps.LatLngBounds();

    bounds.extend(animatedDriverLocations[order._id]);

    bounds.extend({
      lat: order.deliveryDetails?.latitude,
      lng: order.deliveryDetails?.longitude
    });

    map.fitBounds(bounds);
  }
}}
>

{/* Customer marker */}
<Marker
  position={{
    lat: order.deliveryDetails?.latitude || 23.0225,
    lng: order.deliveryDetails?.longitude || 72.5714
  }}
/>

{/* Driver marker */}
{animatedDriverLocations[order._id] && (
  <Marker
    position={animatedDriverLocations[order._id]}
    icon={{
      url: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
      scaledSize: new window.google.maps.Size(40,40)
    }}
  />
)}

{/* Route line */}
{routes[order._id] && (
  <DirectionsRenderer directions={routes[order._id]} />
)}

</GoogleMap>
  </div>
)}
          
                    {/* PRODUCTS */}
                    {order.products.map((item, i) => (
  <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-3 mb-2 hover:bg-gray-100 transition">
  <div className="flex items-center gap-3">
    <img
  src={
    item.productId?.image
      ? item.productId.image
      : "https://via.placeholder.com/100"
  }
  alt={item.productId?.name}
  className="w-12 h-12 object-cover rounded-lg"
/>

    <div>
      <p className="font-medium text-gray-800">
        {item.productId?.name || "Product"}
      </p>
      <p className="text-sm text-gray-500">
        ₹{item.productId?.price} × {item.quantity}
      </p>
    </div>
  </div>

  <p className="font-semibold text-gray-800">
    ₹{((item.productId?.price || 0) * item.quantity).toFixed(2)}
  </p>
</div>
))}


{/* ================= PRICE DETAILS ================= */}
<div className="mt-4 border-t pt-4">

  <h4 className="text-sm font-semibold text-gray-700 mb-2">
    Price Details
  </h4>

  <div className="space-y-1 text-sm text-gray-600">

    <div className="flex justify-between">
      <span>Items Total</span>
      <span>₹{order.charges?.itemsTotal?.toFixed(2)}</span>
    </div>

    {order.charges?.serviceCharge > 0 && (
      <div className="flex justify-between">
        <span>Service Charge</span>
        <span>₹{order.charges.serviceCharge}</span>
      </div>
    )}

    {order.charges?.platformFee > 0 && (
      <div className="flex justify-between">
        <span>Platform Fee</span>
        <span>₹{order.charges.platformFee}</span>
      </div>
    )}

    {order.charges?.gst > 0 && (
      <div className="flex justify-between">
        <span>GST</span>
        <span>₹{order.charges.gst}</span>
      </div>
    )}

    {order.charges?.deliveryCharge > 0 && (
      <div className="flex justify-between">
        <span>Delivery Charge</span>
        <span>₹{order.charges.deliveryCharge}</span>
      </div>
    )}

    {order.charges?.tip > 0 && (
      <div className="flex justify-between">
        <span>Tip</span>
        <span>₹{order.charges.tip}</span>
      </div>
    )}

    {/* TOTAL */}
<div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg text-black">  
<span>
  {order.status === "Cancelled" ? "Order Value" : "Total Paid"}
</span>      <span>₹{Number(order.totalAmount).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
})}</span>
    </div>

  </div>
</div>
                    {/* ACTIONS */}
         <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

  {/* PRICE */}
  {/* <p className="text-xl font-bold text-gray-800">
    ₹{order.totalAmount.toFixed(2)}
  </p> */}

  {/* BUTTON GROUP */}
  <div className="flex flex-wrap gap-2 items-center">

    {/* CANCEL */}
   {["Placed", "Accepted"].includes(order.status) && (
  <button
   onClick={() =>
  handleCancelOrder(order._id, order.status, order.paymentMethod)
}
className="px-4 py-2 text-sm font-medium border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition"  >
    ❌ Cancel
  </button>
)}


    {/* REORDER */}
    <button
      onClick={() => handleReorder(order)}
className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow"    >
      🔁 Reorder
    </button>

    {/* INVOICE */}
    {order.status === "Delivered" && (
      <button
        onClick={() => handleDownloadInvoice(order._id)}
className="px-4 py-2 text-sm font-medium border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"      >
        📄 Invoice
      </button>
    )}

    {/* RATING */}
    {order.status === "Delivered" && (
      !order.customerRating?.rating ? (
        <button
          onClick={() => {
            setRatingModalOrder(order);
            setRating(0);
            setReview("");
          }}
          className="px-4 py-2 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          ⭐ Rate
        </button>
      ) : (
        <span className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg font-semibold">
          ⭐ {order.customerRating.rating}/5
        </span>
      )
    )}

  </div>
</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-xl shadow">
            <Package className="mx-auto mb-4 text-gray-400" size={48} />
            <p>No orders yet</p>
            <Link to="/" className="text-orange-500 font-semibold">
              Browse Products
            </Link>
          </div>
        )}
      </div>

      {/* ================= RATING MODAL ================= */}
      {ratingModalOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h2 className="text-xl font-bold mb-2">Rate your order</h2>

            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className={`text-2xl ${
                    s <= rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              className="w-full border rounded-lg p-2 mb-4"
              placeholder="Write a review (optional)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRatingModalOrder(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={rating === 0}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
