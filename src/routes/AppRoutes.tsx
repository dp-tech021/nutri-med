import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { Layout } from '../components/Layout';
import { AuthPage, ResetPasswordPage, safeInternalPath } from '../pages/AuthPages';
import { CatalogPage } from '../pages/CatalogPage';
import { DashboardPage } from '../pages/DashboardPage';
import { HomePage } from '../pages/HomePage';
import { ProfileSetupPage } from '../pages/ProfileSetupPage';
import { PublicProviderPage } from '../pages/PublicProviderPage';
import { RequestDetailsPage } from '../pages/RequestDetailsPage';
import { ServiceDetailsPage } from '../pages/ServiceDetailsPage';
import { EditServicePage, NewServicePage } from '../pages/ServiceFormPages';
import { MyServicesPage, ProviderProposalsPage, ReceivedRequestsPage } from '../pages/ProviderPages';
import { ErrorState, LoadingState } from '../components/ui';

const DesignSystemPage = import.meta.env.DEV
  ? lazy(() => import('../pages/DesignSystemPage'))
  : null;

export function AppRoutes() {
  const { session, profile, profileError, refresh } = useApp();
  const location = useLocation();
  const loginRedirect = <Navigate
    to="/login"
    replace
    state={{ from: `${location.pathname}${location.search}` }}
  />;
  const dashboard = !session
    ? loginRedirect
    : profileError
      ? <Layout><ErrorState title="Não foi possível carregar seu perfil" description={profileError} onRetry={() => void refresh()} /></Layout>
      : !profile ? <ProfileSetupPage /> : <DashboardPage />;

  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/servicos" element={<CatalogPage />} />
    <Route path="/login" element={session
      ? <Navigate to={safeInternalPath((location.state as { from?: unknown } | null)?.from)} replace />
      : <AuthPage mode="login" />} />
    <Route path="/cadastro" element={session ? <Navigate to="/dashboard" replace /> : <AuthPage mode="cadastro" />} />
    <Route path="/recuperar" element={<AuthPage mode="recuperar" />} />
    <Route path="/atualizar-senha" element={<ResetPasswordPage />} />
    <Route path="/servico/:id" element={<ServiceDetailsPage />} />
    <Route path="/prestador/:id" element={<PublicProviderPage />} />
    <Route path="/dashboard" element={dashboard} />
    <Route path="/novo-servico" element={!session
      ? loginRedirect
      : profile?.kind !== 'prestador' ? <Navigate to="/dashboard" replace /> : <NewServicePage />} />
    <Route path="/editar-servico/:id" element={!session
      ? loginRedirect
      : profile?.kind !== 'prestador' ? <Navigate to="/dashboard" replace /> : <EditServicePage />} />
    <Route path="/meus-servicos" element={!session
      ? loginRedirect
      : profile?.kind !== 'prestador' ? <Navigate to="/dashboard" replace /> : <MyServicesPage />} />
    <Route path="/solicitacoes-recebidas" element={!session
      ? loginRedirect
      : profile?.kind !== 'prestador' ? <Navigate to="/dashboard" replace /> : <ReceivedRequestsPage />} />
    <Route path="/propostas" element={!session
      ? loginRedirect
      : profile?.kind !== 'prestador' ? <Navigate to="/dashboard" replace /> : <ProviderProposalsPage />} />
    <Route path="/pedido/:id" element={!session
      ? loginRedirect
      : <RequestDetailsPage />} />
    {DesignSystemPage && <Route path="/dev/design-system" element={<Suspense fallback={<LoadingState label="Carregando componentes..." />}><DesignSystemPage /></Suspense>} />}
    <Route path="*" element={<Layout><h1>Página não encontrada</h1><Link to="/">Voltar ao início</Link></Layout>} />
  </Routes>;
}
