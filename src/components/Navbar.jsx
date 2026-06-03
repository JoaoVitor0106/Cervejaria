import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { subscribeToAuth, logoutUser } from "../firebase";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Escuta estado de autenticação
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
    });

    // Controla estilo no scroll
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  // Verifica se estamos nas rotas administrativas
  const isAdminRoute = location.pathname.startsWith("/admin") || location.pathname === "/dashboard";

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="/logo.png" alt="Schraderbräu Logo" />
          <span>Schraderbräu</span>
        </Link>

        <ul className="navbar-links">
          {!isAdminRoute ? (
            // Links Públicos da Landing Page
            <>
              <li><a href="#home" className="navbar-link">Início</a></li>
              <li><a href="#sobre" className="navbar-link">História</a></li>
              <li><a href="#cervejas" className="navbar-link">Nossas Cervejas</a></li>
              <li><a href="#contato" className="navbar-link">Contato</a></li>
              {user ? (
                <li>
                  <Link to="/admin/dashboard" className="navbar-link active">
                    Painel Cervejeiro
                  </Link>
                </li>
              ) : (
                <li>
                  <Link to="/login" className="navbar-link">
                    Entrar
                  </Link>
                </li>
              )}
            </>
          ) : (
            // Links da Área Restrita Administrativa
            <>
              <li>
                <Link to="/admin/dashboard" className={`navbar-link ${isActive("/admin/dashboard")}`}>
                  Painel
                </Link>
              </li>
              <li>
                <Link to="/admin/cervejas" className={`navbar-link ${isActive("/admin/cervejas")}`}>
                  Cervejas (CRUD 1)
                </Link>
              </li>
              <li>
                <Link to="/admin/estilos" className={`navbar-link ${isActive("/admin/estilos")}`}>
                  Estilos (CRUD 2)
                </Link>
              </li>
              <li>
                <Link to="/admin/lotes" className={`navbar-link ${isActive("/admin/lotes")}`}>
                  Lotes (CRUD 3)
                </Link>
              </li>
              <li>
                <Link to="/admin/relatorio" className={`navbar-link ${isActive("/admin/relatorio")}`}>
                  Relatório JOIN
                </Link>
              </li>
              <li>
                <Link to="/" className="navbar-link">
                  Ver Site
                </Link>
              </li>
            </>
          )}
        </ul>

        {user && isAdminRoute && (
          <div className="navbar-user-info">
            <span className="navbar-user-name">Hank Schrader</span>
            <button onClick={handleLogout} className="btn-danger" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
