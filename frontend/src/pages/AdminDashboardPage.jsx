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
    const [pendingVendors, setPendingVendors] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [notes, setNotes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [admin, setAdmin] = useState(null);
    const [pendingDrivers, setPendingDrivers] = useState([]);
    const [approvedVendors, setApprovedVendors] = useState([]);
  const [rejectedVendors, setRejectedVendors] = useState([]);
  const [approvedDrivers, setApprovedDrivers] = useState([]);
  const [rejectedDrivers, setRejectedDrivers] = useState([]);
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
        fetchNotifications()
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

    return (
      <div className="min-h-screen bg-slate-50 flex">
        {/* ---------- SIDEBAR ---------- */}
        <aside className={`bg-white shadow-md min-h-screen p-5 flex flex-col justify-between transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-16'}`}>
          <div>
            <div className="flex items-center justify-between mb-10">
              {sidebarOpen && (
                <div className="flex items-center gap-3">
                 <img
  src={
    admin?.profileImage
      ? admin.profileImage
      : "https://via.placeholder.com/150"
  }
  alt="Admin"
  className="w-10 h-10 rounded-full object-cover border-2 border-slate-300"
/>

                  <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
                </div>
              )}
              <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            <SidebarItem icon={<LayoutGrid />} label="Dashboard" active={active === "dashboard"} onClick={() => setActive("dashboard")} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
   <SidebarItem
  icon={<Users />}
  label="Customers"
  active={active === "users"}
  onClick={() => setActive("users")}
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
/>

<SidebarItem
  icon={<Building2 />}
  label="Approved Vendors"
  active={active === "approvedVendors"}
  onClick={() => setActive("approvedVendors")}
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
/>

<SidebarItem
  icon={<Building2 />}
  label="Rejected Vendors"
  active={active === "rejectedVendors"}
  onClick={() => setActive("rejectedVendors")}
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
/>

<SidebarItem
  icon={<Building2 />}
  label="Pending Vendors"
  active={active === "vendors"}
  onClick={() => setActive("vendors")}
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
/>

<SidebarItem
  icon={<Truck />}
  label="Approved Drivers"
  active={active === "approvedDrivers"}
  onClick={() => setActive("approvedDrivers")}
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
/>

<SidebarItem
  icon={<Truck />}
  label="Rejected Drivers"
  active={active === "rejectedDrivers"}
  onClick={() => setActive("rejectedDrivers")}
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
/>

<SidebarItem
  icon={<Truck />}
  label="Pending Drivers"
  active={active === "pendingDrivers"}
  onClick={() => setActive("pendingDrivers")}
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
/>

<SidebarItem
  icon={<LayoutGrid />}
  label="Categories"
  active={active === "categories"}
  onClick={() => setActive("categories")}
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
/>

<SidebarItem
  icon={<Bell />}
  label="Notifications"
  active={active === "notifications"}
  onClick={() => setActive("notifications")}
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
/>



          </div>
        </aside>

        {/* ---------- MAIN CONTENT ---------- */}
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              {active === "dashboard" ? "Dashboard"
                : active === "users" ? "Customers"
                  : active === "vendors" ? "Pending Vendors"
                    : active === "allVendors" ? "All Vendors"
                      : active === "drivers" ? "Delivery Partners"
                        : active === "categories" ? "Categories"
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

          {loading && <div className="bg-white rounded-xl shadow p-6">Loading...</div>}

          {/* ---------- DASHBOARD ---------- */}
          {!loading && active === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Customers" value={users.length} color="from-blue-500 to-blue-400" />
                <StatCard title="Total Vendors" value={vendors.length} color="from-purple-500 to-purple-400" />
                <StatCard title="Delivery Partners" value={drivers.length} color="from-green-500 to-green-400" />
              </div><br></br>
              <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto h-96 flex items-center justify-center">
    <Doughnut 
      data={chartData} 
      options={{ 
        responsive: true, 
        maintainAspectRatio: false, 
        cutout: '70%' 
      }} 
    />
  </div>

            </div>
          )}

          {/* ---------- CUSTOMERS ---------- */}
          {!loading && active === "users" && (
            <SectionCard title="Customers">
  <SimpleTable
    columns={["Name", "Email", "Phone"]}
    rows={paginate(users).map(u => [u.name, u.email, u.phone || "-"])}
  />

  <Pagination
    totalItems={users.length}
    currentPage={currentPage}
    setCurrentPage={setCurrentPage}
  />
  
            </SectionCard>
          )}
          {!loading && active === "pendingDrivers" && (
    <SectionCard title="Pending Driver Approvals">
      {pendingDrivers.length === 0 ? (
    <div className="text-slate-600">No pending drivers.</div>
  ) : (
    <>
      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead className="bg-slate-100">
          <tr>
            <Th>Name</Th><Th>Email</Th><Th>Vehicle</Th><Th>Status</Th><Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {paginate(pendingDrivers).map(d => (
            <tr key={d._id} className="border-t">
              <Td>{d.name}</Td>
              <Td>{d.email}</Td>
              <Td>{d.vehicleNumber || "-"}</Td>
              <Td>
                <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">
                  {d.driverStatus}
                </span>
              </Td>
              <Td className="flex gap-2">
                <button onClick={() => approveDriver(d._id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded">Approve</button>
                <button onClick={() => rejectDriver(d._id)} className="bg-red-600 text-white px-3 py-1.5 rounded">Reject</button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>

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
      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead className="bg-slate-100">
          <tr>
            <Th>Name</Th><Th>Email</Th><Th>Business</Th><Th>Status</Th><Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {paginate(pendingVendors).map(v => (
            <tr key={v._id} className="border-t">
              <Td>{v.name}</Td>
              <Td>{v.email}</Td>
              <Td>{v.businessName || "-"}</Td>
              <Td>
                <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">
                  {v.vendorStatus}
                </span>
              </Td>
              <Td className="flex gap-2">
                <button onClick={() => approveVendor(v._id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded">
                  Approve
                </button>
                <button onClick={() => rejectVendor(v._id)} className="bg-red-600 text-white px-3 py-1.5 rounded">
                  Reject
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>

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
        <SimpleTable columns={["Name", "Email", "Business"]} rows={approvedVendors.map(v => [v.name, v.email, v.businessName || "-"])} />}
    </SectionCard>
  )}

  {/* ---------- REJECTED VENDORS ---------- */}
  {!loading && active === "rejectedVendors" && (
    <SectionCard title="Rejected Vendors">
      {rejectedVendors.length === 0 ? <div>No rejected vendors.</div> :
        <SimpleTable columns={["Name", "Email", "Business"]} rows={rejectedVendors.map(v => [v.name, v.email, v.businessName || "-"])} />}
    </SectionCard>
  )}

  {/* ---------- APPROVED DRIVERS ---------- */}
  {!loading && active === "approvedDrivers" && (
    <SectionCard title="Approved Drivers">
      {approvedDrivers.length === 0 ? <div>No approved drivers.</div> :
        <SimpleTable columns={["Name", "Email", "Vehicle"]} rows={approvedDrivers.map(d => [d.name, d.email, d.vehicleNumber || "-"])} />}
    </SectionCard>
  )}

  {/* ---------- REJECTED DRIVERS ---------- */}
  {!loading && active === "rejectedDrivers" && (
    <SectionCard title="Rejected Drivers">
      {rejectedDrivers.length === 0 ? <div>No rejected drivers.</div> :
        <SimpleTable columns={["Name", "Email", "Vehicle"]} rows={rejectedDrivers.map(d => [d.name, d.email, d.vehicleNumber || "-"])} />}
    </SectionCard>
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
  const SidebarItem = ({ icon, label, active, onClick, sidebarOpen, setSidebarOpen }) => (
  <button
    onClick={() => {
      onClick();
      if (window.innerWidth < 768) {
        setSidebarOpen(false); // ✅ CLOSE SIDEBAR ON MOBILE
      }
    }}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
      active ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
    }`}
  >
    <span className="w-5 h-5">{icon}</span>
    {sidebarOpen && <span className="font-medium">{label}</span>}
  </button>
);


  const StatCard = ({ title, value, color }) => (
    <div className={`bg-gradient-to-r ${color} text-white p-5 rounded-xl shadow flex flex-col`}>
      <div className="text-sm">{title}</div>
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
                ? "bg-slate-900 text-white"
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
        <input type="file" onChange={(e) => setImage(e.target.files[0])} className="border px-3 py-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{loading ? "Adding..." : "Add"}</button>
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
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="border px-3 py-2 rounded" />
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
