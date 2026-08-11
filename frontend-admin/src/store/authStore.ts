import { create } from 'zustand';

type Role = 'admin' | 'hospital_admin' | 'reviewer' | 'user' | 'customer_rep' | 'translation_admin' | null;

interface AdminAuthState {
  token: string | null;
  username: string | null;
  role: Role;
  hospitalId: number | null;
  mustChangePassword: boolean;
  setAuth: (token: string, username: string, role: Role, hospitalId?: number | null, mustChangePassword?: boolean) => void;
  clearMustChangePassword: () => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  token: localStorage.getItem('admin_token'),
  username: localStorage.getItem('admin_username'),
  role: (localStorage.getItem('admin_role') as Role) || null,
  hospitalId: localStorage.getItem('admin_hospital_id')
    ? Number(localStorage.getItem('admin_hospital_id'))
    : null,
  mustChangePassword: localStorage.getItem('admin_must_change_pw') === '1',
  setAuth: (token, username, role, hospitalId = null, mustChangePassword = false) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_username', username);
    if (role) localStorage.setItem('admin_role', role);
    if (hospitalId != null) localStorage.setItem('admin_hospital_id', String(hospitalId));
    else localStorage.removeItem('admin_hospital_id');
    localStorage.setItem('admin_must_change_pw', mustChangePassword ? '1' : '0');
    set({ token, username, role, hospitalId, mustChangePassword });
  },
  clearMustChangePassword: () => {
    localStorage.setItem('admin_must_change_pw', '0');
    set({ mustChangePassword: false });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_hospital_id');
    localStorage.removeItem('admin_must_change_pw');
    set({ token: null, username: null, role: null, hospitalId: null, mustChangePassword: false });
  },
}));
