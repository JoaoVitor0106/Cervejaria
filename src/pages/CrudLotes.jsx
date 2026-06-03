import React, { useState, useEffect } from "react";
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from "../firebase";

const CrudLotes = () => {
  const [batches, setBatches] = useState([]);
  const [beers, setBeers] = useState([]);
  
  // Estados do Formulário
  const [codigoLote, setCodigoLote] = useState("");
  const [cervejaId, setCervejaId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [status, setStatus] = useState("Fermentando");
  
  // Controle de Edição
  const [editingId, setEditingId] = useState(null);
  
  // Feedback
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    // Escuta em tempo real lotes e cervejas
    const unsubscribeBatches = subscribeToCollection("lotes", (data) => {
      setBatches(data);
    });

    const unsubscribeBeers = subscribeToCollection("cervejas", (data) => {
      setBeers(data);
    });

    return () => {
      unsubscribeBatches();
      unsubscribeBeers();
    };
  }, []);

  const showFeedback = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!codigoLote.trim()) {
      showFeedback("O código do lote é obrigatório.", "danger");
      return;
    }
    if (!cervejaId) {
      showFeedback("Selecione a cerveja que está sendo produzida neste lote.", "danger");
      return;
    }
    if (!dataInicio) {
      showFeedback("A data de início da brasagem é obrigatória.", "danger");
      return;
    }
    if (!quantidade || isNaN(quantidade) || parseFloat(quantidade) <= 0) {
      showFeedback("Quantidade em litros inválida.", "danger");
      return;
    }
    if (!status) {
      showFeedback("Selecione o status atual do lote.", "danger");
      return;
    }

    const data = {
      codigoLote: codigoLote.trim().toUpperCase(),
      cervejaId,
      dataInicio,
      quantidade: parseFloat(quantidade).toString(),
      status
    };

    try {
      if (editingId) {
        // Atualiza lote
        await updateDocument("lotes", editingId, data);
        showFeedback("Lote de produção atualizado com sucesso!");
        setEditingId(null);
      } else {
        // Cria lote
        await addDocument("lotes", data);
        showFeedback("Lote de produção adicionado com sucesso!");
      }
      // Limpa formulário
      setCodigoLote("");
      setCervejaId("");
      setDataInicio("");
      setQuantidade("");
      setStatus("Fermentando");
    } catch (error) {
      console.error(error);
      showFeedback("Erro ao salvar o lote de produção.", "danger");
    }
  };

  const handleEdit = (batch) => {
    setEditingId(batch.id);
    setCodigoLote(batch.codigoLote);
    setCervejaId(batch.cervejaId);
    setDataInicio(batch.dataInicio);
    setQuantidade(batch.quantidade);
    setStatus(batch.status);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCodigoLote("");
    setCervejaId("");
    setDataInicio("");
    setQuantidade("");
    setStatus("Fermentando");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este lote de produção?")) {
      try {
        await deleteDocument("lotes", id);
        showFeedback("Lote de produção excluído com sucesso!");
        if (editingId === id) {
          handleCancelEdit();
        }
      } catch (error) {
        console.error(error);
        showFeedback("Erro ao deletar lote.", "danger");
      }
    }
  };

  // Helper para obter o nome da cerveja conectada ao lote
  const getBeerName = (beerId) => {
    const beer = beers.find(b => b.id === beerId);
    return beer ? beer.nome : "Cerveja excluída/não encontrada";
  };

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
        
        {/* Cabeçalho da Página */}
        <div className="admin-header">
          <div className="admin-title-area">
            <h1>Lotes de Produção (CRUD 3)</h1>
            <p>Controle a fabricação, data de brasagem, volume e o processo fermentativo dos lotes.</p>
          </div>
        </div>

        {/* Feedback */}
        {message.text && (
          <div className={`alert ${message.type === "danger" ? "alert-danger" : "alert-success"}`}>
            <span>{message.type === "danger" ? "⚠️" : "✅"} {message.text}</span>
          </div>
        )}

        <div className="crud-grid">
          {/* Listagem (Read) */}
          <div className="crud-list-wrapper">
            <div className="crud-list-header">
              <h2 className="crud-list-title">Lotes Monitorados</h2>
              <span className="beer-style-badge" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#fff" }}>
                Total: {batches.length}
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cód. Lote</th>
                    <th>Cerveja</th>
                    <th>Data Início</th>
                    <th>Volume (L)</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                        Nenhum lote em produção cadastrado. Use o painel ao lado!
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch) => (
                      <tr key={batch.id}>
                        <td style={{ fontWeight: "700", color: "var(--primary-color)" }}>{batch.codigoLote}</td>
                        <td style={{ fontWeight: "600" }}>{getBeerName(batch.cervejaId)}</td>
                        <td>{batch.dataInicio.split("-").reverse().join("/")}</td>
                        <td>{batch.quantidade} Litros</td>
                        <td>
                          <span className={getStatusBadgeClass(batch.status)}>
                            {batch.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              onClick={() => handleEdit(batch)}
                              className="btn-icon edit"
                              title="Editar Lote"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(batch.id)}
                              className="btn-icon delete"
                              title="Excluir Lote"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formulário (Create/Update) */}
          <div className="crud-form-wrapper">
            <h2 className="crud-form-title">
              {editingId ? "Editar Lote" : "Iniciar Novo Lote"}
            </h2>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="batch-code">Código do Lote</label>
                <input
                  type="text"
                  id="batch-code"
                  className="form-control"
                  placeholder="Ex: LOTE-045, BR-500"
                  value={codigoLote}
                  onChange={(e) => setCodigoLote(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="batch-beer">Receita da Cerveja</label>
                <select
                  id="batch-beer"
                  className="form-control"
                  value={cervejaId}
                  onChange={(e) => setCervejaId(e.target.value)}
                  required
                >
                  <option value="">-- Selecione a Cerveja --</option>
                  {beers.map((beer) => (
                    <option key={beer.id} value={beer.id}>
                      {beer.nome}
                    </option>
                  ))}
                </select>
                {beers.length === 0 && (
                  <p style={{ fontSize: "0.8rem", color: "var(--color-warning)", marginTop: "4px" }}>
                    ⚠️ Nenhuma cerveja cadastrada. Adicione receitas no CRUD 1 primeiro!
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="batch-date">Data de Início (Brasagem)</label>
                <input
                  type="date"
                  id="batch-date"
                  className="form-control"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="batch-volume">Volume Fervido (Litros)</label>
                <input
                  type="number"
                  step="1"
                  id="batch-volume"
                  className="form-control"
                  placeholder="Ex: 500"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="batch-status">Status de Produção</label>
                <select
                  id="batch-status"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="Fermentando">Fermentando (Atenuação)</option>
                  <option value="Condicionando">Condicionando (Maturação)</option>
                  <option value="Pronto">Pronto (Envasado)</option>
                </select>
              </div>

              <div className="form-actions">
                {editingId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="btn-primary">
                  {editingId ? "Atualizar" : "Registrar Lote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrudLotes;
