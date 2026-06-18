import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { subscribeToAuth } from "../firebase";
import { useEffect } from "react";
import CheckoutModal from "./CheckoutModal";

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const [user, setUser] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuth(setUser);
    return () => unsub();
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setIsOpen(false);
  };

  return (
    <>
      {/* Overlay escuro */}
      <div
        className={`cart-overlay ${isOpen ? "open" : ""}`}
        onClick={handleOverlayClick}
      />

      {/* Drawer lateral */}
      <div className={`cart-drawer ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title">
            <span>🛒</span>
            <h3>Carrinho</h3>
            {totalItems > 0 && (
              <span className="cart-count-badge">{totalItems}</span>
            )}
          </div>
          <button className="cart-close-btn" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        {/* Conteúdo */}
        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🍺</div>
              <p>Seu carrinho está vazio.</p>
              <p className="cart-empty-sub">Adicione algumas cervejas para começar!</p>
              <button className="btn-primary" style={{ marginTop: "16px" }} onClick={() => setIsOpen(false)}>
                Ver Cervejas
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-emoji">🍺</span>
                    <div className="cart-item-details">
                      <p className="cart-item-name">{item.nome}</p>
                      <p className="cart-item-price">R$ {parseFloat(item.preco).toFixed(2)} /un</p>
                    </div>
                  </div>

                  <div className="cart-item-controls">
                    <div className="quantity-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >−</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >+</button>
                    </div>
                    <span className="cart-item-subtotal">
                      R$ {(parseFloat(item.preco) * item.quantity).toFixed(2)}
                    </span>
                    <button
                      className="cart-remove-btn"
                      onClick={() => removeFromCart(item.id)}
                      title="Remover item"
                    >🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer com total e botão de checkout */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Total do pedido</span>
              <span className="cart-total-value">R$ {totalPrice.toFixed(2)}</span>
            </div>
            <button
              className="btn-primary cart-checkout-btn"
              onClick={() => {
                if (!user) {
                  setIsOpen(false);
                  window.location.href = "/login";
                  return;
                }
                setShowCheckout(true);
              }}
            >
              {user ? "Finalizar Pedido" : "Entrar para Finalizar"}
            </button>
            {!user && (
              <p className="cart-login-hint">Você precisa estar logado para finalizar o pedido.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal de Checkout */}
      {showCheckout && (
        <CheckoutModal
          user={user}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            setIsOpen(false);
          }}
        />
      )}
    </>
  );
};

export default CartDrawer;
