import { createContext, useContext, useState } from "react";

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {

  const [items, setItems] = useState([]);

  const addItem = (item) => {

    setItems((prev) => {

      const existing = prev.find(
        (i) =>
          i.id === item.id &&
          i.color === item.color &&
          i.size === item.size
      );

      if (existing) {

        return prev.map((i) =>
          i === existing
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );

      }

      return [
        ...prev,
        {
          ...item,
          quantity: 1,
        },
      ];

    });

  };


  const removeItem = (id) => {

    setItems((prev) =>
      prev.filter((i) => i.id !== id)
    );

  };


  const updateQuantity = (id, quantity) => {

    if (quantity < 1) return;

    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, quantity }
          : i
      )
    );

  };


  const totalItems = items.reduce(
    (sum, i) => sum + i.quantity,
    0
  );


  const subtotal = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );


  return (

    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        totalItems,
        subtotal,
      }}
    >

      {children}

    </CartContext.Provider>

  );

};


export const useCart = () => {

  const context = useContext(CartContext);

  if (!context) {

    throw new Error(
      "useCart must be used within CartProvider"
    );

  }

  return context;

};
