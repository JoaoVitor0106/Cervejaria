import React from "react";

const StyleRow = ({ styleItem, onEdit, onDelete }) => {
  return (
    <tr>
      <td style={{ fontWeight: "600" }}>{styleItem.nomeEstilo}</td>
      <td>{styleItem.origem}</td>
      <td>{styleItem.temperaturaServico} °C</td>
      <td>
        <div className="table-actions">
          <button 
            onClick={() => onEdit(styleItem)} 
            className="btn-icon edit" 
            title="Editar Estilo"
          >
            ✏️
          </button>
          <button 
            onClick={() => onDelete(styleItem.id)} 
            className="btn-icon delete" 
            title="Excluir Estilo"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
};

export default StyleRow;
