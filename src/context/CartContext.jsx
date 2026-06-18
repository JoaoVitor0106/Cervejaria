import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const CartContext = createContext(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
};

export const CartProvider = ({ children }) => {
  // Carrega carrinho do localStorage ao inicializar
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem("brew_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  // Sincroniza com localStorage sempre que o carrinho mudar
  useEffect(() => {
    localStorage.setItem("brew_cart", JSON.stringify(items));
  }, [items]);

  // Adiciona item ao carrinho (ou incrementa quantidade) — memorizado para evitar re-renders
  const addToCart = useCallback((beer) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === beer.id);
      if (existing) {
        return prev.map(i =>
          i.id === beer.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...beer, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  // Remove item completamente do carrinho
  const removeFromCart = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // Atualiza a quantidade de um item
  const updateQuantity = useCallback((id, qty) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.id !== id));
      return;
    }
    setItems(prev =>
      prev.map(i => i.id === id ? { ...i, quantity: qty } : i)
    );
  }, []);

  // Limpa o carrinho
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Valores derivados — memorizados para evitar recálculo em cada render
  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + parseFloat(i.preco) * i.quantity, 0),
    [items]
  );

  // Valor do contexto memorizado — só muda se os dados mudarem
  const value = useMemo(() => ({
    items,
    isOpen,
    setIsOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  }), [items, isOpen, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
