import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(email, password, isAdmin);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-100 via-white to-indigo-50 min-h-[calc(100vh-64px)] -mt-8">
      <div className="max-w-md w-full backdrop-blur-xl bg-white/60 p-10 rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Create Account</h2>
            <p className="mt-2 text-gray-600">Join us and share your feedback</p>
          </div>
          
          {error && (
            <div className="bg-red-50/50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                className="w-full bg-white/50 border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full bg-white/50 border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center bg-white/50 p-3 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="admin"
                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <label htmlFor="admin" className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
                Register as Admin User
              </label>
            </div>
            
            <button 
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/40 transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
            >
              {loading ? 'Creating Account...' : (
                <>
                  <UserPlus size={20} />
                  Register Now
                </>
              )}
            </button>
          </form>
          
          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Sign in instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
