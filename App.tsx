
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Clapperboard, Sparkles, BookOpen, LogOut, Settings, Clock, Zap, ShieldCheck, PenTool, User as UserIcon } from 'lucide-react';
import CinematicPromptModule from './modules/CinematicPromptModule';
import SeriesDirectorModule from './modules/SeriesDirectorModule';
import StoryStudioModule from './modules/StoryStudioModule';
import MarketingSolutionsModule from './modules/MarketingSolutionsModule';
import UserGuideModule from './modules/UserGuideModule';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import ApiKeyManager from './components/ApiKeyManager';
import { loadState, saveState } from './services/persistenceService';
import { getAuthSession, saveAuthSession } from './services/keyService';
import { AuthSession } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guide' | 'single' | 'series' | 'story' | 'marketing'>(() => loadState('activeTab', 'guide' as const));
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    saveState('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      if (session.expirationTime === 'unlimited') {
        setTimeLeft('Vĩnh viễn');
        return;
      }

      const now = Date.now();
      const diff = session.expirationTime - now;

      if (diff <= 0) {
        handleLogout();
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const handleLogin = (newSession: AuthSession) => {
    setSession(newSession);
    saveAuthSession(newSession);
  };

  const handleLogout = () => {
    setSession(null);
    saveAuthSession(null);
  };

  const handleSaveApiKeys = (keys: string[]) => {
    if (!session) return;
    const updatedSession = { ...session, extraApiKeys: keys };
    setSession(updatedSession);
    saveAuthSession(updatedSession);
  };

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-orange-200 selection:text-orange-900 overflow-x-hidden w-full">
        {/* Top Promo Banner */}
        <div className="bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] py-2 px-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-white/20 p-1 rounded-md">
                <Clapperboard className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                MUA KHÓA HỌC CAPCUT & TÀI KHOẢN <span className="text-yellow-300">PRO</span> - MUA TÀI KHOẢN VEO3 ULTRA <span className="text-yellow-300">GIÁ RẺ</span> LIÊN HỆ
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <a 
                href="https://zalo.me/0981028794" 
                target="_blank" 
                rel="noreferrer"
                className="bg-white text-[#7C3AED] px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black shadow-lg hover:bg-slate-50 transition-all active:scale-95"
              >
                Nam AI 098.102.8794
              </a>
              <div className="bg-black/20 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span className="text-[9px] sm:text-[10px] text-white font-bold uppercase tracking-tighter">GIÁ RẺ - UY TÍN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-50 w-full">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-8 flex-1 min-w-0">
              {/* Logo */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#F97316] rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm">
                <Film className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>

              {/* Pill Navigation */}
              <nav className="flex overflow-x-auto no-scrollbar bg-[#F3F4F6] p-1 rounded-xl border border-slate-100 gap-1 flex-1 sm:flex-none">
                {[
                  { id: 'guide', label: 'Hướng dẫn', icon: BookOpen },
                  { id: 'single', label: 'Prompt Đơn', icon: Sparkles },
                  { id: 'series', label: 'Phim Võ Thuật', icon: Clapperboard },
                  { id: 'story', label: 'Xưởng Truyện', icon: PenTool },
                  { id: 'marketing', label: 'Giải pháp Marketing', icon: Zap },
                ].map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(item.id as any)}
                    className={cn(
                      "nav-pill whitespace-nowrap flex-shrink-0 px-3 sm:px-5 py-1.5 sm:py-2",
                      activeTab === item.id ? 'nav-pill-active' : 'nav-pill-inactive'
                    )}
                  >
                    <item.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", activeTab === item.id && "animate-pulse")} />
                    <span className="text-[10px] sm:text-xs md:text-sm">{item.label}</span>
                  </motion.button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Timer & User Info */}
              <div className="hidden sm:flex flex-col items-end mr-2">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <UserIcon className="w-3 h-3" /> {session.username}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 uppercase tracking-widest">
                  <Clock className="w-3 h-3" /> {timeLeft}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={() => setIsApiKeyOpen(true)}
                  className="p-2 sm:p-2.5 bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl border border-slate-200 transition-all active:scale-90"
                  title="Quản lý API Key"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 sm:p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-slate-200 transition-all active:scale-90"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Sub-nav message like in the image */}
          <div className="bg-white border-b border-slate-50 py-1 flex justify-center px-4">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
              <div className="sm:hidden flex items-center gap-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <UserIcon className="w-2.5 h-2.5" /> {session.username}
                </span>
                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {timeLeft}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6 relative w-full overflow-x-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-orange-100/20 blur-[120px] -z-10 pointer-events-none" />
          
          <div className="space-y-8">
            {activeTab === 'guide' ? (
              <UserGuideModule onNavigate={(tab) => setActiveTab(tab)} />
            ) : activeTab === 'single' ? (
              <CinematicPromptModule />
            ) : activeTab === 'series' ? (
              <SeriesDirectorModule />
            ) : activeTab === 'story' ? (
              <StoryStudioModule />
            ) : (
              <MarketingSolutionsModule />
            )}
          </div>
        </main>

        <footer className="py-8 text-center border-t border-slate-100 mt-12 bg-white">
           <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em]">© 2026 AI JIMENG — Tạo Prompt Video AI Chuyên Nghiệp</span>
        </footer>

        <ApiKeyManager 
          isOpen={isApiKeyOpen} 
          onClose={() => setIsApiKeyOpen(false)} 
          keys={session.extraApiKeys || []}
          onSave={handleSaveApiKeys}
        />
      </div>
    </ErrorBoundary>
  );
};

// App component ends here
export default App;
