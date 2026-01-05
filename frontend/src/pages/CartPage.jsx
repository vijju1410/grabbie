import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";
import toast, { Toaster } from "react-hot-toast";
const API = process.env.REACT_APP_API_URL;

const CartPage = () => {
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /* ================= UPDATE QUANTITY ================= */
  const updateQuantity = async (productId, newQty) => {
  if (newQty < 1 || newQty > 10) return;

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

  /* ================= TOTAL ================= */
const total = cart
  .reduce(
    (sum, item) =>
      sum +
      Number(item.productId?.price || 0) *
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

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="space-y-4">
        {cart.map((item) => {
          const price = item.productId.price;
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

                  <p className="text-sm text-gray-600 mt-1">
                    {item.productId.description?.slice(0, 80)}...
                  </p>

                  <p className="text-green-600 font-bold mt-2">
                    ₹{price}
                  </p>
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
              <div className="flex items-center gap-3">
               <button
  disabled={qty === 1}
  onClick={() =>
    updateQuantity(item.productId._id, qty - 1)
  }
  className={`px-3 py-1 rounded ${
    qty === 1
      ? "bg-gray-200 cursor-not-allowed opacity-50"
      : "bg-gray-300"
  }`}
>
  -
</button>

<span className="font-semibold">{qty}</span>

<button
  disabled={qty === 10}
  onClick={() =>
    updateQuantity(item.productId._id, qty + 1)
  }
  className={`px-3 py-1 rounded ${
    qty === 10
      ? "bg-gray-200 cursor-not-allowed opacity-50"
      : "bg-gray-300"
  }`}
>
  +
</button>

              </div>

              {/* REMOVE */}
              <button
                onClick={() => removeItem(item.productId._id)}
                className="text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      {/* TOTAL */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center border-t pt-4 gap-4">
        <h2 className="text-xl font-bold">Total: ₹{total}</h2>
        <button
          onClick={() => navigate("/checkout")}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow w-full sm:w-auto"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;
