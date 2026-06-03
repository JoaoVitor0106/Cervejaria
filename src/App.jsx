import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CrudCervejas from "./pages/CrudCervejas";
import CrudEstilos from "./pages/CrudEstilos";
import CrudLotes from "./pages/CrudLotes";
import Relatorio from "./pages/Relatorio";

import "./App.css";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Rota Pública principal */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Rota de Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rotas Administrativas Protegidas */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/cervejas" 
          element={
            <ProtectedRoute>
              <CrudCervejas />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/estilos" 
          element={
            <ProtectedRoute>
              <CrudEstilos />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/lotes" 
          element={
            <ProtectedRoute>
              <CrudLotes />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/relatorio" 
          element={
            <ProtectedRoute>
              <Relatorio />
            </ProtectedRoute>
          } 
        />

        {/* Redireciona qualquer rota inválida para a Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
