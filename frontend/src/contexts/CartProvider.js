import { createContext, useContext, useState } from 'react';

const CartContext = createContext({ itemCount: 0, setItemCount: () => {} });

export function CartProvider({ children }) {
  const [itemCount, setItemCount] = useState(0);
  return (
    <CartContext.Provider value={{ itemCount, setItemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartCount() {
  return useContext(CartContext);
}
