import React, { useState, useEffect, createContext, useContext } from 'react';
import { LayoutGrid, Lock, User, LogIn, UserPlus } from 'lucide-react';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const meRes = await fetch('/api/auth/me');
        const data = await meRes.json();
        setUser(data.user);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const register = async (username, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const meRes = await fetch('/api/auth/me');
        const data = await meRes.json();
        setUser(data.user);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {user ? children : <AuthScreen />}
    </AuthContext.Provider>
  );
};

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = isLogin ? await login(username, password) : await register(username, password);
    if (!success) {
      setError(isLogin ? 'Invalid credentials' : 'Username might be taken');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-sans text-neutral-100 p-4">
      <div className="w-full max-w-sm bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center space-x-2 mb-8 justify-center">
          <span className="font-semibold text-xl tracking-tight">starterr</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">{error}</div>}
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-500 px-1">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-neutral-800 text-neutral-200 text-sm rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all placeholder-neutral-600"
                placeholder="Enter username"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-500 px-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-neutral-800 text-neutral-200 text-sm rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all placeholder-neutral-600"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-neutral-100 text-black font-semibold text-sm rounded-xl py-2.5 mt-2 hover:bg-white transition-colors flex items-center justify-center space-x-2">
            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        <div className="mt-5 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {isLogin ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
