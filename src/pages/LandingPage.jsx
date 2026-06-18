import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { subscribeToCollection, addDocument } from "../firebase";
import { useCart } from "../context/CartContext";

// Card de cerveja isolado e memorizado — não re-renderiza quando o formulário de contato muda
const BeerCard = memo(({ beer, styleName, onAddToCart }) => (
  <div className="beer-card">
    <div className="beer-card-body">
      <span className="beer-style-badge">{styleName}</span>
      <h3 className="beer-card-title">{beer.nome}</h3>
      <p className="beer-description">{beer.descricao}</p>
      <div className="beer-meta">
        <div className="beer-abv">Teor: <span>{beer.abv}% ABV</span></div>
        <div className="beer-price">R$ {parseFloat(beer.preco).toFixed(2)}</div>
      </div>
      <button
        className="btn-add-cart"
        onClick={() => onAddToCart(beer)}
        id={`add-cart-${beer.id}`}
      >
        🛒 Adicionar ao Carrinho
      </button>
    </div>
  </div>
));

const LandingPage = () => {
  const [beers, setBeers] = useState([]);
  const [styles, setStyles] = useState([]);
  const { addToCart } = useCart();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  // Mapa de estilos para lookup O(1) em vez de .find() a cada render
  const stylesMap = useMemo(() => {
    const map = {};
    styles.forEach(s => { map[s.id] = s.nomeEstilo; });
    return map;
  }, [styles]);

  const getStyleName = useCallback(
    (styleId) => stylesMap[styleId] || "Estilo Especial",
    [stylesMap]
  );

  const handleContactSubmit = useCallback(async (e) => {
    e.preventDefault();
    setFormError("");
    if (!contactName || !contactEmail || !contactMessage) {
      setFormError("Todos os campos do formulário são obrigatórios.");
      return;
    }
    try {
      await addDocument("contatos", {
        nome: contactName,
        email: contactEmail,
        mensagem: contactMessage,
        dataEnvio: new Date().toISOString()
      });
      setFormSubmitted(true);
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setTimeout(() => setFormSubmitted(false), 5000);
    } catch (err) {
      console.error(err);
      setFormError("Erro ao enviar mensagem. Tente novamente.");
    }
  }, [contactName, contactEmail, contactMessage]);

  useEffect(() => {
    const unsubscribeBeers  = subscribeToCollection("cervejas", setBeers);
    const unsubscribeStyles = subscribeToCollection("estilos",  setStyles);
    return () => { unsubscribeBeers(); unsubscribeStyles(); };
  }, []);

  return (
    <div id="home">
      {/* 🚀 HERO SECTION */}
      <header className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="hero-tagline">Silky Smooth German Lager</span>
            <h1 className="hero-title">
              Brews that will <span className="gradient-text">break you!</span>
            </h1>
            <p className="hero-description">
              Diretamente da garagem do Mestre Cervejeiro <strong>Hank Schrader</strong> em Albuquerque, a Schraderbräu é o resultado de uma busca implacável pela perfeição. Uma cerveja artesanal encorpada, sedosa e com controle microbiológico impecável.
            </p>
            <div className="hero-buttons">
              <a href="#cervejas" className="btn-primary">
                Nossas Receitas
              </a>
              <a href="#sobre" className="btn-secondary">
                Nossa História
              </a>
            </div>
          </div>
          
          <div className="hero-image-container">
            <div className="hero-image-wrapper">
              <img 
                className="hero-image pulse-glow" 
                src="/logo.png" 
                alt="Hank Schrader e sua Schraderbräu" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* 🔍 ABOUT SECTION */}
      <section id="sobre" className="section section-dark">
        <div className="container">
          <div className="about-grid">
            <div className="about-text">
              <span className="section-subtitle">O Mestre Cervejeiro</span>
              <h2 className="section-title">Minerais e Malte</h2>
              <p style={{ marginTop: "24px" }}>
                Para o agente especial do DEA <strong>Hank Schrader</strong>, produzir cerveja não é apenas um hobby; é uma ciência exata. Lançada como uma produção caseira rigorosa, cada lote de <strong>Schraderbräu</strong> passa por um controle de densidade e temperatura de fermentação extremamente rígidos.
              </p>
              <p>
                Hank costuma dizer que fazer cerveja é como estudar <em>minerais</em> (não rochas!): exige paciência, olho para a estrutura cristalina do malte e apreciação pelos elementos químicos naturais. O resultado? Uma cerveja que alcançou status lendário entre amigos e familiares.
              </p>
            </div>
            
            <div className="about-stats">
              <div className="stat-card">
                <div className="stat-number">100%</div>
                <div className="stat-label">Artesanal</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0%</div>
                <div className="stat-label">Conservantes</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">5.2%</div>
                <div className="stat-label">ABV Tradicional</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">25+</div>
                <div className="stat-label">Lotes Testados</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🍺 BEERS SHOWCASE */}
      <section id="cervejas" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Exclusividade em Lotes Limitados</span>
            <h2 className="section-title">Nossos Rótulos</h2>
          </div>

          <div className="beers-grid">
            {beers.length === 0 ? (
              <div className="text-center" style={{ gridColumn: "1 / -1", padding: "40px", color: "var(--text-muted)" }}>
                Carregando receitas direto da cervejaria...
              </div>
            ) : (
              beers.map((beer) => (
                <BeerCard
                  key={beer.id}
                  beer={beer}
                  styleName={getStyleName(beer.estiloId)}
                  onAddToCart={addToCart}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ✉️ CONTACT & INQUIRY SECTION */}
      <section id="contato" className="section section-dark">
        <div className="container contact-container">
          <div className="contact-info">
            <span className="section-subtitle">Fale com o Hank</span>
            <h3>Encomende seu Garrafão</h3>
            <p>
              Nossa cerveja é produzida em lotes pequenos e exclusivos. Tem interesse em adquirir garrafas personalizadas de Schraderbräu ou quer enviar seu feedback para o Mestre Cervejeiro? Mande uma mensagem!
            </p>
            
            <div className="contact-details">
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div className="contact-text">
                  <h4>Cervejaria</h4>
                  <p>Garagem do Hank — Albuquerque, New Mexico</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">✉️</div>
                <div className="contact-text">
                  <h4>E-mail</h4>
                  <p>hank@schrader.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form">
            <h4 style={{ marginBottom: "20px", fontSize: "1.2rem", fontWeight: "700" }}>Enviar Mensagem</h4>
            
            {formSubmitted && (
              <div className="alert alert-success">
                <span>✅ Sua mensagem foi enviada com sucesso para o quartel-general da Schraderbräu!</span>
              </div>
            )}
            
            {formError && (
              <div className="alert alert-danger">
                <span>⚠️ {formError}</span>
              </div>
            )}

            <form onSubmit={handleContactSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Nome Completo</label>
                <input 
                  type="text" 
                  id="name" 
                  className="form-control" 
                  placeholder="Seu nome"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">E-mail</label>
                <input 
                  type="email" 
                  id="email" 
                  className="form-control" 
                  placeholder="exemplo@email.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="msg">Mensagem / Solicitação de Lote</label>
                <textarea 
                  id="msg" 
                  rows="4" 
                  className="form-control" 
                  placeholder="Olá Hank, traga uma caixa de Schraderbräu para o próximo churrasco!"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                  style={{ resize: "none" }}
                ></textarea>
              </div>

              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Enviar Solicitação
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 🧹 FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3>Schraderbräu</h3>
              <p>Produzindo a cerveja caseira de melhor qualidade sob o sol do deserto do Novo México. Bebida com respeito, produzida com ciência.</p>
            </div>
            
            <div className="footer-links-col">
              <h4>Navegação</h4>
              <ul className="footer-links">
                <li><a href="#home">Início</a></li>
                <li><a href="#sobre">História</a></li>
                <li><a href="#cervejas">Rótulos</a></li>
                <li><a href="#contato">Fale Conosco</a></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Acesso Restrito</h4>
              <ul className="footer-links">
                <li><Link to="/login">Painel do Mestre Cervejeiro</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Schraderbräu Inc. Todos os direitos reservados. "Brews that will break you!"</p>
            <p>Seja responsável: beba com moderação. Venda proibida para menores de 18 anos.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
