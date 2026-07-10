import { create } from 'zustand';

type Role = 'admin' | 'hospital_admin' | 'reviewer' | 'user' | 'customer_rep' | null;

interface AdminAuthState {
  token: string | null;
  username: string | null;
  role: Role;
  hospitalId: number | null;
  setAuth: (token: string, username: string, role: Role, hospitalId?: number | null) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  token: localStorage.getItem('admin_token'),
  username: localStorage.getItem('admin_username'),
  role: (localStorage.getItem('admin_role') as Role) || null,
  hospitalId: localStorage.getItem('admin_hospital_id')
    ? Number(localStorage.getItem('admin_hospital_id'))
    : null,
  setAuth: (token, username, role, hospitalId = null) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_username', username);
    if (role) localStorage.setItem('admin_role', role);
    if (hospitalId != null) localStorage.setItem('admin_hospital_id', String(hospitalId));
    else localStorage.removeItem('admin_hospital_id');
    set({ token, username, role, hospitalId });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_hospital_id');
    set({ token: null, username: null, role: null, hospitalId: null });
  },
}));
