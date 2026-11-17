import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './app/AppProvider';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return <AppProvider>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  </AppProvider>;
}
