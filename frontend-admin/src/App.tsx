import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HospitalManage from './pages/HospitalManage';
import DoctorManage from './pages/DoctorManage';
import EquipmentManage from './pages/EquipmentManage';
import EnvironmentManage from './pages/EnvironmentManage';
import ServiceTeamManage from './pages/ServiceTeamManage';
import ServiceFeatureManage from './pages/ServiceFeatureManage';
import ProductManage from './pages/ProductManage';
import CaseManage from './pages/CaseManage';
import UserManage from './pages/UserManage';
import SiteConfig from './pages/SiteConfig';
import CreateStaffPage from './pages/CreateStaff';
import HospitalAdminManage from './pages/HospitalAdminManage';
import HAHospitalPage from './pages/HospitalAdmin/HAHospitalPage';
import HADoctorsPage from './pages/HospitalAdmin/HADoctorsPage';
import HAEquipmentsPage from './pages/HospitalAdmin/HAEquipmentsPage';
import HAEnvironmentsPage from './pages/HospitalAdmin/HAEnvironmentsPage';
import HACasesPage from './pages/HospitalAdmin/HACasesPage';
import HAProductsPage from './pages/HospitalAdmin/HAProductsPage';
import ReviewerPendingPage from './pages/Reviewer/ReviewerPendingPage';
import CustomerRepManage from './pages/CustomerRepManage';
import RepDashboard from './pages/RepDashboard';

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
                {/* Super admin routes */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="hospitals" element={<HospitalManage />} />
                <Route path="doctors" element={<DoctorManage />} />
                <Route path="equipments" element={<EquipmentManage />} />
                <Route path="environments" element={<EnvironmentManage />} />
                <Route path="service-teams" element={<ServiceTeamManage />} />
                <Route path="service-features" element={<ServiceFeatureManage />} />
                <Route path="products" element={<ProductManage />} />
                <Route path="cases" element={<CaseManage />} />
                <Route path="users" element={<UserManage />} />
                <Route path="config" element={<SiteConfig />} />
                <Route path="create-staff" element={<CreateStaffPage />} />
                <Route path="hospital-admins" element={<HospitalAdminManage />} />
                <Route path="customer-reps" element={<CustomerRepManage />} />
                {/* Hospital admin routes */}
                <Route path="ha/hospital" element={<HAHospitalPage />} />
                <Route path="ha/doctors" element={<HADoctorsPage />} />
                <Route path="ha/equipments" element={<HAEquipmentsPage />} />
                <Route path="ha/environments" element={<HAEnvironmentsPage />} />
                <Route path="ha/cases" element={<HACasesPage />} />
                <Route path="ha/products" element={<HAProductsPage />} />
                {/* Reviewer routes */}
                <Route path="reviewer/pending" element={<ReviewerPendingPage />} />
                {/* Customer rep routes */}
                <Route path="rep/dashboard" element={<RepDashboard />} />
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
