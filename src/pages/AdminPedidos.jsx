import React, { useState, useEffect } from "react";
import { subscribeToCollection, updateDocument } from "../firebase";

const STATUS_OPTIONS = ["pendente", "em preparo", "entregue", "cancelado"];

const AdminPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const unsub = subscribeToCollection("pedidos", (data) => {
      // Ordena do mais recente para o mais antigo
      const sorted = [...data].sort((a, b) => new Date(b.dataPedido) - new Date(a.dataPedido));
      setPedidos(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatusChange = async (pedidoId, newStatus) => {
    setUpdatingId(pedidoId);
    try {
      await updateDocument("pedidos", pedidoId, { status: newStatus });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    } finally {
      setUpdatingId(null);
    }
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

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const filteredPedidos = filter === "todos"
    ? pedidos
    : pedidos.filter(p => p.status === filter);

  // Estatísticas
  const stats = {
    total: pedidos.length,
    pendentes: pedidos.filter(p => p.status === "pendente").length,
    emPreparo: pedidos.filter(p => p.status === "em preparo").length,
    entregues: pedidos.filter(p => p.status === "entregue").length,
    faturamento: pedidos
      .filter(p => p.status !== "cancelado")
      .reduce((sum, p) => sum + (p.total || 0), 0)
  };

  return (
    <div className="admin-layout">
      <div className="container">
        {/* Cabeçalho */}
        <div className="admin-header">
          <div className="admin-title-area">
            <h1>📦 Painel de Pedidos</h1>
            <p>Gerencie os pedidos dos clientes em tempo real.</p>
          </div>
        </div>

        {/* Métricas */}
        <div className="metrics-grid" style={{ marginBottom: "32px" }}>
          <div className="metric-card">
            <div className="metric-info">
              <h3>Total de Pedidos</h3>
              <div className="metric-value">{stats.total}</div>
            </div>
            <div className="metric-icon-box amber">📦</div>
          </div>
          <div className="metric-card">
            <div className="metric-info">
              <h3>Pendentes</h3>
              <div className="metric-value" style={{ color: "var(--color-warning)" }}>{stats.pendentes}</div>
            </div>
            <div className="metric-icon-box amber">⏳</div>
          </div>
          <div className="metric-card">
            <div className="metric-info">
              <h3>Em Preparo</h3>
              <div className="metric-value" style={{ color: "var(--color-info)" }}>{stats.emPreparo}</div>
            </div>
            <div className="metric-icon-box blue">🔥</div>
          </div>
          <div className="metric-card">
            <div className="metric-info">
              <h3>Faturamento</h3>
              <div className="metric-value" style={{ color: "var(--color-success)", fontSize: "1.6rem" }}>
                R$ {stats.faturamento.toFixed(2)}
              </div>
            </div>
            <div className="metric-icon-box green">💰</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="pedidos-filters">
          {["todos", "pendente", "em preparo", "entregue", "cancelado"].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "todos" ? "Todos" :
               f === "pendente" ? "⏳ Pendentes" :
               f === "em preparo" ? "🔥 Em Preparo" :
               f === "entregue" ? "✅ Entregues" : "❌ Cancelados"}
            </button>
          ))}
        </div>

        {/* Tabela de Pedidos */}
        <div className="crud-list-wrapper" style={{ marginTop: "24px" }}>
          <div className="crud-list-header">
            <h2 className="crud-list-title">Pedidos ({filteredPedidos.length})</h2>
          </div>

          {loading ? (
            <div className="text-center" style={{ padding: "48px", color: "var(--text-muted)" }}>
              Carregando pedidos...
            </div>
          ) : filteredPedidos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>Nenhum pedido encontrado</h3>
              <p>Ainda não há pedidos {filter !== "todos" ? `com status "${filter}"` : "registrados"}.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Itens</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPedidos.map(pedido => (
                    <tr key={pedido.id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          #{pedido.id?.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                        {formatDate(pedido.dataPedido)}
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{pedido.clienteNome}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{pedido.clienteEmail}</div>
                        </div>
                      </td>
                      <td>
                        <div className="pedido-itens-resumo">
                          {pedido.itens?.map((item, i) => (
                            <div key={i} style={{ fontSize: "0.85rem" }}>
                              {item.nome} <span style={{ color: "var(--primary-color)" }}>×{item.quantidade}</span>
                            </div>
                          ))}
                          {pedido.observacao && (
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px", fontStyle: "italic" }}>
                              Obs: {pedido.observacao}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: "800", color: "var(--secondary-color)", fontSize: "1.05rem" }}>
                          R$ {pedido.total?.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(pedido.status)}`}>
                          {pedido.status === "pendente" ? "⏳ Pendente" :
                           pedido.status === "em preparo" ? "🔥 Em Preparo" :
                           pedido.status === "entregue" ? "✅ Entregue" : "❌ Cancelado"}
                        </span>
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={pedido.status}
                          onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                          disabled={updatingId === pedido.id}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>
                              {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPedidos;
