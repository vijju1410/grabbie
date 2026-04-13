import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";
import toast, { Toaster } from "react-hot-toast";
import { useState } from "react";

import { useEffect } from "react";
const API = process.env.REACT_APP_API_URL;

const CartPage = () => {
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
const [offers, setOffers] = useState([]);

  /* ================= UPDATE QUANTITY ================= */
  const updateQuantity = async (productId, newQty, stock) => {
  if (newQty < 1 || newQty > stock) {
    toast.error(`Only ${stock} available`);
    return;
  }

  try {
    await fetch(`${API}/api/cart/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, quantity: newQty }),
    });

    fetchCart();
  } catch (err) {
    toast.error("Failed to update quantity");
  }
};


  /* ================= REMOVE ITEM ================= */
  const removeItem = async (productId) => {
    try {
      await fetch(`${API}/api/cart/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      fetchCart();
      toast.success("Item removed from cart");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    }
  };

useEffect(() => {
  cart.forEach((item) => {
    if (item.productId.stock === 0) {
      removeItem(item.productId._id);
      toast.error(`${item.productId.name} removed (out of stock)`);
    }
  });
}, [cart]);


useEffect(() => {
  const fetchOffers = async () => {
    try {
      const res = await fetch(`${API}/api/offers`);
      const data = await res.json();
      setOffers(data);
    } catch (err) {
      console.error("Offer fetch error", err);
    }
  };

  fetchOffers();
}, []);


const getFinalPrice = (product) => {
  const offer = offers.find(
    (o) => o.productId?._id === product._id
  );

  if (!offer) return product.price;

  return offer.discountType === "percent"
    ? product.price - (product.price * offer.discountValue) / 100
    : product.price - offer.discountValue;
};

  /* ================= TOTAL ================= */
const total = cart
  .reduce(
    (sum, item) =>
      sum +
      getFinalPrice(item.productId) *
      Number(item.quantity || 1),
    0
  )
  .toFixed(2);


  /* ================= EMPTY CART ================= */
  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <p className="text-2xl mb-2">🛒 Your cart is empty</p>
        <button
          onClick={() => navigate("/")}
          className="text-orange-500 font-semibold hover:underline"
        >
          Start shopping →
        </button>
      </div>
    );
  }
const totalSavings = cart.reduce((sum, item) => {
  const original = item.productId.price;
  const discounted = getFinalPrice(item.productId);
  const qty = item.quantity;

  return sum + (original - discounted) * qty;
}, 0).toFixed(2);
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="space-y-4">
        {cart.map((item) => {
          const price = getFinalPrice(item.productId);
const originalPrice = item.productId.price;
const hasDiscount = price < originalPrice;
          const qty = item.quantity;
          const subtotal = (price * qty).toFixed(2);

          return (
            <div
              key={item.productId._id}
              className="flex flex-col md:flex-row md:items-center justify-between border rounded-lg p-4 shadow gap-4"
            >
              {/* PRODUCT INFO */}
              <div className="flex items-start gap-4 flex-1">
                <img
                  src={item.productId.image}
                  alt={item.productId.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg border"
                />

                <div>
                  <h2 className="font-semibold text-gray-900">
                    {item.productId.name}
                  </h2>

                  {item.productId.category && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full capitalize">
                      {item.productId.category}
                    </span>
                  )}

                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
  {item.productId.description}
</p>

             <div className="mt-2 flex items-center gap-3 flex-wrap">
  <div>
    {hasDiscount && (
      <p className="text-sm text-gray-400 line-through">
        ₹{originalPrice}
      </p>
    )}

    <p className="text-green-600 font-bold text-lg">
      ₹{price}
    </p>
  </div>

 {hasDiscount && (
  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded whitespace-nowrap">
    {offers.find(o => o.productId?._id === item.productId._id)?.discountType === "percent"
      ? `${offers.find(o => o.productId?._id === item.productId._id)?.discountValue}% OFF`
      : `₹${offers.find(o => o.productId?._id === item.productId._id)?.discountValue} OFF`}
  </span>
)}
</div>

                  {item.productId.stock <= 5 && item.productId.stock > 0 && (
  <p className="text-red-500 text-xs">
    🔥 Only {item.productId.stock} left
  </p>
)}

{item.productId.stock === 0 && (
  <p className="text-red-600 text-xs font-semibold">
    ❌ Out of Stock
  </p>
)}

                  <p className="text-sm text-gray-500">
                    Subtotal: ₹{subtotal}
                  </p>

                  {item.productId.vendorId?.name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Sold by{" "}
                      <span className="font-medium">
                        {item.productId.vendorId.name}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* QUANTITY CONTROLS */}
        {/* ACTIONS (Quantity + Remove) */}
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

  {/* Quantity */}
  <div className="flex items-center gap-3">
    <button
      disabled={qty === 1}
      onClick={() =>
        updateQuantity(item.productId._id, qty - 1, item.productId.stock)
      }
      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded ${
        qty === 1
          ? "bg-gray-200 cursor-not-allowed opacity-50"
          : "bg-gray-300"
      }`}
    >
      -
    </button>

    <span className="font-semibold">{qty}</span>

    <button
      disabled={qty >= item.productId.stock}
      onClick={() =>
        updateQuantity(item.productId._id, qty + 1, item.productId.stock)
      }
      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded ${
        qty >= item.productId.stock
          ? "bg-gray-200 cursor-not-allowed opacity-50"
          : "bg-gray-300"
      }`}
    >
      +
    </button>
  </div>

  {/* Remove */}
  <button
    onClick={() => removeItem(item.productId._id)}
    className="text-red-500 px-2 py-1 rounded hover:bg-red-50"
  >
    Remove
  </button>

</div>

</div>
          );
        })}
      </div>

      {/* TOTAL */}
    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center border-t pt-4 gap-4 sticky bottom-0 bg-white">

  <div className="flex flex-col">
    <h2 className="text-xl font-bold">Total: ₹{total}</h2>

    {Number(totalSavings) > 0 && (
      <p className="text-green-600 text-sm">
        🎉 You saved ₹{totalSavings}
      </p>
    )}
  </div>
        <button
  onClick={() => navigate("/checkout")}
  disabled={cart.some(item => item.productId.stock === 0)}
  className={`px-6 py-2 rounded-lg shadow w-full sm:w-auto ${
    cart.some(item => item.productId.stock === 0)
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700 text-white"
  }`}
>
  Proceed to Checkout
</button>
      </div>
    </div>
  );
};

export default CartPage;
