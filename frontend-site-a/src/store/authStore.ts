import { create } from 'zustand';
import type { User } from '../types';

export interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    return token && username ? { token, username, role: role || 'user' } : null;
  })(),
  setUser: (user) => {
    if (user) {
      localStorage.setItem('token', user.token);
      localStorage.setItem('username', user.username);
      localStorage.setItem('role', user.role);
    }
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    set({ user: null });
  },
}));
