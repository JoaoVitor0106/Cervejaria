import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, subscribeToAuth } from "../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Se já estiver logado, redireciona para o dashboard
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      if (currentUser) {
        navigate("/admin/dashboard");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validações básicas no front-end
    if (!email) {
      setError("O e-mail é obrigatório.");
      setLoading(false);
      return;
    }
    
    if (!password) {
      setError("A senha é obrigatória.");
      setLoading(false);
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("Insira um e-mail válido (ex: nome@dominio.com).");
      setLoading(false);
      return;
    }

    if (password.length < 5) {
      setError("A senha deve conter no mínimo 5 caracteres.");
      setLoading(false);
      return;
    }

    try {
      await loginUser(email, password);
      // Redireciona
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Erro de login desconhecido. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/logo.png" alt="Schraderbräu Mascot" className="login-logo pulse-glow" />
        <h2 className="login-title">Área do Cervejeiro</h2>
        <p className="login-subtitle">Acesso Restrito - Controle de Lotes</p>

        {error && (
          <div className="alert alert-danger" id="login-error-msg">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">E-mail Corporativo</label>
            <input
              type="email"
              id="login-email"
              className="form-control"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Senha de Segurança</label>
            <input
              type="password"
              id="login-password"
              className="form-control"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary login-btn"
            disabled={loading}
          >
            {loading ? "Verificando..." : "Acessar Painel"}
          </button>
        </form>

        <div className="login-footer-info">
          <p>Para testar localmente, utilize:</p>
          <p>E-mail: <code>hank@schrader.com</code></p>
          <p>Senha: <code>mineral</code></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
