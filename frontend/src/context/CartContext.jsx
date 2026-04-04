import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { cartApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CartContext = createContext(undefined);

// ── Helper: map one backend cart entry → local item shape ─────────────────────
// Backend cart entry shape:
// { _id, product: { _id, name, images, basePrice, salePrice, variants[] }, variantSku, quantity }
const mapEntry = (entry) => {
  const product = entry.product || {};
  const variants = product.variants || [];

  // Match the variant by SKU to get the correct price and color
  const variant = variants.find((v) => v.sku === entry.variantSku);

  // Price: variant price → salePrice → basePrice
  const price = variant?.price ?? product.salePrice ?? product.basePrice ?? 0;

  // Image: product.images is now a color-keyed object { "White": [{url, altText}] }
  // Use the variant's color to look up the right image
  const color = variant?.color || "";
  const imageUrl =
    product.images?.[color]?.[0]?.url || // color-keyed map (new backend shape)
    product.images?.[0]?.url || // fallback: array shape
    "";

  return {
    itemId: entry._id, // backend cart entry _id — used for DELETE
    id: product._id || entry.product, // product _id
    name: product.name || "Product",
    image: imageUrl,
    price,
    color,
    size: variant?.size || "",
    variantSku: entry.variantSku,
    quantity: entry.quantity,
  };
};

export const CartProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const [items, setItems] = useState([]);

  // ── On login: load cart from user profile (user.cart populated via GET /me) ──
  useEffect(() => {
    if (isLoggedIn && user?.cart?.length) {
      setItems(user.cart.map(mapEntry));
    } else if (!isLoggedIn) {
      setItems([]); // clear on logout
    }
  }, [isLoggedIn, user]);

  // ── addItem ────────────────────────────────────────────────────────────────
  const addItem = useCallback(
    async (item) => {
      // 1. Optimistic local update
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.id === item.id && i.variantSku === item.variantSku,
        );
        if (existing) {
          return prev.map((i) =>
            i === existing ? { ...i, quantity: i.quantity + 1 } : i,
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });

      // 2. Sync to backend (so placeOrder can read customer.cart from MongoDB)
      if (isLoggedIn) {
        try {
          const data = await cartApi.add(item.id, item.variantSku, 1);
          // Store the server-assigned itemId (_id of the cart subdoc)
          // so removeItem can call DELETE /v1/me/cart/:itemId correctly
          if (data?.cart) {
            setItems((prev) =>
              prev.map((i) => {
                if (i.id !== item.id || i.variantSku !== item.variantSku)
                  return i;
                const serverEntry = data.cart.find(
                  (e) =>
                    (e.product === item.id || e.product?._id === item.id) &&
                    e.variantSku === item.variantSku,
                );
                return serverEntry ? { ...i, itemId: serverEntry._id } : i;
              }),
            );
          }
        } catch (err) {
          console.error("Cart sync error:", err.message);
        }
      }
    },
    [isLoggedIn],
  );

  // ── removeItem ─────────────────────────────────────────────────────────────
  const removeItem = useCallback(
    async (id) => {
      // id can be productId or itemId — find whichever matches
      const item = items.find((i) => i.id === id || i.itemId === id);

      // Optimistic remove
      setItems((prev) => prev.filter((i) => i.id !== id && i.itemId !== id));

      if (isLoggedIn && item?.itemId) {
        try {
          await cartApi.remove(item.itemId);
        } catch (err) {
          console.error("Cart remove error:", err.message);
        }
      }
    },
    [items, isLoggedIn],
  );

  // ── updateQuantity ─────────────────────────────────────────────────────────
  // Local only — backend uses add/remove pattern, not a quantity PATCH
  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  // ── clearCart ──────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    setItems([]);
    if (isLoggedIn) {
      try {
        await cartApi.clear();
      } catch (err) {
        console.error("Cart clear error:", err.message);
      }
    }
  }, [isLoggedIn]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
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
