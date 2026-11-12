import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { AuthPage, ResetPasswordPage } from '../pages/AuthPages';
import { CatalogPage } from '../pages/CatalogPage';
import { DashboardPage } from '../pages/DashboardPage';
import { HomePage } from '../pages/HomePage';
import { ProfileSetupPage } from '../pages/ProfileSetupPage';
import { PublicProviderPage } from '../pages/PublicProviderPage';
import { RequestDetailsPage } from '../pages/RequestDetailsPage';
import { ServiceDetailsPage } from '../pages/ServiceDetailsPage';
import { EditServicePage, NewServicePage } from '../pages/ServiceFormPages';
import { LoadingState } from '../components/ui';
import { ClientRequestsPage } from '../pages/ClientRequestsPage';

const DesignSystemPage = import.meta.env.DEV
  ? lazy(() => import('../pages/DesignSystemPage'))
  : null;

export function AppRoutes() {
  const { session, profile } = useApp();
  const location = useLocation();
  const loginRedirect = <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;

  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/servicos" element={<CatalogPage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/cadastro" element={<AuthPage mode="cadastro" />} />
    <Route path="/recuperar" element={<AuthPage mode="recuperar" />} />
    <Route path="/atualizar-senha" element={<ResetPasswordPage />} />
    <Route path="/servico/:id" element={<ServiceDetailsPage />} />
    <Route path="/prestador/:id" element={<PublicProviderPage />} />
    <Route path="/dashboard" element={!session
      ? loginRedirect
      : !profile ? <ProfileSetupPage /> : <DashboardPage />} />
    <Route path="/novo-servico" element={!session
      ? <Navigate to="/login" />
      : profile?.kind !== 'prestador' ? <Navigate to="/dashboard" /> : <NewServicePage />} />
    <Route path="/editar-servico/:id" element={!session
      ? <Navigate to="/login" />
      : profile?.kind !== 'prestador' ? <Navigate to="/dashboard" /> : <EditServicePage />} />
    <Route path="/pedido/:id" element={!session
      ? loginRedirect
      : <RequestDetailsPage />} />
    <Route path="/minhas-solicitacoes" element={!session
      ? loginRedirect
      : profile?.kind !== 'cliente' ? <Navigate to="/dashboard" replace /> : <ClientRequestsPage />} />
    {DesignSystemPage && <Route path="/dev/design-system" element={<Suspense fallback={<LoadingState label="Carregando componentes..." />}><DesignSystemPage /></Suspense>} />}
    <Route path="*" element={<Layout><h1>Página não encontrada</h1><Link to="/">Voltar ao início</Link></Layout>} />
  </Routes>;
}
