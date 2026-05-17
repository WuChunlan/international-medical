import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import HomePage from './pages/HomePage';
import HospitalDetailPage from './pages/HospitalDetail';
import ProductDetailPage from './pages/ProductDetail';
import ProfilePage from './pages/Profile';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/login?redirect=${redirect}`);
    return null;
  }
  return <>{children}</>;
}

/** Redirect unknown routes back to Site A */
function RedirectToSiteA() {
  const navigate = useNavigate();
  useEffect(() => {
    window.location.href = 'http://localhost:3000';
  }, [navigate]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
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
        <Route path="*" element={<RedirectToSiteA />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
