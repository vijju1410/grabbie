// src/pages/VendorDashboardPage.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import Swal from "sweetalert2";

import { 
  Plus, 
  Eye, 
  DollarSign, 
  Package, 
  Users, 
  Trash2,
  TrendingUp,
  Star,
  Clock,
  X,
  Menu
} from 'lucide-react';

import axios from 'axios';
import toast from "react-hot-toast";

import { io as ioClient } from "socket.io-client";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend as PieLegend, 
  BarChart, Bar, Tooltip
} from 'recharts';

const BACKEND_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const VendorDashboardPage = () => {
  const [products, setProducts] = useState([]);
  const [vendor, setVendor] = useState(null);

  // Order action UI states
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [notesModalOrder, setNotesModalOrder] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [changePriceOrder, setChangePriceOrder] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [uploadProofOrder, setUploadProofOrder] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [timelineOrder, setTimelineOrder] = useState(null);



  const [sidebarOpen, setSidebarOpen] = useState(false);



  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
  name: '', price: '', category: '', image: null, description: ''
});
// Customers pagination
const CUSTOMERS_PER_PAGE = 5;
const [customerPage, setCustomerPage] = useState(1);

const ORDERS_PER_PAGE = 3;
const [orderPage, setOrderPage] = useState(1);

const ITEMS_PER_PAGE = 3;
const [currentPage, setCurrentPage] = useState(1);

  const [vendorRating, setVendorRating] = useState({
  avgRating: "0.0",
  totalReviews: 0
});
const fetchVendorRating = async () => {
  if (!user._id) return;
  try {
    const res = await axios.get(
      `${BACKEND_BASE}/api/orders/vendor/${user._id}/ratings`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setVendorRating(res.data);
  } catch (err) {
    console.error("Failed to fetch vendor rating", err);
  }
};
const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

const paginatedProducts = useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  return products.slice(start, start + ITEMS_PER_PAGE);
}, [products, currentPage]);
// Sort orders latest first
const sortedOrders = useMemo(() => {
  return [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}, [orders]);

// Dashboard: only latest 1 order
const recentOrders = useMemo(() => {
  return sortedOrders.slice(0, 1);
}, [sortedOrders]);

// Orders tab pagination
const totalOrderPages = Math.ceil(sortedOrders.length / ORDERS_PER_PAGE);

const paginatedOrders = useMemo(() => {
  const start = (orderPage - 1) * ORDERS_PER_PAGE;
  return sortedOrders.slice(start, start + ORDERS_PER_PAGE);
}, [sortedOrders, orderPage]);

// 🔹 Build unique customers list from orders
const customersList = useMemo(() => {
  const map = {};

  orders.forEach(order => {
    const c = order.customerId;
    if (!c) return;

    if (!map[c._id]) {
      map[c._id] = {
        id: c._id,
        name: c.name,
        email: c.email,
        phone: order.deliveryDetails?.phone,
        orders: 0,
      };
    }
    map[c._id].orders += 1;
  });

  return Object.values(map);
}, [orders]);
const totalCustomerPages = Math.ceil(
  customersList.length / CUSTOMERS_PER_PAGE
);

const paginatedCustomers = useMemo(() => {
  const start = (customerPage - 1) * CUSTOMERS_PER_PAGE;
  return customersList.slice(start, start + CUSTOMERS_PER_PAGE);
}, [customersList, customerPage]);

const analyticsData = useMemo(() => {
  const daily = {};
  const productSales = {};
  const statusCount = {};

  orders.forEach(order => {
    const date = new Date(order.createdAt).toLocaleDateString();

    // Revenue & orders per day
    if (!daily[date]) daily[date] = { date, revenue: 0, orders: 0 };
daily[date].revenue = Number(
  (daily[date].revenue + (order.totalAmount || 0)).toFixed(2)
);
    daily[date].orders += 1;

    // Status count
    statusCount[order.status] = (statusCount[order.status] || 0) + 1;

    // Product sales
    (order.products || []).forEach(p => {
      const name = p.productId?.name || "Unknown";
      productSales[name] = (productSales[name] || 0) + (p.quantity || 1);
    });
  });

  return {
    revenueTrend: Object.values(daily),
    statusPie: Object.entries(statusCount).map(([name, value]) => ({ name, value })),
    topProducts: Object.entries(productSales).map(([name, qty]) => ({ name, qty }))
  };
}, [orders]);


  const socketRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // --- Fetch vendor profile ---
  useEffect(() => {
    const fetchVendor = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${BACKEND_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVendor(res.data);
      } catch (err) {
        console.error('Failed to fetch vendor profile', err);
      }
    };
    fetchVendor();
  }, [token]);
  useEffect(() => {
  setOrderPage(1);
}, [activeTab]);

useEffect(() => {
  if (activeTab === "customers") {
    setCustomerPage(1);
  }
}, [activeTab]);

useEffect(() => {
  fetchCategories();
}, []);


  // --- Fetch functions ---
  const fetchProducts = async () => {
  if (!vendor?._id) return;

  try {
    const res = await axios.get(
      `${BACKEND_BASE}/api/products/vendor/${vendor._id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    setProducts(res.data);
  } catch (error) {
    console.error('Failed to fetch vendor products', error);
  }
};


  const fetchOrders = async () => {
    if (!user._id) return;
    try {
      const res = await axios.get(`${BACKEND_BASE}/api/orders/vendor/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data || []);
    } catch (error) {
      console.error('Failed to fetch vendor orders', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${BACKEND_BASE}/api/categories`);
      setCategories(res.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };
useEffect(() => {
  setCurrentPage(1);
}, [activeTab]);

  useEffect(() => {
  if (vendor?._id) {
    fetchProducts();
    fetchOrders();
    fetchVendorRating();
  }
}, [vendor]);


  // --- Socket.IO connect & handlers ---
  useEffect(() => {
    if (!vendor || !vendor._id) return;

    // already connected?
    if (socketRef.current) {
      // join the new vendor room if vendor changed
      try { socketRef.current.emit('joinVendor', vendor._id); } catch (e) { /* ignore */ }
      return;
    }
    

    // Connect socket
    const url = process.env.REACT_APP_SOCKET_URL || BACKEND_BASE;
    const s = ioClient(url, { transports: ['websocket'] });
    socketRef.current = s;

    s.on('connect', () => {
      console.log('socket connected (frontend):', s.id);
      // join vendor-specific room
      s.emit('joinVendor', vendor._id);
    });

    // Events: when an order relevant to this vendor is created/updated, server emits targeted events
    s.on('orderCreated', (payload) => {
      console.log('orderCreated payload', payload);
      // simple approach: refetch vendor orders to keep UI consistent with server
      fetchOrders();
      // optional small notification
      if (payload && payload.order) {
        toast.success(`New order received: ${payload.order._id}`);
      }
    });

    s.on('orderUpdated', (payload) => {
      console.log('orderUpdated', payload);
      // keep UI up-to-date by re-fetching (safe)
      fetchOrders();
      if (payload && payload.status) {
        toast.success(`Order ${payload.order?._id || ''} status: ${payload.status}`);
      }
    });

    s.on('orderNoteAdded', (payload) => {
      console.log('orderNoteAdded', payload);
      fetchOrders();
      toast.success('Note added to an order');
    });

    s.on('orderProofUploaded', (payload) => {
      console.log('orderProofUploaded', payload);
      fetchOrders();
      toast.success('Proof uploaded to an order');
    });

    // Cleanup on unmount
    return () => {
      try {
        s.disconnect();
      } catch (e) {}
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor && vendor._id]);

  /// --- Stats ---
const stats = useMemo(() => {
  const customerRating = `${vendorRating.avgRating} ⭐ (${vendorRating.totalReviews})`;

  const totalRevenue = orders.reduce(
    (acc, order) => acc + Number(order.totalAmount || 0),
    0
  );

  const formattedRevenue = totalRevenue.toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});


  const totalOrders = orders.length;
const activeProducts = products.length;

 

  return [
    {
      title: "Total Revenue",
      value: `₹${formattedRevenue}`, // ✅ FIX HERE
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Products",
      value: activeProducts,
      icon: Eye,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
  title: "Customer Rating",
  value: customerRating,
  icon: Star,
  color: "text-yellow-600",
  bg: "bg-yellow-100",
}

  ];
}, [orders, products]);

  // --- Modal Handlers & form ---
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

 const handleAddProduct = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", form.name);
  formData.append("price", form.price);
  formData.append("category", form.category);
  formData.append("description", form.description);

  // ✅ append image ONLY if new file selected
  if (form.image instanceof File) {
    formData.append("image", form.image);
  }

  try {
    if (editId) {
      await axios.put(
        `${BACKEND_BASE}/api/products/${editId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Product Updated",
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      await axios.post(
        `${BACKEND_BASE}/api/products/add`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Product Added",
        timer: 1500,
        showConfirmButton: false,
      });
    }

    setShowModal(false);
    setEditId(null);
    setForm({
      name: '',
      price: '',
      category: '',
      description: '',
      image: null, // ✅ correct
    });
    fetchProducts();
  } catch (error) {
    console.error("Failed to save product", error);
    Swal.fire({
      icon: "error",
      title: "Failed",
      text: "Could not save product. Please try again.",
    });
  }
};


  // --- Helpers: maps, clipboard, export ---
  const openMapsFor = (address, lat, lng) => {
    const q = lat && lng ? `${lat},${lng}` : encodeURIComponent(address || "");
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    window.open(url, "_blank");
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Copy failed", err);
      toast.success("Failed to copy");
    }
  };

  const downloadOrder = (order, as = "json") => {
    if (!order) return;
    if (as === "json") {
      const blob = new Blob([JSON.stringify(order, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-${order._id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const rows = [["Product","Quantity","Price"]];
      (order.products || []).forEach(p => {
        rows.push([p.productId?.name || "Unknown", p.quantity || 1, p.productId?.price || ""]);
      });
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-${order._id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // --- Order action handlers ---
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      const res = await axios.put(`${BACKEND_BASE}/api/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || "Order cancelled");
      fetchOrders();
    } catch (err) {
      console.error("Cancel failed", err);
      toast.success(err.response?.data?.message || "Cancel failed");
    }
  };

  const handleSetStatus = async (orderId, status) => {
    try {
      // optimistic update
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      // send to server to persist and emit to others
      await axios.put(`${BACKEND_BASE}/api/orders/${orderId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // ensure final sync
      fetchOrders();
      toast.success(`Marked ${status}`);
    } catch (err) {
      console.error("Set status failed", err);
      toast.success("Failed to update status");
      fetchOrders();
    }
  };
  const handleVendorReject = async (orderId) => {
  if (!window.confirm("Reject this order?")) return;

  try {
    await axios.put(
      `${BACKEND_BASE}/api/orders/${orderId}/vendor-reject`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success("Order rejected");
    fetchOrders();
  } catch (err) {
    toast.success(err.response?.data?.message || "Reject failed");
  }
};


  const handleAddNote = async (orderId) => {
    if (!noteText.trim()) { alert("Enter a note"); return; }
    try {
      await axios.post(`${BACKEND_BASE}/api/orders/${orderId}/notes`, { text: noteText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNoteText("");
      setNotesModalOrder(null);
      fetchOrders();
    } catch (err) {
      console.error("Add note failed", err);
      toast.success("Failed to save note");
    }
  };

  const handleUploadProof = async (orderId) => {
    if (!uploadFile) return alert("Choose a file first");
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("type", "pickupProof");
      await axios.post(`${BACKEND_BASE}/api/orders/${orderId}/proof`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setUploadProofOrder(null);
      setUploadFile(null);
      fetchOrders();
    } catch (err) {
      console.error("Upload proof failed", err);
      toast.success("Failed to upload proof");
    }
  };

  const handleChangePriceSave = async (orderId) => {
    const price = parseFloat(newPrice);
    if (isNaN(price)) return alert("Enter valid price");
    try {
      await axios.put(`${BACKEND_BASE}/api/orders/${orderId}/price`, { totalAmount: price }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChangePriceOrder(null);
      setNewPrice("");
      fetchOrders();
    } catch (err) {
      console.error("Change price failed", err);
      toast.success("Failed to change price");
    }
  };

  const handleShowInvoice = (order) => {
    setInvoiceOrder(order);
  };

  const handleRequestDriver = async (orderId) => {
    toast.success("Requesting driver (placeholder). Implement server endpoint to auto-assign or notify drivers if needed.");
  };

  const handleReorder = (order) => {
    const items = (order.products || []).map(p => ({ productId: p.productId?._id || p.productId, qty: p.quantity || 1 }));
    localStorage.setItem("cart_prefill", JSON.stringify(items));
    toast.success("Saved order items to cart_prefill.");
  };

  const handleExportOrder = (order, as) => downloadOrder(order, as);

  // --- Product edit/delete ---
  const handleEditClick = (product) => {
    setEditId(product._id);
    setForm({
  name: product.name,
  price: product.price,
  category: product.category,
  description: product.description,
 image: null,
});
    setShowModal(true);
  };

  const handleDelete = async (product) => {
  Swal.fire({
    title: "Are you sure?",
    text: `Delete product "${product.name}"?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${BACKEND_BASE}/api/products/${product._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Swal.fire({
          icon: "success",
          title: "Deleted",
          text: "Product deleted successfully",
          timer: 1500,
          showConfirmButton: false,
        });

        fetchProducts();
      } catch (error) {
        console.error("Failed to delete product", error);
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: "Could not delete product. Please try again.",
        });
      }
    }
  });
};


  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  // --- OrderActions component ---
  const OrderActions = ({ order }) => {
    // If order is delivered or cancelled → read-only
if (order.status === "Delivered" || order.status === "Cancelled") {
  return (
    <div className="flex items-center space-x-2">
      <span className="px-3 py-1 text-sm rounded bg-green-100 text-green-700">
        {order.status}
      </span>

      <button
        onClick={() => handleShowInvoice(order)}
        className="text-sm bg-blue-500 text-white px-3 py-1 rounded"
      >
        View Invoice
      </button>

      <button
        onClick={() => setTimelineOrder(order)}
        className="text-sm bg-gray-100 px-3 py-1 rounded"
      >
        View Timeline
      </button>
    </div>
  );
}
    const addressStr = `${order.deliveryDetails?.addressLine1 || ""}${order.deliveryDetails?.addressLine2 ? ", " + order.deliveryDetails.addressLine2 : ""}, ${order.deliveryDetails?.city || ""}, ${order.deliveryDetails?.state || ""} ${order.deliveryDetails?.postalCode || ""}`;

    return (
      <div className="flex items-center space-x-2">
        <button onClick={() => copyText(addressStr)} className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">Copy Address</button>
        <a className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded" href={`tel:${order.deliveryDetails?.phone}`}>Call</a>

        <details className="relative">
          <summary className="cursor-pointer text-sm bg-gray-100 px-3 py-1 rounded">More ▾</summary>
          <div className="absolute right-0 mt-1 w-64 bg-white border rounded shadow-md z-50 p-3">
            <button onClick={() => handleShowInvoice(order)} className="w-full text-left py-2 text-sm hover:bg-gray-50">View / Print Invoice</button>
            <button onClick={() => handleExportOrder(order, "json")} className="w-full text-left py-2 text-sm hover:bg-gray-50">Download JSON</button>
            <button onClick={() => handleExportOrder(order, "csv")} className="w-full text-left py-2 text-sm hover:bg-gray-50">Download CSV</button>

            <hr className="my-2" />

            {order.status === "Placed" && (
  <button onClick={() => handleSetStatus(order._id, "Accepted")}>
    Mark Accepted
  </button>
)}

{order.status === "Accepted" && (
  <button onClick={() => handleSetStatus(order._id, "Preparing")}>
    Mark Preparing
  </button>
)}

{order.status === "Preparing" && (
  <button onClick={() => handleSetStatus(order._id, "Ready for Pickup")}>
    Mark Ready for Pickup
  </button>
)}

            <hr className="my-2" />

            <button onClick={() => { setNotesModalOrder(order); }} className="w-full text-left py-2 text-sm hover:bg-gray-50">Add Internal Note</button>
            <button onClick={() => { setUploadProofOrder(order); }} className="w-full text-left py-2 text-sm hover:bg-gray-50">Upload Pickup Proof</button>
            <button onClick={() => { setChangePriceOrder(order); setNewPrice(order.totalAmount); }} className="w-full text-left py-2 text-sm hover:bg-gray-50">Change Price</button>

            <hr className="my-2" />

            <button onClick={() => openMapsFor(addressStr)} className="w-full text-left py-2 text-sm hover:bg-gray-50">Open Delivery in Maps</button>
            <button onClick={() => handleReorder(order)} className="w-full text-left py-2 text-sm hover:bg-gray-50">Reorder (prefill cart)</button>

            <hr className="my-2" />

{order.status === "Ready for Pickup" && (
  <button
    onClick={() => handleRequestDriver(order._id)}
    className="w-full text-left py-2 text-sm hover:bg-gray-50"
  >
    Request Driver
  </button>
)}
{order.status === "Placed" && (
  <button
    onClick={() => handleVendorReject(order._id)}
    className="w-full text-left py-2 text-sm text-red-600 hover:bg-red-50"
  >
    Reject Order
  </button>
)}

            <hr className="my-2" />

            <button onClick={() => { setTimelineOrder(order); }} className="w-full text-left py-2 text-sm hover:bg-gray-50">View Timeline</button>
          </div>
        </details>
      </div>
    );
  };

  // --- Analytics charts omitted for brevity (reuse your existing AnalyticsTab) ---
  // (You can keep the AnalyticsTab from your previous code unchanged)
  // For brevity below, I'm rendering the main UI - reuse your AnalyticsTab component as before.

  // --- Main render (keeps the rest of your UI) ---
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Mobile backdrop overlay */}
{sidebarOpen && (
  <div
    className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
    onClick={() => setSidebarOpen(false)}
  />
)}

        {/* Sidebar */}
       {/* Sidebar */}
<div
  className={`fixed md:static z-40 top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300
  ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
>
  {/* Close button (mobile only) */}
  <button
    onClick={() => setSidebarOpen(false)}
    className="md:hidden absolute top-4 right-4 text-gray-600"
  >
    <X />
  </button>



          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <img
                src={
  vendor?.profileImage
    ? vendor.profileImage
    : 'https://via.placeholder.com/40'
}

                alt="Vendor"
                className="w-10 h-10 rounded-full object-cover border-2 border-orange-500"
              />
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{vendor?.businessName || vendor?.name || 'Vendor'}</span>
                <span className="text-sm text-gray-500">Vendor Portal</span>
              </div>
            </div>

       <nav className="space-y-2">
  <button
    onClick={() => {
      setActiveTab('dashboard');
      setSidebarOpen(false);
    }}
    className={`flex w-full items-center space-x-3 px-4 py-3 rounded-lg ${
      activeTab === 'dashboard'
        ? 'bg-orange-50 text-orange-700'
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <Package className="w-5 h-5" />
    <span>Dashboard</span>
  </button>

  <button
    onClick={() => {
      setActiveTab('products');
      setSidebarOpen(false);
    }}
    className={`flex w-full items-center space-x-3 px-4 py-3 rounded-lg ${
      activeTab === 'products'
        ? 'bg-orange-50 text-orange-700'
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <Package className="w-5 h-5" />
    <span>Products</span>
  </button>

  <button
    onClick={() => {
      setActiveTab('orders');
      setSidebarOpen(false);
    }}
    className={`flex w-full items-center space-x-3 px-4 py-3 rounded-lg ${
      activeTab === 'orders'
        ? 'bg-orange-50 text-orange-700'
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <Clock className="w-5 h-5" />
    <span>Orders</span>
  </button>

  <button
    onClick={() => {
      setActiveTab('analytics');
      setSidebarOpen(false);
    }}
    className={`flex w-full items-center space-x-3 px-4 py-3 rounded-lg ${
      activeTab === 'analytics'
        ? 'bg-orange-50 text-orange-700'
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <TrendingUp className="w-5 h-5" />
    <span>Analytics</span>
  </button>

  <button
    onClick={() => {
      setActiveTab('customers');
      setSidebarOpen(false);
    }}
    className={`flex w-full items-center space-x-3 px-4 py-3 rounded-lg ${
      activeTab === 'customers'
        ? 'bg-orange-50 text-orange-700'
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <Users className="w-5 h-5" />
    <span>Customers</span>
  </button>
</nav>

          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8">
          {/* Mobile Sidebar Toggle Button */}
<button
  onClick={() => setSidebarOpen(true)}
  className="md:hidden mb-4 bg-white p-2 rounded shadow"
>
  <Menu className="w-6 h-6" />
</button>


          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-2">Welcome back to your vendor dashboard</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Products & Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Products Table */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-md">
                      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">My Products</h2>
                        <button onClick={() => { setEditId(null); setShowModal(true); }} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2">
                          <Plus className="w-4 h-4" /><span>Add Product</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-2">
  <thead>
    <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
      <th className="px-6 py-3">Product</th>
      <th className="px-6 py-3 text-right">Price</th>
      <th className="px-6 py-3">Category</th>
      <th className="px-6 py-3 text-center">Actions</th>
    </tr>
  </thead>

  <tbody>
    {paginatedProducts.map(product => (
      <tr
        key={product._id}
        className="bg-white shadow-sm hover:shadow-md transition rounded-lg"
      >
        <td className="px-6 py-4 flex items-center gap-4 rounded-l-lg">
          <img
            src={product.image}
            alt={product.name}
            className="w-12 h-12 rounded-md object-cover border"
          />
          <div>
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-xs text-gray-500">ID: {product._id.slice(-6)}</p>
          </div>
        </td>

        <td className="px-6 py-4 text-right font-semibold text-gray-800">
          ₹{product.price}
        </td>

        <td className="px-6 py-4 capitalize text-gray-700">
          {product.category}
        </td>

        <td className="px-6 py-4 text-center rounded-r-lg">
          <div className="flex justify-center gap-3">
            <button
              onClick={() => handleEditClick(product)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
            <button
  onClick={() => handleDelete(product)}
  className="text-red-600 hover:text-red-800 text-sm font-medium"
>
  Delete
</button>

          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
{totalPages > 1 && (
 <div className="flex justify-center items-center gap-2 mt-6 w-full">

    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(p => p - 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Prev
    </button>

    {[...Array(totalPages)].map((_, i) => (
      <button
        key={i}
        onClick={() => setCurrentPage(i + 1)}
        className={`px-3 py-1 rounded border ${
          currentPage === i + 1
            ? "bg-orange-500 text-white"
            : "hover:bg-gray-100"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(p => p + 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}


                      </div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="lg:col-span-1 bg-white rounded-xl shadow-md">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
                    </div>
                    <div className="p-6 space-y-4">
{recentOrders.map((order) => (
                        <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{order._id}</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status || 'preparing')}`}>
                              {order.status || 'preparing'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{order.customerId?.name}</p>
                          <p className="text-sm text-gray-600 mb-2">
                            {(order.products || []).map((p) => `${p.quantity || 1}x ${p.productId?.name}`).join(', ')}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">₹{order.totalAmount}</span>
                            <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</span>
                          </div>

                          <div className="mt-3">
                            <OrderActions order={order} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
            

            {activeTab === 'products' && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
                {/* Reuse same table as dashboard */}
                <div className="bg-white rounded-xl shadow-md">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">My Products</h2>
                    <button onClick={() => { setEditId(null); setShowModal(true); }} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2">
                      <Plus className="w-4 h-4" /><span>Add Product</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2">
  <thead>
    <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
      <th className="px-6 py-3">Product</th>
      <th className="px-6 py-3 text-right">Price</th>
      <th className="px-6 py-3">Category</th>
      <th className="px-6 py-3 text-center">Actions</th>
    </tr>
  </thead>

<tbody>
  {paginatedProducts.map(product => (
    <tr
      key={product._id}
      className="bg-white shadow-sm hover:shadow-md transition rounded-lg"
    >
      <td className="px-6 py-4 flex items-center gap-4 rounded-l-lg">
        <img
          src={product.image}
          alt={product.name}
          className="w-12 h-12 rounded-md object-cover border"
        />
        <span className="font-medium text-gray-900">{product.name}</span>
      </td>

      <td className="px-6 py-4 text-right font-semibold">
        ₹{product.price}
      </td>

      <td className="px-6 py-4 capitalize">
        {product.category}
      </td>

      <td className="px-6 py-4 text-center rounded-r-lg">
        <button onClick={() => handleEditClick(product)} className="text-blue-600 mr-3">
          Edit
        </button>
      <button onClick={() => handleDelete(product)} className="text-red-600">


          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>

                    </table>
                   {totalPages > 1 && (
 <div className="w-full flex justify-center items-center gap-2 mt-10 pt-4">

    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(p => p - 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Prev
    </button>

    {[...Array(totalPages)].map((_, i) => (
      <button
        key={i}
        onClick={() => setCurrentPage(i + 1)}
        className={`px-3 py-1 rounded border ${
          currentPage === i + 1
            ? "bg-orange-500 text-white"
            : "hover:bg-gray-100"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(p => p + 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}


                  </div>
                </div>
              </div>
            )}

            {/* Orders tab & analytics & customers: keep same structure; simplified here for space */}
            {activeTab === 'orders' && (
               <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.length === 0 ? (
                  <p className="text-gray-500 col-span-full text-center mt-10">No orders have been placed yet.</p>
                ) : (
                  paginatedOrders.map((order) => (

                    <div key={order._id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-2xl transition-shadow duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-gray-800">Order #{order._id}</span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${getStatusColor(order.status || 'preparing')}`}>
                          {order.status || 'Preparing'}
                        </span>
                      </div>

                      <div className="mb-4 border-b border-gray-200 pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Customer</p>
                            <p className="text-sm text-gray-600">{order.customerId?.name}</p>
                            <p className="text-sm text-gray-600">{order.customerId?.email || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">Phone</p>
                            <p className="text-sm text-gray-600">{order.deliveryDetails?.phone}</p>
                          </div>
                        </div>

                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Delivery Address</p>
                          <p className="text-sm text-gray-600">
                            {order.deliveryDetails?.addressLine1}, {order.deliveryDetails?.addressLine2 ? order.deliveryDetails.addressLine2 + ', ' : ''}
                            {order.deliveryDetails?.city}, {order.deliveryDetails?.state} - {order.deliveryDetails?.postalCode}, {order.deliveryDetails?.country}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Products</p>
                        <ul className="divide-y divide-gray-100 max-h-32 overflow-y-auto">
                          {(order.products || []).map((p) => (
                            <li key={p.productId?._id || Math.random()} className="flex justify-between py-1">
                              <span className="text-sm text-gray-600">{p.productId?.name}</span>
                              <span className="text-sm font-medium text-gray-800">{p.quantity || 1}x</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <span className="text-lg font-bold text-gray-900">₹{order.totalAmount}</span>
                        <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="mt-4 flex justify-end space-x-2">
                        <OrderActions order={order} />
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* ✅ CENTERED PAGINATION */}
    {totalOrderPages > 1 && (
      <div className="w-full flex justify-center mt-10">
        <div className="flex items-center gap-2">
          <button
            disabled={orderPage === 1}
            onClick={() => setOrderPage(p => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          {[...Array(totalOrderPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setOrderPage(i + 1)}
              className={`px-3 py-1 rounded border ${
                orderPage === i + 1
                  ? "bg-orange-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={orderPage === totalOrderPages}
            onClick={() => setOrderPage(p => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    )}
  </>
)}


              
            
            {activeTab === 'analytics' && (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>

    {/* Revenue Trend */}
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4">Revenue Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={analyticsData.revenueTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <LineTooltip />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#f97316"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Order Status */}
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4">Order Status Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={analyticsData.statusPie}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {analyticsData.statusPie.map((_, index) => (
              <Cell
                key={index}
                fill={["#22c55e", "#3b82f6", "#f97316", "#ef4444", "#a855f7"][index % 5]}
              />
            ))}
          </Pie>
          <PieLegend />
        </PieChart>
      </ResponsiveContainer>
    </div>

    {/* Top Products */}
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={analyticsData.topProducts}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="qty" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}



     {activeTab === 'customers' && (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">My Customers</h1>

    {orders.length === 0 ? (
      <p className="text-gray-600">No customers have placed orders yet.</p>
    ) : (
      <>
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3">Customer Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3 text-right">Total Orders</th>
            </tr>
          </thead>

          <tbody>
            {paginatedCustomers.map((customer) => (
              <tr key={customer.id} className="bg-white shadow-sm rounded-lg">
                <td className="px-6 py-4 font-medium">{customer.name}</td>
                <td className="px-6 py-4">{customer.email}</td>
                <td className="px-6 py-4">{customer.phone || "N/A"}</td>
                <td className="px-6 py-4 text-right font-semibold">
                  {customer.orders}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalCustomerPages > 1 && (
  <div className="w-full flex justify-center items-center gap-2 mt-10 pt-4">
    <button
      disabled={customerPage === 1}
      onClick={() => setCustomerPage(p => p - 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Prev
    </button>

    {[...Array(totalCustomerPages)].map((_, i) => (
      <button
        key={i}
        onClick={() => setCustomerPage(i + 1)}
        className={`px-3 py-1 rounded border ${
          customerPage === i + 1
            ? "bg-orange-500 text-white"
            : "hover:bg-gray-100"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      disabled={customerPage === totalCustomerPages}
      onClick={() => setCustomerPage(p => p + 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}

      </>
    )}
  </div>
)}


          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"><X /></button>
            <h2 className="text-xl font-semibold mb-4">{editId ? 'Edit Product' : 'Add Product'}</h2>
            <form className="space-y-4" onSubmit={handleAddProduct}>
              <input type="text" name="name" placeholder="Product Name" value={form.name} onChange={handleChange} className="w-full border px-3 py-2 rounded-lg"/>
              <input type="number" name="price" placeholder="Price" value={form.price} onChange={handleChange} className="w-full border px-3 py-2 rounded-lg"/>

              <select name="category" value={form.category} onChange={handleChange} className="w-full border px-3 py-2 rounded-lg">
                <option value="">Select Category</option>
                {categories.map(cat => (<option key={cat._id} value={cat.name}>{cat.name}</option>))}
              </select>
              <input type="text" name="description" placeholder="Description" value={form.description} onChange={handleChange} className="w-full border px-3 py-2 rounded-lg"/>
              <input type="file" name="image" onChange={e => setForm({...form, image: e.target.files[0]})} className="w-full"/>
              <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors duration-200 w-full">{editId ? 'Update' : 'Add'}</button>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Order Modals & Utilities ---------- */}
      {/* Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center p-6">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 overflow-auto">
            <button onClick={() => setInvoiceOrder(null)} className="float-right">Close</button>
            <h2 className="text-lg font-semibold mb-4">Invoice — Order #{invoiceOrder._id}</h2>

            <div id="invoice-content" className="text-sm">
              <div className="mb-4">
                <strong>Vendor:</strong> {vendor?.businessName || vendor?.name}<br/>
                <strong>Customer:</strong> {invoiceOrder.customerId?.name} — {invoiceOrder.deliveryDetails?.phone}
              </div>

              <table className="w-full mb-4 text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoiceOrder.products||[]).map((p, idx) => (
                    <tr key={idx}>
                      <td>{p.productId?.name}</td>
                      <td className="text-right">{p.quantity || 1}</td>
                      <td className="text-right">₹{p.productId?.price || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-right font-bold text-lg">Total: ₹{invoiceOrder.totalAmount}</div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => {
                const printContent = document.getElementById("invoice-content").innerHTML;
                const newWin = window.open('', '', 'width=800,height=600');
                newWin.document.write('<html><head><title>Invoice</title></head><body>' + printContent + '</body></html>');
                newWin.document.close();
                newWin.focus();
                newWin.print();
                newWin.close();
              }} className="bg-blue-600 text-white px-4 py-2 rounded">Print</button>

              <button onClick={() => downloadOrder(invoiceOrder, "json")} className="bg-gray-200 px-4 py-2 rounded">Download (JSON/CSV available)</button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {notesModalOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-3">Add Note — Order {notesModalOrder._id}</h3>
            <textarea rows="4" value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full border p-2 rounded" />
            <div className="mt-3 flex justify-end space-x-2">
              <button onClick={() => setNotesModalOrder(null)} className="px-3 py-1">Cancel</button>
              <button onClick={() => handleAddNote(notesModalOrder._id)} className="bg-orange-500 text-white px-3 py-1 rounded">Save Note</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Price Modal */}
      {changePriceOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-3">Change Price — Order {changePriceOrder._id}</h3>
            <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full border p-2 rounded" />
            <div className="mt-3 flex justify-end space-x-2">
              <button onClick={() => setChangePriceOrder(null)} className="px-3 py-1">Cancel</button>
              <button onClick={() => handleChangePriceSave(changePriceOrder._id)} className="bg-orange-500 text-white px-3 py-1 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload proof Modal */}
      {uploadProofOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-3">Upload Proof — Order {uploadProofOrder._id}</h3>
            <input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files[0])} />
            <div className="mt-3 flex justify-end space-x-2">
              <button onClick={() => setUploadProofOrder(null)} className="px-3 py-1">Cancel</button>
              <button onClick={() => handleUploadProof(uploadProofOrder._id)} className="bg-orange-500 text-white px-3 py-1 rounded">Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {timelineOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Order Timeline — {timelineOrder._id}</h3>
            <div className="space-y-2">
              { (timelineOrder.statusHistory && timelineOrder.statusHistory.length > 0) ? (
                timelineOrder.statusHistory.map((s, i) => (
                  <div key={i} className="p-2 border rounded">
                    <div className="text-sm font-semibold">{s.status}</div>
                    <div className="text-xs text-gray-500">{new Date(s.at).toLocaleString()} — by {s.by || 'system'}</div>
                    {s.note && <div className="text-sm mt-1">{s.note}</div>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No timeline/meta available.</p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setTimelineOrder(null)} className="px-3 py-1">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorDashboardPage;
