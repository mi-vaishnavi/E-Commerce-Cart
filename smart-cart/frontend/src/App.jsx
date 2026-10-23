import { useState } from 'react';

import Header from './components/Header';
import CartDrawer from './components/CartDrawer';
import CatalogPage from './pages/CatalogPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import Login from './pages/Login';
import Register from './pages/Register';

import { useTheme } from './hooks/useTheme';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { dark, toggle } = useTheme();
  const { user, loading, logout } = useAuth();

  const [view, setView] = useState('catalog');
  const [orderId, setOrderId] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [authError, setAuthError] = useState('');

  async function handleLogout() {
    try {
      await logout();
      setView('catalog');
      setAuthError('');
    } catch (error) {
      setAuthError(error.message || 'Unable to log out.');
    }
  }

  function handleCheckout() {
    setCartOpen(false);

    if (!user) {
      setView('login');
      return;
    }

    setView('checkout');
  }

  function handleAuthSuccess() {
    setAuthError('');
    setView('catalog');
  }

  if (loading) {
  return <p>Loading Cartwise...</p>;
}

if (!user) {
  return (
    <>
      <Header
        dark={dark}
        onToggleTheme={toggle}
        onOpenCart={() => {}}
        onHome={() => {}}
      />

      {view === 'register' ? (
        <Register
          onSuccess={() => setView('catalog')}
          onLogin={() => setView('login')}
        />
      ) : (
        <Login
          onSuccess={() => setView('catalog')}
          onRegister={() => setView('register')}
        />
      )}
    </>
  );
}

  return (
    <>
      <Header
        dark={dark}
        onToggleTheme={toggle}
        onOpenCart={() => setCartOpen(true)}
        onHome={() => setView('catalog')}
      />

      <nav className="auth-navigation">
        {user ? (
          <>
            <span>Welcome, {user.name}</span>

            <button type="button" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setAuthError('');
                setView('login');
              }}
            >
              Log in
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthError('');
                setView('register');
              }}
            >
              Register
            </button>
          </>
        )}
      </nav>

      {authError && (
        <p className="auth-error" role="alert">
          {authError}
        </p>
      )}

      {view === 'catalog' && <CatalogPage />}

      {view === 'login' && (
        <Login
          onSuccess={() => {
            handleAuthSuccess();
          }}
          onRegister={() => {
            setAuthError('');
            setView('register');
          }}
        />
      )}

      {view === 'register' && (
        <Register
          onSuccess={handleAuthSuccess}
          onLogin={() => {
            setAuthError('');
            setView('login');
          }}
        />
      )}

      {view === 'checkout' &&
        (user ? (
          <CheckoutPage
            onBack={() => setView('catalog')}
            onPlaced={(id) => {
              setOrderId(id);
              setView('success');
            }}
          />
        ) : (
          <Login
            onSuccess={() => setView('checkout')}
            onRegister={() => setView('register')}
          />
        ))}

      {view === 'success' && (
        <OrderSuccessPage
          orderId={orderId}
          onContinue={() => setView('catalog')}
        />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </>
  );
}
