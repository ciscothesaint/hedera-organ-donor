import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * DAO Authentication Store
 *
 * IMPORTANT: Uses SEPARATE storage key 'dao-auth-storage'
 * This ensures complete session isolation from admin platform
 */
export const useDaoAuthStore = create(
  persist(
    (set) => ({
      doctor: null,
      daoToken: null,
      isAuthenticated: false,

      /**
       * Login doctor with DAO credentials
       */
      loginDoctor: (doctorData, token) => {
        set({
          doctor: doctorData,
          daoToken: token,
          isAuthenticated: true,
        });
      },

      /**
       * Logout doctor
       */
      logoutDoctor: () => {
        set({
          doctor: null,
          daoToken: null,
          isAuthenticated: false,
        });
      },

      /**
       * Update doctor profile
       */
      updateDoctor: (doctorData) => {
        set({ doctor: doctorData });
      },

      /**
       * Check if user can vote
       * In centralized model, no wallet required
       */
      canVote: () => {
        const state = useDaoAuthStore.getState();
        return state.doctor?.daoProfile?.isAuthorizedVoter;
      },

      /**
       * Check if user can create proposals
       * In centralized model, no wallet required
       */
      canCreateProposals: () => {
        const state = useDaoAuthStore.getState();
        return (
          state.doctor?.role === 'DAO_DOCTOR' &&
          state.doctor?.daoProfile?.isAuthorizedVoter
        );
      },
    }),
    {
      name: 'dao-auth-storage', // ⚠️ DIFFERENT from admin 'auth-storage'
    }
  )
);
