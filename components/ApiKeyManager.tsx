
import React, { useState, useEffect } from 'react';
import { X, Save, Zap, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  keys: string[];
  onSave: (keys: string[]) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ isOpen, onClose, keys, onSave }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText(keys.join('\n'));
    }
  }, [isOpen, keys]);

  const handleSave = () => {
    const newKeys = text.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    onSave(newKeys);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden relative z-10"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Quản lý API Key</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cấu hình Gemini API</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400 hover:text-slate-600 active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách API Key</label>
                  <span className="text-[9px] font-bold text-slate-400 italic">Mỗi dòng là 1 API Key</span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-mono text-slate-700 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none resize-none placeholder:text-slate-300"
                  placeholder="Nhập API Key tại đây...&#10;Key 1&#10;Key 2&#10;Key 3"
                />
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-4 items-start">
                <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
                  Hệ thống sẽ tự động xoay vòng các API Key này để tối ưu hóa giới hạn lượt gọi (Rate Limit) của Gemini.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-slate-100 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all active:scale-[0.98]"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Lưu cấu hình
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ApiKeyManager;
