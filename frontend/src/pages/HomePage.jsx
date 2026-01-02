import { Link } from "react-router-dom";
import { Search, Star, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL;

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  
  const [loading, setLoading] = useState(false);
  const [homeProducts, setHomeProducts] = useState([]);
const [searchProducts, setSearchProducts] = useState([]);
const [showAll, setShowAll] = useState(false);


  const observerRef = useRef(null);
  const searchRef = useRef(null);

  const HOME_LIMIT = 9;
const [homePage, setHomePage] = useState(1);
const [hasMoreHome, setHasMoreHome] = useState(true);


  // ❌ Clear single history item
const removeHistoryItem = (item) => {
  const updated = recentSearches.filter((q) => q !== item);
  setRecentSearches(updated);
  localStorage.setItem("recentSearches", JSON.stringify(updated));
};

// 🗑️ Clear all history
const clearAllHistory = () => {
  setRecentSearches([]);
  localStorage.removeItem("recentSearches");
};


  // =============================
  // Initial load (unchanged)
  // =============================
 

// const loadMoreHomeProducts = async () => {
//   if (!hasMoreHome) return;

//   const nextPage = homePage + 1;
//   const res = await axios.get(`${API}/api/products`);

  

//   if (res.data.length === 0) {
//     setHasMoreHome(false);
//     return;
//   }

//   setHomeProducts(prev => {
//     const ids = new Set(prev.map(p => p._id));
//     const unique = res.data.filter(p => !ids.has(p._id));
//     return [...prev, ...unique];
//   });

//   setHomePage(nextPage);
// };



useEffect(() => {
  const timer = setTimeout(async () => {
    if (!searchQuery.trim()) {
  setSearchProducts([]);
  setSuggestions([]);
  
  return;
}


    try {
      setLoading(true);
      const res = await axios.get(
        `${API}/api/products/search/query?q=${searchQuery}&page=1&limit=6`
      );

      setSearchProducts(res.data);
      setSuggestions(res.data.slice(0, 5));

      const updated = [
        searchQuery,
        ...recentSearches.filter(q => q !== searchQuery)
      ].slice(0, 5);

      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, 400);

  return () => clearTimeout(timer);
}, [searchQuery]);

  // =============================
  // Debounced backend search

  // =============================
  // Infinite scroll
  // =============================
  

  // =============================
  // Close suggestions on outside click
  // =============================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

// useEffect(() => {
//   const fetchInitialData = async () => {
//     const [catRes, prodRes] = await Promise.all([
//       axios.get(`${API}/api/categories`),
//       axios.get(`${API}/api/products`)
//     ]);

//     setCategories(catRes.data);
//     setHomeProducts(prodRes.data);
//   };

//   fetchInitialData();
// }, []);

useEffect(() => {
  axios.get(`${API}/api/categories`)
    .then(res => setCategories(res.data))
    .catch(err => console.error("Categories error", err));

  axios.get(`${API}/api/products`)
    .then(res => setHomeProducts(res.data))
    .catch(err => console.error("Products error", err));
}, []);


  // =============================
  // Highlight matched text
  // =============================
  const highlightText = (text) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ================= HERO SECTION (UNCHANGED UI) ================= */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Grab local deals,<br />delivered quick
          </h1>

          <p className="text-xl md:text-2xl mb-8 text-orange-100">
            Your favorite local restaurants and stores, now at your fingertips
          </p>

          <div ref={searchRef} className="max-w-2xl mx-auto relative">
            <div className="flex items-center bg-white rounded-lg shadow-lg overflow-hidden">
              <Search className="w-6 h-6 text-gray-400 ml-4" />
              <input
                type="text"
                placeholder="Search for restaurants, food, or deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1 px-4 py-4 text-gray-900 focus:outline-none"
              />

              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="px-4 text-gray-500"
                >
                  <X />
                </button>
              )}
            </div>

            {/* Suggestions / Recent searches */}
           {showSuggestions &&
  (suggestions.length > 0 || recentSearches.length > 0) && (
    <div className="absolute w-full bg-white shadow rounded-lg mt-2 z-50 text-left">

      {/* 🗂️ Recent searches header */}
      {searchQuery === "" && recentSearches.length > 0 && (
        <div className="flex justify-between items-center px-4 py-2 border-b text-sm">
          <span className="text-gray-500">Recent searches</span>
          <button
            onClick={clearAllHistory}
            className="text-red-500 hover:underline"
          >
            🗑️ Clear all
          </button>
        </div>
      )}

      {/* 🔁 Recent search items */}
      {searchQuery === "" &&
        recentSearches.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 text-gray-700"
          >
            <span
              onClick={() => {
                setSearchQuery(item);
                setShowSuggestions(false);
              }}
              className="cursor-pointer"
            >
              🔁 {item}
            </span>

            {/* ❌ Remove single item */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeHistoryItem(item);
              }}
              className="text-gray-400 hover:text-red-500 text-sm"
            >
              ❌
            </button>
          </div>
        ))}

      {/* 🔍 Search suggestions */}
      {suggestions.map((p) => (
        <div
          key={p._id}
          onClick={() => {
            setSearchQuery(p.name);
            setShowSuggestions(false);
          }}
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
        >
          🔍 {p.name}
        </div>
      ))}
    </div>
)}

          </div>
        </div>
      </section>

      {/* ================= BROWSE BY CATEGORY ================= */}
{searchQuery === "" && (
  <section className="py-16 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-10">
        🍴 Browse by Category
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {categories.slice(0, 6).map((cat) => (
          <Link
            key={cat._id}
           to={`/category/${encodeURIComponent(cat.name)}`}



            className="bg-white shadow-md rounded-2xl p-6 text-center hover:shadow-xl transition"
          >
           <img
  src={cat.image}
  alt={cat.name}
  className="w-20 h-20 mx-auto mb-4 rounded-full object-cover"
/>
            <h3 className="font-semibold capitalize">{cat.name}</h3>
          </Link>
        ))}
      </div>

      {/* VIEW ALL CATEGORIES */}
      {categories.length > 6 && (
        <div className="flex justify-center mt-12">
          <Link
            to="/categories"
            className="px-8 py-3 rounded-full bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
          >
            View All Categories →
          </Link>
        </div>
      )}
    </div>
  </section>
)}



      {/* ================= FEATURED PRODUCTS (UNCHANGED) ================= */}
    {/* ================= FEATURED PRODUCTS ================= */}
<section className="py-16 bg-white">
  <div className="max-w-7xl mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-12">
      {searchQuery
        ? "Search Results"
        : <>Featured <span className="text-orange-600">Deals</span></>
      }
    </h2>

    {loading && (
      <p className="text-center text-gray-500 mb-6">
        Searching products...
      </p>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {(searchQuery ? searchProducts : homeProducts.slice(0, showAll ? homeProducts.length : HOME_LIMIT)).map((product) => (
        <Link
          key={product._id}
          to={`/product/${product._id}`}
          className="flex flex-col bg-white rounded-2xl border shadow-sm hover:shadow-lg transition"
        >
          <div className="h-60 flex items-center justify-center border-b">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-48 object-contain"
            />
          </div>

          <div className="p-5 flex flex-col flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {highlightText(product.name)}
            </h3>

            <span className="text-xs bg-gray-100 px-2 py-1 rounded mb-3 w-fit capitalize">
              {highlightText(product.category)}
            </span>

            <p className="text-sm text-gray-600 mb-4">
              {expandedId === product._id
                ? product.description
                : product.description.slice(0, 90)}
              {product.description.length > 90 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setExpandedId(
                      expandedId === product._id ? null : product._id
                    );
                  }}
                  className="text-orange-600 ml-1"
                >
                  {expandedId === product._id ? "Less" : "More"}
                </button>
              )}
            </p>

            <div className="flex justify-between items-center mt-auto">
              <span className="text-xl font-bold text-orange-600">
                ₹{product.price}
              </span>
            </div>

            {product.vendorId?.name && (
              <p className="text-xs text-gray-500 mt-3">
                by {product.vendorId.name}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>

    {/* VIEW ALL DEALS BUTTON (ONLY ON HOME, NOT SEARCH) */}
    {!searchQuery && hasMoreHome && (
  <div className="flex justify-center mt-12">
    <button
  onClick={() => {
    setShowAll(true);
    // loadMoreHomeProducts();
  }}

      className="px-8 py-3 rounded-full bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
    >
      View More →
    </button>
  </div>
)}

    

    {/* Infinite scroll trigger (ONLY FOR SEARCH) */}
    
  </div>
</section>

    </div>
  );
};

export default HomePage;
