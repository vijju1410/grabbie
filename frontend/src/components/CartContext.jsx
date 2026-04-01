import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
const CartContext = createContext();
const API = process.env.REACT_APP_API_URL;

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const token = localStorage.getItem("token");

  // Fetch cart from backend
  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(res.data.products || []);
    } catch (err) {
      console.error("Failed to fetch cart", err);
    }
  };

  // Clear cart after order
  const clearCart = async () => {
    setCart([]); // frontend clear
    try {
      await axios.post(
        `${API}/api/cart/clear`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to clear cart on backend", err);
    }
  };

  useEffect(() => {
  fetchCart();

  const socket = io(API, {
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("stockUpdated", (data) => {
    console.log("🔥 Stock updated:", data);

    // refresh cart automatically
    fetchCart();
  });

  return () => {
    socket.disconnect();
  };
}, [token]);
  return (
    <CartContext.Provider value={{ cart, setCart, fetchCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
