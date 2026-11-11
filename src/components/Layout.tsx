import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../api';
import { useApp } from '../app/AppContext';

export function Layout({ children }: { children: ReactNode }) {
  const { session, profile } = useApp();

  return <>
    <header className="bg-white border-b border-emerald-100">
      <nav className="max-w-5xl mx-auto p-4 flex flex-wrap gap-4 items-center justify-between">
        <Link className="font-bold text-xl no-underline" to="/">Nutri-Med</Link>
        <div className="flex gap-3 flex-wrap">
          <Link to="/">Catálogo</Link>
          {session ? <>
            <Link to="/dashboard">Painel</Link>
            <span>{profile?.display_name || 'Conta'}</span>
            <button className="btn btn-outline" onClick={() => void supabase.auth.signOut()}>Sair</button>
          </> : <>
            <Link to="/login">Entrar</Link>
            <Link to="/cadastro">Cadastrar</Link>
          </>}
        </div>
      </nav>
    </header>
    <main className="max-w-5xl mx-auto p-4 md:p-8">{children}</main>
    <footer className="max-w-5xl mx-auto p-5 text-sm muted">Protótipo do MVP. Sem pagamentos na plataforma.</footer>
  </>;
}
