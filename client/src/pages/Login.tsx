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
