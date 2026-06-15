import React, { useState, useEffect } from "react";
import { subscribeToCollection } from "../firebase";

const Relatorio = () => {
  const [batches, setBatches] = useState([]);
  const [beers, setBeers] = useState([]);
  const [styles, setStyles] = useState([]);

  useEffect(() => {
    // Escuta em tempo real os três bancos
    const unsubscribeBatches = subscribeToCollection("lotes", (data) => setBatches(data));
    const unsubscribeBeers = subscribeToCollection("cervejas", (data) => setBeers(data));
    const unsubscribeStyles = subscribeToCollection("estilos", (data) => setStyles(data));

    return () => {
      unsubscribeBatches();
      unsubscribeBeers();
      unsubscribeStyles();
    };
  }, []);

  const joinedData = batches.map(batch => {
    const beer = beers.find(b => b.id === batch.cervejaId) || null;
    const style = beer ? styles.find(s => s.id === beer.estiloId) : null;

    return {
      id: batch.id,
      codigoLote: batch.codigoLote,
      dataInicio: batch.dataInicio,
      quantidade: parseFloat(batch.quantidade || 0),
      status: batch.status,
      // Dados da Cerveja
      cervejaNome: beer ? beer.nome : "Rótulo Desconhecido",
      cervejaAbv: beer ? beer.abv : "N/A",
      cervejaPreco: beer ? parseFloat(beer.preco || 0) : 0,
      // Dados do Estilo
      estiloNome: style ? style.nomeEstilo : "Estilo Desconhecido",
      estiloOrigem: style ? style.origem : "N/A"
    };
  });

  const totalVolume = joinedData.reduce((acc, curr) => acc + curr.quantidade, 0);
  const totalReceitaEst = joinedData.reduce((acc, curr) => acc + (curr.quantidade * curr.cervejaPreco), 0);
  const totalProntos = joinedData.filter(b => b.status === "Pronto").length;
  const totalProducao = joinedData.filter(b => b.status !== "Pronto").length;

  const getStatusBadgeClass = (statusStr) => {
    switch (statusStr) {
      case "Pronto": return "table-badge ready";
      case "Fermentando": return "table-badge fermenting";
      case "Condicionando": return "table-badge conditioning";
      default: return "table-badge";
    }
  };

  return (
    <div className="admin-layout">
      <div className="container">

        {/* Cabeçalho */}
        <div className="admin-header">
          <div className="admin-title-area">
            <h1>Relatório Geral de Produção (JOIN)</h1>
            <p>Relatório integrando Lotes de Produção, Receitas de Cervejas e Estilos.</p>
          </div>
        </div>

        {/* Indicadores Consolidados */}
        <div className="report-summary-cards">
          <div className="report-summary-card">
            <div className="report-summary-label">Volume Total Produzido</div>
            <div className="report-summary-val">{totalVolume.toLocaleString()} Litros</div>
          </div>
          <div className="report-summary-card">
            <div className="report-summary-label">Valor Comercial Estimado</div>
            <div className="report-summary-val">R$ {totalReceitaEst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="report-summary-card">
            <div className="report-summary-label">Lotes Prontos</div>
            <div className="report-summary-val" style={{ color: "var(--color-success)" }}>{totalProntos} Lotes</div>
          </div>
          <div className="report-summary-card">
            <div className="report-summary-label">Lotes Ativos na Garagem</div>
            <div className="report-summary-val" style={{ color: "var(--primary-color)" }}>{totalProducao} Lotes</div>
          </div>
        </div>

        {/* Tabela de Relatório */}
        <div className="crud-list-wrapper" style={{ width: "100%" }}>
          <div className="crud-list-header">
            <h2 className="crud-list-title">Lista Consolidada (Join)</h2>
            <span className="beer-style-badge" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#fff" }}>
              Total Lotes: {joinedData.length}
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código Lote</th>
                  <th>Cerveja (Nome)</th>
                  <th>Estilo</th>
                  <th>Origem Estilo</th>
                  <th>Grad. Alcoólica</th>
                  <th>Volume (Litros)</th>
                  <th>Preço Litro (Est.)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {joinedData.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                      Nenhum dado cadastrado para realizar o JOIN. Preencha as informações nas telas de CRUD.
                    </td>
                  </tr>
                ) : (
                  joinedData.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: "700", color: "var(--primary-color)" }}>{row.codigoLote}</td>
                      <td style={{ fontWeight: "600" }}>{row.cervejaNome}</td>
                      <td>{row.estiloNome}</td>
                      <td>{row.estiloOrigem}</td>
                      <td>{row.cervejaAbv}% ABV</td>
                      <td>{row.quantidade} L</td>
                      <td>R$ {parseFloat(row.cervejaPreco).toFixed(2)}</td>
                      <td>
                        <span className={getStatusBadgeClass(row.status)}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relatorio;
