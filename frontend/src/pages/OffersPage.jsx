import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const API = process.env.REACT_APP_API_URL;

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await axios.get(`${API}/api/offers`);
        setOffers(res.data);
        setFilteredOffers(res.data);

        const uniqueCategories = [
          ...new Set(
            res.data.map((o) => o.productId?.category).filter(Boolean)
          ),
        ];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  // 🎯 Discount
  const getDiscountedPrice = (product, offer) => {
    if (offer.discountType === "percent") {
      return product.price - (product.price * offer.discountValue) / 100;
    }
    return product.price - offer.discountValue;
  };

  // 🎯 FILTER
  useEffect(() => {
    let updated = [...offers];

    if (filter === "high") {
      updated.sort((a, b) => b.discountValue - a.discountValue);
    } else if (filter !== "all") {
      updated = updated.filter(
        (o) => o.productId?.category === filter
      );
    }

    setFilteredOffers(updated);
  }, [filter, offers]);

  // ⏳ TIMER
  const getTimeData = (expiryDate) => {
    if (!expiryDate) return null;

    const now = new Date();
    const end = new Date(expiryDate);
    const diff = end - now;

    if (diff <= 0) return null;

    const total = end - new Date(offers[0]?.createdAt || now);
    const progress = Math.max(0, Math.min(100, (diff / total) * 100));

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    return {
      text: `${h}h ${m}m ${s}s`,
      progress,
      isEndingSoon: diff < 1000 * 60 * 60, // <1 hour
    };
  };

  // ⏳ refresh every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  // ❌ Remove expired
  const validOffers = filteredOffers.filter((offer) => {
    if (!offer.expiryDate) return true;
    return new Date(offer.expiryDate) > new Date();
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">

        <h1 className="text-3xl font-bold text-center mb-8">
          🔥 Limited Time Deals
        </h1>

        {/* FILTER */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full ${filter==="all"?"bg-orange-500 text-white":"bg-white border"}`}>All</button>
          <button onClick={() => setFilter("high")} className={`px-4 py-2 rounded-full ${filter==="high"?"bg-orange-500 text-white":"bg-white border"}`}>Biggest Discount</button>

          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-full ${filter===cat?"bg-orange-500 text-white":"bg-white border"}`}>
              {cat}
            </button>
          ))}
        </div>

        {loading && <p className="text-center">Loading...</p>}

        {!loading && validOffers.length === 0 && (
          <p className="text-center text-gray-500">No offers found</p>
        )}

        {/* OFFERS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {validOffers.map((offer) => {
            const product = offer.productId;
            if (!product) return null;

            const discountedPrice = getDiscountedPrice(product, offer);
            const savedAmount = product.price - discountedPrice;

            const isLowStock = product.stock > 0 && product.stock <= 5;
            const isOutOfStock = product.stock === 0;

            const timeData = getTimeData(offer.expiryDate);

            return (
              <motion.div
                key={offer._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Link
                  to={isOutOfStock ? "#" : `/product/${product._id}`}
                  className={`block bg-white rounded-2xl p-5 shadow hover:shadow-xl transition relative ${
                    isOutOfStock ? "opacity-60 pointer-events-none" : ""
                  }`}
                >

                  {/* ⏳ TIMER */}
                  <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded 
                    ${timeData?.isEndingSoon ? "bg-red-500 text-white animate-pulse" : "bg-yellow-100 text-yellow-700"}`}>
                    
                    {timeData ? `⏳ ${timeData.text}` : "🔥 Ongoing"}
                  </span>

                  {/* 🔥 STOCK */}
                  {isOutOfStock && (
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded">
                      OUT OF STOCK
                    </span>
                  )}

                  {isLowStock && (
                    <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs px-2 py-1 rounded animate-pulse">
                      Only {product.stock} left
                    </span>
                  )}

                  {/* IMAGE */}
                  <img
                    src={product.image || "/placeholder.png"}
                    alt={product.name}
                    loading="lazy"
                    className="h-40 mx-auto mb-4 object-contain"
                  />

                  {/* NAME */}
                  <h3 className="font-semibold">{product.name}</h3>

                  {/* PRICE */}
                  <p className="text-sm line-through text-gray-400">
                    ₹{product.price}
                  </p>

                  <p className="text-xl text-green-600 font-bold">
                    ₹{discountedPrice.toFixed(2)}
                  </p>

                  <p className="text-xs text-gray-500">
                    Save ₹{savedAmount.toFixed(2)}
                  </p>

                  {/* 🎯 PROGRESS BAR */}
                  {timeData && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${timeData.progress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* BADGE */}
                  <span className="inline-block mt-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                    {offer.discountType === "percent"
                      ? `${offer.discountValue}% OFF`
                      : `₹${offer.discountValue} OFF`}
                  </span>

                  {/* CTA */}
                  <button className="mt-3 w-full bg-orange-500 text-white py-2 rounded-lg text-sm">
                    Grab Deal
                  </button>

                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OffersPage;