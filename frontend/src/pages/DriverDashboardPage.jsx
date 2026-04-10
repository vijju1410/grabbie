import { useState, useEffect,useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
const API = process.env.REACT_APP_API_URL;


 

const mapContainerStyle = { width: "100%", height: "400px" };
const defaultCenter = { lat: 23.0225, lng: 72.5714 };

const DriverDashboardPage = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [availability, setAvailability] = useState(false);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState(null);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

const [notifications, setNotifications] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null); // for map InfoWindow
  const [driverLocation, setDriverLocation] = useState(null);


 const [driverStats, setDriverStats] = useState({
  totalDeliveries: 0,
  totalEarnings: 0,
  averageRating: 0,
  notificationsCount: 0,
  deliveredOrders: []
});

const stats = [
  { title: "Total Deliveries", value: driverStats.totalDeliveries, icon: "📦" },
  { title: "Total Earnings", value: `₹${driverStats.totalEarnings}`, icon: "💰" },
  { title: "Average Rating", value: driverStats.averageRating, icon: "⭐" },
  { title: "Active Orders", value: activeOrders.length, icon: "🚚" },
];


const weeklyData = useMemo(() => {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const data = days.map(day => ({ day, amount: 0 }));

  driverStats.deliveredOrders?.forEach(order => {
    const day = days[new Date(order.createdAt).getDay()];
    const item = data.find(d => d.day === day);
    if (item) item.amount += order.charges?.driverEarning || 0;
  });

  return data;
}, [driverStats]);
const fetchDriverStats = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API}/api/orders/driver/stats`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setDriverStats(res.data);
};


  const toggleAvailability = async () => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = !availability;
      await axios.put(
        `${API}/api/users/availability`,
        { availability: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailability(newStatus);
      toast.success(`You are now ${newStatus ? "Online" : "Offline"}`);
    } catch (err) {
      console.error("Failed to update availability:", err);
      toast.success("Error updating availability");
    }
  };


  


  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "navigation", label: "Navigation", icon: "🗺️" },
     { id: "history", label: "Delivery History", icon: "📜" },
    { id: "earnings", label: "Earnings", icon: "💰" },
    
    { id: "ratings", label: "Ratings", icon: "⭐" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "profile", label: "Profile", icon: "👤" },
   
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered": return "bg-green-100 text-green-600";
      case "Out for Delivery": return "bg-blue-100 text-blue-600";
      case "Placed": return "bg-yellow-100 text-yellow-600";
      case "Cancelled": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  // ================= DRIVER ORDERS =================
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const [availableRes, activeRes] = await Promise.all([
        axios.get(`${API}/api/orders/available`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/orders/active`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const combinedOrders = [...availableRes.data, ...activeRes.data];

      const ordersWithDelivery = combinedOrders.map(o => ({
        ...o,
        deliveryDetails: {
          fullName: o.deliveryDetails?.fullName || "N/A",
          phone: o.deliveryDetails?.phone || "N/A",
          email: o.deliveryDetails?.email || "N/A",
          addressLine1: o.deliveryDetails?.addressLine1 || "N/A",
          addressLine2: o.deliveryDetails?.addressLine2 || "",
          city: o.deliveryDetails?.city || "N/A",
          state: o.deliveryDetails?.state || "N/A",
          postalCode: o.deliveryDetails?.postalCode || "N/A",
          country: o.deliveryDetails?.country || "N/A",
          latitude: o.deliveryDetails?.latitude || defaultCenter.lat,
          longitude: o.deliveryDetails?.longitude || defaultCenter.lng,
        }
      }));

      setAvailableOrders(availableRes.data);
      setActiveOrders(activeRes.data);
      setOrders(ordersWithDelivery);

    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const assignOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API}/api/orders/${orderId}/assign`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(res.data.message);
      fetchOrders();
    } catch (err) {
      toast.success(err.response?.data?.message || "Error assigning order");
    }
  };

  const deliverOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API}/api/orders/${orderId}/deliver`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(res.data.message);
      fetchOrders();
    } catch (err) {
      toast.success(err.response?.data?.message || "Error delivering order");
    }
  };

 useEffect(() => {
  if (!availability) return;

  fetchOrders();
  fetchDriverStats();

  const socket = io(API);

  socket.on("connect", () => {
    console.log("🟢 Socket connected");
  });

  socket.on("newOrderAvailable", (data) => {
    console.log("🔥 New order received:", data);

    // refresh orders instantly
    fetchOrders();

    toast.success("🚀 New order available!");
  });
socket.on("newOrderAvailable", (data) => {

  setNotifications(prev => [
    {
      id: Date.now(),
      message: "🚀 New order available",
      time: new Date().toLocaleTimeString()
    },
    ...prev
  ]);

  fetchOrders();
  toast.success("🚀 New order available!");
});
  return () => {
    socket.disconnect();
  };
}, [availability]);


  const { isLoaded } = useJsApiLoader({
googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  // ================= COMPONENTS =================
  const StatsCard = ({ title, value, icon }) => (
  <div className="
   bg-white rounded-2xl p-4
    shadow-sm hover:shadow-lg
    transition-all duration-300
    border border-gray-100
    hover:-translate-y-1
  ">
    
    <div className="flex items-center justify-between mb-3">
      <div className="text-3xl">{icon}</div>
    </div>

    <h2 className="text-2xl font-bold text-gray-800">
      {value}
    </h2>

    <p className="text-sm text-gray-500 mt-1">
      {title}
    </p>
  </div>
);
const WeeklyChart = () => (
 <div className="bg-white rounded-xl shadow p-3 flex flex-col">
    <h2 className="text-sm font-semibold text-gray-600 mb-2">
      Weekly Earnings
    </h2>

    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={weeklyData}>
        <XAxis 
          dataKey="day" 
          tick={{ fontSize: 12 }} 
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          contentStyle={{ borderRadius: "8px", border: "none" }}
        />
        <Bar 
          dataKey="amount" 
          fill="#f97316" 
          radius={[10, 10, 0, 0]} 
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

  // Helper to get vendor info for an order (prefers snapshot then populated vendor)
  const resolveVendorForOrder = (order) => {
    // try to find first product's vendor snapshot or populated vendor
    if (!order || !Array.isArray(order.products) || order.products.length === 0) return null;
    const firstItem = order.products[0];
    // vendorSnapshot saved on order item (businessName, businessAddress, businessPhone)
    if (firstItem.vendorSnapshot) return {
      name: firstItem.vendorSnapshot.businessName || "",
      address: firstItem.vendorSnapshot.businessAddress || "",
      phone: firstItem.vendorSnapshot.businessPhone || ""
    };
    // fallback to populated productId.vendorId (if populated by backend)
    const populatedVendor = firstItem.productId?.vendorId;
    if (populatedVendor) return {
      name: populatedVendor.businessName || populatedVendor.name || "",
      address: populatedVendor.businessAddress || "",
      phone: populatedVendor.businessPhone || populatedVendor.phone || ""
    };
    return null;
  };
const RecentOrders = ({ ordersList }) => (
  <div className="space-y-3">

    {ordersList.map((order) => {

      const vendor = resolveVendorForOrder(order);

      const vendorAddress = vendor?.address || "";
const customerAddress = order.deliveryDetails?.addressLine1 || "";

const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${
  encodeURIComponent(vendorAddress)
}&destination=${
  encodeURIComponent(customerAddress)
}`;

      return (
        <div
          key={order._id}
          className="bg-white rounded-xl p-4 border-l-4 border-orange-500 hover:shadow-lg transition-all duration-300"
        >

          {/* HEADER */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
  <p className="text-sm font-semibold text-orange-600">
    Order #{order._id.slice(-6)}
  </p>

  {order.status === "Ready for Pickup" && (
    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
      🔥 New
    </span>
  )}
</div>

            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          {/* CUSTOMER */}
          <div className="text-sm">
            <p className="font-medium">{order.customerId?.name}</p>
            <p className="text-xs text-gray-400 mt-1">
  🕒 {new Date(order.createdAt).toLocaleTimeString()}
</p>

<p className="text-xs text-gray-500">
  📦 {order.products?.length || 0} items
</p>
            <p className="text-gray-500 text-xs">{order.deliveryDetails?.phone}</p>
          </div>

          {/* FULL ADDRESS */}
          <p className="text-xs text-gray-500 mt-1">
            📍 {order.deliveryDetails?.addressLine1}, {order.deliveryDetails?.city}, {order.deliveryDetails?.state} - {order.deliveryDetails?.postalCode}
          </p>

          {/* PRODUCTS (ALL ITEMS) */}
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            {order.products?.map((item, i) => (
              <p key={i}>
                🛒 {item.productId?.name} x {item.quantity}
              </p>
            ))}
          </div>

          {/* VENDOR INFO */}
         {/* DELIVERY FLOW */}
<div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">

  <p>🏪 Pickup: {vendor?.address || "N/A"}</p>

  <p className="mt-1">⬇️</p>

  <p>🏠 Drop: {order.deliveryDetails?.addressLine1}</p>

</div>

          {/* PRICE + MAP */}
          <div className="flex justify-between items-center mt-3">
            <div>
  <p className="text-sm font-bold text-green-600">
    ₹{order.totalAmount}
  </p>
  <p className="text-xs text-gray-400">
  {order.status === "Delivered" ? (
  <span className="text-xs text-green-600">
    Earned ₹{order.charges?.driverEarning || 0}
  </span>
) : (
  <span className="text-xs text-gray-400">
    Potential ₹{order.charges?.driverEarning || 0}
  </span>
)}
</p>
</div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              Navigate →
            </a>
          </div>

          {/* ACTION BUTTON */}
          <div className="mt-3">
            {order.status === "Ready for Pickup" && !order.assignedDriver && (
              <button
                onClick={() => assignOrder(order._id)}
                className="w-full bg-orange-500 text-white py-2 rounded text-sm hover:bg-orange-600"
              >
                Accept Order
              </button>
            )}

            {order.assignedDriver && order.status === "Out for Delivery" && (
              <button
                onClick={() => deliverOrder(order._id)}
                className="w-full bg-green-500 text-white py-2 rounded text-sm hover:bg-green-600"
              >
                Mark Delivered
              </button>
            )}
          </div>

        </div>
      );
    })}

  </div>
);
  // ================= ORDERS WITH TABS =================
  const OrdersSection = () => {
    const [tab, setTab] = useState("available");
    const [currentPage, setCurrentPage] = useState(1);
const ordersPerPage = 1;
    const displayedOrders = (tab === "available" ? availableOrders : activeOrders)
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const indexOfLast = currentPage * ordersPerPage;
const indexOfFirst = indexOfLast - ordersPerPage;

const currentOrders = displayedOrders.slice(indexOfFirst, indexOfLast);

    return (
      <div className="bg-white rounded-xl shadow p-4 flex flex-col">
       

        <div className="flex space-x-2 mb-4">
          <button
            className={`px-4 py-2 rounded ${tab === "available" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => {
  setTab("available");
  setCurrentPage(1);
}}
          >
            Available Orders
          </button>
          <button
            className={`px-4 py-2 rounded ${tab === "active" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => {
  setTab("active");
  setCurrentPage(1);
}}
          >
            Active Orders
          </button>
        </div>

      <div className="flex-1 overflow-y-auto">
  <RecentOrders ordersList={currentOrders} />
<div className="sticky bottom-0 bg-white py-3 flex justify-between items-center border-t mt-3 px-4">

  {/* PREVIOUS BUTTON */}
  <button
    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    className={`px-3 py-1 rounded text-sm ${
      currentPage === 1
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-orange-500 text-white hover:bg-orange-600"
    }`}
  >
    ← Prev
  </button>

  {/* PAGE NUMBERS */}
  <div className="flex gap-2">
    {Array.from(
      { length: Math.ceil(displayedOrders.length / ordersPerPage) },
      (_, i) => (
        <button
          key={i}
          onClick={() => setCurrentPage(i + 1)}
          className={`px-3 py-1 rounded text-sm ${
            currentPage === i + 1
              ? "bg-orange-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {i + 1}
        </button>
      )
    )}
  </div>

  {/* NEXT BUTTON */}
  <button
    onClick={() =>
      setCurrentPage(prev =>
        Math.min(prev + 1, Math.ceil(displayedOrders.length / ordersPerPage))
      )
    }
    disabled={
      currentPage === Math.ceil(displayedOrders.length / ordersPerPage)
    }
    className={`px-3 py-1 rounded text-sm ${
      currentPage === Math.ceil(displayedOrders.length / ordersPerPage)
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-orange-500 text-white hover:bg-orange-600"
    }`}
  >
    Next →
  </button>

</div>
</div>
      </div>
    );
  };

  // ================= MAP =================
  const renderMap = () => {
  if (!isLoaded) return <div>Loading Map...</div>;

  const currentOrder = activeOrders[0]; // ✅ MOVE HERE
  const vendor = currentOrder ? resolveVendorForOrder(currentOrder) : null;

  return (
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Active Orders Map</h2>
       <GoogleMap
  mapContainerStyle={mapContainerStyle}
  center={driverLocation || defaultCenter}
  zoom={14}
>

  {/* 🔴 Customer Marker */}
  {currentOrder && (
    <Marker
      position={{
        lat: currentOrder.deliveryDetails?.latitude || defaultCenter.lat,
        lng: currentOrder.deliveryDetails?.longitude || defaultCenter.lng
      }}
      onClick={() => setSelectedMarker(currentOrder)}
    />
  )}

  {/* 🟢 Vendor Marker */}
  {vendor && currentOrder && (
    <Marker
      position={{
        lat: currentOrder.products[0]?.vendorSnapshot?.location?.lat || defaultCenter.lat,
        lng: currentOrder.products[0]?.vendorSnapshot?.location?.lng || defaultCenter.lng
      }}
      icon={{
        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
      }}
    />
  )}

  {/* 🔵 Driver Marker */}
  {driverLocation && (
    <Marker
      position={driverLocation}
      icon={{
        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      }}
    />
  )}

  {/* 📦 Info Window */}
  {selectedMarker && (
    <InfoWindow
      position={{
        lat: selectedMarker.deliveryDetails?.latitude,
        lng: selectedMarker.deliveryDetails?.longitude
      }}
      onCloseClick={() => setSelectedMarker(null)}
    >
      <div>
        <p className="font-semibold">Order ID: {selectedMarker._id}</p>
        <p>{selectedMarker.deliveryDetails?.fullName}</p>
        <p>{selectedMarker.deliveryDetails?.addressLine1}</p>

        {selectedMarker.status === "Ready for Pickup" && !selectedMarker.assignedDriver && (
          <button
            onClick={() => assignOrder(selectedMarker._id)}
            className="bg-orange-500 text-white px-3 py-1 rounded mt-2"
          >
            Accept
          </button>
        )}

        {selectedMarker.assignedDriver && selectedMarker.status === "Out for Delivery" && (
          <button
            onClick={() => deliverOrder(selectedMarker._id)}
            className="bg-green-500 text-white px-3 py-1 rounded mt-2"
          >
            Mark Delivered
          </button>
        )}
      </div>
    </InfoWindow>
  )}

</GoogleMap>
      </div>
    );
  };

  // ================= DASHBOARD =================
const renderDashboard = () => (
  <div className="space-y-6">

    

    {/* 📊 STATS */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex justify-between">
            <span className="text-xl">{s.icon}</span>
            <span className="text-xs text-gray-400">Today</span>
          </div>

          <h2 className="text-xl font-bold mt-2">{s.value}</h2>
          <p className="text-xs text-gray-500">{s.title}</p>
        </div>
      ))}
    </div>

    {/* 🔥 MAIN CONTENT */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ORDERS BIG */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow p-4 h-[480px] flex flex-col">
        <h2 className="font-semibold mb-3">Orders</h2>

        <div className="flex-1 overflow-y-auto">
          <OrdersSection />
        </div>
      </div>

      {/* CHART SMALL */}
      <div className="bg-white rounded-xl shadow p-4 h-[480px] flex flex-col">
        <h2 className="font-semibold mb-3">Weekly Earnings</h2>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData}>
            <XAxis dataKey="day" />
            <Tooltip />
            <Bar dataKey="amount" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  </div>
);

  const AvailabilityToggle = ({ availability, onToggle }) => (
  <button
    onClick={onToggle}
    className={`
      w-full flex items-center justify-between px-3 py-2 rounded-lg
      text-sm font-medium transition-all duration-200
      ${availability
        ? "bg-green-100 text-green-700"
        : "bg-gray-100 text-gray-600"}
    `}
  >
    <span>
      {availability ? "🟢 Online" : "⚫ Offline"}
    </span>

    <span
      className={`
        w-8 h-4 flex items-center rounded-full p-0.5
        ${availability ? "bg-green-500" : "bg-gray-400"}
      `}
    >
      <span
        className={`
          w-3 h-3 bg-white rounded-full shadow transform transition-all
          ${availability ? "translate-x-4" : "translate-x-0"}
        `}
      />
    </span>
  </button>
);


 
 const ProfileSection = () => {
  

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600" />
        <div className="relative p-6 flex flex-col sm:flex-row items-center gap-4 text-white">

          {/* Avatar Upload */}
          <label className="relative cursor-pointer">
            <img
              src={
                profile?.profileImage
                  ? profile.profileImage

                  : "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?w=200"
              }
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              alt="Profile"
            />

            

           
          </label>

          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold">{profile?.name}</h2>
            <p className="text-sm opacity-90">{profile?.email}</p>

            <span className="inline-block mt-2 px-3 py-0.5 text-xs font-semibold bg-white/20 rounded-full">
              🚚 Driver
            </span>
          </div>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow p-4 text-center">
          <p className="text-gray-500 text-xs">Total Deliveries</p>
          <p className="text-2xl font-bold">{driverStats.totalDeliveries}</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 text-center">
          <p className="text-gray-500 text-xs">Total Earnings</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{driverStats.totalEarnings}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 text-center">
          <p className="text-gray-500 text-xs">Rating</p>
          <p className="text-2xl font-bold">
            ⭐ {driverStats.averageRating || "5.0"}
          </p>
        </div>
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-2xl shadow p-4">
  <h3 className="text-base font-semibold mb-3">Driver Summary</h3>

  <div className="space-y-2 text-sm text-gray-700">
    <div className="flex justify-between">
      <span>Total Deliveries</span>
      <span className="font-semibold">{driverStats.totalDeliveries}</span>
    </div>

    <div className="flex justify-between">
      <span>Lifetime Earnings</span>
      <span className="font-semibold text-green-600">
        ₹{driverStats.totalEarnings}
      </span>
    </div>

    <div className="flex justify-between">
      <span>Rating</span>
      <span className="font-semibold">⭐ {driverStats.averageRating || "5.0"}</span>
    </div>

    <div className="flex justify-between">
      <span>Status</span>
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          availability
            ? "bg-green-100 text-green-600"
            : "bg-red-100 text-red-600"
        }`}
      >
        {availability ? "Online" : "Offline"}
      </span>
    </div>
  </div>
</div><div className="bg-white rounded-2xl shadow p-4 space-y-3">
  <h3 className="text-base font-semibold">Account</h3>

  <button
    onClick={() => toast.success("Support will contact you soon")}
    className="w-full py-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 text-sm"
  >
    Contact Support
  </button>

  <button
    onClick={() => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }}
    className="w-full py-2.5 rounded-xl bg-gray-900 text-white hover:bg-black text-sm"
  >
    Logout
  </button>
</div>      </div>

      {/* Modal */}
      
    </div>
  );
};

const NavigationSection = () => {
  const currentOrder = activeOrders[0];
  const vendor = currentOrder ? resolveVendorForOrder(currentOrder) : null;

  return (
    <div className="space-y-4">

      <h1 className="text-xl font-semibold">Navigation</h1>

      {currentOrder ? (
        <div className="bg-white p-4 rounded-xl shadow text-sm space-y-2">

          <p>👤 {currentOrder.deliveryDetails?.fullName}</p>

          <p>🏪 Pickup: {vendor?.address || "N/A"}</p>

          <p>🏠 Drop: {currentOrder.deliveryDetails?.addressLine1}</p>

          <p className="text-green-600 font-semibold">
            Earn ₹{currentOrder.charges?.driverEarning || 0}
          </p>

        </div>
      ) : (
        <p className="text-gray-500">No active delivery</p>
      )}

      {renderMap()}
    </div>
  );
};
const NotificationsSection = () => (
  <div className="bg-white rounded-xl shadow p-6">

    <h1 className="text-xl font-semibold mb-4">Notifications</h1>

    {notifications.length === 0 ? (
      <p className="text-gray-500">No notifications</p>
    ) : (
      <div className="space-y-3">

        {notifications.map(n => (
          <div
            key={n.id}
            className="border p-3 rounded flex justify-between items-center"
          >
            <p className="text-sm">{n.message}</p>
            <span className="text-xs text-gray-400">{n.time}</span>
          </div>
        ))}

      </div>
    )}

  </div>
);
const WalletSection = () => (
  <div className="bg-white rounded-xl shadow p-6 space-y-2">
    <h1 className="text-xl font-semibold">Driver Wallet</h1>

    <div className="bg-green-100 p-4 rounded-lg">
      <p className="text-gray-600 text-sm">Total Earnings</p>
      <p className="text-2xl font-bold text-green-700">
        ₹{driverStats.totalEarnings}
      </p>
    </div>

    <button className="bg-orange-500 text-white px-4 py-2 rounded">
      Withdraw Earnings
    </button>
  </div>
);
const RatingsSection = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const reviewsPerPage = 3;

  // ✅ ALL RATINGS
  const allRatings = (driverStats.deliveredOrders || [])
    .filter(o => o.customerRating?.rating)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // ✅ FILTER LOGIC
  const filteredRatings =
    selectedFilter === "all"
      ? allRatings
      : allRatings.filter(
          o => Math.floor(o.customerRating.rating) === selectedFilter
        );

  // ✅ PAGINATION
  const totalPages = Math.ceil(filteredRatings.length / reviewsPerPage);
  const indexOfLast = currentPage * reviewsPerPage;
  const indexOfFirst = indexOfLast - reviewsPerPage;
  const currentRatings = filteredRatings.slice(indexOfFirst, indexOfLast);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, driverStats]);

  return (
    <div className="space-y-4">

      {/* ⭐ AVERAGE */}
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <p className="text-gray-500 text-sm">Average Rating</p>
        <p className="text-4xl font-bold text-yellow-500">
          ⭐ {driverStats.averageRating || 5}
        </p>
      </div>

      {/* 🎯 FILTER BUTTONS */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-2 justify-center">
        {["all", 5, 4, 3, 2, 1].map((f, i) => (
          <button
            key={i}
            onClick={() => setSelectedFilter(f)}
            className={`px-3 py-1 rounded-full text-sm transition ${
              selectedFilter === f
                ? "bg-orange-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "All" : `⭐ ${f}`}
          </button>
        ))}
      </div>

      {/* 📦 REVIEWS + FIXED HEIGHT */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col h-[420px]">

        <h2 className="font-semibold mb-3">Customer Reviews</h2>

        {filteredRatings.length === 0 ? (
          <p className="text-gray-500">No ratings found</p>
        ) : (
          <>
            {/* ✅ SCROLL AREA (FIXED HEIGHT) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {currentRatings.map(order => (
                <div
                  key={order._id}
                  className="border p-3 rounded-lg hover:shadow-sm transition"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-yellow-500">
                      ⭐ {order.customerRating.rating}
                    </p>

                    <span className="text-xs text-gray-400">
                      #{order._id.slice(-5)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">
                    {order.customerRating.review || "No comment"}
                  </p>
                </div>
              ))}
            </div>

            {/* ✅ FIXED PAGINATION (BOTTOM LOCKED) */}
            <div className="border-t pt-3 mt-3 flex justify-between items-center">

              {/* PREV */}
              <button
                onClick={() =>
                  setCurrentPage(prev => Math.max(prev - 1, 1))
                }
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                ← Prev
              </button>

              {/* PAGE NUMBERS */}
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === i + 1
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* NEXT */}
              <button
                onClick={() =>
                  setCurrentPage(prev =>
                    Math.min(prev + 1, totalPages)
                  )
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
const SupportSection = () => (
  <div className="bg-white rounded-xl shadow p-6 space-y-2">
    <h1 className="text-xl font-semibold">Support</h1>

    <p className="text-gray-600">
      If you face any issue during delivery contact support.
    </p>

    <button className="bg-orange-500 text-white px-4 py-2 rounded">
      Contact Admin
    </button>
  </div>
);
const EarningsSection = () => {

  // 🟢 Today Earnings
  const todayEarnings = driverStats.deliveredOrders
    ?.filter(order => {
      const today = new Date();
      const orderDate = new Date(order.createdAt);
      return orderDate.toDateString() === today.toDateString();
    })
    .reduce((sum, order) => sum + (order.charges?.driverEarning || 0), 0);

  // 🔵 Weekly Earnings
  const weekEarnings = driverStats.deliveredOrders
    ?.filter(order => {
      const now = new Date();
      const orderDate = new Date(order.createdAt);
      const diff = (now - orderDate) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    })
    .reduce((sum, order) => sum + (order.charges?.driverEarning || 0), 0);

  return (
    <div className="space-y-6">

      {/* 🔥 TOP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-green-100 p-4 rounded-xl">
          <p className="text-sm text-gray-600">Today Earnings</p>
          <p className="text-2xl font-bold text-green-700">
            ₹{todayEarnings}
          </p>
        </div>

        <div className="bg-blue-100 p-4 rounded-xl">
          <p className="text-sm text-gray-600">Last 7 Days</p>
          <p className="text-2xl font-bold text-blue-700">
            ₹{weekEarnings}
          </p>
        </div>

        <div className="bg-orange-100 p-4 rounded-xl">
          <p className="text-sm text-gray-600">Total Deliveries</p>
          <p className="text-2xl font-bold text-orange-700">
            {driverStats.totalDeliveries}
          </p>
        </div>

      </div>

      {/* 📊 CHART */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-2">
          Weekly Earnings Overview
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Track your earnings for each day
        </p>

        <WeeklyChart />
      </div>

      {/* 📄 RECENT EARNINGS */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-3">Recent Earnings</h2>

        <div className="space-y-2">
          {driverStats.deliveredOrders
            ?.slice(0, 5)
            .map(order => (
              <div key={order._id} className="flex justify-between text-sm">

                <span>
                  Order #{order._id.slice(-5)}
                </span>

                <span className="text-green-600 font-medium">
                  ₹{order.charges?.driverEarning || 0}
                </span>

              </div>
            ))}
        </div>
      </div>

    </div>
  );
};

const DeliveryHistorySection = () => {
 const deliveredOrders = (driverStats.deliveredOrders || [])
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
const [currentPage, setCurrentPage] = useState(1);
const ordersPerPage = 2;
const indexOfLast = currentPage * ordersPerPage;
const indexOfFirst = indexOfLast - ordersPerPage;
useEffect(() => {
  setCurrentPage(1);
}, [driverStats]);
const currentOrders = deliveredOrders.slice(indexOfFirst, indexOfLast);
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h1 className="text-xl font-semibold mb-4">Delivery History</h1>
<p className="mb-4 text-green-600 font-semibold">
  Total Earned: ₹{driverStats.totalEarnings}
</p>
      {deliveredOrders.length === 0 ? (
  <p className="text-gray-500">No deliveries yet</p>
) : (
  <>
    {/* ORDERS LIST */}
    <div className="space-y-4">
      {currentOrders.map(order => (
        <div
          key={order._id}
          className="border rounded-lg p-4 hover:shadow-md transition"
        >

          {/* HEADER */}
          <div className="flex justify-between items-center">
            <p className="font-semibold text-orange-600">
              Order #{order._id.slice(-6)}
            </p>

            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
              Delivered
            </span>
          </div>

          {/* CUSTOMER */}
          <div className="text-sm mt-1 space-y-1">
            <p>👤 {order.customerId?.name || "Customer"}</p>
            <p className="text-xs text-gray-500">
              📞 {order.deliveryDetails?.phone || "N/A"}
            </p>
            
          </div>

          {/* ADDRESS */}
          <p className="text-xs text-gray-500 mt-1">
            📍 {order.deliveryDetails?.addressLine1}, 
            {order.deliveryDetails?.city}, 
            {order.deliveryDetails?.state} - 
            {order.deliveryDetails?.postalCode}
          </p>

          {/* TIME */}
          <p className="text-xs text-gray-400 mt-1">
            🕒 {new Date(order.createdAt).toLocaleString()}
          </p>

          {/* PRICE + EARNING */}
          <div className="flex justify-between mt-3">
            <p className="text-sm font-semibold text-green-600">
              ₹{order.totalAmount}
            </p>

            <p className="text-sm text-blue-600 font-medium">
              Earned ₹{order.charges?.driverEarning || 0}
            </p>
          </div>

        </div>
      ))}
    </div>

    {/* ✅ PAGINATION (ONLY ONCE) */}
    <div className="mt-4 flex justify-between items-center">

      <button
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        ← Prev
      </button>

      <div className="flex gap-2">
        {Array.from(
          { length: Math.ceil(deliveredOrders.length / ordersPerPage) },
          (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          )
        )}
      </div>

      <button
        onClick={() =>
          setCurrentPage(prev =>
            Math.min(prev + 1, Math.ceil(deliveredOrders.length / ordersPerPage))
          )
        }
        disabled={
          currentPage === Math.ceil(deliveredOrders.length / ordersPerPage)
        }
        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        Next →
      </button>

    </div>
  </>
)}
    </div>
  );
};

 const renderContent = () => {
  switch (activeSection) {
    case "dashboard":
      return renderDashboard();

    case "orders":
      return <OrdersSection />;

    case "earnings":
      return <EarningsSection />;

    case "profile":
      return <ProfileSection />;

    case "history":
      return <DeliveryHistorySection />;

    case "navigation":
      return <NavigationSection />;

    case "notifications":
      return <NotificationsSection />;


    case "ratings":
      return <RatingsSection />;

    

    default:
      return renderDashboard();
  }
};


  useEffect(() => {
  const token = localStorage.getItem("token");

  axios.get(`${API}/api/users/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => {
      setProfile(res.data);

      // 🔥 ADD THIS LINE (VERY IMPORTANT)
      setAvailability(res.data.isAvailable);
    })
    .catch(err => console.error("Failed to fetch profile:", err));

}, []);
  useEffect(() => {

  const token = localStorage.getItem("token");

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {

      const { latitude, longitude } = position.coords;
      setDriverLocation({
       lat: latitude,
       lng: longitude
      });
      try {
        await axios.post(
          `${API}/api/users/driver/location`,
          { lat: latitude, lng: longitude },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Location update failed");
      }

    },
    (err) => console.error(err),
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 5000
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);

}, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {mobileMenuOpen && (
  <div
    className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
    onClick={() => setMobileMenuOpen(false)}
  />
)}
     {/* ✅ NEW SIDEBAR PASTE HERE */}
<aside
  className={`
    fixed top-0 left-0 h-screen
    bg-white/90 backdrop-blur-md border-r border-gray-200
    flex flex-col z-40
    transition-all duration-300 ease-in-out

    ${sidebarCollapsed ? "w-20" : "w-64"}
    ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}
>

  {/* LOGO */}
  <div className="flex items-center justify-between px-5 py-4 border-b">
    {!sidebarCollapsed && (
    <span
  className={`
    text-xl font-bold text-orange-500 whitespace-nowrap
    transition-all duration-300
    ${sidebarCollapsed ? "opacity-0 scale-0" : "opacity-100 scale-100"}
  `}
>
  Grabbie 🚀
</span>
    )}

    <button
      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      className="text-gray-500 hover:text-orange-500 text-lg"
    >
      {sidebarCollapsed ? "➡" : "⬅"}
    </button>
  </div>

  {/* AVAILABILITY */}
  <div className="hidden md:block px-4 py-3 border-b">
    {!sidebarCollapsed && (
      <p className="text-xs text-gray-400 mb-2">Availability</p>
    )}
    <AvailabilityToggle
      availability={availability}
      onToggle={toggleAvailability}
    />
  </div>

  {/* MENU */}
  <nav className="flex-1 overflow-y-auto mt-4 px-3 space-y-1">

    {menuItems.map((item) => {
  const active = activeSection === item.id;

  return (
    <button
      key={item.id}
      onClick={() => {
        setActiveSection(item.id);
        setMobileMenuOpen(false);
      }}
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200 ease-in-out w-full text-left

        ${active
          ? "bg-gradient-to-r from-orange-100 to-orange-50 text-orange-600 shadow-sm"
          : "text-gray-600 hover:bg-orange-50 hover:text-orange-500 hover:scale-[1.02]"
        }
      `}
    >

      {/* LEFT ACTIVE INDICATOR */}
      <div
        className={`
          w-1 h-6 rounded-full transition-all
          ${active ? "bg-orange-500" : "bg-transparent group-hover:bg-orange-300"}
        `}
      />

      {/* ICON BOX */}
      <div
        className={`
          flex items-center justify-center w-9 h-9 rounded-lg
          ${active
            ? "bg-orange-200 shadow-inner"
            : "bg-gray-100 group-hover:bg-orange-100 group-hover:shadow-sm"}
        `}
      >
        <span className="text-lg transition-transform duration-200 group-hover:scale-110">
          {item.icon}
        </span>
      </div>

      {/* LABEL */}
      {!sidebarCollapsed && (
        <span
  className={`
    text-sm font-medium transition-all duration-200
    ${sidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}
  `}
>
  {item.label}
</span>
      )}

    </button>
  );
})}

  </nav>

  {/* LOGOUT */}
  <div className="mt-auto px-4 pb-4">
    <button
      onClick={() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }}
      className="w-full py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm"
    >
      Logout
    </button>
  </div>

</aside>

      <main
  className={`
    flex-1 flex flex-col
    ml-64
    ${sidebarCollapsed ? "ml-20" : "ml-64"}
    transition-all duration-300
  `}
>
    <div className="p-6 flex-1 overflow-hidden ml-0">
  <div className="h-full overflow-y-auto pr-2">

    {/* 📱 MOBILE TOP BAR */}
    <div className="flex items-center justify-between mb-4 md:hidden">

  {/* LEFT SIDE */}
  <div className="flex items-center gap-3">
    <button
      onClick={() => setMobileMenuOpen(true)}
      className="text-2xl"
    >
      ☰
    </button>

    <h1 className="text-xl font-bold capitalize">
      {activeSection}
    </h1>
  </div>

  {/* RIGHT SIDE (ONLINE BUTTON) */}
  <button
    onClick={toggleAvailability}
    className={`
      px-3 py-1.5 rounded-full text-xs font-medium
      flex items-center gap-2
      ${availability
        ? "bg-green-100 text-green-700"
        : "bg-gray-200 text-gray-600"}
    `}
  >
    <span
      className={`w-2 h-2 rounded-full ${
        availability ? "bg-green-500" : "bg-gray-400"
      }`}
    />
    {availability ? "Online" : "Offline"}
  </button>

</div>

    {/* 💻 DESKTOP TITLE */}
    <h1 className="hidden md:block text-2xl font-bold text-gray-800 mb-4 capitalize">
      {activeSection}
    </h1>

    {renderContent()}
    
  </div>
</div>
      </main>
    </div>
  );
};

export default DriverDashboardPage;
