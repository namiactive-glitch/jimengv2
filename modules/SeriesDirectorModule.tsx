
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  Loader2, 
  Clock, 
  History, 
  Send, 
  ArrowLeft, 
  Zap, 
  Copy, 
  Check,
  RotateCcw,
  Plus,
  Minus,
  Film,
  Scissors,
  Edit3,
  Image,
  Type
} from 'lucide-react';
import { generateContinuityEpisode, generateFinalPrompt } from '../services/promptService';
import { Scene, Character, ContinuityResult, CinematicPrompt } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { loadState, saveState } from '../services/persistenceService';
import PromptEditor from '../components/PromptEditor';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CHARACTER_COLORS = [
  'bg-orange-500', 
  'bg-blue-500', 
  'bg-purple-500', 
  'bg-orange-500', 
  'bg-rose-500', 
  'bg-amber-500', 
  'bg-indigo-500', 
  'bg-cyan-500'
];

const MAIN_CHARACTER_NAMES = [
  'lê tuấn', 'đình thược', 'ngân thơm', 'hà út', 'tuyết mai', 'sato', 'tuấn', 'thược', 'thơm', 'út', 'mai'
];

const detectCharacters = (text: string, existingCharacters: Character[] = []): Character[] => {
  const characters: Character[] = [...existingCharacters];
  const lowerText = text.toLowerCase();
  
  const regex = /(?:@(\d+)\s*\(([^)]+)\)|\[([^\]]+)\])/g;
  let match;
  let idCounter = characters.length + 1;
  
  while ((match = regex.exec(text)) !== null) {
    const id = match[1] || String(idCounter++);
    const name = (match[2] || match[3]).trim();
    
    const remainingText = text.substring(regex.lastIndex);
    const descMatch = remainingText.match(/^\s*-\s*([^.\n,\[]+)/);
    const description = descMatch ? descMatch[1].trim() : undefined;
    
    const existing = characters.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!existing) {
      addCharacter(name, id, characters, description);
    } else if (description && !existing.description) {
      existing.description = description;
    }
  }

  MAIN_CHARACTER_NAMES.forEach(mainName => {
    if (lowerText.includes(mainName)) {
      if (!characters.find(c => c.name.toLowerCase().includes(mainName))) {
        const startIdx = lowerText.indexOf(mainName);
        const rawName = text.substring(startIdx, startIdx + 20).split(/[.,!?;:\n]/)[0].trim();
        addCharacter(rawName || mainName, String(idCounter++), characters);
      }
    }
  });
  
  return characters;
};

const addCharacter = (name: string, id: string, characters: Character[], description?: string) => {
  const lowerName = name.toLowerCase();
  let gender: 'male' | 'female' = 'male';
  const femaleMarkers = ['thị', 'mai', 'lan', 'hồng', 'tuyết', 'ngọc', 'linh', 'trang', 'thảo', 'phương', 'hạnh', 'hiền', 'anh', 'nhi', 'vy', 'quỳnh', 'ngân', 'thom'];
  const maleMarkers = ['văn', 'tuấn', 'hùng', 'dũng', 'cường', 'minh', 'nam', 'sơn', 'hải', 'long', 'thành', 'trung', 'kiên', 'hoàng', 'huy', 'đức', 'việt', 'thược'];

  const isFemale = femaleMarkers.some(m => lowerName.includes(m));
  const isMale = maleMarkers.some(m => lowerName.includes(m));

  if (isFemale && !isMale) gender = 'female';
  else if (isMale) gender = 'male';
  
  const isMain = MAIN_CHARACTER_NAMES.some(mainName => lowerName.includes(mainName));
  
  characters.push({
    id,
    name,
    gender,
    isMain,
    useCameoOutfit: isMain,
    color: CHARACTER_COLORS[characters.length % CHARACTER_COLORS.length],
    description
  });
};

const SeriesDirectorModule: React.FC = () => {
  const [step, setStep] = useState(() => loadState('series_step', 1));
  const [loading, setLoading] = useState(false);
  
  // Inputs
  const [previousScript, setPreviousScript] = useState(() => loadState('series_previousScript', ''));
  const [nextEpisodeIdea, setNextEpisodeIdea] = useState(() => loadState('series_nextEpisodeIdea', ''));
  const [episodeNumber, setEpisodeNumber] = useState(() => loadState('series_episodeNumber', 10));
  const [duration, setDuration] = useState(() => loadState('series_duration', 3));
  const [intensityLevel, setIntensityLevel] = useState<'storytelling' | 'action-drama' | 'hardcore'>(() => loadState('series_intensityLevel', 'action-drama' as const));
  
  // Results
  const [result, setResult] = useState<ContinuityResult | null>(() => loadState('series_result', null));
  const [editingOutfit, setEditingOutfit] = useState<{sceneId: string, characterId: string} | null>(null);
  const resultRef = useRef<ContinuityResult | null>(null);
  
  useEffect(() => {
    resultRef.current = result;
    saveState('series_result', result);
  }, [result]);

  useEffect(() => {
    saveState('series_step', step);
  }, [step]);

  useEffect(() => {
    saveState('series_previousScript', previousScript);
  }, [previousScript]);

  useEffect(() => {
    saveState('series_nextEpisodeIdea', nextEpisodeIdea);
  }, [nextEpisodeIdea]);

  useEffect(() => {
    saveState('series_episodeNumber', episodeNumber);
  }, [episodeNumber]);

  useEffect(() => {
    saveState('series_duration', duration);
  }, [duration]);

  useEffect(() => {
    saveState('series_intensityLevel', intensityLevel);
  }, [intensityLevel]);

  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerateContinuity = async () => {
    if (!previousScript) return;
    setLoading(true);
    try {
      const res = await generateContinuityEpisode(
        previousScript, 
        episodeNumber, 
        duration,
        intensityLevel,
        nextEpisodeIdea || undefined
      );
      
      // Auto detect characters for scenes
      const scenesWithChars = res.scenes.map(s => ({
        ...s,
        characters: detectCharacters(s.description)
      }));
      
      setResult({ ...res, scenes: scenesWithChars });
      setStep(2);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrompt = async (sceneId: string) => {
    const currentResult = resultRef.current;
    if (!currentResult) return;
    const scene = currentResult.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const updateSceneLoading = (isLoading: boolean) => {
      setResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, loading: isLoading, progress: isLoading ? 0 : 100 } : s)
        };
      });
    };

    updateSceneLoading(true);

    const progressInterval = setInterval(() => {
      setResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          scenes: prev.scenes.map(s => {
            if (s.id === sceneId && s.loading) {
              const currentProgress = s.progress || 0;
              const increment = currentProgress < 30 ? 5 : currentProgress < 70 ? 2 : currentProgress < 95 ? 1 : 0.2;
              const nextProgress = Math.min(99, currentProgress + increment);
              return { ...s, progress: nextProgress };
            }
            return s;
          })
        };
      });
    }, 200);

    try {
      const latestResult = resultRef.current;
      if (!latestResult) return;
      
      const sceneIndex = latestResult.scenes.findIndex(s => s.id === sceneId);
      let previousSceneDesc = undefined;
      let previousTechnicalPrompt = undefined;
      
      if (sceneIndex > 0) {
        const prevScene = latestResult.scenes[sceneIndex - 1];
        previousSceneDesc = prevScene.description;
        previousTechnicalPrompt = prevScene.finalPrompt?.prompt;
      }

      const context = `TẬP ${episodeNumber}: ${latestResult.title}\n${latestResult.summary}\n\nBỐI CẢNH TRƯỚC ĐÓ:\n${previousScript.slice(-1000)}`;

      const res = await generateFinalPrompt(
        scene.description, 
        context, 
        scene.characters || [], 
        intensityLevel,
        previousSceneDesc,
        previousTechnicalPrompt
      );
      
      clearInterval(progressInterval);

      setResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, finalPrompt: res, loading: false, progress: 100 } : s)
        };
      });
    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      updateSceneLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!result) return;
    setLoading(true);
    try {
      for (const scene of result.scenes) {
        if (scene.finalPrompt) continue;
        await handleGeneratePrompt(scene.id);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const updateScenePrompt = (sceneId: string, updatedPrompt: CinematicPrompt) => {
    if (!result) return;
    setResult({
      ...result,
      scenes: result.scenes.map(s => s.id === sceneId ? { ...s, finalPrompt: updatedPrompt } : s)
    });
  };

  const toggleCharacterCameoOutfit = (sceneId: string, characterId: string) => {
    if (!result) return;
    setResult({
      ...result,
      scenes: result.scenes.map(s => s.id === sceneId ? { 
        ...s, 
        characters: s.characters?.map(c => c.id === characterId ? { ...c, useCameoOutfit: !c.useCameoOutfit } : c)
      } : s)
    });
  };

  const updateCharacterOutfit = (sceneId: string, characterId: string, outfit: string) => {
    if (!result) return;
    setResult({
      ...result,
      scenes: result.scenes.map(s => s.id === sceneId ? { 
        ...s, 
        characters: s.characters?.map(c => c.id === characterId ? { ...c, customOutfit: outfit } : c)
      } : s)
    });
  };

  const updateCharacterRefImage = (sceneId: string, characterId: string, imageUrl: string) => {
    if (!result) return;
    setResult({
      ...result,
      scenes: result.scenes.map(s => s.id === sceneId ? { 
        ...s, 
        characters: s.characters?.map(c => c.id === characterId ? { ...c, outfitRefImage: imageUrl } : c)
      } : s)
    });
  };

  const toggleCharacterGender = (sceneId: string, characterId: string) => {
    if (!result) return;
    setResult({
      ...result,
      scenes: result.scenes.map(s => s.id === sceneId ? { 
        ...s, 
        characters: s.characters?.map(c => c.id === characterId ? { ...c, gender: c.gender === 'male' ? 'female' : 'male' } : c)
      } : s)
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-6 md:py-12">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="luxury-card relative overflow-hidden p-4 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-10 gap-4">
                <div className="flex items-center gap-4">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="p-3 bg-orange-50 rounded-xl border border-orange-100 shadow-sm flex-shrink-0"
                  >
                    <BookOpen className="w-6 h-6 text-[#F97316]" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#1F2937] tracking-tight">Đạo Diễn Phim Bộ</h2>
                    <p className="text-[#9CA3AF] text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Script Continuity & Scene Breakdown</p>
                  </div>
                </div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-default self-start sm:self-auto"
                >
                  <motion.span 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"
                  >
                    BY NAM LÊ
                  </motion.span>
                </motion.div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="luxury-label">Dán kịch bản các tập trước</label>
                  <textarea 
                    value={previousScript}
                    onChange={(e) => setPreviousScript(e.target.value)}
                    placeholder="Dán nội dung từ tập 1 đến tập hiện tại vào đây để AI hiểu bối cảnh..."
                    rows={8}
                    className="input-field resize-none custom-scrollbar"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="luxury-label">Tập tiếp theo (Số)</label>
                    <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all h-[48px] md:h-[52px] px-4">
                      <input 
                        type="number"
                        value={episodeNumber}
                        onChange={(e) => setEpisodeNumber(parseInt(e.target.value) || 0)}
                        className="flex-1 bg-transparent border-none text-left focus:ring-0 p-0 text-[#1F2937] font-semibold text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="luxury-label">Thời lượng (Phút)</label>
                    <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all h-[48px] md:h-[52px] px-4">
                      <input 
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                        className="flex-1 bg-transparent border-none text-left focus:ring-0 p-0 text-[#1F2937] font-semibold text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="luxury-label">Ý tưởng tập mới (Không bắt buộc)</label>
                  <textarea 
                    value={nextEpisodeIdea}
                    onChange={(e) => setNextEpisodeIdea(e.target.value)}
                    placeholder="Nếu để trống, AI sẽ tự động viết tiếp diễn biến kịch tính nhất..."
                    rows={3}
                    className="input-field resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                  {(['storytelling', 'action-drama', 'hardcore'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setIntensityLevel(level)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden",
                        intensityLevel === level 
                          ? "bg-orange-50 border-[#F97316] shadow-md shadow-orange-500/10" 
                          : "bg-white border-slate-100 hover:border-orange-200"
                      )}
                    >
                      {intensityLevel === level && (
                        <div className="absolute top-0 right-0 w-8 h-8 bg-[#F97316] -rotate-45 translate-x-4 -translate-y-4 flex items-end justify-center pb-0.5">
                          <Zap className="w-2 h-2 text-white rotate-45" />
                        </div>
                      )}
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        intensityLevel === level ? "text-[#F97316]" : "text-slate-400"
                      )}>
                        {level === 'storytelling' ? 'Bình thường' : level === 'action-drama' ? 'Kịch tính' : 'Hardcore'}
                      </p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateContinuity}
                  disabled={loading || !previousScript}
                  className="btn-primary w-full py-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {nextEpisodeIdea ? 'TRIỂN KHAI Ý TƯỞNG & CHIA CẢNH' : 'AI TỰ VIẾT TIẾP & CHIA CẢNH'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && result && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="luxury-card">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 md:mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 md:p-4 bg-orange-100 rounded-2xl border border-orange-200">
                    <Film className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-serif text-orange-600 font-medium tracking-tight">Tập {episodeNumber}: {result.title}</h2>
                    <p className="text-orange-300 text-[10px] font-medium uppercase tracking-[0.3em]">Kịch bản đã được triển khai</p>
                  </div>
                </div>
                <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                  <button onClick={() => setStep(1)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors border border-orange-100">
                    <ArrowLeft className="w-5 h-5 text-orange-500" />
                  </button>
                  <button onClick={handleGenerateAll} disabled={loading} className="btn-secondary flex-1 sm:flex-none px-6">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    TẠO TẤT CẢ PROMPT
                  </button>
                </div>
              </div>

              <div className="p-6 bg-orange-50/50 rounded-2xl border border-white/5 mb-10">
                <p className="text-sm text-orange-800 leading-relaxed font-medium italic">"{result.summary}"</p>
              </div>

              <div className="space-y-8">
                {result.scenes.map((scene, idx) => (
                  <div key={scene.id} className="bg-orange-50-light/20 border border-orange-100 rounded-3xl p-4 md:p-8 hover:border-luxury-gold/40 transition-all">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-medium">
                          {idx + 1}
                        </span>
                        <h3 className="text-lg font-serif font-medium text-orange-600">Cảnh {idx + 1}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {scene.characters?.map(char => (
                          <div key={char.id} className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleCharacterCameoOutfit(scene.id, char.id)}
                                className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-medium uppercase tracking-wider transition-all border",
                                  char.useCameoOutfit 
                                    ? "bg-orange-500 text-white border-luxury-gold" 
                                    : "bg-white/5 text-orange-400 border-orange-100"
                                )}
                              >
                                {char.name} {char.useCameoOutfit ? '• CAMEO' : ''}
                              </button>
                              <button 
                                onClick={() => {
                                  if (editingOutfit?.characterId === char.id && editingOutfit?.sceneId === scene.id) {
                                    setEditingOutfit(null);
                                  } else {
                                    setEditingOutfit({ sceneId: scene.id, characterId: char.id });
                                  }
                                }}
                                className={cn(
                                  "p-1.5 rounded-full transition-all border",
                                  (char.customOutfit || char.outfitRefImage) 
                                    ? "bg-orange-100 border-orange-200 text-orange-600" 
                                    : "bg-white/10 border-orange-100 text-orange-400 hover:text-orange-500"
                                )}
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                            <AnimatePresence>
                              {editingOutfit?.characterId === char.id && editingOutfit?.sceneId === scene.id && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden bg-white/5 rounded-xl border border-orange-100/30"
                                >
                                  <div className="p-3 space-y-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-[8px] font-bold text-orange-400 uppercase tracking-widest">
                                        <Type className="w-2.5 h-2.5" />
                                        Mô tả trang phục
                                      </div>
                                      <input 
                                        type="text"
                                        value={char.customOutfit || ''}
                                        onChange={(e) => updateCharacterOutfit(scene.id, char.id, e.target.value)}
                                        placeholder="Ví dụ: Áo sơ mi trắng..."
                                        className="w-full bg-white/10 border border-orange-100/20 rounded-lg px-3 py-1.5 text-[10px] text-orange-600 focus:ring-1 focus:ring-orange-500 outline-none"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-[8px] font-bold text-orange-400 uppercase tracking-widest">
                                        <Image className="w-2.5 h-2.5" />
                                        Ảnh tham chiếu (URL)
                                      </div>
                                      <input 
                                        type="text"
                                        value={char.outfitRefImage || ''}
                                        onChange={(e) => updateCharacterRefImage(scene.id, char.id, e.target.value)}
                                        placeholder="Link ảnh..."
                                        className="w-full bg-white/10 border border-orange-100/20 rounded-lg px-3 py-1.5 text-[10px] text-orange-600 focus:ring-1 focus:ring-orange-500 outline-none"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-orange-600/70 mb-8 leading-relaxed">{scene.description}</p>

                    {scene.finalPrompt ? (
                      <div className="space-y-4">
                        <div className="flex justify-end items-center gap-4">
                          <button 
                            onClick={() => handleGeneratePrompt(scene.id)}
                            disabled={scene.loading}
                            className="flex items-center gap-2 text-[10px] font-medium text-orange-500 uppercase tracking-widest hover:text-orange-600 transition-colors"
                          >
                            <RotateCcw className={cn("w-3.5 h-3.5", scene.loading && "animate-spin")} />
                            {scene.loading ? 'ĐANG TẠO...' : 'TẠO LẠI'}
                          </button>
                          <button 
                            onClick={() => copyToClipboard(scene.finalPrompt!.chinesePrompt, scene.id)}
                            className="flex items-center gap-2 text-[10px] font-medium text-orange-500 uppercase tracking-widest hover:text-orange-600 transition-colors"
                          >
                            {copied === scene.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied === scene.id ? 'ĐÃ COPY' : 'COPY PROMPT'}
                          </button>
                        </div>
                        <PromptEditor 
                          prompt={scene.finalPrompt} 
                          sceneId={scene.id} 
                          onUpdate={(updated) => updateScenePrompt(scene.id, updated)} 
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGeneratePrompt(scene.id)}
                        disabled={scene.loading}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-orange-100 rounded-2xl flex items-center justify-center gap-3 transition-all group"
                      >
                        {scene.loading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                            <span className="text-[10px] font-medium text-orange-500 uppercase tracking-widest">{Math.round(scene.progress || 0)}%</span>
                          </div>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-orange-600 group-hover:text-orange-500 uppercase tracking-widest">Tạo Prompt Phân Cảnh</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeriesDirectorModule;
