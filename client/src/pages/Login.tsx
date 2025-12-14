import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Attempting direct Supabase login:', email);
      
      // We use the direct Supabase client instead of the internal API
      // This bypasses any Vercel Function timeouts or middleware issues
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.session) {
        console.log('✅ Login successful, redirecting to dashboard...');
        // Force a hard location change to clear any stuck React state
        window.location.href = '/';
      } else {
        throw new Error('Session could not be established.');
      }
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4 font-sans">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-yellow-600/30 rounded-xl p-8 shadow-2xl">
        
        {/* Simple, Safe Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-500 mb-2">Zyeuté</h1>
          <div className="h-1 w-16 bg-yellow-600 mx-auto rounded-full"></div>
          <p className="text-gray-400 text-sm mt-3">Secure Access</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 text-red-200 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3.5 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-900/20"
          >
            {loading ? 'Authenticating...' : 'Enter Zyeuté'}
          </button>
        </form>

                    <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                                      <div className="w-full border-t border-gray-800"></div>
                                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                                      <span className="px-4 bg-[#1a1a1a] text-gray-400">Ou</span>
                                                    </div>
                                  </div>

                    <button
                                    type="button"
                                    onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
                                    className="w-full bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-3"
                                  >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                                    </svg>
                                    Continuer avec Google
                                  </button>

        <div className="mt-8 text-center pt-6 border-t border-gray-800">
          <Link to="/signup" className="text-yellow-500 hover:text-yellow-400 text-sm font-medium transition-colors">
            No account? Create one here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
