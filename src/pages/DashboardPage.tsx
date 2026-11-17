import { HealthDashboardPage } from './HealthDashboardPage';
import { useApp } from '../app/AppContext';
import { ClientRequestsPage } from './ClientRequestsPage';
import { ProviderOverview } from './ProviderPages';

export function DashboardPage() {
  const { profile } = useApp();
  return profile?.kind === 'prestador' ? profile.domain === 'health' ? <HealthDashboardPage /> : <ProviderOverview /> : <ClientRequestsPage />;
}
