import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { subscribeToCollection } from "../firebase";

const Dashboard = () => {
  const [beersCount, setBeersCount] = useState(0);
  const [stylesCount, setStylesCount] = useState(0);
  const [activeBatchesCount, setActiveBatchesCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Inscreve-se nas coleções para calcular estatísticas
    const unsubscribeBeers = subscribeToCollection("cervejas", (data) => {
      setBeersCount(data.length);
    });

    const unsubscribeStyles = subscribeToCollection("estilos", (data) => {
      setStylesCount(data.length);
    });

    const unsubscribeBatches = subscribeToCollection("lotes", (data) => {
      // Conta lotes que não estão com status "Pronto"
      const active = data.filter(batch => batch.status !== "Pronto").length;
      setActiveBatchesCount(active);
    });

    const unsubscribeOrders = subscribeToCollection("pedidos", (data) => {
      const pending = data.filter(p => p.status === "pendente").length;
      setPendingOrdersCount(pending);
    });

    return () => {
      unsubscribeBeers();
      unsubscribeStyles();
      unsubscribeBatches();
      unsubscribeOrders();
    };
  }, []);

  return (
    <div className="admin-layout">
      <div className="container">
        {/* Cabeçalho */}
        <div className="admin-header">
          <div className="admin-title-area">
            <h1>Painel do Mestre Cervejeiro</h1>
            <p>Monitore suas receitas, lotes de fermentação e análises microbiológicas.</p>
          </div>
          <div>
            <Link to="/" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
              Ir para o Site
            </Link>
          </div>
        </div>

        {/* Cartões de Métricas */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-info">
              <h3>Cervejas Cadastradas</h3>
              <div className="metric-value">{beersCount}</div>
            </div>
            <div className="metric-icon-box amber">🍺</div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <h3>Estilos Registrados</h3>
              <div className="metric-value">{stylesCount}</div>
            </div>
            <div className="metric-icon-box blue">📜</div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <h3>Lotes Ativos (Fermentando/Condicionando)</h3>
              <div className="metric-value">{activeBatchesCount}</div>
            </div>
            <div className="metric-icon-box green">🧪</div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <h3>Pedidos Pendentes</h3>
              <div className="metric-value" style={{ color: pendingOrdersCount > 0 ? "var(--color-warning)" : "inherit" }}>
                {pendingOrdersCount}
              </div>
            </div>
            <div className="metric-icon-box amber">📦</div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <h2 style={{ fontFamily: "var(--font-family-serif)", fontSize: "1.8rem", marginBottom: "24px" }}>
          Operações de Cadastro (CRUD)
        </h2>
        
        <div className="quick-actions-grid">
          <div className="action-card" onClick={() => navigate("/admin/cervejas")}>
            <div className="action-card-icon">🍺</div>
            <div className="action-card-title">Gerenciar Cervejas</div>
            <p className="action-card-desc">Crie, visualize, atualize e remova os rótulos e preços das cervejas.</p>
          </div>

          <div className="action-card" onClick={() => navigate("/admin/estilos")}>
            <div className="action-card-icon">📜</div>
            <div className="action-card-title">Gerenciar Estilos</div>
            <p className="action-card-desc">Administre os estilos de cerveja, temperatura de serviço e origens geográficas.</p>
          </div>

          <div className="action-card" onClick={() => navigate("/admin/lotes")}>
            <div className="action-card-icon">🧪</div>
            <div className="action-card-title">Lotes de Produção</div>
            <p className="action-card-desc">Monitore novos lotes de fervura, quantidade de litros produzidos e status atual.</p>
          </div>

          <div className="action-card" onClick={() => navigate("/admin/relatorio")}>
            <div className="action-card-icon">📊</div>
            <div className="action-card-title">Relatório JOIN</div>
            <p className="action-card-desc">Visualize o relatório unificado unindo Lotes, Receitas e Estilos com métricas consolidadas.</p>
          </div>

          <div className="action-card" onClick={() => navigate("/admin/pedidos")}>
            <div className="action-card-icon">📦</div>
            <div className="action-card-title">Painel de Pedidos</div>
            <p className="action-card-desc">Gerencie pedidos de clientes em tempo real, atualize status e acompanhe o faturamento.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
