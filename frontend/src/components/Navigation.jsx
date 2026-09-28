import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, ShieldAlert } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to={isAdmin ? '/admin' : '/student'} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform">
            S
          </div>
          <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            SentimentX
          </span>
        </Link>
        <div className="flex items-center gap-6">
          {token ? (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                {isAdmin ? <ShieldAlert size={16} className="text-purple-600" /> : <User size={16} className="text-indigo-600" />}
                {isAdmin ? 'Admin View' : 'Student View'}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-medium transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
