import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { subscribeToAuth, logoutUser, subscribeToCollection, isAdminUser } from "../firebase";

const MinhaConta = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) navigate("/login");
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    // Filtra apenas os pedidos do usuário atual
    const unsub = subscribeToCollection("pedidos", (allPedidos) => {
      const meusPedidos = allPedidos.filter(p => p.clienteUid === user.uid);
      // Ordena do mais recente para o mais antigo
      meusPedidos.sort((a, b) => new Date(b.dataPedido) - new Date(a.dataPedido));
      setPedidos(meusPedidos);
    });
    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };

  const getStatusClass = (status) => {
    const map = {
      pendente: "status-pendente",
      "em preparo": "status-preparo",
      entregue: "status-entregue",
      cancelado: "status-cancelado"
    };
    return map[status] || "status-pendente";
  };

  const getStatusLabel = (status) => {
    const map = {
      pendente: "⏳ Pendente",
      "em preparo": "🔥 Em Preparo",
      entregue: "✅ Entregue",
      cancelado: "❌ Cancelado"
    };
    return map[status] || status;
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#0c0c0d", color: "#f39c12", fontSize: "1.2rem" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-title-area">
            <h1>👤 Minha Conta</h1>
            <p>Bem-vindo, <strong style={{ color: "var(--primary-color)" }}>{user?.displayName || user?.email}</strong>!</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link to="/" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
              Ver Cervejas
            </Link>
            <button onClick={handleLogout} className="btn-danger" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
              Sair
            </button>
          </div>
        </div>

        {/* Dados do usuário */}
        <div className="minha-conta-profile">
          <div className="profile-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Foto" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-initials">
                {(user?.displayName || user?.email || "?")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h3>{user?.displayName || "Usuário"}</h3>
            <p>{user?.email}</p>
            <span className="profile-role-badge">
              {isAdminUser(user) ? "👑 Administrador" : "🛒 Cliente"}
            </span>
          </div>
        </div>

        {/* Meus Pedidos */}
        <div className="minha-conta-pedidos">
          <h2 style={{ fontFamily: "var(--font-family-serif)", fontSize: "1.8rem", marginBottom: "24px" }}>
            📦 Meus Pedidos
          </h2>

          {pedidos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍺</div>
              <h3>Nenhum pedido ainda</h3>
              <p>Explore nossas cervejas e faça seu primeiro pedido!</p>
              <Link to="/" className="btn-primary" style={{ marginTop: "16px" }}>
                Ver Cervejas
              </Link>
            </div>
          ) : (
            <div className="pedidos-list">
              {pedidos.map(pedido => (
                <div key={pedido.id} className="pedido-card">
                  <div className="pedido-card-header">
                    <div className="pedido-info">
                      <span className="pedido-id">Pedido #{pedido.id?.slice(-6).toUpperCase()}</span>
                      <span className="pedido-date">{formatDate(pedido.dataPedido)}</span>
                    </div>
                    <span className={`status-badge ${getStatusClass(pedido.status)}`}>
                      {getStatusLabel(pedido.status)}
                    </span>
                  </div>

                  <div className="pedido-card-body">
                    <div className="pedido-itens">
                      {pedido.itens?.map((item, idx) => (
                        <div key={idx} className="pedido-item-row">
                          <span>🍺 {item.nome} <span className="pedido-qty">x{item.quantidade}</span></span>
                          <span>R$ {item.subtotal?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {pedido.observacao && (
                      <p className="pedido-obs"><strong>Obs:</strong> {pedido.observacao}</p>
                    )}
                  </div>

                  <div className="pedido-card-footer">
                    <span className="pedido-total-label">Total</span>
                    <span className="pedido-total-value">R$ {pedido.total?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinhaConta;
