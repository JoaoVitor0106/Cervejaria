import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, loginWithGoogle, subscribeToAuth, isAdminUser } from "../firebase";

const Registro = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // Se já estiver logado, redireciona
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      if (currentUser) {
        navigate(isAdminUser(currentUser) ? "/admin/dashboard" : "/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) { setError("O nome é obrigatório."); return; }
    if (!email) { setError("O e-mail é obrigatório."); return; }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) { setError("Insira um e-mail válido."); return; }
    if (password.length < 6) { setError("A senha deve ter no mínimo 6 caracteres."); return; }
    if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    try {
      await registerUser(email, password, displayName);
      navigate("/minha-conta");
    } catch (err) {
      setError(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      navigate(isAdminUser(user) ? "/admin/dashboard" : "/minha-conta");
    } catch (err) {
      setError(err.message || "Erro ao entrar com o Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: "500px" }}>
        <img src="/logo.png" alt="Schraderbräu" className="login-logo pulse-glow" />
        <h2 className="login-title">Criar Conta</h2>
        <p className="login-subtitle">Registre-se para fazer seus pedidos</p>

        {error && (
          <div className="alert alert-danger">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Nome Completo</label>
            <input
              type="text"
              id="reg-name"
              className="form-control"
              placeholder="Seu nome"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading || googleLoading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">E-mail</label>
            <input
              type="email"
              id="reg-email"
              className="form-control"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || googleLoading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Senha</label>
            <input
              type="password"
              id="reg-password"
              className="form-control"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || googleLoading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirmar Senha</label>
            <input
              type="password"
              id="reg-confirm"
              className="form-control"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || googleLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary login-btn"
            disabled={loading || googleLoading}
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>

        <div className="login-divider">
          <span>ou</span>
        </div>

        <button
          id="btn-google-register"
          className="btn-google"
          onClick={handleGoogleRegister}
          disabled={loading || googleLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? "Conectando..." : "Registrar com Google"}
        </button>

        <div className="login-register-link">
          <p>Já tem uma conta? <Link to="/login">Entrar</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Registro;
