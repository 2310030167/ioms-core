import { create } from 'zustand';
import { pb } from '@/lib/pocketbase';

type UserRole = 'CEO' | 'Admin' | 'PM' | 'Lead' | 'Dev' | 'Designer' | 'QA' | 'HR' | 'Sales' | 'Client';

interface AuthState {
  user: any | null;
  role: UserRole | null;
  isValid: boolean;
  syncAuth: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: pb.authStore.model,
  role: (pb.authStore.model?.role as UserRole) || null,
  isValid: pb.authStore.isValid,
  syncAuth: () => set({
    user: pb.authStore.model,
    role: (pb.authStore.model?.role as UserRole) || null,
    isValid: pb.authStore.isValid
  }),
  logout: () => {
    pb.authStore.clear();
    set({ user: null, role: null, isValid: false });
  }
}));