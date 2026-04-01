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
import {
  LayoutDashboard,
  ShoppingCart,
  Tag,
  Bell
} from "lucide-react";
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
const [searchTerm, setSearchTerm] = useState("");
const [stockFilter, setStockFilter] = useState("all");
const [categoryFilter, setCategoryFilter] = useState("all");
const [reviews, setReviews] = useState([]);
const [loadingReviews, setLoadingReviews] = useState(false);
const [filterRating, setFilterRating] = useState("all");
const [notifications, setNotifications] = useState([]);
const INVENTORY_PER_PAGE = 5;
const [inventoryPage, setInventoryPage] = useState(1);
const [stockAlerted, setStockAlerted] = useState([]);
const [earnings, setEarnings] = useState(null);
const [loadingEarnings, setLoadingEarnings] = useState(false);
const [idProofFile, setIdProofFile] = useState(null);
const [offers, setOffers] = useState([]);
const [searchCustomer, setSearchCustomer] = useState("");
const REVIEWS_PER_PAGE = 2;
const [reviewPage, setReviewPage] = useState(1);


// ✅ FILTER REVIEWS FIRST
const filteredReviews = useMemo(() => {
  return reviews.filter(r =>
    filterRating === "all" || r.rating.toString() === filterRating
  );
}, [reviews, filterRating]);

// ✅ THEN PAGINATION ON FILTERED DATA
const totalReviewPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE);

const paginatedReviews = useMemo(() => {
  const start = (reviewPage - 1) * REVIEWS_PER_PAGE;
  return filteredReviews.slice(start, start + REVIEWS_PER_PAGE);
}, [filteredReviews, reviewPage]);

const OFFERS_PER_PAGE = 3;
const [offerPage, setOfferPage] = useState(1);
const totalOfferPages = Math.ceil(offers.length / OFFERS_PER_PAGE);

const paginatedOffers = useMemo(() => {
  const start = (offerPage - 1) * OFFERS_PER_PAGE;
  return offers.slice(start, start + OFFERS_PER_PAGE);
}, [offers, offerPage]);







const [range, setRange] = useState("Today");
const [openMenu, setOpenMenu] = useState(null);
useEffect(() => {
  const handleClickOutside = () => {
    setOpenMenu(null);
  };

  document.addEventListener("click", handleClickOutside);

  return () => {
    document.removeEventListener("click", handleClickOutside);
  };
}, []);

const [offerForm, setOfferForm] = useState({
  productId: "",
  discountType: "percent",
  discountValue: "",
  expiryDate: ""
});

const growth = (() => {
  const data = earnings?.dailyEarnings || [];

  if (data.length < 2) return 0;

  const last = data[data.length - 1].amount;
  const prev = data[data.length - 2].amount;

  if (prev === 0) return 0;

  return ((last - prev) / prev) * 100;
})();
  const [sidebarOpen, setSidebarOpen] = useState(false);



  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
const [searchOrder, setSearchOrder] = useState("");
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
  name: '',
  price: '',
  category: '',
  description: '',
  stock: '', // ✅ ADD THIS
  image: null
});
// Customers pagination
const CUSTOMERS_PER_PAGE = 4;
const [customerPage, setCustomerPage] = useState(1);

const ORDERS_PER_PAGE = 3;
const [orderPage, setOrderPage] = useState(1);

const ITEMS_PER_PAGE = 3;
const [currentPage, setCurrentPage] = useState(1);

  const [vendorRating, setVendorRating] = useState({
  avgRating: "0.0",
  totalReviews: 0
});

const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

const paginatedProducts = useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  return products.slice(start, start + ITEMS_PER_PAGE);
}, [products, currentPage]);
// Sort orders latest first
const sortedOrders = useMemo(() => {
  return [...orders]
    .filter(order => !order.isArchivedByVendor)
    .filter(order => {
      const matchStatus =
        statusFilter === "all" || order.status === statusFilter;

      const matchSearch =
        order._id.toLowerCase().includes(searchOrder.toLowerCase()) ||
        order.customerId?.name?.toLowerCase().includes(searchOrder.toLowerCase());

      return matchStatus && matchSearch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}, [orders, statusFilter, searchOrder]);

const filteredProducts = useMemo(() => {
  return products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory =
      categoryFilter === "all" || p.category === categoryFilter;

    let matchStock = true;
    if (stockFilter === "in") matchStock = p.stock > 5;
    else if (stockFilter === "low") matchStock = p.stock > 0 && p.stock <= 5;
    else if (stockFilter === "out") matchStock = p.stock === 0;

    return matchSearch && matchCategory && matchStock;
  });
}, [products, searchTerm, stockFilter, categoryFilter]);

const totalProductPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

const paginatedFilteredProducts = useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
}, [filteredProducts, currentPage]);

// Dashboard: only latest 1 order
const recentOrders = useMemo(() => {
  return sortedOrders.slice(0, 1);
}, [sortedOrders]);
const chartData = useMemo(() => {
  if (!earnings) return [];

  if (range === "Today") {
    return earnings.dailyEarnings || [];
  }

  if (range === "Week") {
    const data = earnings.dailyEarnings || [];
    return data.slice(-7); // last 7 days
  }

  if (range === "Month") {
    return earnings.monthlyEarnings || [];
  }

  return [];
}, [earnings, range]);

const totalInventoryPages = Math.ceil(products.length / INVENTORY_PER_PAGE);

const paginatedInventory = useMemo(() => {
  const start = (inventoryPage - 1) * INVENTORY_PER_PAGE;
  return products.slice(start, start + INVENTORY_PER_PAGE);
}, [products, inventoryPage]);
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


const fetchOffers = async () => {
  try {
    const res = await axios.get(`${BACKEND_BASE}/api/offers/vendor`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setOffers(res.data);
  } catch (err) {
    console.error(err);
  }
};

const handleCreateOffer = async (e) => {
  e.preventDefault();

  try {
    await axios.post(
      `${BACKEND_BASE}/api/offers`,
      offerForm,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchOffers();
    setOfferForm({
      productId: "",
      discountType: "percent",
      discountValue: "",
      expiryDate: ""
    });

  } catch (err) {
    console.error(err);
  }
};
useEffect(() => {
  if (activeTab === "reviews") {
    setReviewPage(1);
  }
}, [activeTab]);

useEffect(() => {
  if (activeTab === "offers") {
    fetchOffers();
  }
}, [activeTab]);
useEffect(() => {
  if (activeTab === "offers") {
    setOfferPage(1);
  }
}, [activeTab]);


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

const fetchEarnings = async () => {
  if (!user._id) return;

  try {
    setLoadingEarnings(true);

    const res = await axios.get(
      `${BACKEND_BASE}/api/orders/vendor/${user._id}/earnings`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setEarnings(res.data);
  } catch (err) {
    console.error("Failed to fetch earnings", err);
  } finally {
    setLoadingEarnings(false);
  }
};


useEffect(() => {
  if (activeTab === "earnings") {
    fetchEarnings();
  }
}, [activeTab]);

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
}, [activeTab, statusFilter, searchOrder]);


const handleArchive = async (orderId) => {
  try {
    await axios.put(
      `${BACKEND_BASE}/api/orders/${orderId}/archive`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success("Order archived");

    fetchOrders(); // refresh

  } catch (err) {
    toast.error("Failed to archive");
  }
};
const fetchReviews = async () => {
  if (!user._id) return;

  try {
    setLoadingReviews(true);

    const res = await axios.get(
      `${BACKEND_BASE}/api/orders/vendor/${user._id}/reviews`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setReviews(res.data || []);
  } catch (err) {
    console.error("Failed to fetch reviews", err);
  } finally {
    setLoadingReviews(false);
  }
};


useEffect(() => {
  if (activeTab === "reviews") {
    fetchReviews();
  }
}, [activeTab]);

useEffect(() => {
  if (activeTab === "notifications") {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }
}, [activeTab]);

useEffect(() => {
  if (activeTab === "customers") {
    setCustomerPage(1);
  }
}, [activeTab]);

useEffect(() => {
  fetchCategories();
}, []);

useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, stockFilter, categoryFilter]);

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
const markAsRead = (index) => {
  setNotifications(prev =>
    prev.map((n, i) =>
      i === index ? { ...n, read: true } : n
    )
  );
};

const clearAllNotifications = () => {
  setNotifications([]);
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
useEffect(() => {
  if (!products || products.length === 0) return;

  products.forEach((product) => {

    if (product.stock === 0 && !stockAlerted.includes(product._id)) {
      setStockAlerted(prev => [...prev, product._id]);

      setNotifications(prev => [
        {
          text: `❌ ${product.name} is OUT OF STOCK`,
          time: new Date(),
          read: false
        },
        ...prev
      ]);

      toast.error(`${product.name} is OUT OF STOCK!`);
    }

    else if (product.stock <= 5 && !stockAlerted.includes(product._id)) {
      setStockAlerted(prev => [...prev, product._id]);

      setNotifications(prev => [
        {
          text: `⚠ Low stock: ${product.name} (${product.stock} left)`,
          time: new Date(),
          read: false
        },
        ...prev
      ]);

      toast(`⚠ Low stock: ${product.name}`, { icon: "⚠️" });
    }

  });

}, [products]);

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
  fetchOrders();
  fetchEarnings(); 

  // 🔔 ADD NOTIFICATION
  setNotifications(prev => [
  {
    text: `New order received`,
    time: new Date(),
    read: false
  },
  ...prev.slice(0, 19)
]);

  toast.success(`New order received`);
});
   s.on('orderUpdated', (payload) => {
  fetchOrders();
  fetchEarnings(); 

  setNotifications(prev => [
  {
    text: `Order updated: ${payload.status}`,
    time: new Date(),
    read: false
  },
  ...prev.slice(0, 19)
]);

  toast.success(`Order updated`);
});

s.on("stockUpdated", () => {
  fetchProducts();
});

s.on("orderCancelled", (payload) => {
  fetchOrders();
  fetchEarnings();



  const customer = payload?.order?.customerId?.name || "Customer";
  const orderId = payload?.order?._id?.slice(-6) || "XXXX";
  const reason = payload?.reason || "No reason";

  setNotifications(prev => [
  {
    text: `❌ ${customer} cancelled Order #${orderId} (${reason})`,
    time: new Date(),
    read: false
  },
  ...prev.slice(0, 19)
]);

  toast.error(`Order cancelled by ${customer}`);
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

 const totalRevenue = orders
  .filter(order => order.status === "Delivered") // ✅ IMPORTANT
  .reduce((acc, order) => acc + Number(order.totalAmount || 0), 0);

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
  formData.append("stock", form.stock); // ✅ IMPORTANT
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
      stock: '',
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
      toast.error("Failed to update status");
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
     case 'Accepted': return 'bg-blue-100 text-blue-800';
case 'Ready for Pickup': return 'bg-purple-100 text-purple-800';
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

       <div className="relative">

  {/* 🔘 BUTTON */}
  <button
    onClick={(e) => {
  e.stopPropagation();
  setOpenMenu(openMenu === order._id ? null : order._id);
}}
    className="text-sm bg-gray-100 px-3 py-1 rounded"
  >
    More ▾
  </button>

  {/* 📦 DROPDOWN */}
  {openMenu === order._id && (
   <div
  onClick={(e) => e.stopPropagation()}
  className="absolute right-0 mt-1 w-64 bg-white border rounded shadow-md z-[999] p-3"
>

      {/* 📄 Invoice */}
      <button
        onClick={() => handleShowInvoice(order)}
        className="w-full text-left py-2 text-sm hover:bg-gray-50"
      >
        View / Print Invoice
      </button>

      <hr className="my-2" />

      {/* ⚙️ Order Actions */}
      {order.status === "Placed" && (
        <button
          onClick={() => {
  handleSetStatus(order._id, "Accepted");
  setOpenMenu(null);
}}
          className="w-full text-left px-3 py-2 text-sm rounded hover:bg-green-50 text-green-600"
        >
          ✅ Accept Order
        </button>
      )}

      {order.status === "Accepted" && (
       <button
    onClick={() => {
     handleSetStatus(order._id, "Ready for Pickup")
      setOpenMenu(null);
    }}
  >
    📦 Pack Order
  </button>
)}

      {order.status === "Packed" && (
        <button
          onClick={() => {handleSetStatus(order._id, "Ready for Pickup");setOpenMenu(null);
}}
          className="w-full text-left px-3 py-2 text-sm rounded hover:bg-purple-50 text-purple-600"
        >
          📦 Ready for Pickup
        </button>
      )}

      <hr className="my-2" />

      {/* 🧠 Tools */}
      <button
        onClick={() => {setNotesModalOrder(order);setOpenMenu(null);
}}
        className="w-full text-left py-2 text-sm hover:bg-gray-50"
      >
        Add Internal Note
      </button>

      <button
        onClick={() => {setUploadProofOrder(order);setOpenMenu(null);
}}
        className="w-full text-left py-2 text-sm hover:bg-gray-50"
      >
        Upload Pickup Proof
      </button>

      <button
        onClick={() => {
          setChangePriceOrder(order);
          setNewPrice(order.totalAmount);
        }}
        className="w-full text-left py-2 text-sm hover:bg-gray-50"
      >
        Change Price
      </button>

      <hr className="my-2" />

      {/* 📍 Utility */}
      <button
        onClick={() => {openMapsFor(addressStr);setOpenMenu(null);
}}
        className="w-full text-left py-2 text-sm hover:bg-gray-50"
      >
        Open Delivery in Maps
      </button>

      <button
        onClick={() => {setTimelineOrder(order);setOpenMenu(null);
}}
        className="w-full text-left py-2 text-sm hover:bg-gray-50"
      >
        View Timeline
      </button>

      <hr className="my-2" />

      {/* ❌ Reject */}
      {order.status === "Placed" && (
        <button
          onClick={() => {handleVendorReject(order._id);setOpenMenu(null);
}}
          className="w-full text-left py-2 text-sm text-red-600 hover:bg-red-50"
        >
          ❌ Reject Order
        </button>
      )}

    </div>
  )}
</div>
      </div>
    );
  };

  const ProfileSection = ({ orders, vendorRating }) => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [idProofFile, setIdProofFile] = useState(null);
const completedOrders = orders.filter(o => o.status === "Delivered").length;
const cancelledOrders = orders.filter(o => o.status === "Cancelled").length;
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get(`${BACKEND_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const phone = res.data.phone
          ? res.data.phone.replace("+91", "")
          : "";

        setUser(res.data);
        setFormData({ ...res.data, phone });
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, []);
const totalOrders = orders?.length || 0;

const totalRevenue = orders
  ?.filter(order => order.status === "Delivered")
  .reduce((acc, order) => acc + Number(order.totalAmount || 0), 0) || 0;

const avgRating = vendorRating?.avgRating || "0.0";
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const data = new FormData();
      data.append("userId", user._id);
      data.append("name", formData.name);
      data.append("phone", `+91${formData.phone}`);

      data.append("businessName", formData.businessName);
      data.append("businessAddress", formData.businessAddress);
      data.append("businessCategory", formData.businessCategory);

      if (profileImageFile) {
  data.append("profileImage", profileImageFile);
}

if (idProofFile) {
  data.append("idProof", idProofFile);
}



      const res = await axios.put(
        `${BACKEND_BASE}/api/users/profile`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(res.data.user);
      setEditMode(false);
      setStatusMessage("✅ Updated!");
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
  <div className="max-w-5xl mx-auto mt-8 space-y-6">
    {editMode && (
  <div className="bg-yellow-100 border border-yellow-300 p-3 rounded text-sm">
    ✏️ You are editing your profile
  </div>
)}

    {/* 🔥 PROFILE HEADER */}
<div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-6 text-white shadow-lg space-y-4 hover:shadow-2xl transition duration-300">

  {/* 🔝 TOP ROW */}
  <div className="flex items-center justify-between">

    {/* 👤 LEFT SIDE */}
    <div className="flex items-center gap-5">

      <img
        src={user.profileImage || "https://via.placeholder.com/150"}
        className="w-24 h-24 rounded-full border-4 border-white object-cover shadow"
      />

      <div>
        <h2 className="text-2xl font-bold">
          {user.businessName || user.name}
        </h2>

        <p className="text-sm opacity-90">{user.email}</p>

        <p className="text-xs opacity-80 mt-1">Vendor Account</p>

        {/* ✅ VERIFIED BADGE */}
        <span className="inline-block mt-2 bg-green-100 text-green-700 px-3 py-1 text-xs rounded-full">
          ✅ Verified Vendor
        </span>
      </div>

    </div>

    {/* ✏️ EDIT BUTTON */}
    <button
      onClick={() => setEditMode(!editMode)}
      className="bg-white text-orange-600 px-5 py-2 rounded-lg font-semibold shadow hover:scale-105 hover:bg-gray-100 transition font-semibold shadow hover:scale-105 transition"
    >
      {editMode ? "Cancel" : "Edit Profile"}
    </button>

  </div>

  {/* 📊 STATS */}<div className="flex gap-6 text-sm">

  <div className="bg-white/20 px-4 py-2 rounded-lg">
  <p className="font-bold text-lg">
    ₹{totalRevenue.toLocaleString("en-IN")}
  </p>
  <p className="opacity-80 text-xs">Revenue</p>
</div>

<div>
  <p className="font-bold text-lg">{totalOrders}</p>
  <p className="opacity-80 text-xs">Total Orders</p>
</div>

<div>
  <p className="font-bold text-lg">{completedOrders}</p>
  <p className="opacity-80 text-xs">Completed</p>
</div>

<div>
  <p className="font-bold text-lg text-red-300">{cancelledOrders}</p>
  <p className="opacity-80 text-xs">Cancelled</p>
</div>

<div className="bg-white/20 px-4 py-2 rounded-lg">
  <p className="font-bold text-lg">
    {avgRating} <span className="text-yellow-300">★</span>
  </p>
  <p className="opacity-80 text-xs">Rating</p>
</div>

</div>

  {/* 📈 PROFILE COMPLETION */}
  <div className="w-full">
    <p className="text-xs mb-1">Profile Completion</p>

    <div className="w-full bg-white/30 h-3 rounded">
      <div
        className="bg-white h-2 rounded"
        style={{ width: "100%" }}
      ></div>
    </div>
  </div>

</div>

    {/* 🔥 GRID SECTION */}
    <div className="grid md:grid-cols-2 gap-6">

      {/* 👤 PERSONAL INFO */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Personal Info
        </h3>

        <div className="space-y-4">
          <input
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            disabled={!editMode}
            placeholder="Full Name"
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
          />

          <input
            name="phone"
            value={formData.phone || ""}
            onChange={handleChange}
            disabled={!editMode}
            placeholder="Phone Number"
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
          />

          <input
            value={formData.email || ""}
            disabled
            className="w-full border p-3 rounded-lg bg-gray-100"
          />
        </div>
      </div>

      {/* 🏪 BUSINESS INFO */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Business Info
        </h3>

        <div className="space-y-4">
          <input
            name="businessName"
            value={formData.businessName || ""}
            onChange={handleChange}
            disabled={!editMode}
            placeholder="Business Name"
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
          />

          <input
            name="businessAddress"
            value={formData.businessAddress || ""}
            onChange={handleChange}
            disabled={!editMode}
            placeholder="Business Address"
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
          />

          <input
            name="businessCategory"
            value={formData.businessCategory || ""}
            onChange={handleChange}
            disabled={!editMode}
            placeholder="Category"
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
          />
        </div>
      </div>

    </div>

    {/* 🆔 ID PROOF SECTION */}
    <div className="bg-white rounded-2xl shadow p-6 text-center">

      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        ID Verification
      </h3>

      {user.idProof ? (
        <>
          <img
            src={user.idProof}
            onClick={() => setPreviewImage(user.idProof)}
            className="w-56 h-36 object-cover rounded-lg border mx-auto cursor-pointer hover:scale-105 transition"
          />

          <a
            href={user.idProof}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-blue-600 hover:underline"
          >
            ⬇ Download ID Proof
          </a>
        </>
      ) : (
        <p className="text-gray-400 text-sm">
          No ID uploaded
        </p>
      )}

      {/* Upload in edit mode */}
      {editMode && (
        <div className="mt-4 space-y-3">
          <input
  type="file"
  onChange={(e) => {
    const file = e.target.files[0];
    setProfileImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  }}
/>

          <input
            type="file"
            onChange={(e) => setIdProofFile(e.target.files[0])}
            className="w-full border p-2 rounded"
          />
        </div>
      )}
    </div>

    {/* 💾 SAVE BUTTON */}
    {editMode && (
      <button
        onClick={handleUpdate}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold shadow-lg transition"
      >
        Save Changes
      </button>
    )}

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
<div className={`fixed z-40 top-0 left-0 h-screen w-64 bg-white shadow-lg flex flex-col
  ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>

  {/* 🔶 TOP SECTION */}
  <div className="p-6 border-b">

    <div className="flex items-center gap-2 mb-6">
      <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold">
        G
      </div>
      <span className="text-lg font-bold text-gray-900">Grabbie</span>
    </div>

   <div className="flex items-center justify-between">

  {/* 👤 PROFILE */}
  <div className="flex items-center space-x-3">
    <img
      src={vendor?.profileImage || 'https://via.placeholder.com/40'}
      className="w-10 h-10 rounded-full border-2 border-orange-500"
    />
    <div>
      <p className="font-medium text-gray-900">
        {vendor?.businessName || vendor?.name || 'Vendor'}
      </p>
      <p className="text-xs text-gray-500">Vendor</p>
    </div>
  </div>

  {/* 🔔 NOTIFICATION ICON */}
<div className="relative">
  <button
    onClick={() => {
      setActiveTab("notifications");
      setSidebarOpen(false);
    }}
  >
    <Bell className="w-5 h-5 text-gray-600" />
  </button>

  {/* 🔴 BADGE */}
  {notifications.filter(n => !n.read).length > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
      {notifications.filter(n => !n.read).length}
    </span>
  )}
</div>

</div>
      
      

  </div>

  {/* 📋 MENU (SCROLLABLE ONLY THIS PART) */}
  <div className="flex-1 overflow-y-auto p-4 space-y-2">

    {[
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'orders', label: 'Orders', icon: ShoppingCart },
      { key: 'products', label: 'Products', icon: Package },
      { key: 'customers', label: 'Customers', icon: Users },
      { key: 'analytics', label: 'Analytics', icon: TrendingUp },
      { key: 'earnings', label: 'Earnings', icon: DollarSign },
      { key: 'reviews', label: 'Reviews', icon: Star },
      { key: 'offers', label: 'Offers', icon: Tag },
      { key: 'profile', label: 'Profile', icon: Users },
      { key: 'notifications', label: 'Notifications', icon: Bell },
    ].map(item => (
      <button
        key={item.key}
        onClick={() => {
          setActiveTab(item.key);
          setSidebarOpen(false);
        }}
        className={`flex w-full items-center space-x-3 px-4 py-3 rounded-lg transition
          ${
            activeTab === item.key
              ? 'bg-orange-50 text-orange-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
      >
        <item.icon className="w-5 h-5" />
        <span>{item.label}</span>
      </button>
    ))}

  </div>

  {/* 🔴 LOGOUT (FIXED BOTTOM) */}
  <div className="p-4 border-t">
    <button
      onClick={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }}
      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
    >
      Logout
    </button>
  </div>

</div>

  

        {/* Main Content */}
     <div className="flex-1 ml-0 md:ml-64 p-4 pt-16 md:pt-8 md:p-8">

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

  {/* Products + Orders */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

  {/* PRODUCTS */}
  <div className="lg:col-span-2">
    <div className="bg-white rounded-xl shadow-md min-h-[450px] flex flex-col">

      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My Products</h2>
        <button
          onClick={() => { setEditId(null); setShowModal(true); }}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          + Add Product
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto flex-1 min-h-[300px]">
        <table className="min-w-[700px] border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500">
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3 text-right">Price</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3 text-center">Stock</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedProducts.map(product => (
              <tr key={product._id} className="bg-white shadow-sm rounded-lg">
                <td className="px-6 py-4 flex items-center gap-4">
                  <img src={product.image} className="w-12 h-12 rounded border" />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      ID: {product._id.slice(-6)}
                    </p>
                  </div>
                </td>

                <td className="px-6 py-4 text-right font-semibold">
                  ₹{product.price}
                </td>

                <td className="px-6 py-4">{product.category}</td>

                <td className="px-6 py-4 text-center">{product.stock}</td>

                <td className="px-6 py-4 text-center">
                  <button className="text-blue-600 mr-2">Edit</button>
                  <button className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ FIXED PAGINATION (OUTSIDE TABLE) */}
      {totalPages > 1 && (
        <div className="mt-auto p-4 flex justify-center items-center gap-2 border-t">

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

  {/* 🔥 YOUR ORIGINAL RECENT ORDERS (UNCHANGED) */}
  <div className="lg:col-span-1 bg-white rounded-xl shadow-md">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
    </div>

    <div className="p-6 space-y-4">
      {recentOrders.map((order) => (
        <div key={order._id} className="border border-gray-200 rounded-lg p-4">

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              {order._id}
            </span>

            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-1">
            {order.customerId?.name}
          </p>

          <p className="text-sm text-gray-600 mb-2">
            {(order.products || [])
              .map((p) => `${p.quantity}x ${p.productId?.name}`)
              .join(", ")}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">
              ₹{order.totalAmount}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(order.createdAt).toLocaleTimeString()}
            </span>
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
 {activeTab === 'profile' && (
  <div>
    {/* 🔥 HEADER (like other tabs) */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
      <p className="text-gray-600 mt-1">
        Manage your personal and business information
      </p>
    </div>

    <ProfileSection 
  orders={orders} 
  vendorRating={vendorRating}
/>
  </div>
)}
         {activeTab === 'products' && (
  <div>
    <div className="mb-6">
  <h1 className="text-3xl font-bold text-gray-900">Products</h1>
  <p className="text-gray-600 mt-1">
    Manage and organize all your products
  </p>
</div>

    {/* 🔥 STATS BAR */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow text-center">
        <p className="text-gray-500 text-sm">Total</p>
        <p className="text-xl font-bold">{products.length}</p>
      </div>
      <div className="bg-green-100 p-4 rounded-xl text-center">
        <p className="text-green-700 text-sm">In Stock</p>
        <p className="text-xl font-bold">
          {products.filter(p => p.stock > 5).length}
        </p>
      </div>
      <div className="bg-yellow-100 p-4 rounded-xl text-center">
        <p className="text-yellow-700 text-sm">Low Stock</p>
        <p className="text-xl font-bold">
          {products.filter(p => p.stock > 0 && p.stock <= 5).length}
        </p>
      </div>
      <div className="bg-red-100 p-4 rounded-xl text-center">
        <p className="text-red-700 text-sm">Out</p>
        <p className="text-xl font-bold">
          {products.filter(p => p.stock === 0).length}
        </p>
      </div>
    </div>

    {/* 🔍 SEARCH + FILTER */}
    <div className="bg-white p-4 rounded-xl shadow mb-10 flex flex-col md:flex-row items-center gap-4">

  {/* 🔍 SEARCH */}
  <div className="relative w-full md:flex-1">

    <input
      type="text"
      placeholder="Search product..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full h-10 px-4 pr-10 rounded-lg border border-gray-300 focus:border-orange-500 outline-none text-sm"
    />

    {searchTerm && (
      <button
        onClick={() => setSearchTerm("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black flex items-center justify-center w-5 h-5"
      >
        <X size={14} />
      </button>
    )}

  </div>

  {/* 📂 CATEGORY */}
  <select
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
    className="h-10 px-3 rounded-lg border border-gray-300 text-sm"
  >
    <option value="all">All Categories</option>
    {categories.map(cat => (
      <option key={cat._id} value={cat.name}>
        {cat.name}
      </option>
    ))}
  </select>

  {/* 📦 STOCK */}
  <select
    value={stockFilter}
    onChange={(e) => setStockFilter(e.target.value)}
    className="h-10 px-3 rounded-lg border border-gray-300 text-sm"
  >
    <option value="all">All Stock</option>
    <option value="in">In Stock</option>
    <option value="low">Low Stock</option>
    <option value="out">Out of Stock</option>
  </select>

  {/* ➕ ADD BUTTON */}
  <button
    onClick={() => { setEditId(null); setShowModal(true); }}
    className="h-10 px-4 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition"
  >
    + Add
  </button>

</div>
    {/* 📦 TABLE */}
   <div className="bg-white rounded-xl shadow flex flex-col min-h-[400px]">
     <div className="overflow-x-auto flex-1">
  <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-left border-b">
            <th className="p-4">Product</th>
            <th>Price</th>
            <th>Category</th>
            <th>Stock</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
         {paginatedFilteredProducts.map(product => (
            <tr key={product._id} className="border-t hover:bg-gray-50">

              <td className="p-4 flex items-center gap-3">
                <img
                  src={product.image}
                  className="w-10 h-10 rounded object-cover"
                />
                <span>{product.name}</span>
              </td>

              <td>₹{product.price}</td>
              <td>{product.category}</td>

              <td>
                <div className="flex flex-col">
                  <span className="font-bold">{product.stock}</span>

                  {product.stock > 5 && (
                    <span className="text-green-600 text-xs">In Stock</span>
                  )}

                  {product.stock <= 5 && product.stock > 0 && (
                    <span className="text-yellow-600 text-xs">⚠ Low</span>
                  )}

                  {product.stock === 0 && (
                    <span className="text-red-600 text-xs">❌ Out</span>
                  )}
                </div>
              </td>

              <td className="text-center">
                <button
                  onClick={() => handleEditClick(product)}
                  className="text-blue-600 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

</div>
      {totalProductPages > 1 && (
  <div className="mt-auto p-4 flex justify-center items-center gap-2 border-t">

    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(p => p - 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Prev
    </button>

    {[...Array(totalProductPages)].map((_, i) => (
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
      disabled={currentPage === totalProductPages}
      onClick={() => setCurrentPage(p => p + 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>

  </div>
)}

      {filteredProducts.length === 0 && (
        <p className="text-center text-gray-500 p-6">
          No products found
        </p>
      )}
    </div>
  </div>
)}

{activeTab === 'offers' && (
  <div>
    {/* HEADER */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
      <p className="text-gray-600 mt-1">
        Create and manage your discounts
      </p>
    </div>

    {/* CREATE OFFER */}
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="font-semibold mb-4">Create Offer</h2>

      <form onSubmit={handleCreateOffer} className="grid md:grid-cols-4 gap-4">

        <select
          value={offerForm.productId}
          onChange={(e) =>
            setOfferForm({ ...offerForm, productId: e.target.value })
          }
          className="border p-2 rounded"
          required
        >
          <option value="">Select Product</option>
          {products.map(p => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={offerForm.discountType}
          onChange={(e) =>
            setOfferForm({ ...offerForm, discountType: e.target.value })
          }
          className="border p-2 rounded"
        >
          <option value="percent">%</option>
          <option value="flat">₹</option>
        </select>

        <input
          type="number"
          placeholder="Discount"
          value={offerForm.discountValue}
          onChange={(e) =>
            setOfferForm({ ...offerForm, discountValue: e.target.value })
          }
          className="border p-2 rounded"
          required
        />

        <input
          type="date"
          value={offerForm.expiryDate}
          onChange={(e) =>
            setOfferForm({ ...offerForm, expiryDate: e.target.value })
          }
          className="border p-2 rounded"
        />

        <button className="col-span-4 bg-orange-500 text-white py-2 rounded">
          Create Offer
        </button>
      </form>
    </div>

    {/* OFFERS LIST */}
 <div className="bg-white rounded-xl shadow flex flex-col min-h-[400px]">

  {/* 🔹 OFFERS LIST */}
  <div className="flex-1 p-6 space-y-3">

    {offers.length === 0 ? (
      <p className="text-gray-500 text-center">No offers yet</p>
    ) : (
      paginatedOffers.map((o) => (
        <div key={o._id} className="border p-3 rounded flex justify-between">

          <div>
            <p className="font-medium">{o.productId?.name}</p>
            <p className="text-sm text-gray-500">
              {o.discountType === "percent"
                ? `${o.discountValue}% OFF`
                : `₹${o.discountValue} OFF`}
            </p>
          </div>

          <p className="text-sm text-gray-400">
            Expires: {o.expiryDate?.slice(0, 10)}
          </p>

        </div>
      ))
    )}

  </div>

  {/* ✅ PAGINATION */}
  {totalOfferPages > 1 && (
    <div className="mt-auto p-4 flex justify-center items-center gap-2 border-t">

      <button
        disabled={offerPage === 1}
        onClick={() => setOfferPage(p => p - 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </button>

      {[...Array(totalOfferPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => setOfferPage(i + 1)}
          className={`px-3 py-1 rounded border ${
            offerPage === i + 1
              ? "bg-orange-500 text-white"
              : "hover:bg-gray-100"
          }`}
        >
          {i + 1}
        </button>
      ))}

      <button
        disabled={offerPage === totalOfferPages}
        onClick={() => setOfferPage(p => p + 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>

    </div>
  )}

</div>
  </div>
)}
            {/* Orders tab & analytics & customers: keep same structure; simplified here for space */}
            {activeTab === 'orders' && (
               <>
 <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

  {/* LEFT SIDE */}
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
    <p className="text-gray-700 mt-1">Manage and track all your orders</p>
  </div>

  {/* RIGHT SIDE */}
  <div className="flex gap-3 items-center">

    {/* 🔍 SEARCH */}
<div className="relative w-full md:w-80 lg:w-96">
      <input
        type="text"
        placeholder="Search order..."
        value={searchOrder}
        onChange={(e) => setSearchOrder(e.target.value)}
        className="border px-6 py-2 pr-14 rounded-lg w-full"
      />

      {/* ❌ CLEAR BUTTON */}
      {searchOrder && (
        <button
          onClick={() => setSearchOrder("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-black"
        >
          ✕
        </button>
      )}

    </div>

    {/* 📦 FILTER */}
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="border px-3 py-2 rounded-lg"
    >
      <option value="all">All Orders</option>
      <option value="Placed">Placed</option>
      <option value="Accepted">Accepted</option>
      <option value="Ready for Pickup">Ready</option>
      <option value="Delivered">Delivered</option>
      <option value="Cancelled">Cancelled</option>
    </select>

  </div>

</div>
             <div className="bg-white rounded-xl shadow-md min-h-[500px] flex flex-col p-6">
  
  {/* Orders Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
               {paginatedOrders.length === 0 ? (
  <div className="col-span-full text-center mt-10 text-gray-500">
    
    {statusFilter === "all" ? (
      <p>No orders available</p>
    ) : (
      <p>
        No orders with <span className="font-semibold">{statusFilter}</span> status
      </p>
    )}

  </div>
) : (
  paginatedOrders.map((order) => (

                    <div key={order._id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-2xl transition-shadow duration-300">
                     <div className="flex items-center justify-between mb-4">
  <span className="text-sm font-semibold text-gray-800">
    Order #{order._id}
  </span>

  <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${getStatusColor(order.status || 'preparing')}`}>
    {order.status || 'Placed'}
  </span>
</div>

{/* ✅ ADD HERE */}
{order.status === "Cancelled" && order.cancelReason && (
  <div className="mt-2 text-sm text-red-700 bg-red-100 px-3 py-2 rounded-lg border border-red-200">
    ❌ Cancelled: {order.cancelReason}
  </div>
)}

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
                        <div className="flex justify-between items-center">

  <OrderActions order={order} />

  {/* 🔥 ARCHIVE BUTTON */}
  {(order.status === "Cancelled" || order.status === "Delivered") && (
    <button
      onClick={() => handleArchive(order._id)}
      className="text-xs text-red-500 hover:underline"
    >
      Archive
    </button>
  )}

</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div> {/* grid */}
              {/* ✅ CENTERED PAGINATION */}
    {totalOrderPages > 1 && (
  <div className="mt-auto pt-6 flex justify-center">
    <div className="flex items-center gap-2 border-t pt-4 w-full justify-center">

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
    <div className="mb-6">
  <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
  <p className="text-gray-600 mt-1">
    Track performance, revenue, and customer insights
  </p>
</div>

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
  dataKey="amount"
  stroke="#f97316"
  strokeWidth={3}
  dot={{ r: 4 }}
  activeDot={{ r: 6 }}
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
{activeTab === 'earnings' && (
  <div>

    {/* HEADER */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
      <p className="text-gray-600 mt-1">
        Track your revenue performance
      </p>
    </div>

    {/* FILTER BUTTONS */}
   

    {/* SUMMARY CARDS (INCLUDING GROWTH) */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

      {/* 💰 TOTAL REVENUE */}
      <div className="bg-white p-6 rounded-xl shadow flex justify-between">
        <div>
          <p className="text-gray-500 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{Number(earnings?.totalEarnings || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-green-100 p-3 rounded-full">💰</div>
      </div>

      {/* 📦 TOTAL ORDERS */}
      <div className="bg-white p-6 rounded-xl shadow flex justify-between">
        <div>
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-2xl font-bold">
            {earnings?.totalOrders || 0}
          </p>
        </div>
        <div className="bg-blue-100 p-3 rounded-full">📦</div>
      </div>

      {/* 📊 AVG ORDER VALUE */}
      <div className="bg-white p-6 rounded-xl shadow flex justify-between">
        <div>
          <p className="text-gray-500 text-sm">Avg Order Value</p>
          <p className="text-2xl font-bold text-orange-600">
            ₹{Number(
              (earnings?.totalEarnings || 0) /
              (earnings?.totalOrders || 1)
            ).toFixed(2)}
          </p>
        </div>
        <div className="bg-orange-100 p-3 rounded-full">📊</div>
      </div>

      {/* 📈 GROWTH */}
      <div className="bg-white p-6 rounded-xl shadow flex justify-between">
        <div>
          <p className="text-gray-500 text-sm">Growth</p>
         <p
  className={`text-2xl font-bold ${
    growth >= 0 ? "text-green-600" : "text-red-600"
  }`}
>
  {growth >= 0 ? "+" : ""}
  {growth.toFixed(1)}%
</p>
        </div>
        <div className="bg-green-100 p-3 rounded-full">📈</div>
      </div>

    </div>
<div className="flex gap-2 mb-4">
  {["Today", "Week", "Month"].map((r) => (
    <button
      key={r}
      onClick={() => setRange(r)}
      className={`px-4 py-1 rounded-full text-sm font-medium transition
        ${
          range === r
            ? "bg-orange-500 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
    >
      {r}
    </button>
  ))}
</div>

    {/* CHART */}
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="font-semibold mb-4">Revenue Trend</h2>

      {chartData.length ? (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={chartData}>
      <XAxis dataKey={range === "Month" ? "month" : "date"} />
      <YAxis />
      <Line
  type="monotone"
  dataKey="amount"
  stroke="#f97316"
  strokeWidth={3}
  dot={{ r: 4 }}
  activeDot={{ r: 6 }}
  isAnimationActive={true}
  animationDuration={800}
/>
    </LineChart>
  </ResponsiveContainer>
) : (
  <p className="text-center text-gray-500 py-20">
    No revenue data available
  </p>
)}
    </div>

  </div>
)}
{activeTab === 'reviews' && (
  <div>
    <div className="mb-6">
  <h1 className="text-3xl font-bold text-gray-900">
    Customer Reviews
  </h1>
  <p className="text-gray-600 mt-1">
    View and manage feedback from your customers
  </p>
</div>

    {/* ⭐ Summary */}
    <div className="bg-white p-6 rounded-xl shadow mb-6 flex items-center justify-between">
      <div>
        <p className="text-4xl font-bold text-yellow-500">
          {vendorRating.avgRating} ⭐
        </p>
        <p className="text-gray-600">
          {vendorRating.totalReviews} reviews
        </p>
      </div>

      {/* Filter */}
      <select
        value={filterRating}
        onChange={(e) => {
          setFilterRating(e.target.value);
          setReviewPage(1); // ✅ reset page on filter
        }}
        className="border px-3 py-2 rounded-lg"
      >
        <option value="all">All Ratings</option>
        <option value="5">5 Star</option>
        <option value="4">4 Star</option>
        <option value="3">3 Star</option>
        <option value="2">2 Star</option>
        <option value="1">1 Star</option>
      </select>
    </div>

    {/* ✅ MAIN CONTAINER (IMPORTANT) */}
    <div className="bg-white rounded-xl shadow flex flex-col min-h-[400px]">

      {/* 🔹 REVIEWS LIST */}
      <div className="flex-1 p-6 space-y-4">

        {loadingReviews ? (
          <p className="text-gray-500">Loading reviews...</p>
        ) : paginatedReviews.length === 0 ? (
          <p className="text-gray-500 text-center">No reviews yet.</p>
        ) : (
          paginatedReviews.map((review) => (
            <div
              key={review._id}
              className="bg-gray-50 p-5 rounded-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">
                  {review.customer?.name || "Customer"}
                </p>

                <p className="text-yellow-500 font-medium">
                  {"⭐".repeat(review.rating)}
                </p>
              </div>

              <p className="text-gray-700 mb-2">
                {review.comment || "No comment"}
              </p>

              <p className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}

      </div>

      {/* ✅ PAGINATION (FIXED LIKE ORDERS/PRODUCTS) */}
      {totalReviewPages > 1 && (
        <div className="mt-auto p-4 flex justify-center items-center gap-2 border-t">

          <button
            disabled={reviewPage === 1}
            onClick={() => setReviewPage(p => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          {[...Array(totalReviewPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setReviewPage(i + 1)}
              className={`px-3 py-1 rounded border ${
                reviewPage === i + 1
                  ? "bg-orange-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={reviewPage === totalReviewPages}
            onClick={() => setReviewPage(p => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>

        </div>
      )}
    </div>
  </div>
)}


{activeTab === 'notifications' && (
  <div>
    <div className="mb-6">
  <h1 className="text-3xl font-bold text-gray-900">
    Notifications
  </h1>
  <p className="text-gray-600 mt-1">
    Stay updated with orders, stock alerts, and system activity
  </p>
</div>

    {notifications.length === 0 ? (
      <p>No notifications yet</p>
    ) : (
      <>
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">All Notifications</h2>
          <button
            onClick={clearAllNotifications}
            className="text-red-500 text-sm"
          >
            Clear All
          </button>
        </div>

        {notifications.map((n, i) => (
          <div
            key={i}
            onClick={() => markAsRead(i)}
            className={`p-4 mb-3 rounded shadow cursor-pointer ${
              n.read
                ? "bg-gray-100 opacity-60"
                : "bg-white border-l-4 border-orange-500"
            }`}
          >
            <p>{n.text}</p>
            <span className="text-xs text-gray-400">
              {new Date(n.time).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </>
    )}
  </div>
)}



{activeTab === 'customers' && (
  <div>
    {/* 🔥 HEADER */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
      <p className="text-gray-600 mt-1">
        Manage and view your customers
      </p>
    </div>

    {/* 🔥 STATS */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow text-center">
        <p className="text-gray-500 text-sm">Total Customers</p>
        <p className="text-xl font-bold">{customersList.length}</p>
      </div>

      <div className="bg-blue-100 p-4 rounded-xl text-center">
        <p className="text-blue-700 text-sm">Active Customers</p>
        <p className="text-xl font-bold">
          {customersList.filter(c => c.orders > 1).length}
        </p>
      </div>

      <div className="bg-orange-100 p-4 rounded-xl text-center">
        <p className="text-orange-700 text-sm">New Customers</p>
        <p className="text-xl font-bold">
          {customersList.filter(c => c.orders === 1).length}
        </p>
      </div>
    </div>

    {/* 🔥 TABLE */}
   <div className="bg-white rounded-xl shadow flex flex-col min-h-[450px]">

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left border-b">
              <th className="p-4">Customer</th>
              <th>Email</th>
              <th>Phone</th>
              <th className="text-center">Orders</th>
            </tr>
          </thead>

          <tbody>
            {paginatedCustomers.map((customer) => (
              <tr
                key={customer.id}
                className="border-t hover:bg-gray-50 transition"
              >
                {/* 👤 CUSTOMER */}
                <td className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 flex items-center justify-center rounded-full font-bold">
                    {customer.name?.charAt(0)}
                  </div>

                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-gray-500">
                      ID: {customer.id.slice(-6)}
                    </p>
                  </div>
                </td>

                {/* 📧 EMAIL */}
                <td>{customer.email || "N/A"}</td>

                {/* 📞 PHONE */}
                <td>{customer.phone || "N/A"}</td>

                {/* 📦 ORDERS */}
                <td className="text-center">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                    {customer.orders} Orders
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔥 EMPTY STATE */}
      {customersList.length === 0 && (
        <p className="text-center text-gray-500 p-6">
          No customers yet
        </p>
      )}

      {/* 🔥 PAGINATION (MATCH PRODUCTS/ORDERS STYLE) */}
      {totalCustomerPages > 1 && (
        <div className="mt-auto p-4 flex justify-center items-center gap-2 border-t">

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
    </div>
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
<input
  type="number"
  name="stock"
  placeholder="Stock Quantity"
  value={form.stock || ""}
  onChange={handleChange}
  className="w-full border px-3 py-2 rounded-lg"
/>
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
