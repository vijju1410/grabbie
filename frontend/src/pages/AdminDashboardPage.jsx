  import React, { useEffect, useMemo, useState } from "react";
  import axios from "axios";
  import { 
    Bell, CheckCircle, Users, Building2, Truck, LayoutGrid, X, Menu, Edit2, Trash2 
  } from "lucide-react";

  import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
  import { Doughnut } from "react-chartjs-2";
  import Swal from "sweetalert2";


  ChartJS.register(ArcElement, Tooltip, Legend);

const API = process.env.REACT_APP_API_URL;
  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
    const ITEMS_PER_PAGE = 5;

  const AdminDashboardPage = () => {
    const [active, setActive] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [users, setUsers] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [orderFilter, setOrderFilter] = useState("all");
    const [pendingVendors, setPendingVendors] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [notes, setNotes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [admin, setAdmin] = useState(null);
    const [pendingDrivers, setPendingDrivers] = useState([]);
    const [approvedVendors, setApprovedVendors] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [customerSearch, setCustomerSearch] = useState("");
  const [rejectedVendors, setRejectedVendors] = useState([]);
  const [approvedDrivers, setApprovedDrivers] = useState([]);
  const [rejectedDrivers, setRejectedDrivers] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // ---------- PAGINATION ----------

  const [currentPage, setCurrentPage] = useState(1);

  const paginate = (data = []) => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  };



    // ---------- FETCH ADMIN PROFILE ----------
    useEffect(() => {
      const fetchAdmin = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
          const res = await axios.get(`${API}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAdmin(res.data);
        } catch (err) {
          console.error("Failed to fetch admin profile", err);
        }
      };
      fetchAdmin();
    }, []);

    useEffect(() => {
    setApprovedVendors(vendors.filter(v => v.vendorStatus === 'approved'));
    setRejectedVendors(vendors.filter(v => v.vendorStatus === 'rejected'));
  }, [vendors]);

  useEffect(() => {
    setApprovedDrivers(drivers.filter(d => d.driverStatus === 'approved'));
    setRejectedDrivers(drivers.filter(d => d.driverStatus === 'rejected'));
  }, [drivers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [active]);

    // ---------- FETCH DATA ----------
    const fetchUsers = async () => {
      const res = await axios.get(`${API}/api/users?role=customer`, { headers: authHeader() });
      setUsers(res.data || []);
    };
const fetchOrders = async () => {
  try {
    const res = await axios.get(`${API}/api/orders`, {
      headers: authHeader(),
    });
    setOrders(res.data || []);
  } catch (err) {
    console.error("Failed to fetch orders", err);
  }
};

  const fetchPendingDrivers = async () => {
    const res = await axios.get(`${API}/api/admin/pending-drivers`, { headers: authHeader() });
    setPendingDrivers(res.data || []);
  };

    const fetchDrivers = async () => {
      const res = await axios.get(`${API}/api/users?role=driver`, { headers: authHeader() });
      setDrivers(res.data || []);
    };

    const fetchPendingVendors = async () => {
      const res = await axios.get(`${API}/api/admin/pending-vendors`, { headers: authHeader() });
      setPendingVendors(res.data || []);
    };

    const fetchAllVendors = async () => {
      const res = await axios.get(`${API}/api/users?role=vendor`, { headers: authHeader() });
      setVendors(res.data || []);
    };

    const fetchNotifications = async () => {
      const res = await axios.get(`${API}/api/admin/notifications`, { headers: authHeader() });
      setNotes(res.data || []);
    };

    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API}/api/categories`, { headers: authHeader() });
        setCategories(res.data || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    const approveDriver = async (id) => {
    await axios.put(`${API}/api/admin/approve-driver/${id}`, {}, { headers: authHeader() });
    setPendingDrivers(prev => prev.filter(d => d._id !== id));
    fetchDrivers();
  };

  const rejectDriver = async (id) => {
    await axios.put(`${API}/api/admin/reject-driver/${id}`, {}, { headers: authHeader() });
    setPendingDrivers(prev => prev.filter(d => d._id !== id));
  };


    useEffect(() => {
      setLoading(true);
      Promise.all([
        fetchUsers(), 
        fetchDrivers(), 
          fetchPendingDrivers(), // add this

        fetchPendingVendors(), 
        fetchAllVendors(), 
        fetchNotifications(),
        fetchOrders()
      ]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
      if (active === "notifications") fetchNotifications();
      if (active === "vendors") fetchPendingVendors();
      if (active === "allVendors") fetchAllVendors();
      if (active === "categories") fetchCategories();
    }, [active]);

    // ---------- VENDOR APPROVE/REJECT ----------
    const approveVendor = async (id) => {
      await axios.put(`${API}/api/admin/approve-vendor/${id}`, {}, { headers: authHeader() });
      setPendingVendors(prev => prev.filter(v => v._id !== id));
      fetchAllVendors();
      fetchNotifications();
    };

    const rejectVendor = async (id) => {
      await axios.put(`${API}/api/admin/reject-vendor/${id}`, {}, { headers: authHeader() });
      setPendingVendors(prev => prev.filter(v => v._id !== id));
      fetchAllVendors();
      fetchNotifications();
    };

    // ---------- CHART DATA ----------
    const chartData = useMemo(() => ({
    labels: ["Customers", "Total Vendors", "Delivery Partners"],
    datasets: [{
      data: [users.length, vendors.length, drivers.length], // use vendors.length here
      backgroundColor: ["#3B82F6", "#8B5CF6", "#10B981"],
    }]
  }), [users.length, vendors.length, drivers.length]);

  const platformRevenue = orders.reduce((sum, o) => {
  const c = o.charges || {};
  return sum + (c.platformFee || 0) + (c.serviceCharge || 0);
}, 0);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

const activeOrders = orders.filter(o =>
  ["Placed", "Accepted", "Ready for Pickup", "Out for Delivery"].includes(o.status)
).length;
const filteredOrders =
  orderFilter === "all"
    ? orders
    : orders.filter(o => o.status === orderFilter);
const pendingOrders = orders.filter(o => o.status === "Placed").length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
        {sidebarOpen && (
<div
className="fixed inset-0 bg-black/40 z-30 md:hidden"
onClick={() => setSidebarOpen(false)}
></div>
)}
        {/* ---------- SIDEBAR ---------- */}
<aside
  className={`
    fixed top-0 left-0 h-full w-64
    bg-gray-50 border-r border-gray-200
    shadow-xl
    flex flex-col   // ✅ IMPORTANT
    transition-all duration-300
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
    z-40
  `}
>

  {/* 🔷 LOGO + ADMIN */}
<div className="px-4 py-5 border-b border-gray-100">

  {/* PROFILE HEADER (REPLACES LOGO) */}
  <div className="flex items-center gap-3">
    <img
      src={admin?.profileImage || "https://via.placeholder.com/40"}
      className="w-11 h-11 rounded-full object-cover border"
    />

    <div>
      <p className="text-sm font-semibold text-gray-800">
        {admin?.name || "Admin"}
      </p>
      <p className="text-xs text-gray-500">Administrator</p>
    </div>
  </div>

</div>

  {/* 🔷 MENU (KEEP YOUR EXISTING ITEMS SAME) */}
  <div className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">

    {/* ⚠️ DO NOT CHANGE BELOW MENU ITEMS */}
    <SidebarItem icon={<LayoutGrid />} label="Dashboard" active={active === "dashboard"} onClick={() => setActive("dashboard")} />

    <SidebarItem icon={<Users />} label="Customers" active={active === "users"} onClick={() => setActive("users")} />

    <SidebarItem icon={<Building2 />} label="Approved Vendors" active={active === "approvedVendors"} onClick={() => setActive("approvedVendors")} />

    <SidebarItem icon={<Building2 />} label="Rejected Vendors" active={active === "rejectedVendors"} onClick={() => setActive("rejectedVendors")} />

    <SidebarItem icon={<Building2 />} label="Pending Vendors" active={active === "vendors"} onClick={() => setActive("vendors")} />

    <SidebarItem icon={<Truck />} label="Approved Drivers" active={active === "approvedDrivers"} onClick={() => setActive("approvedDrivers")} />

    <SidebarItem icon={<Truck />} label="Rejected Drivers" active={active === "rejectedDrivers"} onClick={() => setActive("rejectedDrivers")} />

    <SidebarItem icon={<Truck />} label="Pending Drivers" active={active === "pendingDrivers"} onClick={() => setActive("pendingDrivers")} />

    <SidebarItem icon={<LayoutGrid />} label="Categories" active={active === "categories"} onClick={() => setActive("categories")} />

    <SidebarItem icon={<Bell />} label="Notifications" active={active === "notifications"} onClick={() => setActive("notifications")} />
<SidebarItem icon={<LayoutGrid />} label="Orders" active={active === "orders"} onClick={() => setActive("orders")} />
  </div>

  {/* 🔻 LOGOUT BUTTON */}
  <div className="p-4 border-t border-gray-200">
    <button
      onClick={() => {
        localStorage.clear();
        window.location.href = "/login";
      }}
      className="w-full bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition"
    >
      Logout
    </button>
  </div>

</aside>

        {/* ---------- MAIN CONTENT ---------- */}
    <main className="flex-1 p-4 sm:p-6 md:p-8 md:ml-64">
<div className="flex flex-wrap justify-between items-center gap-2 mb-6">

<button
className="md:hidden mr-2"
onClick={() => setSidebarOpen(true)}
>
<Menu className="w-6 h-6"/>
</button>       
     <h1 className="text-lg sm:text-2xl font-bold text-slate-800">
              {active === "dashboard" ? "Dashboard"
                : active === "users" ? "Customers"
                  : active === "vendors" ? "Pending Vendors"
                    : active === "allVendors" ? "All Vendors"
                      : active === "drivers" ? "Delivery Partners"
                        : active === "categories" ? "Categories"
                        : active === "orders" ? "Orders"
                          : "Notifications"}
            </h1>

            <button
              onClick={() => setActive("notifications")}
              className="relative p-2 rounded hover:bg-slate-100"
              title="Notifications"
            >
              <Bell className="w-6 h-6 text-slate-700" />
              {notes.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {notes.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
{!loading && active === "orders" && (
  <SectionCard title="All Orders">
    {/* 🔥 ORDER STATS */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

  <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white p-4 rounded-xl shadow">
    <p className="text-sm opacity-80">Total Orders</p>
    <p className="text-xl font-bold">{orders.length}</p>
  </div>

  <div className="bg-white p-4 rounded-xl shadow">
    <p className="text-sm text-gray-500">Pending</p>
    <p className="text-xl font-bold">
      {orders.filter(o => o.status === "Placed").length}
    </p>
  </div>

  <div className="bg-white p-4 rounded-xl shadow">
    <p className="text-sm text-gray-500">Delivered</p>
    <p className="text-xl font-bold text-green-600">
      {orders.filter(o => o.status === "Delivered").length}
    </p>
  </div>

</div>
   <div className="mb-6 flex flex-wrap gap-2">

  {["all","Placed","Out for Delivery","Delivered","Cancelled"].map(status => (
    <button
      key={status}
      onClick={() => setOrderFilter(status)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition
        ${orderFilter === status
          ? "bg-orange-500 text-white shadow"
          : "bg-gray-100 text-gray-600 hover:bg-orange-100"
        }`}
    >
      {status}
    </button>
  ))}

</div>

    {filteredOrders.length === 0 ? (
  <div className="text-center py-10 text-gray-500">
    🚫 No orders for "{orderFilter}" status
  </div>
) : (
      <>
<table className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm">          <thead className="bg-slate-100">
            <tr>
              <Th>Customer</Th>
              <Th>Vendor</Th>
              <Th>Driver</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th>Action</Th>
            </tr>
          </thead>

          <tbody>
            {paginate(filteredOrders).map(o => (
              <tr key={o._id} className="border-t hover:bg-gray-50 transition">
                
                {/* CUSTOMER */}
                <Td>
                  {o.customerId?.name || "Customer"}
                </Td>
<Td>
  {o.products[0]?.vendorSnapshot?.businessName || "Vendor"}
</Td>

<Td>
  {o.assignedDriver?.name || "Not Assigned"}
</Td>
                {/* AMOUNT */}
                <Td>
                 ₹{o.totalAmount?.toLocaleString()}
                </Td>

                {/* STATUS */}
                <Td>
                  <span className={`px-2 py-0.5 text-xs rounded
                    ${o.status === "Delivered" ? "bg-green-100 text-green-700"
                      : o.status === "Cancelled" ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-800"}
                  `}>
                    {o.status}
                  </span>
                </Td>

                {/* DATE */}
                <Td>
                  {new Date(o.createdAt).toLocaleDateString()}
                </Td>
<Td>
  <button
    onClick={() => setSelectedOrder(o)}
    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-sm"
  >
    View
  </button>
</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedOrder && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-[500px] relative">

      <button
        onClick={() => setSelectedOrder(null)}
        className="absolute top-2 right-3"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold mb-4">Order Details</h2>
<p><b>Order Date:</b> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
      <p><b>Customer:</b> {selectedOrder.customerId?.name}</p>
      <p><b>Amount:</b> ₹{selectedOrder.totalAmount}</p>
      <p><b>Status:</b> {selectedOrder.status}</p>

      <div className="mt-3">
        <b>Products:</b>
        {selectedOrder.products.map((p, i) => (
          <div key={i}>
            {p.productId?.name} × {p.quantity}
          </div>
        ))}
      </div>

    </div>
  </div>
)}

        <Pagination
          totalItems={filteredOrders.length}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </>
    )}
  </SectionCard>
)}
          {loading && <div className="bg-white rounded-xl shadow p-6">Loading...</div>}

          {/* ---------- DASHBOARD ---------- */}
          {!loading && active === "dashboard" && (
            <div className="space-y-6">
              {/* 🔥 BUSINESS STATS */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
  <StatCard title="Total Orders" value={orders.length} color="from-orange-500 to-orange-400" />
  <StatCard title="Revenue" value={`₹${totalRevenue.toFixed(2)}`} color="from-pink-500 to-pink-400" />
  <StatCard title="Platform Revenue" value={`₹${platformRevenue.toFixed(2)}`} color="from-indigo-500 to-indigo-400" />
</div>

{/* 👥 USERS */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
  <StatCard title="Customers" value={users.length} color="from-blue-500 to-blue-400" />
  <StatCard title="Vendors" value={vendors.length} color="from-purple-500 to-purple-400" />
  <StatCard title="Drivers" value={drivers.length} color="from-green-500 to-green-400" />
</div>

{/* 🚚 ORDER STATUS */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
  <StatCard title="Active Orders" value={activeOrders} color="from-yellow-500 to-yellow-400" />
  <StatCard title="Pending Orders" value={pendingOrders} color="from-red-500 to-red-400" />
</div>
             <br></br>
 <SectionCard title="Recent Orders">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b">
          <th className="py-2">Customer</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {orders.slice(0, 5).map(o => (
          <tr key={o._id} className="border-b hover:bg-gray-50">
            <td className="py-2">{o.customerId?.name || "Customer"}</td>
            <td>₹{o.totalAmount}</td>

            <td>
              <span className={`px-2 py-1 text-xs rounded
                ${o.status === "Delivered"
                  ? "bg-green-100 text-green-700"
                  : o.status === "Cancelled"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-800"}
              `}>
                {o.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</SectionCard>

<div className="bg-white rounded-2xl shadow-lg p-6">

  <div className="h-72">
    <Doughnut 
      data={chartData} 
      options={{ 
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%"
      }} 
    />
  </div>
</div>

            </div>
          )}

          {/* ---------- CUSTOMERS ---------- */}
          {!loading && active === "users" && (
            <SectionCard title="Customers">
              <div className="relative mb-5">
  <input
    type="text"
    placeholder="🔍 Search by name, email, phone..."
    value={customerSearch}
    onChange={(e) => setCustomerSearch(e.target.value)}
    className="w-full border border-gray-200 px-4 py-3 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-400 outline-none"
  />
</div>{/* 🔥 CUSTOMER STATS */}



  <SimpleTable
  columns={["Customer", "Email", "Phone", "Action"]}
  rows={paginate(
    users.filter(u =>
      u.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (u.phone || "").toLowerCase().includes(customerSearch.toLowerCase())
    )
  ).map(u => [
  <div className="flex items-center gap-3">
    <img
      src={u.profileImage || "https://via.placeholder.com/40"}
      alt="customer"
      className="w-10 h-10 rounded-full object-cover border"
    />
    <div>
      <p className="font-medium">{u.name}</p>
      <p className="text-xs text-gray-400">Customer</p>
    </div>
  </div>,

  <span className="text-gray-600">{u.email}</span>,

  <span>{u.phone || "-"}</span>,

  <button
    onClick={() => setSelectedCustomer(u)}
    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-sm"
  >
    View
  </button>
])}
/>

  <Pagination
    totalItems={users.length}
    currentPage={currentPage}
    setCurrentPage={setCurrentPage}
  />
  {/* 👁️ CUSTOMER DETAILS MODAL */}
{selectedCustomer && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-[450px] relative">

      <button
        onClick={() => setSelectedCustomer(null)}
        className="absolute top-2 right-3 text-gray-500"
      >
        ✕
      </button>

      <div className="flex items-center gap-4 mb-4">
        <img
          src={selectedCustomer.profileImage || "https://via.placeholder.com/80"}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div>
          <h2 className="text-lg font-bold">{selectedCustomer.name}</h2>
          <p className="text-sm text-gray-500">Customer</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <p><b>Email:</b> {selectedCustomer.email}</p>
        <p><b>Phone:</b> {selectedCustomer.phone || "-"}</p>
        <p><b>User ID:</b> {selectedCustomer._id}</p>
      </div>

    </div>
  </div>
)}
  
            </SectionCard>
          )}
          {!loading && active === "pendingDrivers" && (
    <SectionCard title="Pending Driver Approvals">
      {pendingDrivers.length === 0 ? (
    <div className="text-slate-600">No pending drivers.</div>
  ) : (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

    {paginate(pendingDrivers).map(d => (
      <div key={d._id} className="bg-white rounded-2xl shadow p-5">

        <div className="flex items-center gap-3 mb-3">
          <img src={d.profileImage || "https://via.placeholder.com/50"} className="w-12 h-12 rounded-full" />
          <div>
            <p className="font-semibold">{d.name}</p>
            <p className="text-xs text-gray-500">{d.email}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Vehicle: {d.vehicleNumber || "-"}
        </p>

        <div className="flex gap-2 mt-4">
          <button onClick={() => approveDriver(d._id)} className="flex-1 bg-green-500 text-white py-2 rounded-lg">
            Approve
          </button>

          <button onClick={() => rejectDriver(d._id)} className="flex-1 bg-red-500 text-white py-2 rounded-lg">
            Reject
          </button>
        </div>

      </div>
    ))}

  </div>

      <Pagination
        totalItems={pendingDrivers.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  )}

    </SectionCard>
  )}


          {/* ---------- PENDING VENDORS ---------- */}
          {!loading && active === "vendors" && (
            <SectionCard title="Pending Vendor Approvals">
            {pendingVendors.length === 0 ? (
    <div className="text-slate-600">No pending vendors.</div>
  ) : (
    <>
     {/* 🔥 STATS */}
  <div className="grid grid-cols-3 gap-4 mb-6">
    <div className="bg-orange-500 text-white p-4 rounded-xl">
      <p className="text-sm">Pending</p>
      <p className="text-xl font-bold">{pendingVendors.length}</p>
    </div>

    <div className="bg-green-100 p-4 rounded-xl">
      <p className="text-sm text-gray-500">Approved</p>
      <p className="text-xl font-bold">{approvedVendors.length}</p>
    </div>

    <div className="bg-red-100 p-4 rounded-xl">
      <p className="text-sm text-gray-500">Rejected</p>
      <p className="text-xl font-bold">{rejectedVendors.length}</p>
    </div>
  </div>

  {/* 🔥 CARDS */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {paginate(pendingVendors).map(v => (
      <div key={v._id} className="bg-white rounded-2xl shadow p-5">

        <div className="flex items-center gap-3 mb-4">
          <img src={v.profileImage || "https://via.placeholder.com/50"} className="w-12 h-12 rounded-full" />
          <div>
            <p className="font-semibold">{v.name}</p>
            <p className="text-xs text-gray-500">{v.email}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          {v.businessName} • {v.businessCategory}
        </p>

        <div className="flex gap-2 mt-4">
          <button onClick={() => approveVendor(v._id)} className="flex-1 bg-green-500 text-white py-2 rounded-lg">
            Approve
          </button>

          <button onClick={() => rejectVendor(v._id)} className="flex-1 bg-red-500 text-white py-2 rounded-lg">
            Reject
          </button>

          <button onClick={() => setSelectedVendor(v)} className="bg-orange-500 text-white px-3 rounded-lg">
            View
          </button>
        </div>

      </div>
    ))}
  </div>

      <Pagination
        totalItems={pendingVendors.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  )}

            </SectionCard>
          )}

          {/* ---------- ALL VENDORS ---------- */}
          {!loading && active === "allVendors" && (
            <SectionCard title="All Vendors">
              {vendors.length === 0 ? <div className="text-slate-600">No vendors.</div> :
                <SimpleTable columns={["Name","Email","Business","Status"]} rows={vendors.map(v=>[v.name,v.email,v.businessName||'-',v.vendorStatus])} />}
            </SectionCard>
          )}

          {/* ---------- DRIVERS ---------- */}
          {!loading && active === "drivers" && (
            <SectionCard title="Delivery Partners">
              <SimpleTable columns={["Name", "Email", "Vehicle"]} rows={drivers.map(d => [d.name, d.email, d.vehicleNumber || "-"])} />
            </SectionCard>
          )}

          {/* ---------- CATEGORIES ---------- */}
          {!loading && active === "categories" && (
            <SectionCard title="Manage Categories">

              
              <AddCategoryForm onCategoryAdded={fetchCategories} />
<CategoryTable
  categories={paginate(categories)}
  onCategoryUpdated={fetchCategories}
  onCategoryDeleted={fetchCategories}
/>

<Pagination
  totalItems={categories.length}
  currentPage={currentPage}
  setCurrentPage={setCurrentPage}
/>
            </SectionCard>
          )}
  {/* ---------- APPROVED VENDORS ---------- */}
  {!loading && active === "approvedVendors" && (
    <SectionCard title="Approved Vendors">
      {approvedVendors.length === 0 ? <div>No approved vendors.</div> :
<SimpleTable
columns={["Vendor", "Email", "Business"]}
rows={approvedVendors.map(v => [
  <div className="flex items-center gap-3">
    <img
      src={v.profileImage || "https://via.placeholder.com/40"}
      alt="vendor"
      className="w-8 h-8 rounded-full object-cover"
    />
    {v.name}
  </div>,
  v.email,
  v.businessName || "-"
])}
/>}
    </SectionCard>
  )}

  {/* ---------- REJECTED VENDORS ---------- */}
  {!loading && active === "rejectedVendors" && (
    <SectionCard title="Rejected Vendors">
      {rejectedVendors.length === 0 ? <div>No rejected vendors.</div> :
        <SimpleTable
columns={["Vendor", "Email", "Business"]}
rows={rejectedVendors.map(v => [
  <div className="flex items-center gap-3">
    <img
      src={v.profileImage || "https://via.placeholder.com/40"}
      alt="vendor"
      className="w-8 h-8 rounded-full object-cover"
    />
    {v.name}
  </div>,
  v.email,
  v.businessName || "-"
])}
/>}
    </SectionCard>
  )}

  {/* ---------- APPROVED DRIVERS ---------- */}
  {!loading && active === "approvedDrivers" && (
    <SectionCard title="Approved Drivers">
      {approvedDrivers.length === 0 ? <div>No approved drivers.</div> :
       <SimpleTable
  columns={["Driver", "Email", "Vehicle"]}
  rows={approvedDrivers.map(d => [
    <div className="flex items-center gap-3">
      <img
        src={d.profileImage || "https://via.placeholder.com/40"}
        alt="driver"
        className="w-8 h-8 rounded-full object-cover"
      />
      {d.name}
    </div>,
    d.email,
    d.vehicleNumber || "-"
  ])}
/>}
    </SectionCard>
  )}

  {/* ---------- REJECTED DRIVERS ---------- */}
  {!loading && active === "rejectedDrivers" && (
    <SectionCard title="Rejected Drivers">
      {rejectedDrivers.length === 0 ? <div>No rejected drivers.</div> :
       <SimpleTable
  columns={["Driver", "Email", "Vehicle"]}
  rows={rejectedDrivers.map(d => [
    <div className="flex items-center gap-3">
      <img
        src={d.profileImage || "https://via.placeholder.com/40"}
        alt="driver"
        className="w-8 h-8 rounded-full object-cover"
      />
      {d.name}
    </div>,
    d.email,
    d.vehicleNumber || "-"
  ])}
/>}
    </SectionCard>
  )}
  {selectedVendor && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-[500px] relative">

      <button
        onClick={() => setSelectedVendor(null)}
        className="absolute top-2 right-3 text-gray-500"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold mb-4">Vendor Details</h2>

      <div className="space-y-2 text-sm">

        <p><b>Name:</b> {selectedVendor.name}</p>
        <p><b>Email:</b> {selectedVendor.email}</p>
        <p><b>Phone:</b> {selectedVendor.phone}</p>

        <p><b>Business Name:</b> {selectedVendor.businessName}</p>
        <p><b>Business Address:</b> {selectedVendor.businessAddress}</p>
        <p><b>Business Phone:</b> {selectedVendor.businessPhone}</p>
        <p><b>Category:</b> {selectedVendor.businessCategory}</p>

        {selectedVendor.profileImage && (
          <div>
            <p className="font-semibold mt-2">Profile Image</p>
            <img
              src={selectedVendor.profileImage}
              alt="profile"
              className="w-20 h-20 rounded mt-1"
            />
          </div>
        )}

        {selectedVendor.idProof && (
          <div>
            <p className="font-semibold mt-2">ID Proof</p>
            <a
              href={selectedVendor.idProof}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              View ID Proof
            </a>
          </div>
        )}

      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            approveVendor(selectedVendor._id);
            setSelectedVendor(null);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Approve
        </button>

        <button
          onClick={() => {
            rejectVendor(selectedVendor._id);
            setSelectedVendor(null);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Reject
        </button>
      </div>

    </div>
  </div>
)}
{selectedDriver && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-[500px] relative">

      <button
        onClick={() => setSelectedDriver(null)}
        className="absolute top-2 right-3 text-gray-500"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold mb-4">Driver Details</h2>

      <div className="space-y-2 text-sm">

        <p><b>Name:</b> {selectedDriver.name}</p>
        <p><b>Email:</b> {selectedDriver.email}</p>
        <p><b>Phone:</b> {selectedDriver.phone}</p>

        <p><b>Vehicle Number:</b> {selectedDriver.vehicleNumber}</p>
        <p><b>License Number:</b> {selectedDriver.licenseNumber}</p>

        {selectedDriver.profileImage && (
          <div>
            <p className="font-semibold mt-2">Profile Image</p>
            <img
              src={selectedDriver.profileImage}
              alt="profile"
              className="w-20 h-20 rounded mt-1"
            />
          </div>
        )}

        {selectedDriver.idProof && (
          <div>
            <p className="font-semibold mt-2">ID Proof</p>
            <a
              href={selectedDriver.idProof}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              View ID Proof
            </a>
          </div>
        )}

      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            approveDriver(selectedDriver._id);
            setSelectedDriver(null);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Approve
        </button>

        <button
          onClick={() => {
            rejectDriver(selectedDriver._id);
            setSelectedDriver(null);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Reject
        </button>
      </div>

    </div>
  </div>
)}
          {/* ---------- NOTIFICATIONS ---------- */}
          {!loading && active === "notifications" && (
            <SectionCard title="Notifications">
              <ul className="divide-y">
                {paginate(notes).map(n => (

                  <li key={n._id} className="py-3 flex items-start justify-between">
                    <div>
                      <div className="font-medium">{n.title}</div>
                      <div className="text-sm text-slate-600">{n.message}</div>
                      <div className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded" onClick={async () => {
                          await axios.put(`${API}/api/admin/notifications/${n._id}/read`, {}, { headers: authHeader() });
                          setNotes(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
                        }}>Mark read</button>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${n.read ? 'bg-slate-200 text-slate-700':'bg-amber-100 text-amber-800'}`}>{n.read?'Read':'New'}</span>
                    </div>
                  </li>
                  
                ))}
                {notes.length===0 && <li className="py-3 text-slate-600">No notifications.</li>}
              </ul>
              <Pagination
    totalItems={notes.length}
    currentPage={currentPage}
    setCurrentPage={setCurrentPage}
  />

            </SectionCard>
            
          )}
        </main>
      </div>
    );
  };

  // ---------- COMPONENTS ----------
const SidebarItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
      text-sm font-medium transition-all duration-200 group

      ${active
        ? "bg-orange-50 text-orange-600"
        : "text-gray-600 hover:bg-gray-50 hover:text-orange-500"
      }
    `}
  >
    {/* ICON */}
    <div className={`
      transition-all
      ${active ? "text-orange-600" : "text-gray-400 group-hover:text-orange-500"}
    `}>
      {React.cloneElement(icon, { size: 18 })}
    </div>

    {/* TEXT */}
    <span>{label}</span>
  </button>
);
 const StatCard = ({ title, value, color }) => (
  <div className={`relative overflow-hidden bg-gradient-to-r ${color} text-white p-5 rounded-2xl shadow-lg hover:scale-[1.02] transition-all duration-300`}>
    
    {/* Glow effect */}
    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>

    <div className="text-sm opacity-80">{title}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </div>
);

  const SectionCard = ({ title, children }) => (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );

  const SimpleTable = ({ columns = [], rows = [] }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead className="bg-slate-100">
          <tr>{columns.map(c => <Th key={c}>{c}</Th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (<tr key={i} className="border-t">{r.map((cell, j) => <Td key={j}>{cell}</Td>)}</tr>))}
        </tbody>
      </table>
    </div>
  );


  const Th = ({ children }) => <th className="text-left text-sm font-medium text-slate-600 px-4 py-2">{children}</th>;
  const Td = ({ children }) => <td className="text-sm text-slate-800 px-4 py-2">{children}</td>;

  const Pagination = ({ totalItems, currentPage, setCurrentPage }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (totalItems <= ITEMS_PER_PAGE) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border rounded ${
              currentPage === i + 1
                ? "bg-white border-b border-gray-200"
                : "hover:bg-slate-100"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };





  // ---------- CATEGORY FORM ----------
  const AddCategoryForm = ({ onCategoryAdded }) => {
    const [name, setName] = useState("");
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!name || !image) {
  Swal.fire({
    icon: "warning",
    title: "Missing Fields",
    text: "Please enter category name and select an image",
    confirmButtonColor: "#2563eb",
  });
  return;
}

      const formData = new FormData();
      formData.append("name", name);
      formData.append("image", image);

      try {
        setLoading(true);
        await axios.post(`${API}/api/categories`, formData, {
          headers: { "Content-Type": "multipart/form-data", ...authHeader() },
        });
        setName("");
        setImage(null);
        Swal.fire({
  icon: "success",
  title: "Category Added",
  text: "New category has been added successfully",
  timer: 1800,
  showConfirmButton: false,
});

onCategoryAdded();

      } catch (err) {
        console.error(err);
        Swal.fire({
  icon: "error",
  title: "Failed",
  text: "Could not add category. Please try again.",
});

      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
        <input type="text" placeholder="Category Name" value={name} onChange={(e) => setName(e.target.value)} className="border px-3 py-2 rounded flex-1" />
        <input type="file" onChange={(e) => setImage(e.target.files[0])} className="border border-gray-200 px-3 py-2 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none" />
       <button
  type="submit"
  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl shadow transition"
>{loading ? "Adding..." : "Add"}</button>
      </form>
    );
  };

  // ---------- CATEGORY TABLE ----------
  const CategoryTable = ({ categories, onCategoryUpdated, onCategoryDeleted }) => {
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState("");
    const [newImage, setNewImage] = useState(null);

    const handleEditClick = (cat) => {
      setEditingCategory(cat);
      setNewName(cat.name);
      setNewImage(null);
    };

    const handleUpdate = async () => {
      if (!editingCategory) return;
      const formData = new FormData();
      formData.append("name", newName);
      if (newImage) formData.append("image", newImage);

      try {
        setLoading(true);
       await axios.put(
  `${API}/api/categories/${editingCategory._id}`,
  formData,
  {
    headers: {
      ...authHeader() // ✅ ONLY AUTH
    }
  }
);

        setEditingCategory(null);
        onCategoryUpdated();
      } catch (err) {
        console.error(err);
        Swal.fire({
  icon: "error",
  title: "Update Failed",
  text: "Could not update category. Please try again.",
});

      } finally {
        setLoading(false);
      }
    };

    const handleDelete = async () => {
  if (!deletingCategory) return;

  try {
    setLoading(true);
    await axios.delete(
      `${API}/api/categories/${deletingCategory._id}`,
      { headers: authHeader() }
    );

    Swal.fire({
      icon: "success",
      title: "Deleted",
      text: "Category deleted successfully",
      timer: 1500,
      showConfirmButton: false,
    });

    setDeletingCategory(null);
    onCategoryDeleted();

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Delete Failed",
      text: "Could not delete category. Please try again.",
    });
  } finally {
    setLoading(false);
  }
};

    return (
      <div>
        {editingCategory && (
          <div className="p-4 bg-yellow-50 rounded mb-4 flex flex-col gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="border border-gray-200 px-3 py-2 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none" />
            <input type="file" onChange={(e) => setNewImage(e.target.files[0])} />
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="bg-green-600 text-white px-3 py-1 rounded">{loading ? "Updating..." : "Update"}</button>
              <button onClick={() => setEditingCategory(null)} className="bg-slate-400 text-white px-3 py-1 rounded">Cancel</button>
            </div>
          </div>
        )}

        

        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-slate-100">
            <tr>
              <Th>Name</Th><Th>Image</Th><Th>Actions</Th>
            </tr>
          </thead>
        <tbody>
    {categories.map(cat => (


      <tr key={cat._id} className="border-t">
        <Td>{cat.name}</Td>
        <Td>
         <img
  src={cat.image}
  alt={cat.name}
  className="w-10 h-10 object-cover rounded"
/>

        </Td>
        <Td className="flex gap-2">
          <button
            onClick={() => handleEditClick(cat)}
            className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"
          >
            <Edit2 className="w-4 h-4" /> Edit
          </button>
         <button
  onClick={() => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete category "${cat.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `${API}/api/categories/${cat._id}`,
            { headers: authHeader() }
          );

          Swal.fire({
            icon: "success",
            title: "Deleted",
            text: "Category deleted successfully",
            timer: 1500,
            showConfirmButton: false,
          });

          onCategoryDeleted();
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: "Could not delete category.",
          });
        }
      }
    });
  }}
  className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
>
  <Trash2 className="w-4 h-4" /> Delete
</button>


        </Td>
      </tr>
    ))}
  </tbody>

        </table>
      </div>
    );
  };

  export default AdminDashboardPage;
