import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Carregamento imediato para rotas críticas (Landing + Login)
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";

// Lazy loading para rotas secundárias — reduz o bundle inicial
const Registro     = lazy(() => import("./pages/Registro"));
const MinhaConta   = lazy(() => import("./pages/MinhaConta"));
const Dashboard    = lazy(() => import("./pages/Dashboard"));
const CrudCervejas = lazy(() => import("./pages/CrudCervejas"));
const CrudEstilos  = lazy(() => import("./pages/CrudEstilos"));
const CrudLotes    = lazy(() => import("./pages/CrudLotes"));
const Relatorio    = lazy(() => import("./pages/Relatorio"));
const AdminPedidos = lazy(() => import("./pages/AdminPedidos"));

import "./App.css";

// Componente de fallback enquanto a página carrega
const PageLoader = () => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0c0c0d"
  }}>
    <div style={{
      border: "4px solid #151518",
      borderTop: "4px solid #f39c12",
      borderRadius: "50%",
      width: "44px",
      height: "44px",
      animation: "spin 0.8s linear infinite"
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <CartProvider>
      <Router>
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/"            element={<LandingPage />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/registro"    element={<Registro />} />
            <Route path="/minha-conta" element={<MinhaConta />} />

            {/* Rotas Administrativas Protegidas */}
            <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/cervejas"  element={<ProtectedRoute><CrudCervejas /></ProtectedRoute>} />
            <Route path="/admin/estilos"   element={<ProtectedRoute><CrudEstilos /></ProtectedRoute>} />
            <Route path="/admin/lotes"     element={<ProtectedRoute><CrudLotes /></ProtectedRoute>} />
            <Route path="/admin/relatorio" element={<ProtectedRoute><Relatorio /></ProtectedRoute>} />
            <Route path="/admin/pedidos"   element={<ProtectedRoute><AdminPedidos /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </CartProvider>
  );
}

export default App;
