import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API = process.env.REACT_APP_API_URL;

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios.get(`${API}/api/categories`).then((res) => {
      setCategories(res.data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-12">
          All Categories
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {categories.map((cat) => (
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
      </div>
    </div>
  );
};

export default CategoriesPage;
