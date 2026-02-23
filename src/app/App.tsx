import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

function AuthGate() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  ) : (
    <LoginPage />
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
