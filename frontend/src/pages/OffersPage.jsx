import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API = process.env.REACT_APP_API_URL;

const OffersPage = () => {
  const [offers, setOffers] = useState([]);

  // ✅ Fetch offers ONLY (no extra product API calls)
  useEffect(() => {
    axios
      .get(`${API}/api/offers`)
      .then((res) => setOffers(res.data))
      .catch((err) => console.error("Offers error:", err));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        🔥 Best Deals for You
      </h1>

      {/* ✅ If no offers */}
      {offers.length === 0 && (
        <p className="text-center text-gray-500">
          No offers available right now
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {offers.map((offer) => {
          const product = offer.productId;

          // ✅ Safety check
          if (!product) return null;

          // ✅ Calculate discount
          const discountedPrice =
            offer.discountType === "percent"
              ? product.price - (product.price * offer.discountValue) / 100
              : product.price - offer.discountValue;

          return (
            <Link
              key={offer._id}
              to={`/product/${product._id}`}
              className="border rounded-xl p-4 shadow hover:shadow-lg transition"
            >
              {/* ✅ IMAGE FIX */}
              <img
                src={
                  product?.image && product.image !== ""
                    ? product.image
                    : "https://via.placeholder.com/150"
                }
                alt={product?.name}
                className="h-40 mx-auto mb-4 object-contain"
              />

              {/* ✅ PRODUCT NAME */}
              <h3 className="font-semibold mb-1">{product.name}</h3>

              {/* ✅ PRICE */}
              <p className="text-sm text-gray-500 line-through">
                ₹{product.price}
              </p>

              <p className="text-xl text-green-600 font-bold">
                ₹{discountedPrice.toFixed(2)}
              </p>

              {/* ✅ OFFER BADGE */}
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                {offer.discountType === "percent"
                  ? `${offer.discountValue}% OFF`
                  : `₹${offer.discountValue} OFF`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default OffersPage;