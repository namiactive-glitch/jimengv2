
import React, { useState, useEffect } from 'react';
import { CinematicPrompt } from '../types';
import { Copy, Check, Loader2, RefreshCw, Edit3, Save, X } from 'lucide-react';
import { syncTranslation } from '../services/promptService';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PromptEditorProps {
  prompt: CinematicPrompt;
  onUpdate: (updatedPrompt: CinematicPrompt) => void;
  sceneId: string;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ prompt, onUpdate, sceneId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<CinematicPrompt>(prompt);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setEditedPrompt(prompt);
  }, [prompt]);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyAll = () => {
    const text = `VIETNAMESE:\n${editedPrompt.translation}\n\nENGLISH:\n${editedPrompt.prompt}\n\nCHINESE:\n${editedPrompt.chinesePrompt}`;
    navigator.clipboard.writeText(text);
    setCopied('all');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả nội dung prompt này?')) {
      setEditedPrompt({
        prompt: '',
        translation: '',
        chinesePrompt: ''
      });
    }
  };

  const handleSync = async () => {
    if (!editedPrompt.translation.trim()) return;
    
    setIsSyncing(true);
    try {
      const result = await syncTranslation(editedPrompt.translation);
      const newPrompt = {
        ...editedPrompt,
        prompt: result.english,
        chinesePrompt: result.chinese
      };
      setEditedPrompt(newPrompt);
      // Don't auto-save to parent yet, let user review and click Save
    } catch (error) {
      console.error('Failed to sync translation:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = () => {
    onUpdate(editedPrompt);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPrompt(prompt);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4 animate-fadeIn max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-600 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-orange-100 transition-all border border-orange-200 active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              Chỉnh sửa Prompt
            </button>
          ) : (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button 
                onClick={handleSave}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-green-700 transition-all shadow-sm shadow-green-600/20 active:scale-95"
              >
                <Save className="w-4 h-4" />
                Lưu
              </button>
              <button 
                onClick={handleCancel}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all border border-slate-200 active:scale-95"
              >
                <X className="w-4 h-4" />
                Hủy
              </button>
              <button 
                onClick={handleClearAll}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all border border-red-200 active:scale-95"
              >
                Xóa
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {isEditing && (
            <button 
              onClick={handleSync}
              disabled={isSyncing || !editedPrompt.translation.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-orange-600 transition-all disabled:opacity-50 shadow-sm shadow-orange-500/20 active:scale-95"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Dịch (EN/ZH)
            </button>
          )}
          
          <button 
            onClick={handleCopyAll}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-900 transition-all shadow-sm active:scale-95"
          >
            {copied === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* VIETNAMESE PROMPT */}
        <div className="bg-orange-50/50 border border-orange-200 p-5 rounded-2xl relative group transition-all hover:border-orange-300">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] block">Bản dịch Tiếng Việt</span>
            <button 
              onClick={() => handleCopy(editedPrompt.translation, 'vi')}
              className="p-2 hover:bg-orange-100 rounded-xl transition-colors text-orange-400 hover:text-orange-600"
              title="Copy Tiếng Việt"
            >
              {copied === 'vi' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {isEditing ? (
            <textarea
              value={editedPrompt.translation}
              onChange={(e) => setEditedPrompt({ ...editedPrompt, translation: e.target.value })}
              className="w-full bg-white border border-orange-200 rounded-xl p-4 text-sm text-orange-900 font-medium leading-relaxed focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none min-h-[100px] transition-all"
              placeholder="Nhập bản dịch Tiếng Việt..."
            />
          ) : (
            <p className="text-sm text-orange-900 leading-relaxed font-medium italic px-1">
              {editedPrompt.translation || <span className="text-orange-300 font-normal">Chưa có bản dịch...</span>}
            </p>
          )}
        </div>

        {/* ENGLISH PROMPT */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl relative group transition-all hover:border-slate-300">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Jimeng Prompt (English)</span>
            <button 
              onClick={() => handleCopy(editedPrompt.prompt, 'en')}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              title="Copy English"
            >
              {copied === 'en' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {isEditing ? (
            <textarea
              value={editedPrompt.prompt}
              onChange={(e) => setEditedPrompt({ ...editedPrompt, prompt: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-900 font-mono leading-relaxed focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 outline-none min-h-[100px] transition-all"
              placeholder="AI Prompt (English)..."
            />
          ) : (
            <p className="text-sm text-slate-900 font-mono leading-relaxed px-1">
              {editedPrompt.prompt || <span className="text-slate-300 font-normal">Chưa có prompt tiếng Anh...</span>}
            </p>
          )}
        </div>

        {/* CHINESE PROMPT */}
        <div className="bg-orange-50/30 border border-orange-100 p-5 rounded-2xl relative group transition-all hover:border-orange-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] block">Bản dịch Tiếng Trung (Jimeng/Veo)</span>
            <button 
              onClick={() => handleCopy(editedPrompt.chinesePrompt, 'zh')}
              className="p-2 hover:bg-orange-100 rounded-xl transition-colors text-orange-300 hover:text-orange-500"
              title="Copy Tiếng Trung"
            >
              {copied === 'zh' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {isEditing ? (
            <textarea
              value={editedPrompt.chinesePrompt}
              onChange={(e) => setEditedPrompt({ ...editedPrompt, chinesePrompt: e.target.value })}
              className="w-full bg-white border border-orange-200 rounded-xl p-4 text-sm text-orange-900 leading-relaxed focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none min-h-[100px] transition-all"
              placeholder="Bản dịch Tiếng Trung..."
            />
          ) : (
            <p className="text-sm text-orange-800 leading-relaxed font-medium px-1">
              {editedPrompt.chinesePrompt || <span className="text-orange-200 font-normal">Chưa có bản dịch tiếng Trung...</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
