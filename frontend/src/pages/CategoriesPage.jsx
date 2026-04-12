import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const API = process.env.REACT_APP_API_URL;

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "All Categories | Grabbie";

    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API}/api/categories`);
        setCategories(res.data);
      } catch (err) {
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 🎯 Skeleton Loader
  const SkeletonCard = () => (
    <div className="animate-pulse bg-white rounded-2xl p-5 shadow-sm">
      <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-4">

        {/* 🔥 Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-center mb-12"
        >
          Explore Categories
        </motion.h1>

        {/* ❌ Error */}
        {error && (
          <div className="text-center text-red-500 py-10">{error}</div>
        )}

        {/* ⏳ Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {[...Array(12)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* 😶 Empty */}
        {!loading && categories.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            No categories found
          </div>
        )}

        {/* ✅ Categories */}
        {!loading && categories.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08,
                },
              },
            }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8"
          >
            {categories.map((cat) => (
              <motion.div
                key={cat._id}
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { opacity: 1, scale: 1 },
                }}
              >
                <Link
                  to={`/category/${encodeURIComponent(cat.name)}`}
                  className="group block"
                >
                  <div className="bg-gradient-to-br from-white to-gray-50 border rounded-2xl p-5 text-center shadow-sm hover:shadow-xl transition duration-300 transform hover:-translate-y-1">

                    {/* 🖼️ Image */}
                    <img
                      src={cat.image || "/placeholder.png"}
                      alt={cat.name}
                      loading="lazy"
                      onError={(e) =>
                        (e.target.src = "/placeholder.png")
                      }
                      className="w-20 h-20 mx-auto mb-4 rounded-full object-cover border group-hover:scale-110 transition"
                    />

                    {/* 📦 Name */}
                    <h3 className="font-semibold capitalize group-hover:text-green-600 transition">
                      {cat.name}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;