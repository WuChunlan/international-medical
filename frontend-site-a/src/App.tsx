import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import HospitalDetailPage from './pages/HospitalDetail';
import ProductDetailPage from './pages/ProductDetail';
import ProfilePage from './pages/Profile';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${redirect}`, { replace: true });
    }
  }, [user, navigate]);
  if (!user) return null;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<><Header /><HomePage /></>} />
      <Route path="/hospital/:id" element={<HospitalDetailPage />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<><Header /><HomePage /></>} />
    </Routes>
  );
}

export default App;
