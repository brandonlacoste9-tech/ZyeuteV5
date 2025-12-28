/**
 * Password Management Tests
 * Tests for password show/hide toggles and password reset flow
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from '../Login';
import Signup from '../Signup';
import ForgotPassword from '../ForgotPassword';
import ResetPassword from '../ResetPassword';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signUp: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      updateUser: vi.fn(() => Promise.resolve({ data: null, error: null })),
      onAuthStateChange: vi.fn(() => {
        return {
          data: { 
            subscription: { 
              unsubscribe: vi.fn() 
            } 
          },
          error: null
        };
      })
    }
  }
}));

// Mock getUserProfile API call
vi.mock('../../services/api', () => ({
  getUserProfile: vi.fn(() => Promise.resolve(null))
}));

// Mock admin check
vi.mock('../../lib/admin', () => ({
  checkIsAdmin: vi.fn(() => Promise.resolve(false))
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
  logger: {
    withContext: () => ({
      info: vi.fn(),
      error: vi.fn(),
    })
  }
}));

// Mock copy
vi.mock('../../lib/copy', () => ({
  default: {
    auth: {
      login: 'Connexion',
      loginButton: 'Se connecter',
      continueGoogle: 'Continuer avec Google',
      noAccount: 'Pas de compte?',
      signupButton: 'S\'inscrire'
    }
  }
}));

// Mock constants
vi.mock('../../lib/constants', () => ({
  GUEST_MODE_KEY: 'zyeute_guest_mode',
  GUEST_TIMESTAMP_KEY: 'zyeute_guest_timestamp',
  GUEST_VIEWS_KEY: 'zyeute_guest_views_count'
}));

// Helper function to render components with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Password Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Page', () => {
    it('should render password input with toggle button', () => {
      renderWithProviders(<Login />);
      render(<Login />);

      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle password visibility when clicking eye icon', () => {
      renderWithProviders(<Login />);
      render(<Login />);

      const passwordInput = screen.getByPlaceholderText('••••••••');
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('Afficher le mot de passe')
      );

      expect(passwordInput).toHaveAttribute('type', 'password');
      
      if (toggleButton) {
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
        
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });

    it('should render forgot password link', () => {
      renderWithProviders(<Login />);
      render(<Login />);

      const forgotLink = screen.getByText('Mot de passe oublié?');
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Signup Page', () => {
    it('should render password input with toggle button', () => {
      renderWithProviders(<Signup />);
      render(<Signup />);

      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle password visibility', () => {
      renderWithProviders(<Signup />);
      render(<Signup />);

      const passwordInput = screen.getByPlaceholderText('••••••••');
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('Afficher le mot de passe')
      );

      expect(passwordInput).toHaveAttribute('type', 'password');
      
      if (toggleButton) {
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });
  });

  describe('ForgotPassword Page', () => {
    it('should render email input and submit button', () => {
      render(<ForgotPassword />);

      expect(screen.getByPlaceholderText('ton@email.com')).toBeInTheDocument();
      expect(screen.getByText('Envoyer le lien de réinitialisation')).toBeInTheDocument();
    });

    it('should show success message after submitting email', async () => {
      const { supabase } = await import('../../lib/supabase');
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({ 
        data: {} as any, 
        error: null 
      });

      render(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText('ton@email.com');
      const submitButton = screen.getByText('Envoyer le lien de réinitialisation');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Vérifie ton courriel')).toBeInTheDocument();
      });
    });
  });

  describe('ResetPassword Page', () => {
    it('should render two password inputs with toggle buttons', () => {
      // Mock URL search params
      window.history.pushState({}, '', '/reset-password?token=test&type=recovery');

      render(<ResetPassword />);

      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      expect(passwordInputs).toHaveLength(2);
      expect(passwordInputs[0]).toHaveAttribute('type', 'password');
      expect(passwordInputs[1]).toHaveAttribute('type', 'password');
    });

    it('should validate password matching', async () => {
      window.history.pushState({}, '', '/reset-password?token=test&type=recovery');

      render(<ResetPassword />);

      const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
      const submitButton = screen.getByText('Réinitialiser le mot de passe');

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'different' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
      });
    });

    it('should validate minimum password length', async () => {
      window.history.pushState({}, '', '/reset-password?token=test&type=recovery');

      render(<ResetPassword />);

      const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
      const submitButton = screen.getByText('Réinitialiser le mot de passe');

      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Le mot de passe doit contenir au moins 6 caractères')).toBeInTheDocument();
      });
    });

    it('should show error for invalid token', async () => {
      window.history.pushState({}, '', '/reset-password?token=invalid');

      render(<ResetPassword />);

      await waitFor(() => {
        expect(screen.getByText(/Lien de réinitialisation invalide ou expiré/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels on password toggle buttons', () => {
      renderWithProviders(<Login />);
      render(<Login />);

      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('mot de passe')
      );

      expect(toggleButton).toHaveAttribute('aria-label');
    });
  });
});
