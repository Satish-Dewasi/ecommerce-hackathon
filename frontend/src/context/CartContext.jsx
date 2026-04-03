import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cartApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const [items, setItems] = useState([]);

  // ── On login, load cart from user profile (populated via GET /me) ─────────
  useEffect(() => {
    if (isLoggedIn && user?.cart) {
      // Map backend cart shape → local shape
      const mapped = user.cart.map((entry) => ({
        // Use cart entry _id as the itemId for DELETE calls
        itemId:     entry._id,
        id:         entry.product?._id || entry.product,
        name:       entry.product?.name  || "Product",
        image:      entry.product?.thumbnail || "",
        price:      entry.product?.basePrice || 0,
        variantSku: entry.variantSku,
        quantity:   entry.quantity,
      }));
      setItems(mapped);
    } else if (!isLoggedIn) {
      // Clear cart on logout
      setItems([]);
    }
  }, [isLoggedIn, user]);

  // ── addItem ───────────────────────────────────────────────────────────────
  const addItem = useCallback(async (item) => {
    // Optimistic local update first
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id && i.variantSku === item.variantSku
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    // Sync with backend if logged in
    if (isLoggedIn) {
      try {
        const data = await cartApi.add(item.id, item.variantSku, 1);
        // Update itemId from server response so we can delete correctly later
        if (data?.cart) {
          setItems((prev) =>
            prev.map((i) => {
              if (i.id !== item.id || i.variantSku !== item.variantSku) return i;
              const serverEntry = data.cart.find(
                (e) => e.product === item.id && e.variantSku === item.variantSku
              );
              return serverEntry ? { ...i, itemId: serverEntry._id } : i;
            })
          );
        }
      } catch (err) {
        console.error("Cart sync error:", err.message);
      }
    }
  }, [isLoggedIn]);

  // ── removeItem (by local id or itemId) ────────────────────────────────────
  const removeItem = useCallback(async (id) => {
    const item = items.find((i) => i.id === id || i.itemId === id);
    setItems((prev) => prev.filter((i) => i.id !== id && i.itemId !== id));

    if (isLoggedIn && item?.itemId) {
      try { await cartApi.remove(item.itemId); }
      catch (err) { console.error("Cart remove error:", err.message); }
    }
  }, [items, isLoggedIn]);

  // ── updateQuantity (local only — API uses add/remove) ────────────────────
  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }, []);

  // ── clearCart ─────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    setItems([]);
    if (isLoggedIn) {
      try { await cartApi.clear(); }
      catch (err) { console.error("Cart clear error:", err.message); }
    }
  }, [isLoggedIn]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal   = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};