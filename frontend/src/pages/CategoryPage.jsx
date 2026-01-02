import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Search, X } from "lucide-react";

const API = process.env.REACT_APP_API_URL;

const CategoryPage = () => {
  const { name: categorySlug } = useParams();

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchByCategory = async () => {
      try {
        const res = await axios.get(
          `${API}/api/products?category=${decodeURIComponent(categorySlug)}`
        );
        setProducts(res.data);
      } catch (err) {
        console.error("Error fetching category products:", err);
      }
    };

    fetchByCategory();
  }, [categorySlug]);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 capitalize">
          {decodeURIComponent(categorySlug)}
        </h1>

        {products.length === 0 ? (
          <p className="text-gray-500">No products found in this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="bg-white rounded-xl shadow hover:shadow-lg transition"
              >
                <div className="h-56 flex items-center justify-center border-b">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-40 object-contain"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {product.description?.slice(0, 80)}...
                  </p>
                  <p className="text-orange-600 font-bold mt-3">
                    ₹{product.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
