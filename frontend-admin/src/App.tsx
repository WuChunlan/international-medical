import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HospitalManage from './pages/HospitalManage';
import DoctorManage from './pages/DoctorManage';
import EquipmentManage from './pages/EquipmentManage';
import ProductManage from './pages/ProductManage';
import UserManage from './pages/UserManage';
import SiteConfig from './pages/SiteConfig';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="hospitals" element={<HospitalManage />} />
                <Route path="doctors" element={<DoctorManage />} />
                <Route path="equipments" element={<EquipmentManage />} />
                <Route path="products" element={<ProductManage />} />
                <Route path="users" element={<UserManage />} />
                <Route path="config" element={<SiteConfig />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
