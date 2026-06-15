import React, { useState, useEffect } from "react";
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from "../firebase";
import StyleRow from "../components/StyleRow";

const CrudEstilos = () => {
  const [styles, setStyles] = useState([]);
  const [nomeEstilo, setNomeEstilo] = useState("");
  const [origem, setOrigem] = useState("");
  const [temperaturaServico, setTemperaturaServico] = useState("");
  
  // Controle de Edição
  const [editingId, setEditingId] = useState(null);
  
  // Feedback
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const unsubscribe = subscribeToCollection("estilos", (data) => {
      setStyles(data);
    });
    return () => unsubscribe();
  }, []);

  const showFeedback = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validação
    if (!nomeEstilo.trim()) {
      showFeedback("O nome do estilo é obrigatório.", "danger");
      return;
    }
    if (!origem.trim()) {
      showFeedback("A origem geográfica é obrigatória.", "danger");
      return;
    }
    if (!temperaturaServico.trim()) {
      showFeedback("A temperatura de serviço é obrigatória.", "danger");
      return;
    }

    const data = {
      nomeEstilo: nomeEstilo.trim(),
      origem: origem.trim(),
      temperaturaServico: temperaturaServico.trim()
    };

    try {
      if (editingId) {
        // Atualiza estilo
        await updateDocument("estilos", editingId, data);
        showFeedback("Estilo atualizado com sucesso!");
        setEditingId(null);
      } else {
        // Cria estilo
        await addDocument("estilos", data);
        showFeedback("Estilo cadastrado com sucesso!");
      }
      // Limpa formulário
      setNomeEstilo("");
      setOrigem("");
      setTemperaturaServico("");
    } catch (error) {
      console.error(error);
      showFeedback("Erro ao salvar o estilo.", "danger");
    }
  };

  const handleEdit = (styleItem) => {
    setEditingId(styleItem.id);
    setNomeEstilo(styleItem.nomeEstilo);
    setOrigem(styleItem.origem);
    setTemperaturaServico(styleItem.temperaturaServico);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNomeEstilo("");
    setOrigem("");
    setTemperaturaServico("");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este estilo de cerveja?")) {
      try {
        await deleteDocument("estilos", id);
        showFeedback("Estilo removido com sucesso!");
        if (editingId === id) {
          handleCancelEdit();
        }
      } catch (error) {
        console.error(error);
        showFeedback("Erro ao deletar o estilo.", "danger");
      }
    }
  };

  return (
    <div className="admin-layout">
      <div className="container">
        
        {/* Cabeçalho da Página */}
        <div className="admin-header">
          <div className="admin-title-area">
            <h1>Gerenciamento de Estilos</h1>
            <p>Cadastre e altere estilos de cerveja que servirão de base para os rótulos.</p>
          </div>
        </div>



        <div className="crud-grid">
          {/* Listagem (Read) */}
          <div className="crud-list-wrapper">
            <div className="crud-list-header">
              <h2 className="crud-list-title">Estilos Registrados</h2>
              <span className="beer-style-badge" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#fff" }}>
                Total: {styles.length}
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome do Estilo</th>
                    <th>Origem Geográfica</th>
                    <th>Temp. Serviço</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {styles.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                        Nenhum estilo de cerveja cadastrado.
                      </td>
                    </tr>
                  ) : (
                    styles.map((styleItem) => (
                      <StyleRow
                        key={styleItem.id}
                        styleItem={styleItem}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formulário (Create/Update) */}
          <div className="crud-form-wrapper">
            <h2 className="crud-form-title">
              {editingId ? "Editar Estilo" : "Cadastrar Estilo"}
            </h2>

            {/* Feedback */}
            {message.text && (
              <div className={`alert ${message.type === "danger" ? "alert-danger" : "alert-success"}`}>
                <span>{message.type === "danger" ? "⚠️" : "✅"} {message.text}</span>
              </div>
            )}

            <form onSubmit={handleSave} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="style-name">Nome do Estilo</label>
                <input
                  type="text"
                  id="style-name"
                  className="form-control"
                  placeholder="Ex: German Lager, IPA, Stout"
                  value={nomeEstilo}
                  onChange={(e) => setNomeEstilo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="style-origin">Origem Geográfica</label>
                <input
                  type="text"
                  id="style-origin"
                  className="form-control"
                  placeholder="Ex: Alemanha, Reino Unido, Bélgica"
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="style-temp">Temperatura de Serviço (°C)</label>
                <input
                  type="text"
                  id="style-temp"
                  className="form-control"
                  placeholder="Ex: 4-7, 8-12"
                  value={temperaturaServico}
                  onChange={(e) => setTemperaturaServico(e.target.value)}
                  required
                />
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
                  {editingId ? "Atualizar" : "Salvar Estilo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrudEstilos;
