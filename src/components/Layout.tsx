import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../api';
import { useApp } from '../app/AppContext';
import { Button, Container } from './ui';

export function Layout({ children }: { children: ReactNode }) {
  const { session, profile } = useApp();

  return <>
    <header className="bg-white border-b border-slate-200">
      <Container><nav className="py-4 flex flex-wrap gap-4 items-center justify-between" aria-label="Navegação principal">
        <Link className="font-bold text-xl no-underline" to="/">Nutri-Med</Link>
        <div className="flex gap-3 flex-wrap">
          <Link to="/">Catálogo</Link>
          {session ? <>
            <Link to="/dashboard">Painel</Link>
            <span>{profile?.display_name || 'Conta'}</span>
            <Button variant="secondary" onClick={() => void supabase.auth.signOut()}>Sair da conta</Button>
          </> : <>
            <Link to="/login">Entrar</Link>
            <Link to="/cadastro">Cadastrar</Link>
          </>}
        </div>
      </nav></Container>
    </header>
    <main><Container className="py-6 md:py-10">{children}</Container></main>
    <footer><Container className="py-6 text-sm muted">Protótipo do MVP. Sem pagamentos na plataforma.</Container></footer>
  </>;
}
