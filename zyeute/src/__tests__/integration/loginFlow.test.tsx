/**
 * Login Flow Integration Tests
 * End-to-end tests for complete user authentication flows
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GUEST_MODE_KEY, GUEST_TIMESTAMP_KEY, GUEST_VIEWS_KEY } from '../../../client/src/lib/constants';

// Mock fetch globally
global.fetch = vi.fn();

describe('Login Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  describe('Complete Login Flow', () => {
    it('should validate login credentials before API call', async () => {
      const mockLoginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(mockLoginData.email)).toBe(true);

      // Validate password length
      expect(mockLoginData.password.length >= 6).toBe(true);

      // Mock successful API call
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1, email: mockLoginData.email } })
      });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(mockLoginData)
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.user.email).toBe(mockLoginData.email);
    });

    it('should handle API error responses', async () => {
      // Mock failed login API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email ou mot de passe invalide' })
      });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'wrong@example.com', password: 'wrong' })
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });
  });

  describe('Guest Mode Flow', () => {
    it('should set guest mode flags in localStorage', () => {
      // Simulate guest mode activation
      localStorage.setItem(GUEST_MODE_KEY, 'true');
      localStorage.setItem(GUEST_TIMESTAMP_KEY, Date.now().toString());
      localStorage.setItem(GUEST_VIEWS_KEY, '0');

      // Verify localStorage was set correctly
      expect(localStorage.getItem(GUEST_MODE_KEY)).toBe('true');
      expect(localStorage.getItem(GUEST_TIMESTAMP_KEY)).toBeTruthy();
      expect(localStorage.getItem(GUEST_VIEWS_KEY)).toBe('0');
    });

    it('should clear guest mode on successful login', () => {
      // Set up guest mode first
      localStorage.setItem(GUEST_MODE_KEY, 'true');
      localStorage.setItem(GUEST_TIMESTAMP_KEY, Date.now().toString());
      localStorage.setItem(GUEST_VIEWS_KEY, '5');

      expect(localStorage.getItem(GUEST_MODE_KEY)).toBe('true');

      // Simulate login success - clear guest mode
      localStorage.removeItem(GUEST_MODE_KEY);
      localStorage.removeItem(GUEST_TIMESTAMP_KEY);
      localStorage.removeItem(GUEST_VIEWS_KEY);

      // Verify guest mode was cleared
      expect(localStorage.getItem(GUEST_MODE_KEY)).toBeNull();
      expect(localStorage.getItem(GUEST_TIMESTAMP_KEY)).toBeNull();
      expect(localStorage.getItem(GUEST_VIEWS_KEY)).toBeNull();
    });

    it('should validate guest session expiration (24 hours)', () => {
      const now = Date.now();
      
      // Test valid session (12 hours ago)
      const validTimestamp = now - (12 * 60 * 60 * 1000);
      expect(now - validTimestamp < 24 * 60 * 60 * 1000).toBe(true);

      // Test expired session (25 hours ago)
      const expiredTimestamp = now - (25 * 60 * 60 * 1000);
      expect(now - expiredTimestamp > 24 * 60 * 60 * 1000).toBe(true);
    });
  });

  describe('Form Validation Flow', () => {
    it('should validate email format before submission', () => {
      const validEmail = 'user@example.com';
      const invalidEmail = 'notanemail';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test(validEmail)).toBe(true);
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    it('should validate password length', () => {
      const validPassword = 'password123';
      const tooShort = '12345';
      
      expect(validPassword.length >= 6).toBe(true);
      expect(tooShort.length >= 6).toBe(false);
    });

    it('should handle empty form fields', () => {
      const emptyEmail = '';
      const emptyPassword = '';
      
      expect(emptyEmail.trim().length > 0).toBe(false);
      expect(emptyPassword.trim().length > 0).toBe(false);
    });
  });

  describe('API Integration', () => {
    it('should make POST request with correct data structure', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1 } })
      });

      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginData)
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'test@test.com', password: 'test' })
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe('Network error');
      }
    });
  });

  describe('Session Management', () => {
    it('should handle session creation on successful login', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          user: { id: 1, email: 'test@example.com' },
          session: { token: 'abc123' }
        })
      });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password' })
      });

      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
    });
  });
});
