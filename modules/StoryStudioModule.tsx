
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
  Save,
  Trash2,
  Image,
  Type
} from 'lucide-react';
import { suggestStoryIdea, developStoryScript, generateStoryPrompt } from '../services/promptService';
import { Scene, Character, StoryTheme, StoryScript, CinematicPrompt } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { loadState, saveState } from '../services/persistenceService';
import PromptEditor from '../components/PromptEditor';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const THEMES: { id: StoryTheme; label: string; icon: string }[] = [
  { id: 'ceo-reveal', label: 'Chủ tịch giả nghèo', icon: '👔' },
  { id: 'inspirational', label: 'Truyền cảm hứng', icon: '✨' },
  { id: 'emotional-family', label: 'Tình cảm gia đình', icon: '❤️' },
  { id: 'comedy', label: 'Hài hước/Troll', icon: '😂' },
  { id: 'culinary', label: 'Nấu ăn/ASMR', icon: '🍳' },
  { id: 'horror', label: 'Kinh dị/Bí ẩn', icon: '👻' },
  { id: 'historical', label: 'Xuyên không/Cổ trang', icon: '🎎' },
  { id: 'action', label: 'Hành động', icon: '💥' },
];

const CHARACTER_COLORS = [
  'bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-cyan-500'
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
    
    const existing = characters.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!existing) {
      addCharacter(name, id, characters);
    }
  }

  MAIN_CHARACTER_NAMES.forEach(mainName => {
    if (lowerText.includes(mainName)) {
      if (!characters.find(c => c.name.toLowerCase().includes(mainName))) {
        addCharacter(mainName, String(idCounter++), characters);
      }
    }
  });
  
  return characters;
};

const addCharacter = (name: string, id: string, characters: Character[]) => {
  const lowerName = name.toLowerCase();
  let gender: 'male' | 'female' = 'male';
  const femaleMarkers = ['thị', 'mai', 'lan', 'hồng', 'tuyết', 'ngọc', 'linh', 'trang', 'thảo', 'phương', 'hạnh', 'hiền', 'anh', 'nhi', 'vy', 'quỳnh', 'ngân', 'thom'];
  const maleMarkers = ['văn', 'tuấn', 'hùng', 'dũng', 'cường', 'minh', 'nam', 'sơn', 'hải', 'long', 'thành', 'trung', 'kiên', 'hoàng', 'huy', 'đức', 'việt', 'thược'];

  if (femaleMarkers.some(m => lowerName.includes(m)) && !maleMarkers.some(m => lowerName.includes(m))) gender = 'female';
  
  const isMain = MAIN_CHARACTER_NAMES.some(mainName => lowerName.includes(mainName));
  
  characters.push({
    id,
    name,
    gender,
    isMain,
    useCameoOutfit: true,
    color: CHARACTER_COLORS[characters.length % CHARACTER_COLORS.length]
  });
};

const StoryStudioModule: React.FC = () => {
  const [step, setStep] = useState(() => loadState('story_step', 1));
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<StoryTheme>(() => loadState('story_selectedTheme', 'ceo-reveal' as const));
  const [storyIdea, setStoryIdea] = useState(() => loadState('story_storyIdea', ''));
  const [numEpisodes, setNumEpisodes] = useState(() => loadState('story_numEpisodes', 1));
  const [durationPerEpisode, setDurationPerEpisode] = useState(() => loadState('story_durationPerEpisode', 1));
  const [script, setScript] = useState<StoryScript | null>(() => loadState('story_script', null));
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [editingOutfit, setEditingOutfit] = useState<{sceneId: string, characterId: string} | null>(null);

  useEffect(() => {
    saveState('story_step', step);
  }, [step]);

  useEffect(() => {
    saveState('story_selectedTheme', selectedTheme);
  }, [selectedTheme]);

  useEffect(() => {
    saveState('story_storyIdea', storyIdea);
  }, [storyIdea]);

  useEffect(() => {
    saveState('story_numEpisodes', numEpisodes);
  }, [numEpisodes]);

  useEffect(() => {
    saveState('story_durationPerEpisode', durationPerEpisode);
  }, [durationPerEpisode]);

  useEffect(() => {
    saveState('story_script', script);
  }, [script]);

  const handleSuggestIdea = async () => {
    setLoading(true);
    try {
      const idea = await suggestStoryIdea(selectedTheme);
      setStoryIdea(idea);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDevelopScript = async () => {
    if (!storyIdea) return;
    setLoading(true);
    try {
      const res = await developStoryScript(selectedTheme, storyIdea, numEpisodes, durationPerEpisode);
      
      // Auto detect characters for all scenes
      const episodesWithChars = res.episodes.map(ep => ({
        ...ep,
        scenes: ep.scenes.map((s, idx) => ({
          ...s,
          id: `story-scene-${Date.now()}-${ep.id}-${idx}`,
          characters: detectCharacters(s.description),
          loading: false,
          progress: 0
        }))
      }));

      setScript({ ...res, episodes: episodesWithChars });
      setStep(2);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrompt = async (episodeId: number, sceneId: string) => {
    if (!script) return;
    const episode = script.episodes.find(e => e.id === episodeId);
    if (!episode) return;
    const scene = episode.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const updateScene = (updates: Partial<Scene>) => {
      setScript(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          episodes: prev.episodes.map(e => e.id === episodeId ? {
            ...e,
            scenes: e.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s)
          } : e)
        };
      });
    };

    updateScene({ loading: true, progress: 0 });

    try {
      const sceneIndex = episode.scenes.findIndex(s => s.id === sceneId);
      const isLastScene = episodeId === script.episodes.length && sceneIndex === episode.scenes.length - 1;
      
      let previousSceneDesc = undefined;
      let previousTechnicalPrompt = undefined;
      
      if (sceneIndex > 0) {
        const prevScene = episode.scenes[sceneIndex - 1];
        previousSceneDesc = prevScene.description;
        previousTechnicalPrompt = prevScene.finalPrompt?.prompt;
      }

      const context = `${script.title}\n${script.summary}\n\nTẬP ${episodeId}: ${episode.title}\n${episode.summary}`;

      const res = await generateStoryPrompt(
        scene.description,
        context,
        scene.characters || [],
        selectedTheme,
        previousSceneDesc,
        previousTechnicalPrompt,
        isLastScene
      );

      updateScene({ finalPrompt: res, loading: false, progress: 100 });
    } catch (error) {
      console.error(error);
      updateScene({ loading: false });
    }
  };

  const handleGenerateAll = async () => {
    if (!script) return;
    setLoading(true);
    try {
      for (const episode of script.episodes) {
        for (const scene of episode.scenes) {
          if (scene.finalPrompt) continue;
          await handleGeneratePrompt(episode.id, scene.id);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
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

  const toggleCharacterCameo = (episodeId: number, sceneId: string, charId: string) => {
    setScript(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        episodes: prev.episodes.map(e => e.id === episodeId ? {
          ...e,
          scenes: e.scenes.map(s => s.id === sceneId ? {
            ...s,
            characters: s.characters?.map(c => c.id === charId ? { ...c, useCameoOutfit: !c.useCameoOutfit } : c)
          } : s)
        } : e)
      };
    });
  };

  const updateCharacterOutfit = (episodeId: number, sceneId: string, characterId: string, outfit: string) => {
    setScript(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        episodes: prev.episodes.map(e => e.id === episodeId ? {
          ...e,
          scenes: e.scenes.map(s => s.id === sceneId ? {
            ...s,
            characters: s.characters?.map(c => c.id === characterId ? { ...c, customOutfit: outfit } : c)
          } : s)
        } : e)
      };
    });
  };

  const updateCharacterRefImage = (episodeId: number, sceneId: string, characterId: string, imageUrl: string) => {
    setScript(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        episodes: prev.episodes.map(e => e.id === episodeId ? {
          ...e,
          scenes: e.scenes.map(s => s.id === sceneId ? {
            ...s,
            characters: s.characters?.map(c => c.id === characterId ? { ...c, outfitRefImage: imageUrl } : c)
          } : s)
        } : e)
      };
    });
  };

  const updateSceneDescription = (episodeId: number, sceneId: string, newDesc: string) => {
    setScript(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        episodes: prev.episodes.map(e => e.id === episodeId ? {
          ...e,
          scenes: e.scenes.map(s => s.id === sceneId ? { ...s, description: newDesc } : s)
        } : e)
      };
    });
  };

  const updateFinalPrompt = (episodeId: number, sceneId: string, field: keyof CinematicPrompt, value: string) => {
    setScript(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        episodes: prev.episodes.map(e => e.id === episodeId ? {
          ...e,
          scenes: e.scenes.map(s => s.id === sceneId && s.finalPrompt ? {
            ...s,
            finalPrompt: { ...s.finalPrompt, [field]: value }
          } : s)
        } : e)
      };
    });
  };

  const addSceneBetween = (episodeId: number, index: number) => {
    setScript(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        episodes: prev.episodes.map(e => {
          if (e.id !== episodeId) return e;
          const newScenes = [...e.scenes];
          const newScene: Scene = {
            id: `story-scene-${Date.now()}-added-${index}`,
            description: 'Mô tả cảnh mới tại đây...',
            characters: [],
            loading: false,
            progress: 0
          };
          newScenes.splice(index + 1, 0, newScene);
          return { ...e, scenes: newScenes };
        })
      };
    });
  };

  const deleteScene = (episodeId: number, sceneId: string) => {
    setScript(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        episodes: prev.episodes.map(e => {
          if (e.id !== episodeId) return e;
          return {
            ...e,
            scenes: e.scenes.filter(s => s.id !== sceneId)
          };
        })
      };
    });
  };

  const updateScenePrompt = (episodeId: number, sceneId: string, updatedPrompt: CinematicPrompt) => {
    setScript(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        episodes: prev.episodes.map(e => {
          if (e.id !== episodeId) return e;
          return {
            ...e,
            scenes: e.scenes.map(s => s.id === sceneId ? { ...s, finalPrompt: updatedPrompt } : s)
          };
        })
      };
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
                    <Sparkles className="w-6 h-6 text-[#F97316]" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#1F2937] tracking-tight">Xưởng Truyện</h2>
                    <p className="text-[#9CA3AF] text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Multi-Theme Cinematic Storytelling</p>
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

              <div className="space-y-10">
                {/* Theme Selection */}
                <div>
                  <label className="luxury-label mb-4 block">Chọn chủ đề phim</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={cn(
                          "p-3 md:p-4 rounded-xl border transition-all flex flex-col items-center gap-1 md:gap-2 text-center group",
                          selectedTheme === theme.id 
                            ? "bg-orange-50 border-[#F97316] shadow-sm" 
                            : "bg-[#F9FAFB] border-[#E5E7EB] hover:bg-slate-100"
                        )}
                      >
                        <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform">{theme.icon}</span>
                        <span className={cn(
                          "text-[8px] md:text-[10px] font-bold uppercase tracking-wider",
                          selectedTheme === theme.id ? "text-[#F97316]" : "text-[#6B7280]"
                        )}>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Idea Input */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="luxury-label">Ý tưởng kịch bản</label>
                    <button 
                      onClick={handleSuggestIdea}
                      disabled={loading}
                      className="flex items-center gap-2 text-[10px] font-bold text-[#F97316] uppercase tracking-widest hover:text-orange-600 transition-colors mb-2"
                    >
                      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      AI Gợi ý ý tưởng
                    </button>
                  </div>
                  <div className="relative group">
                    <textarea 
                      value={storyIdea}
                      onChange={(e) => setStoryIdea(e.target.value)}
                      placeholder="Dán ý tưởng của bạn hoặc nhấn nút Gợi ý để AI viết giúp..."
                      rows={6}
                      className="input-field resize-none custom-scrollbar pr-12"
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit3 className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="luxury-label">Số tập</label>
                    <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden h-[52px] px-4 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
                      <input 
                        type="number"
                        value={numEpisodes}
                        onChange={(e) => setNumEpisodes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 bg-transparent border-none text-left focus:ring-0 p-0 text-[#1F2937] font-semibold text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="luxury-label">Số phút mỗi tập</label>
                    <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden h-[52px] px-4 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
                      <input 
                        type="number"
                        value={durationPerEpisode}
                        onChange={(e) => setDurationPerEpisode(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 bg-transparent border-none text-left focus:ring-0 p-0 text-[#1F2937] font-semibold text-sm"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDevelopScript}
                  disabled={loading || !storyIdea}
                  className="btn-primary w-full py-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  PHÁT TRIỂN KỊCH BẢN TRỌN GÓI
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && script && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="luxury-card">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <Film className="w-6 h-6 text-[#F97316]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#1F2937] tracking-tight">{script.title}</h2>
                    <p className="text-[#9CA3AF] text-[10px] font-bold uppercase tracking-widest">
                      {THEMES.find(t => t.id === selectedTheme)?.label} • {script.episodes.length} Tập
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="p-3 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                  </button>
                  <button onClick={handleGenerateAll} disabled={loading} className="btn-secondary px-6">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    TẠO TẤT CẢ PROMPT
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-10">
                <p className="text-sm text-[#4B5563] leading-relaxed font-medium italic">"{script.summary}"</p>
              </div>

              <div className="space-y-16">
                {script.episodes.map((episode) => (
                  <div key={episode.id} className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                      <span className="text-[#F97316] font-bold text-xl">Tập {episode.id}:</span>
                      <h3 className="text-xl text-[#1F2937] font-bold">{episode.title}</h3>
                    </div>
                    
                    <div className="grid gap-8">
                      {episode.scenes.map((scene, idx) => (
                        <React.Fragment key={scene.id}>
                          <div className="bg-[#FDFDFD] border border-slate-200 rounded-3xl p-4 md:p-8 hover:border-orange-300 transition-all group/scene relative shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-[#F97316] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                  {idx + 1}
                                </span>
                                <h4 className="text-lg font-bold text-[#1F2937]">Cảnh {idx + 1}</h4>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-wrap gap-2">
                                  {scene.characters?.map(char => (
                                    <div key={char.id} className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2">
                                        <button
                                          key={char.id}
                                          onClick={() => toggleCharacterCameo(episode.id, scene.id, char.id)}
                                          className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border",
                                            char.useCameoOutfit 
                                              ? "bg-[#F97316] text-white border-[#F97316]" 
                                              : "bg-slate-50 text-slate-400 border-slate-200"
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
                                              : "bg-white border-slate-200 text-slate-400 hover:text-orange-500"
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
                                            className="overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm"
                                          >
                                            <div className="p-3 space-y-3">
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                  <Type className="w-2.5 h-2.5" />
                                                  Mô tả trang phục
                                                </div>
                                                <input 
                                                  type="text"
                                                  value={char.customOutfit || ''}
                                                  onChange={(e) => updateCharacterOutfit(episode.id, scene.id, char.id, e.target.value)}
                                                  placeholder="Ví dụ: Áo sơ mi trắng..."
                                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] text-slate-600 focus:ring-1 focus:ring-orange-500 outline-none"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                  <Image className="w-2.5 h-2.5" />
                                                  Ảnh tham chiếu (URL)
                                                </div>
                                                <input 
                                                  type="text"
                                                  value={char.outfitRefImage || ''}
                                                  onChange={(e) => updateCharacterRefImage(episode.id, scene.id, char.id, e.target.value)}
                                                  placeholder="Link ảnh..."
                                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] text-slate-600 focus:ring-1 focus:ring-orange-500 outline-none"
                                                />
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  ))}
                                </div>
                                <button 
                                  onClick={() => deleteScene(episode.id, scene.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-colors group/del"
                                >
                                  <Trash2 className="w-4 h-4 text-slate-300 group-hover/del:text-red-500" />
                                </button>
                              </div>
                            </div>

                          {/* Scene Description - Editable */}
                          <div className="mb-8 relative">
                            {editingSceneId === scene.id ? (
                              <div className="space-y-2">
                                <textarea 
                                  value={scene.description}
                                  onChange={(e) => updateSceneDescription(episode.id, scene.id, e.target.value)}
                                  className="input-field min-h-[100px] text-sm"
                                  autoFocus
                                />
                                <button 
                                  onClick={() => setEditingSceneId(null)}
                                  className="flex items-center gap-2 text-[10px] font-bold text-[#F97316] uppercase tracking-widest"
                                >
                                  <Save className="w-3 h-3" /> Lưu thay đổi
                                </button>
                              </div>
                            ) : (
                              <div className="group/edit relative">
                                <p className="text-sm text-[#4B5563] leading-relaxed pr-8">{scene.description}</p>
                                <button 
                                  onClick={() => setEditingSceneId(scene.id)}
                                  className="absolute top-0 right-0 p-2 opacity-0 group-hover/edit:opacity-100 transition-opacity hover:bg-slate-50 rounded-lg"
                                >
                                  <Edit3 className="w-4 h-4 text-[#F97316]" />
                                </button>
                              </div>
                            )}
                          </div>

                          {scene.finalPrompt ? (
                            <div className="space-y-4 animate-fadeIn">
                              <div className="flex justify-end items-center gap-4">
                                <button 
                                  onClick={() => handleGeneratePrompt(episode.id, scene.id)}
                                  disabled={scene.loading}
                                  className="flex items-center gap-2 text-[10px] font-bold text-[#F97316] uppercase tracking-widest hover:text-orange-600 transition-colors"
                                >
                                  <RotateCcw className={cn("w-3.5 h-3.5", scene.loading && "animate-spin")} />
                                  {scene.loading ? 'ĐANG TẠO...' : 'TẠO LẠI'}
                                </button>
                                <button 
                                  onClick={() => copyToClipboard(scene.finalPrompt!.chinesePrompt, scene.id)}
                                  className="flex items-center gap-2 text-[10px] font-bold text-[#F97316] uppercase tracking-widest hover:text-orange-600 transition-colors"
                                >
                                  {copied === scene.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copied === scene.id ? 'ĐÃ COPY' : 'COPY PROMPT'}
                                </button>
                              </div>
                              <PromptEditor 
                                prompt={scene.finalPrompt} 
                                sceneId={scene.id} 
                                onUpdate={(updated) => updateScenePrompt(episode.id, scene.id, updated)} 
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGeneratePrompt(episode.id, scene.id)}
                              disabled={scene.loading}
                              className="w-full py-4 bg-[#F9FAFB] hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 transition-all group"
                            >
                              {scene.loading ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="w-5 h-5 animate-spin text-[#F97316]" />
                                  <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest">{Math.round(scene.progress || 0)}%</span>
                                </div>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4 text-[#F97316] group-hover:scale-110 transition-transform" />
                                  <span className="text-xs font-bold text-[#4B5563] group-hover:text-[#F97316] uppercase tracking-widest">Tạo Prompt Cảnh Quay</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        
                        {/* Add Scene Button Between */}
                        <div className="flex justify-center -my-4 relative z-10">
                          <button
                            onClick={() => addSceneBetween(episode.id, idx)}
                            className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:border-[#F97316] hover:scale-110 transition-all group shadow-sm"
                            title="Thêm cảnh mới vào đây"
                          >
                            <Plus className="w-4 h-4 text-slate-400 group-hover:text-[#F97316]" />
                          </button>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
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

export default StoryStudioModule;
