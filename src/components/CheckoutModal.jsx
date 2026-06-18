import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { addDocument } from "../firebase";

const CheckoutModal = ({ user, onClose, onSuccess }) => {
  const { items, totalPrice, clearCart } = useCart();
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      const pedido = {
        clienteNome: user.displayName || user.email,
        clienteEmail: user.email,
        clienteUid: user.uid,
        itens: items.map(i => ({
          cervejaId: i.id,
          nome: i.nome,
          preco: parseFloat(i.preco),
          quantidade: i.quantity,
          subtotal: parseFloat(i.preco) * i.quantity
        })),
        total: parseFloat(totalPrice.toFixed(2)),
        observacao: observacao.trim(),
        status: "pendente",
        dataPedido: new Date().toISOString()
      };
      await addDocument("pedidos", pedido);
      clearCart();
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err) {
      console.error(err);
      setError("Erro ao registrar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div className="modal-box checkout-modal">

        {success ? (
          <div className="checkout-success">
            <div className="checkout-success-icon">🎉</div>
            <h3>Pedido Confirmado!</h3>
            <p>Seu pedido foi enviado para o Mestre Cervejeiro.</p>
            <p className="checkout-success-sub">Você pode acompanhar o status em <strong>Minha Conta</strong>.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="modal-header">
              <h3 className="modal-title">🍺 Confirmar Pedido</h3>
              <button className="modal-close-btn" onClick={onClose} disabled={loading}>✕</button>
            </div>

            {/* Resumo */}
            <div className="checkout-summary">
              <h4 className="checkout-section-title">Resumo do Pedido</h4>
              <div className="checkout-items">
                {items.map(item => (
                  <div key={item.id} className="checkout-item-row">
                    <span className="checkout-item-name">
                      {item.nome} <span className="checkout-qty">x{item.quantity}</span>
                    </span>
                    <span className="checkout-item-price">
                      R$ {(parseFloat(item.preco) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="checkout-divider" />

              <div className="checkout-total-row">
                <span>Total</span>
                <span className="checkout-total-value">R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Dados do cliente */}
            <div className="checkout-customer">
              <h4 className="checkout-section-title">Dados do Cliente</h4>
              <div className="checkout-customer-info">
                <div className="checkout-customer-row">
                  <span className="checkout-label">Nome</span>
                  <span>{user.displayName || "—"}</span>
                </div>
                <div className="checkout-customer-row">
                  <span className="checkout-label">E-mail</span>
                  <span>{user.email}</span>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "16px", marginBottom: "0" }}>
                <label className="form-label" htmlFor="obs-checkout">Observação (opcional)</label>
                <textarea
                  id="obs-checkout"
                  className="form-control"
                  rows="3"
                  style={{ resize: "none" }}
                  placeholder="Ex: Sem troco, entregar no portão, etc."
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger">⚠️ {error}</div>
            )}

            {/* Ações */}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "Enviando..." : "✅ Confirmar Pedido"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
