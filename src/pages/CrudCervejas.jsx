import React, { useState, useEffect } from "react";
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from "../firebase";

const CrudCervejas = () => {
  const [beers, setBeers] = useState([]);
  const [styles, setStyles] = useState([]);
  
  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [estiloId, setEstiloId] = useState("");
  const [abv, setAbv] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  
  // Controle de Edição
  const [editingId, setEditingId] = useState(null);
  
  // Feedback
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    // Escuta em tempo real cervejas e estilos
    const unsubscribeBeers = subscribeToCollection("cervejas", (data) => {
      setBeers(data);
    });

    const unsubscribeStyles = subscribeToCollection("estilos", (data) => {
      setStyles(data);
    });

    return () => {
      unsubscribeBeers();
      unsubscribeStyles();
    };
  }, []);

  const showFeedback = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!nome.trim()) {
      showFeedback("O nome da cerveja é obrigatório.", "danger");
      return;
    }
    if (!estiloId) {
      showFeedback("Selecione um estilo de cerveja.", "danger");
      return;
    }
    if (!abv || isNaN(abv) || parseFloat(abv) < 0) {
      showFeedback("Teor alcoólico (ABV) inválido.", "danger");
      return;
    }
    if (!preco || isNaN(preco) || parseFloat(preco) < 0) {
      showFeedback("Preço de venda inválido.", "danger");
      return;
    }
    if (!descricao.trim()) {
      showFeedback("A descrição da cerveja é obrigatória.", "danger");
      return;
    }

    const data = {
      nome: nome.trim(),
      estiloId,
      abv: parseFloat(abv).toString(),
      preco: parseFloat(preco).toString(),
      descricao: descricao.trim()
    };

    try {
      if (editingId) {
        // Atualiza
        await updateDocument("cervejas", editingId, data);
        showFeedback("Cerveja atualizada com sucesso!");
        setEditingId(null);
      } else {
        // Cria
        await addDocument("cervejas", data);
        showFeedback("Cerveja cadastrada com sucesso!");
      }
      // Limpa formulário
      setNome("");
      setEstiloId("");
      setAbv("");
      setPreco("");
      setDescricao("");
    } catch (error) {
      console.error(error);
      showFeedback("Erro ao salvar a receita de cerveja.", "danger");
    }
  };

  const handleEdit = (beer) => {
    setEditingId(beer.id);
    setNome(beer.nome);
    setEstiloId(beer.estiloId);
    setAbv(beer.abv);
    setPreco(beer.preco);
    setDescricao(beer.descricao);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNome("");
    setEstiloId("");
    setAbv("");
    setPreco("");
    setDescricao("");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir esta receita de cerveja?")) {
      try {
        await deleteDocument("cervejas", id);
        showFeedback("Receita removida com sucesso!");
        if (editingId === id) {
          handleCancelEdit();
        }
      } catch (error) {
        console.error(error);
        showFeedback("Erro ao deletar receita.", "danger");
      }
    }
  };

  // Helper para obter o nome do estilo
  const getStyleName = (styleId) => {
    const style = styles.find(s => s.id === styleId);
    return style ? style.nomeEstilo : "Estilo não encontrado";
  };

  return (
    <div className="admin-layout">
      <div className="container">
        
        {/* Cabeçalho da Página */}
        <div className="admin-header">
          <div className="admin-title-area">
            <h1>Cadastro de Cervejas (CRUD 1)</h1>
            <p>Gerencie as receitas de cervejas, seus teores alcoólicos e descrições comerciais.</p>
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
              <h2 className="crud-list-title">Receitas Ativas</h2>
              <span className="beer-style-badge" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#fff" }}>
                Total: {beers.length}
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome da Cerveja</th>
                    <th>Estilo</th>
                    <th>Teor (ABV)</th>
                    <th>Preço (R$)</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {beers.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                        Nenhuma cerveja cadastrada. Adicione uma nova receita ao lado!
                      </td>
                    </tr>
                  ) : (
                    beers.map((beer) => (
                      <tr key={beer.id}>
                        <td style={{ fontWeight: "600" }}>{beer.nome}</td>
                        <td>
                          <span className="beer-style-badge" style={{ margin: 0, padding: "4px 10px" }}>
                            {getStyleName(beer.estiloId)}
                          </span>
                        </td>
                        <td>{beer.abv}%</td>
                        <td>R$ {parseFloat(beer.preco).toFixed(2)}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              onClick={() => handleEdit(beer)}
                              className="btn-icon edit"
                              title="Editar Cerveja"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(beer.id)}
                              className="btn-icon delete"
                              title="Deletar Cerveja"
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
              {editingId ? "Editar Receita" : "Cadastrar Receita"}
            </h2>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="beer-name">Nome da Cerveja</label>
                <input
                  type="text"
                  id="beer-name"
                  className="form-control"
                  placeholder="Ex: Schraderbräu Helles"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="beer-style">Estilo de Cerveja</label>
                <select
                  id="beer-style"
                  className="form-control"
                  value={estiloId}
                  onChange={(e) => setEstiloId(e.target.value)}
                  required
                >
                  <option value="">-- Escolha um Estilo --</option>
                  {styles.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.nomeEstilo} ({style.origem})
                    </option>
                  ))}
                </select>
                {styles.length === 0 && (
                  <p style={{ fontSize: "0.8rem", color: "var(--color-warning)", marginTop: "4px" }}>
                    ⚠️ Nenhum estilo cadastrado. Cadastre estilos primeiro!
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="beer-abv">Teor Alcoólico (ABV %)</label>
                <input
                  type="number"
                  step="0.1"
                  id="beer-abv"
                  className="form-control"
                  placeholder="Ex: 5.2"
                  value={abv}
                  onChange={(e) => setAbv(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="beer-price">Preço de Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  id="beer-price"
                  className="form-control"
                  placeholder="Ex: 18.90"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="beer-desc">Descrição Comercial</label>
                <textarea
                  id="beer-desc"
                  rows="4"
                  className="form-control"
                  placeholder="Descreva as notas de sabor, aroma e visual da cerveja..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  style={{ resize: "none" }}
                  required
                ></textarea>
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
                  {editingId ? "Atualizar" : "Salvar Receita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrudCervejas;
