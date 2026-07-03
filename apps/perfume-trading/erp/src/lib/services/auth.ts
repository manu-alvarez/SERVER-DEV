import type { UserProfile, Role } from '@/types';

export const AuthService = {
  /**
   * Mock login.
   */
  async login(email: string, password: string): Promise<UserProfile> {
    // Mock authentication for the ERP
    if (!email || !password) throw new Error('Email and password required');

    return {
      id: 'mock-user-id',
      email: email,
      role: 'admin',
      name: email.split('@')[0],
    };
  },

  /**
   * Mock logout.
   */
  async logout(): Promise<void> {
    // Do nothing
  },

  /**
   * Get the current session (mocked).
   */
  async getSession(): Promise<UserProfile | null> {
    // In a real app this would check a cookie/token
    // For now we return null to force login, or a mock user
    return null;
  },
};
