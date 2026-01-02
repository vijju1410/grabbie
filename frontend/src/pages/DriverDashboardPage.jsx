import { useState, useEffect,useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";

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
const defaultCenter = { lat: 40.7128, lng: -74.006 };

const DriverDashboardPage = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [availability, setAvailability] = useState(true);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState(null);

  const [selectedMarker, setSelectedMarker] = useState(null); // for map InfoWindow


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
  { title: "Average Rating", value: driverStats.averageRating, icon: "⭐" }
];


const weeklyData = useMemo(() => {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const data = days.map(day => ({ day, amount: 0 }));

  driverStats.deliveredOrders?.forEach(order => {
    const day = days[new Date(order.createdAt).getDay()];
    const item = data.find(d => d.day === day);
    if (item) item.amount += order.charges?.deliveryCharge || 0;
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
    { id: "earnings", label: "Earnings", icon: "💰" },
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
    fetchOrders();
    fetchDriverStats();
    const interval = setInterval(fetchOrders, 15000); // Auto-refresh every 15 sec
    return () => clearInterval(interval);
  }, []);

  const { isLoaded } = useJsApiLoader({
googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  // ================= COMPONENTS =================
  const StatsCard = ({ title, value, change, icon }) => (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="text-2xl">{icon}</div>
        <span className="text-green-600 font-semibold text-sm">{change}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-gray-500 text-sm">{title}</div>
    </div>
  );

  const WeeklyChart = () => (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-lg font-semibold mb-3">Weekly Earnings</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData}>
            <XAxis dataKey="day" />
            <Tooltip />
            <Bar dataKey="amount" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
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
    <div className="space-y-4">
      {ordersList
        .filter(o => !searchTerm || o._id.includes(searchTerm))
        .map((order) => {
          const vendor = resolveVendorForOrder(order);
          const mapsQuery = vendor?.address ? encodeURIComponent(vendor.address) : order.deliveryDetails?.addressLine1 || "";
          const mapsUrl = vendor?.address
            ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryDetails?.addressLine1 || "")}`;

          return (
            <div key={order._id} className="p-4 border rounded-lg hover:shadow bg-white">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold text-orange-600">Order ID: {order._id}</p>
                  <p className="text-sm">{order.customerId?.name} - {order.customerId?.email}</p>
                  <p className="text-sm">
                    Status:
                    <span className={`px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </p>
                </div>
                <div className="flex space-x-2">
                 {order.status === "Ready for Pickup" && !order.assignedDriver && (
  <button
    onClick={() => assignOrder(order._id)}
    className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-sm"
  >
    Accept
  </button>
)}

                  {order.assignedDriver && order.status === "Out for Delivery" &&
                    <button onClick={() => deliverOrder(order._id)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">
                      Mark Delivered
                    </button>
                  }
                </div>
              </div>

              <div className="mb-2">
                <p className="font-semibold">Delivery Address:</p>
                <p className="text-sm">
                  {order.deliveryDetails?.fullName}, {order.deliveryDetails?.phone}<br/>
                  {order.deliveryDetails?.email}<br/>
                  {order.deliveryDetails?.addressLine1}{order.deliveryDetails?.addressLine2 ? `, ${order.deliveryDetails.addressLine2}` : ""}<br/>
                  {order.deliveryDetails?.city}, {order.deliveryDetails?.state} - {order.deliveryDetails?.postalCode}<br/>
                  {order.deliveryDetails?.country}
                </p>
              </div>

              <div className="mb-2">
                <p className="font-semibold">Payment: {order.paymentMethod}</p>
                <p className="font-semibold">Total Amount: ₹{order.totalAmount}</p>
              </div>

              <div className="mb-2">
                <p className="font-semibold">Products:</p>
                {order.products.map((p, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-sm mb-1">
                    <img
                      src={p.productId?.image ? p.productId.image : "https://via.placeholder.com/40"}
                      alt={p.productId?.name}
                      className="w-10 h-10 rounded"
                    />
                    <span>{p.productId?.name} x {p.quantity} (₹{p.productId?.price})</span>
                  </div>
                ))}
              </div>

              {/* Vendor pickup info (first product's vendor) */}
              {vendor && (
                <div className="mb-2 border-t pt-2">
                  <p className="font-semibold">Pickup Location</p>
                  <p className="text-sm">
                    <strong>{vendor.name}</strong><br/>
                    {vendor.address && <>{vendor.address}<br/></>}
                    {vendor.phone && <span>📞 {vendor.phone}</span>}
                  </p>
                  <div className="mt-2">
                    <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Open in Google Maps</a>
                  </div>
                </div>
              )}

            </div>
        )})}
    </div>
  );

  // ================= ORDERS WITH TABS =================
  const OrdersSection = () => {
    const [tab, setTab] = useState("available");
    const displayedOrders = tab === "available" ? availableOrders : activeOrders;

    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold mb-4">Orders</h1>

        <div className="flex space-x-2 mb-4">
          <button
            className={`px-4 py-2 rounded ${tab === "available" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setTab("available")}
          >
            Available Orders
          </button>
          <button
            className={`px-4 py-2 rounded ${tab === "active" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setTab("active")}
          >
            Active Orders
          </button>
        </div>

        <RecentOrders ordersList={displayedOrders} />
      </div>
    );
  };

  // ================= MAP =================
  const renderMap = () => {
    if (!isLoaded) return <div>Loading Map...</div>;

    return (
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Active Orders Map</h2>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={12}
        >
          {activeOrders.map(order => (
            <Marker
              key={order._id}
              position={{
                lat: order.deliveryDetails?.latitude || defaultCenter.lat,
                lng: order.deliveryDetails?.longitude || defaultCenter.lng
              }}
              onClick={() => setSelectedMarker(order)}
            />
          ))}

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

                {selectedMarker.assignedDriver && selectedMarker.status === "Out for Delivery" &&
                  <button onClick={() => deliverOrder(selectedMarker._id)} className="bg-green-500 text-white px-3 py-1 rounded mt-2">Mark Delivered</button>
                }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyChart />
        <OrdersSection />
      </div>
    </div>
  );

  const AvailabilityToggle = ({ availability, onToggle }) => (
  <button
    onClick={onToggle}
    className={`relative w-full h-14 rounded-full transition-all duration-300 shadow-inner
      ${availability ? "bg-green-500" : "bg-gray-300"}`}
  >
    <span
      className={`absolute top-1 left-1 w-12 h-12 bg-white rounded-full shadow-lg
        transform transition-transform duration-300
        ${availability ? "translate-x-[calc(100%-3rem)]" : "translate-x-0"}`}
    />
    <span className="absolute inset-0 flex items-center justify-center font-semibold text-white tracking-wide">
      {availability ? "ONLINE" : "OFFLINE"}
    </span>
  </button>
);
const EditProfileModal = ({ open, onClose }) => {
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");

  const saveProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/api/users/profile`,
        { name, phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Profile updated");
      onClose();
      window.location.reload();
    } catch {
      toast.error("Failed to update profile");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slideUp">
        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border rounded-lg mb-3"
          placeholder="Full Name"
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4"
          placeholder="Phone"
        />

        <div className="flex gap-3">
          <button
            onClick={saveProfile}
            className="flex-1 bg-orange-500 text-white py-2 rounded-lg"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

 const ProfileSection = () => {
  const [showEditProfile, setShowEditProfile] = useState(false);

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
</div>


        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <h3 className="text-base font-semibold">Account</h3>

          <button
            onClick={() => setShowEditProfile(true)}
            className="w-full py-2.5 rounded-xl border hover:bg-gray-100 text-sm"
          >
            ✏️ Edit Profile
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
        </div>
      </div>

      {/* Modal */}
      <EditProfileModal
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </div>
  );
};



const EarningsSection = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <div key={i} className="bg-white rounded-xl shadow p-4">
          <div className="text-2xl">{s.icon}</div>
          <p className="text-xl font-bold mt-2">{s.value}</p>
          <p className="text-sm text-gray-500">{s.title}</p>
        </div>
      ))}
    </div>
    <WeeklyChart />
  </div>
);


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
  
    default:
      return renderDashboard();
  }
};


  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setProfile(res.data))
      .catch(err => console.error("Failed to fetch profile:", err));
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className={`bg-white shadow-md transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-64"}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-orange-600">{!sidebarCollapsed && "DeliveryPro"}</span>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-600">{sidebarCollapsed ? "➡" : "⬅"}</button>
        </div>
        <nav className="flex flex-col mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center p-3 hover:bg-orange-50 ${activeSection === item.id ? "bg-orange-100 text-orange-700" : "text-gray-700"}`}
            >
              <span className="text-xl">{item.icon}</span>
              {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow p-4 flex justify-between">
          <h1 className="text-lg font-semibold">Driver Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
  <span className="text-xl">🔔</span>

  {driverStats.notificationsCount > 0 && (
    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
      {driverStats.notificationsCount}
    </span>
  )}
</div>
           <div className="flex items-center space-x-2">
             <img src={profile?.profileImage ? profile.profileImage
 : "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?w=50&h=50&fit=crop"} alt={profile?.name || "Driver"} className="w-10 h-10 rounded-full"/>
             <div className="hidden sm:block">
               <p className="font-semibold">{profile?.name || "Driver"}</p>
               <p className="text-xs text-gray-500">Driver</p>
             </div>
           </div>
          </div>
        </header>
        <div className="p-6 flex-1 overflow-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default DriverDashboardPage;
