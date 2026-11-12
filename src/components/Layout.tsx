import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../api';
import { useApp } from '../app/AppContext';
import { Button, Container } from './ui';

export function Layout({ children }: { children: ReactNode }) {
  const { session, profile } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!menuOpen) return;
    firstMenuLinkRef.current?.focus();
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [menuOpen]);

  return <>
    <header className="site-header">
      <Container><nav className="site-nav" aria-label="Navegação principal">
        <Link className="brand" to="/" aria-label="Nutri-Med, página inicial">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>Nutri-Med</span>
        </Link>
        <button
          ref={menuButtonRef}
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
        </button>
        <div id="main-menu" className={`main-menu ${menuOpen ? 'main-menu--open' : ''}`}>
          <Link ref={firstMenuLinkRef} to="/">Início</Link>
          <Link to="/servicos">Explorar serviços</Link>
          <Link to="/#como-funciona">Como funciona</Link>
          {session ? <>
            <Link to="/dashboard">Painel</Link>
            <span className="account-name">{profile?.display_name || 'Conta'}</span>
            <Button variant="secondary" onClick={() => void supabase.auth.signOut()}>Sair</Button>
          </> : <>
            <Link to="/login">Entrar</Link>
            <Link className="nav-signup" to="/cadastro">Criar conta</Link>
          </>}
        </div>
      </nav></Container>
    </header>
    <main id="conteudo"><Container className="page-content">{children}</Container></main>
    <footer className="site-footer"><Container className="footer-content">
      <div className="footer-brand">
        <Link className="brand brand--footer" to="/" aria-label="Nutri-Med, página inicial"><span className="brand-mark" aria-hidden="true">N</span><span>Nutri-Med</span></Link>
        <p>Marketplace de serviços para encontrar prestadores, solicitar orçamentos e analisar propostas.</p>
        <p className="footer-prototype">Protótipo em desenvolvimento. A plataforma não processa pagamentos.</p>
      </div>
      <nav aria-label="Navegação do rodapé"><strong>Navegação</strong>
        <Link to="/">Início</Link>
        <Link to="/servicos">Catálogo</Link>
        <Link to="/#como-funciona">Como funciona</Link>
        {session ? <Link to="/dashboard">Painel</Link> : <><Link to="/login">Entrar</Link><Link to="/cadastro">Criar conta</Link></>}
      </nav>
      <div className="footer-institutional"><strong>Informações</strong><p>Termos de uso, política de privacidade e canais oficiais estão em preparação.</p></div>
    </Container></footer>
  </>;
}
