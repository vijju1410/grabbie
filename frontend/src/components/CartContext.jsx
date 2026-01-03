import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const CartContext = createContext();
const API = process.env.REACT_APP_API_URL;

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  const token = localStorage.getItem("token");

  // Fetch cart once auth is ready
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const products = res.data.products || [];
        setCart(products);
        localStorage.setItem("cart", JSON.stringify(products));
      })
      .catch(() => {});
  }, [token]);

  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem("cart");
    if (!token) return;

    await axios.post(
      `${API}/api/cart/clear`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  return (
    <CartContext.Provider value={{ cart, setCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
