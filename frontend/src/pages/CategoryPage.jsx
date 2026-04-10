import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Search, X } from "lucide-react";

const API = process.env.REACT_APP_API_URL;

const CategoryPage = () => {
  const { name: categorySlug } = useParams();

  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [ratings, setRatings] = useState({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 🔹 Fetch products
        const productRes = await axios.get(
          `${API}/api/products?category=${decodeURIComponent(categorySlug)}`
        );

        // 🔹 Fetch offers
        const offerRes = await axios.get(`${API}/api/offers`);

        setProducts(productRes.data);
        setOffers(offerRes.data);

        // 🔥 Fetch ratings for each product
        const ratingPromises = productRes.data.map((p) =>
          axios
            .get(`${API}/api/orders/product/${p._id}/ratings-summary`)
            .then((res) => ({
              productId: p._id,
              data: res.data,
            }))
            .catch(() => ({
              productId: p._id,
              data: { avgRating: 0, totalReviews: 0 },
            }))
        );

        const ratingResults = await Promise.all(ratingPromises);

        const ratingMap = {};
        ratingResults.forEach((r) => {
          ratingMap[r.productId] = r.data;
        });

        setRatings(ratingMap);
      } catch (err) {
        console.error("Error loading category page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categorySlug]);

  // 🔍 Search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  // 🔥 Get offer for product
  const getOffer = (productId) => {
    return offers.find((o) => o.productId?._id === productId);
  };

  // 💰 Calculate discounted price
  const getFinalPrice = (product) => {
    const offer = getOffer(product._id);
    if (!offer) return product.price;

    if (offer.discountType === "percent") {
      return product.price - (product.price * offer.discountValue) / 100;
    } else {
      return product.price - offer.discountValue;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <Link to="/">Home</Link> / {decodeURIComponent(categorySlug)}
        </div>

        <h1 className="text-3xl font-bold mb-6 capitalize">
          {decodeURIComponent(categorySlug)}
        </h1>

        {/* Search */}
        <div className="flex items-center gap-2 mb-8 bg-white p-3 rounded-lg shadow-sm">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={18} />
            </button>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredProducts.length === 0 ? (
          <p>No products found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const offer = getOffer(product._id);
              const rating = ratings[product._id] || {};

              return (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition relative"
                >

                  {/* 🔥 REAL DISCOUNT BADGE */}
                  {offer && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {offer.discountType === "percent"
                        ? `${offer.discountValue}% OFF`
                        : `₹${offer.discountValue} OFF`}
                    </div>
                  )}

                  {/* Image */}
                  <div className="h-48 flex items-center justify-center border-b">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-36 object-contain"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold">{product.name}</h3>

                    {/* ⭐ REAL RATING */}
                   <div className="text-yellow-500 text-sm mt-1">
  {rating.totalReviews > 0 ? (
    <>⭐ {Number(rating.avgRating).toFixed(1)}</>
  ) : (
    <span className="text-gray-400">⭐ New</span>
  )}
</div>

                    {/* 💰 PRICE */}
                    <div className="mt-2">
                      {offer ? (
                        <>
                          <span className="text-gray-400 line-through mr-2">
                            ₹{product.price}
                          </span>
                          <span className="text-orange-600 font-bold">
                            ₹{getFinalPrice(product).toFixed(0)}
                          </span>
                        </>
                      ) : (
                        <span className="text-orange-600 font-bold">
                          ₹{product.price}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;