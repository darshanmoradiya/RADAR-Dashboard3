import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Static credentials
  const STATIC_USERNAME = 'admin';
  const STATIC_PASSWORD = 'Radar#1012';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a slight delay for better UX
    setTimeout(() => {
      if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
        onLogin();
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans antialiased">
      {/* Aurora Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.1) 0px, transparent 50%),
              radial-gradient(at 98% 1%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
              radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%)
            `,
            backgroundSize: '200% 200%',
            animation: 'aurora 15s ease infinite alternate'
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              delay: 0.1 
            }}
            className="mb-6"
          >
            <img 
              src="https://forensiccybertech.com/wp-content/uploads/2025/05/Eagleye-logo-1.png" 
              alt="Eagleye" 
              className="w-16 h-16 object-contain mx-auto mb-4" 
            />
            <h1 className="text-2xl font-black text-white tracking-wide leading-none">EAGLEYE <span className="text-blue-500">RADAR</span></h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-[0.2em] mt-1 uppercase">Network Monitoring & Analysis</p>
          </motion.div>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-panel rounded-2xl shadow-2xl p-8 border border-slate-700/50"
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          <h2 className="text-xl font-bold text-white mb-6 tracking-tight">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-medium">{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-[#020617] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span className="text-xs font-medium">Signing in...</span>
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-[10px] mt-6 font-medium tracking-wide">
          © 2026 Eagleye Radar Dashboard. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
