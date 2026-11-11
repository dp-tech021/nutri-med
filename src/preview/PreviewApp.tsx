import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { HomePage } from '../pages/HomePage';

// Public visual preview only: no AppProvider, Supabase session, login, or API requests.
function PreviewUnavailable() {
  return (
    <Layout>
      <section aria-labelledby="preview-unavailable-title" style={{ marginBlock: '3rem', maxWidth: '42rem' }}>
        <h1 id="preview-unavailable-title">Área indisponível nesta prévia</h1>
        <p>Esta publicação serve apenas para visualizar o layout da landing page. Catálogo, cadastro, login e contratação não estão conectados nesta demonstração.</p>
        <Link className="ui-button ui-button--primary" to="/">Voltar à página inicial</Link>
      </section>
    </Layout>
  );
}

export function PreviewApp() {
  return (
    <HashRouter>
      <div
        role="status"
        style={{
          padding: '0.5rem 1rem',
          textAlign: 'center',
          background: '#fff4e5',
          color: '#6b3d00',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}
      >
        PRÉVIA VISUAL PÚBLICA — SEM LOGIN, BANCO DE DADOS OU PAGAMENTOS
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<PreviewUnavailable />} />
      </Routes>
    </HashRouter>
  );
}
