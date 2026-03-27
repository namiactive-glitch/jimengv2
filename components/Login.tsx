
import React, { useState } from 'react';
import { User, AuthSession } from '../types';
import { Film, Lock, User as UserIcon, Eye, EyeOff, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const VALID_USERS: User[] = [
  { username: 'namai1', password: 'Nam123', durationDays: 30 },
  { username: 'namai2', password: 'Nam1234', durationDays: 60 },
  { username: 'namai2', password: 'Nam12345', durationDays: 90 },
  { username: 'namai2', password: 'Nam123456', durationDays: 180 },
  { username: 'namleai', password: 'Nam6789@', durationDays: 'unlimited', isAdmin: true },
  { username: 'namai15', password: 'Nam15', durationDays: 7 },
];

interface LoginProps {
  onLogin: (session: AuthSession) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = VALID_USERS.find(u => u.username === username && u.password === password);

    if (!user) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng!');
      return;
    }

    if (!apiKey.trim()) {
      setError('Vui lòng nhập Gemini API Key để tiếp tục!');
      return;
    }

    const loginTime = Date.now();
    let expirationTime: number | 'unlimited' = 'unlimited';

    if (user.durationDays !== 'unlimited') {
      expirationTime = loginTime + user.durationDays * 24 * 60 * 60 * 1000;
    }

    const session: AuthSession = {
      username: user.username,
      loginTime,
      expirationTime,
      apiKey: apiKey.trim(),
      extraApiKeys: [apiKey.trim()]
    };

    onLogin(session);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-b from-orange-500 to-orange-600 p-10 text-center relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
             <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl mb-6 shadow-inner border border-white/30">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">NAM AI</h1>
          <p className="text-orange-100 text-sm font-bold uppercase tracking-[0.2em] opacity-80">Hệ thống AI Nhân Hóa Chuyên Nghiệp</p>
        </div>

        {/* Form Body */}
        <div className="p-8 md:p-12 space-y-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none text-slate-700 font-medium placeholder:text-slate-300"
                  placeholder="Nhập tên đăng nhập..."
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none text-slate-700 font-medium placeholder:text-slate-300"
                  placeholder="Nhập mật khẩu..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gemini API Key (Mặc định)</label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[9px] font-bold text-orange-500 hover:underline flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Lấy Key Miễn Phí
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Zap className="h-5 w-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none text-slate-700 font-mono placeholder:text-slate-300"
                  placeholder="................................................"
                />
              </div>
              <p className="text-[9px] text-slate-400 italic ml-1">* Bắt buộc: Hệ thống sẽ dùng Key này cho mọi tính năng.</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black uppercase tracking-[0.1em] shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 active:scale-[0.98] transition-all"
            >
              Đăng nhập ngay
            </button>
          </form>

          {/* Footer Info */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-[32px] p-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow-md shadow-blue-500/20">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-600 text-sm font-bold">Chưa có mật khẩu truy cập?</p>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-1">Vui lòng liên hệ Zalo <span className="text-blue-500 font-bold">098.102.8794</span> để lấy mật khẩu truy cập ứng dụng.</p>
            </div>
            <a 
              href="https://zalo.me/0981028794" 
              target="_blank" 
              rel="noreferrer"
              className="inline-block px-8 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm"
            >
              Nhắn Zalo Ngay
            </a>
          </div>
        </div>

        <div className="py-6 text-center border-t border-slate-50">
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">© 2026 NAM AI - ALL RIGHTS RESERVED</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
