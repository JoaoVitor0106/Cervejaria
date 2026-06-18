import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, loginWithGoogle, subscribeToAuth, isAdminUser } from "../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  // O email é o estado que guarda o valor do campo de email, e o setEmail é a função que atualiza esse estado. O mesmo vale para a senha, o erro e o loading.
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // O loading é o estado que indica se o sistema está processando o login, para desabilitar o botão e mostrar uma mensagem de "Verificando...".
  const navigate = useNavigate();
  // O navigate é a função que redireciona o usuário para outra página, no caso, para o dashboard após o login bem-sucedido.

  // Se já estiver logado, redireciona para o lugar certo
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      if (currentUser) {
        if (isAdminUser(currentUser)) {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

 // Essa função useEffect verifica se o usuário já os campos ja foram preechidos, e se sim é redirecionado para o dashboard. 
 // O subscribeToAuth faz a assinatura das mudanças de autenticação, e o navigate é a função que redireciona o usuário para o dashboard. 
 // O return () => unsubscribe() é a função de limpeza que cancela a assinatura quando o componente é desmontado.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
   // O handleSubmit é a função que é chamada quando o formulário é submetido. Ele previne o comportamento padrão do formulário, limpa o erro anterior e ativa o loading.
   // O e.preventDefault() é usado para evitar que a página seja recarregada ao enviar o formulário, o que é o comportamento padrão do HTML.

    if (!email) {
      setError("O e-mail é obrigatório.");
      setLoading(false);
      return;
    }
    // Essas validações são para garantir que o usuário preencha os campos corretamente antes de tentar fazer o login. Se algum campo estiver vazio ou inválido, uma mensagem de erro é exibida e o processo de login é interrompido. 
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
    // A expressão regular emailPattern é usada para validar o formato do e-mail. Ela verifica se o e-mail contém caracteres antes do @, um domínio válido e uma extensão. Se o e-mail não corresponder a esse padrão, uma mensagem de erro é exibida.

    if (password.length < 5) {
      setError("A senha deve conter no mínimo 5 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const user = await loginUser(email, password);
      if (isAdminUser(user)) {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
      // Se o login for bem-sucedido, o usuário é redirecionado com base no seu role.
    } catch (err) {
      setError(err.message || "Erro de login desconhecido. Verifique suas credenciais.");
      // Se ocorrer um erro durante o login, a mensagem de erro é exibida para o usuário. O err.message contém a mensagem de erro retornada pela função de login, ou uma mensagem genérica se não houver uma mensagem específica.
    } finally {
      setLoading(false);
      // O finally é usado para garantir que o estado de loading seja desativado independentemente do resultado do login, para que o botão seja reabilitado e a interface seja atualizada corretamente.
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      if (isAdminUser(user)) {
        navigate("/admin/dashboard");
      } else {
        navigate("/minha-conta");
      }
    } catch (err) {
      setError(err.message || "Erro ao entrar com o Google. Tente novamente.");
    } finally {
      setGoogleLoading(false);
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
            <label className="form-label" htmlFor="login-email">E-mail</label>
            <input
              type="email"
              id="login-email"
              className="form-control"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || googleLoading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Senha</label>
            <input
              type="password"
              id="login-password"
              className="form-control"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || googleLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary login-btn"
            disabled={loading || googleLoading}
          >
            {loading ? "Verificando..." : "Acessar"}
          </button>
        </form>

        {/* Separador */}
        <div className="login-divider">
          <span>ou</span>
        </div>

        {/* Botão Google */}
        <button
          id="btn-google-login"
          className="btn-google"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? "Conectando..." : "Entrar com Google"}
        </button>

        {/* Link para registro */}
        <div className="login-register-link">
          <p>Ainda não tem uma conta? <Link to="/registro">Criar conta</Link></p>
        </div>

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
