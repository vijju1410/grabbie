import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../components/CartContext";
import toast, { Toaster } from "react-hot-toast";

const API = process.env.REACT_APP_API_URL;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { cart, fetchCart } = useCart();

  const token = localStorage.getItem("token");

  // ===============================
  // Fetch product details
  // ===============================
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API}/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);


useEffect(() => {
  if (product && cart.length > 0) {
    const existingItem = cart.find(
      (item) => item.productId?._id === product._id
    );

    if (existingItem) {
      setQuantity(existingItem.quantity); // ✅ sync quantity
    }
  }
}, [product, cart]);

  // ===============================
  // Fetch product rating (READ-ONLY)
  // ===============================
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const res = await axios.get(
          `${API}/api/products/${id}/ratings-summary`
        );
        setRating(res.data);
      } catch {
        // ignore if no ratings yet
      }
    };

    fetchRating();
  }, [id]);

  // ===============================
  // SEO Page Title
  // ===============================
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Grabbie`;
    }
  }, [product]);

  // ===============================
  // Add to cart
  // ===============================
  const addToCart = async () => {
    if (!token) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `${API}/api/cart/add`,
       { productId: product._id, quantity: Number(quantity) },

        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCart();
      toast.success("Product added to cart!");
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error("Failed to add to cart");
      }
    }
  };

  // ===============================
  // Buy now
  // ===============================
 const buyNow = () => {
  if (!token) {
    toast.error("Please login to continue");
    navigate("/login");
    return;
  }

  navigate("/checkout", {
    state: {
      buyNowItem: {
        product,
        quantity,
      },
    },
  });
};

if (loading) return <div className="p-6 text-center">Loading...</div>;
if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;
if (!product) return null;

const isInCart = cart.some(
  (item) => item.productId?._id === product?._id
);

  return (
    <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-8">
      <Toaster position="top-center" />

      {/* Product Image */}
      <div className="flex justify-center items-center">
        <img
          src={product.image}
          alt={product.name}
          className="rounded-2xl shadow-lg max-h-[400px] object-contain"
        />
      </div>

      {/* Product Info */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

        {/* ⭐ Rating */}
        {rating && rating.totalReviews > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-yellow-500 text-lg">
              ⭐ {rating.avgRating}
            </span>
            <span className="text-sm text-gray-500">
              ({rating.totalReviews} reviews)
            </span>
          </div>
        )}

        <p className="text-gray-600 mb-4">{product.description}</p>

        <p className="text-2xl font-semibold text-green-600 mb-2">
          ₹{product.price}
        </p>

        <p className="text-sm text-gray-500 mb-2">
          Category: {product.category}
        </p>

        {/* Quantity Selector */}
       <div className="flex items-center gap-3 mb-4">
  <button
    disabled={quantity <= 1}
    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
    className={`px-3 py-1 rounded ${
      quantity <= 1
        ? "bg-gray-200 cursor-not-allowed opacity-50"
        : "bg-gray-300"
    }`}
  >
    −
  </button>

  <span className="font-semibold">{quantity}</span>

  <button
    disabled={quantity >= 10}
    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
    className={`px-3 py-1 rounded ${
      quantity >= 10
        ? "bg-gray-200 cursor-not-allowed opacity-50"
        : "bg-gray-300"
    }`}
  >
    +
  </button>
</div>

        {/* Actions */}
        <div className="flex gap-4">
  {isInCart ? (
    <button
      onClick={() => navigate("/cart")}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow"
    >
      Go to Cart
    </button>
  ) : (
    <button
      onClick={addToCart}
      disabled={product.stock === 0}
      className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg shadow disabled:opacity-50"
    >
      Add to Cart
    </button>
  )}

  <button
    onClick={buyNow}
    disabled={product.stock === 0}
    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow disabled:opacity-50"
  >
    Buy Now
  </button>
</div>


        {/* Vendor */}
        {product.vendorId?.name && (
          <p className="text-xs text-gray-500 mt-4">
            Sold by {product.vendorId.name}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
