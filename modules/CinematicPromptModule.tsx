
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Film, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Zap,
  BookOpen,
  ChevronRight,
  Loader2,
  Lightbulb,
  Clapperboard,
  Scissors,
  Send,
  Plus,
  Minus,
  Trash2,
  Edit3,
  ArrowLeft,
  ArrowRight,
  Clock,
  Image,
  Type
} from 'lucide-react';
import { suggestIdeas, generateScreenplay, breakdownScenes, generateFinalPrompt } from '../services/promptService';
import { CinematicPrompt, Screenplay, IdeaSuggestion, Episode, Scene, Character } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Shield, Zap as ZapIcon, Shirt, Sparkle } from 'lucide-react';
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
  
  // 1. Tìm theo định dạng [Tên] hoặc @1 (Tên)
  const regex = /(?:@(\d+)\s*\(([^)]+)\)|\[([^\]]+)\])/g;
  let match;
  let idCounter = characters.length + 1;
  
  while ((match = regex.exec(text)) !== null) {
    const id = match[1] || String(idCounter++);
    const name = (match[2] || match[3]).trim();
    
    // Tìm mô tả ngay sau tên nhân vật (ví dụ: [Tên] - mô tả)
    // Chúng ta không dùng regex chính để bắt mô tả để tránh nuốt mất các tag nhân vật tiếp theo
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

  // 2. Tìm theo danh sách tên nhân vật chính (nếu chưa được tìm thấy)
  MAIN_CHARACTER_NAMES.forEach(mainName => {
    if (lowerText.includes(mainName)) {
      if (!characters.find(c => c.name.toLowerCase().includes(mainName))) {
        // Tìm tên đầy đủ trong text nếu có thể
        const startIdx = lowerText.indexOf(mainName);
        // Giả định tên dài khoảng 2-4 từ
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

const CinematicPromptModule: React.FC = () => {
  const [step, setStep] = useState(() => loadState('cinematic_step', 1));
  const [loading, setLoading] = useState(false);
  
  // Step 1: Idea
  const [idea, setIdea] = useState(() => loadState('cinematic_idea', ''));
  const [suggestions, setSuggestions] = useState<IdeaSuggestion[]>(() => loadState('cinematic_suggestions', []));
  
  // Step 2: Screenplay
  const [numEpisodes, setNumEpisodes] = useState(() => loadState('cinematic_numEpisodes', 6));
  const [durationPerEpisode, setDurationPerEpisode] = useState(() => loadState('cinematic_durationPerEpisode', 1));
  const [screenplay, setScreenplay] = useState<Screenplay | null>(() => loadState('cinematic_screenplay', null));
  const screenplayRef = React.useRef<Screenplay | null>(null);
  
  useEffect(() => {
    screenplayRef.current = screenplay;
    saveState('cinematic_screenplay', screenplay);
  }, [screenplay]);

  useEffect(() => {
    saveState('cinematic_step', step);
  }, [step]);

  useEffect(() => {
    saveState('cinematic_idea', idea);
  }, [idea]);

  useEffect(() => {
    saveState('cinematic_suggestions', suggestions);
  }, [suggestions]);

  useEffect(() => {
    saveState('cinematic_numEpisodes', numEpisodes);
  }, [numEpisodes]);

  useEffect(() => {
    saveState('cinematic_durationPerEpisode', durationPerEpisode);
  }, [durationPerEpisode]);
  
  // Step 3: Breakdown
  const [activeEpisodeId, setActiveEpisodeId] = useState<number | null>(() => loadState('cinematic_activeEpisodeId', null));

  useEffect(() => {
    saveState('cinematic_activeEpisodeId', activeEpisodeId);
  }, [activeEpisodeId]);
  
  // Step 4: Final Prompts
  const [copied, setCopied] = useState<string | null>(null);
  const [editingOutfit, setEditingOutfit] = useState<{sceneId: string, characterId: string} | null>(null);

  const handleSuggestIdeas = async () => {
    setLoading(true);
    try {
      const res = await suggestIdeas();
      setSuggestions(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScreenplay = async () => {
    if (!idea) return;
    setLoading(true);
    try {
      const res = await generateScreenplay(idea, numEpisodes, durationPerEpisode);
      setScreenplay({
        ...res,
        intensityLevel: 'action-drama' // Default
      });
      setStep(2);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBreakdown = async (episodeId: number) => {
    if (!screenplay) return;
    const ep = screenplay.episodes.find(e => e.id === episodeId);
    if (!ep) return;
    
    // Get context from previous episode
    const prevEp = screenplay.episodes.find(e => e.id === episodeId - 1);
    const previousContext = prevEp ? prevEp.summary : "Đây là tập đầu tiên.";

    setLoading(true);
    setActiveEpisodeId(episodeId);
    try {
      const numScenes = Math.ceil((ep.duration * 60) / 12);
      const scenes = await breakdownScenes(ep.summary, numScenes, previousContext, screenplay.intensityLevel);
      
      // Automatically detect characters for each scene
      const scenesWithCharacters = scenes.map(s => ({
        ...s,
        characters: detectCharacters(s.description)
      }));
      
      const updatedEpisodes = screenplay.episodes.map(e => 
        e.id === episodeId ? { ...e, scenes: scenesWithCharacters } : e
      );
      setScreenplay({ ...screenplay, episodes: updatedEpisodes });
      setStep(3);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    if (!screenplay || activeEpisodeId === null) return;
    const ep = screenplay.episodes.find(e => e.id === activeEpisodeId);
    if (!ep) return;

    // Generate prompts for all scenes that don't have one yet or just all of them
    const scenesToProcess = ep.scenes;
    
    setLoading(true);
    try {
      for (const scene of scenesToProcess) {
        // Skip if already generating
        if (scene.loading) continue;
        
        await handleGeneratePrompt(activeEpisodeId, scene.id);
        // Small delay to prevent API rate limiting and allow state to settle
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOverallPlot = (value: string) => {
    if (!screenplay) return;
    setScreenplay({ ...screenplay, overallPlot: value });
  };

  const updateIntensityLevel = (level: 'storytelling' | 'action-drama' | 'hardcore') => {
    if (!screenplay) return;
    setScreenplay({ ...screenplay, intensityLevel: level });
  };

  const updateEpisode = (id: number, field: 'title' | 'summary' | 'duration', value: any) => {
    if (!screenplay) return;
    const updatedEpisodes = screenplay.episodes.map(ep => 
      ep.id === id ? { ...ep, [field]: value } : ep
    );
    setScreenplay({ ...screenplay, episodes: updatedEpisodes });
  };

  const toggleCharacterCameoOutfit = (episodeId: number, sceneId: string, characterId: string) => {
    if (!screenplay) return;
    const updatedEpisodes = screenplay.episodes.map(e => 
      e.id === episodeId ? {
        ...e,
        scenes: e.scenes.map(s => s.id === sceneId ? { 
          ...s, 
          characters: s.characters?.map(c => c.id === characterId ? { ...c, useCameoOutfit: !c.useCameoOutfit } : c)
        } : s)
      } : e
    );
    setScreenplay({ ...screenplay, episodes: updatedEpisodes });
  };

  const toggleCharacterGender = (episodeId: number, sceneId: string, characterId: string) => {
    if (!screenplay) return;
    const updatedEpisodes = screenplay.episodes.map(e => 
      e.id === episodeId ? {
        ...e,
        scenes: e.scenes.map(s => s.id === sceneId ? { 
          ...s, 
          characters: s.characters?.map(c => c.id === characterId ? { ...c, gender: c.gender === 'male' ? 'female' : 'male' } : c)
        } : s)
      } : e
    );
    setScreenplay({ ...screenplay, episodes: updatedEpisodes });
  };

  const updateCharacterOutfit = (episodeId: number, sceneId: string, characterId: string, outfit: string) => {
    if (!screenplay) return;
    const updatedEpisodes = screenplay.episodes.map(e => 
      e.id === episodeId ? {
        ...e,
        scenes: e.scenes.map(s => s.id === sceneId ? { 
          ...s, 
          characters: s.characters?.map(c => c.id === characterId ? { ...c, customOutfit: outfit } : c)
        } : s)
      } : e
    );
    setScreenplay({ ...screenplay, episodes: updatedEpisodes });
  };

  const updateCharacterRefImage = (episodeId: number, sceneId: string, characterId: string, imageUrl: string) => {
    if (!screenplay) return;
    const updatedEpisodes = screenplay.episodes.map(e => 
      e.id === episodeId ? {
        ...e,
        scenes: e.scenes.map(s => s.id === sceneId ? { 
          ...s, 
          characters: s.characters?.map(c => c.id === characterId ? { ...c, outfitRefImage: imageUrl } : c)
        } : s)
      } : e
    );
    setScreenplay({ ...screenplay, episodes: updatedEpisodes });
  };

  const handleGeneratePrompt = async (episodeId: number, sceneId: string) => {
    const currentScreenplay = screenplayRef.current;
    if (!currentScreenplay) return;
    const ep = currentScreenplay.episodes.find(e => e.id === episodeId);
    if (!ep) return;
    const scene = ep.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    // Set loading state for specific scene
    const updateSceneLoading = (isLoading: boolean) => {
      setScreenplay(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          episodes: prev.episodes.map(e => 
            e.id === episodeId ? {
              ...e,
              scenes: e.scenes.map(s => s.id === sceneId ? { ...s, loading: isLoading, progress: isLoading ? 0 : 100 } : s)
            } : e
          )
        };
      });
    };

    updateSceneLoading(true);

    // Simulated progress timer
    const progressInterval = setInterval(() => {
      setScreenplay(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          episodes: prev.episodes.map(e => 
            e.id === episodeId ? {
              ...e,
              scenes: e.scenes.map(s => {
                if (s.id === sceneId && s.loading) {
                  // Increment progress slowly up to 99%
                  const currentProgress = s.progress || 0;
                  const increment = currentProgress < 30 ? 5 : currentProgress < 70 ? 2 : currentProgress < 95 ? 1 : 0.2;
                  const nextProgress = Math.min(99, currentProgress + increment);
                  return { ...s, progress: nextProgress };
                }
                return s;
              })
            } : e
          )
        };
      });
    }, 200);

    try {
      // Find previous scene for continuity
      const latestScreenplay = screenplayRef.current;
      if (!latestScreenplay) return;
      
      const currentEpisode = latestScreenplay.episodes.find(e => e.id === episodeId);
      let previousSceneDesc = undefined;
      let previousTechnicalPrompt = undefined;
      let isLateScene = false;
      
      if (currentEpisode) {
        const sceneIndex = currentEpisode.scenes.findIndex(s => s.id === sceneId);
        isLateScene = sceneIndex >= Math.floor(currentEpisode.scenes.length / 2);
        
        if (sceneIndex > 0) {
          const prevScene = currentEpisode.scenes[sceneIndex - 1];
          previousSceneDesc = prevScene.description;
          previousTechnicalPrompt = prevScene.finalPrompt?.prompt;
        } else {
          // If first scene of episode, check last scene of previous episode
          const prevEp = latestScreenplay.episodes.find(e => e.id === episodeId - 1);
          if (prevEp && prevEp.scenes.length > 0) {
            const lastScene = prevEp.scenes[prevEp.scenes.length - 1];
            previousSceneDesc = lastScene.description;
            previousTechnicalPrompt = lastScene.finalPrompt?.prompt;
          }
        }
      }

      // Layer 1: Global Story (Overall Plot + Summaries up to current episode)
      const episodeHistory = latestScreenplay.episodes
        .filter(e => e.id <= episodeId)
        .map(e => `Tập ${e.id}: ${e.summary}`)
        .join('\n');
      
      const globalStory = `KỊCH BẢN TỔNG THỂ: ${latestScreenplay.overallPlot}\n\nDIỄN BIẾN ĐẾN HIỆN TẠI:\n${episodeHistory}`;

      const res = await generateFinalPrompt(
        scene.description, 
        globalStory, 
        scene.characters || [], 
        latestScreenplay.intensityLevel,
        previousSceneDesc,
        previousTechnicalPrompt,
        isLateScene
      );
      
      clearInterval(progressInterval);

      setScreenplay(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          episodes: prev.episodes.map(e => 
            e.id === episodeId ? {
              ...e,
              scenes: e.scenes.map(s => s.id === sceneId ? { ...s, finalPrompt: res, loading: false, progress: 100 } : s)
            } : e
          )
        };
      });
    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      updateSceneLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const updateScenePrompt = (episodeId: number, sceneId: string, updatedPrompt: CinematicPrompt) => {
    setScreenplay(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        episodes: prev.episodes.map(e => 
          e.id === episodeId ? {
            ...e,
            scenes: e.scenes.map(s => s.id === sceneId ? { ...s, finalPrompt: updatedPrompt } : s)
          } : e
        )
      };
    });
  };

  const reset = () => {
    setStep(1);
    setIdea('');
    setSuggestions([]);
    setScreenplay(null);
    setActiveEpisodeId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-6 md:py-12">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-8 md:mb-16 max-w-4xl mx-auto px-1 md:px-4">
        {[
          { n: 1, label: 'Ý TƯỞNG', icon: Lightbulb },
          { n: 2, label: 'KỊCH BẢN', icon: Clapperboard },
          { n: 3, label: 'CHIA CẢNH', icon: Scissors },
          { n: 4, label: 'XUẤT PROMPT', icon: Send }
        ].map((s) => (
          <div key={s.n} className="flex flex-col items-center relative flex-1">
            <motion.div 
              initial={false}
              animate={{
                scale: step === s.n ? 1.05 : 1,
                backgroundColor: step >= s.n ? "#F97316" : "#FFFFFF",
                borderColor: step >= s.n ? "#F97316" : "#E2E8F0",
                color: step >= s.n ? "#FFFFFF" : "#94A3B8"
              }}
              className={cn(
                "w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[22px] flex items-center justify-center border transition-all duration-500 z-10",
                step === s.n ? "shadow-lg md:shadow-xl shadow-orange-500/40" : "shadow-sm"
              )}
            >
              <s.icon className="w-5 h-5 md:w-7 md:h-7" />
            </motion.div>
            <span className={cn(
              "text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] mt-3 md:mt-5 transition-colors duration-500 text-center",
              step >= s.n ? "text-[#F97316]" : "text-slate-400"
            )}>{s.label}</span>
            {s.n < 4 && (
              <div className="absolute top-5 md:top-8 left-[50%] w-full h-[1px] -z-0">
                <div className={cn(
                  "h-full transition-all duration-700",
                  step > s.n ? "bg-orange-200" : "bg-slate-100"
                )} />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: IDEA GENERATOR */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto space-y-12"
          >
            <div className="luxury-card relative overflow-hidden p-4 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-10 gap-4">
                <div className="flex items-center gap-4">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="p-3 bg-orange-50 rounded-xl border border-orange-100 shadow-sm flex-shrink-0"
                  >
                    <Lightbulb className="w-6 h-6 text-[#F97316]" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#1F2937] tracking-tight">Khởi tạo ý tưởng</h2>
                    <p className="text-[#9CA3AF] text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Bước 1: Tạo Ý Tưởng</p>
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
                  <label className="luxury-label">
                    Nhập ý tưởng sơ khai của bạn
                  </label>
                  <textarea 
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Ví dụ: Một sát thủ gác kiếm bị truy đuổi..."
                    rows={4}
                    className="input-field resize-none mb-8"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="luxury-label">Số tập phim</label>
                      <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all h-[48px] md:h-[52px] px-4">
                        <input 
                          type="number"
                          value={numEpisodes || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') setNumEpisodes(0);
                            else setNumEpisodes(parseInt(val) || 0);
                          }}
                          onBlur={() => {
                            if (!numEpisodes || numEpisodes < 1) setNumEpisodes(1);
                          }}
                          className="flex-1 bg-transparent border-none text-left focus:ring-0 p-0 text-[#1F2937] font-semibold text-sm min-w-0"
                        />
                        <div className="flex items-center gap-1 ml-2">
                          <button 
                            onClick={() => setNumEpisodes(Math.max(1, numEpisodes - 1))}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                            type="button"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => setNumEpisodes(numEpisodes + 1)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                            type="button"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="luxury-label">Phút mỗi tập</label>
                      <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all h-[48px] md:h-[52px] px-4">
                        <input 
                          type="number"
                          value={durationPerEpisode || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') setDurationPerEpisode(0);
                            else setDurationPerEpisode(parseInt(val) || 0);
                          }}
                          onBlur={() => {
                            if (!durationPerEpisode || durationPerEpisode < 1) setDurationPerEpisode(1);
                          }}
                          className="flex-1 bg-transparent border-none text-left focus:ring-0 p-0 text-[#1F2937] font-semibold text-sm min-w-0"
                        />
                        <div className="flex items-center gap-1 ml-2">
                          <button 
                            onClick={() => setDurationPerEpisode(Math.max(1, durationPerEpisode - 1))}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                            type="button"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => setDurationPerEpisode(durationPerEpisode + 1)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                            type="button"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSuggestIdeas}
                    disabled={loading}
                    className="btn-secondary flex-1"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    GỢI Ý Ý TƯỞNG
                  </button>
                  <button
                    onClick={handleGenerateScreenplay}
                    disabled={loading || !idea}
                    className="btn-primary flex-1"
                  >
                    TIẾP THEO
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-5 bg-[#F97316] rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                  <h3 className="text-xs font-black text-orange-600 uppercase tracking-[0.2em]">Xu hướng hành động hot</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestions.map((s, i) => (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      key={i}
                      onClick={() => setIdea(s.description)}
                      className="text-left p-5 bg-gradient-to-br from-white to-orange-50/30 border border-orange-100 rounded-2xl hover:border-[#F97316] hover:shadow-xl hover:shadow-orange-500/10 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#F97316] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-bold text-base text-[#1F2937] group-hover:text-[#F97316] transition-colors leading-tight">{s.title}</h4>
                        <div className="p-1.5 bg-orange-100 rounded-lg text-orange-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <Plus className="w-3 h-3" />
                        </div>
                      </div>
                      <p className="text-[#6B7280] text-[11px] leading-relaxed font-normal line-clamp-3">{s.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 2: SCREENPLAY */}
        {step === 2 && screenplay && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="luxury-card relative overflow-hidden">
              {/* Card Signature */}
              <div className="absolute top-4 right-6 opacity-20 pointer-events-none">
                <span className="text-[8px] font-medium text-orange-500 uppercase tracking-[0.4em]">BY NAM LÊ</span>
              </div>
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-100 rounded-2xl border border-orange-200">
                    <Clapperboard className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif text-orange-600 font-medium tracking-tight">Kịch bản phân tập</h2>
                    <p className="text-orange-300 text-[10px] font-medium uppercase tracking-[0.3em]">Bước 2: Screenplay Editor</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors border border-orange-100">
                    <ArrowLeft className="w-5 h-5 text-orange-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-10">
                <div>
                  <label className="luxury-label">Cốt truyện tổng thể</label>
                  <textarea 
                    value={screenplay.overallPlot}
                    onChange={(e) => updateOverallPlot(e.target.value)}
                    rows={4}
                    className="input-field resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['storytelling', 'action-drama', 'hardcore'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => updateIntensityLevel(level)}
                      className={cn(
                        "p-6 rounded-2xl border-2 transition-all text-left group relative overflow-hidden",
                        screenplay.intensityLevel === level 
                          ? "bg-orange-50 border-[#F97316] shadow-md shadow-orange-500/10" 
                          : "bg-white border-slate-100 hover:border-orange-200"
                      )}
                    >
                      {screenplay.intensityLevel === level && (
                        <div className="absolute top-0 right-0 w-12 h-12 bg-[#F97316] -rotate-45 translate-x-6 -translate-y-6 flex items-end justify-center pb-1">
                          <Zap className="w-3 h-3 text-white rotate-45" />
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <Zap className={cn(
                          "w-5 h-5",
                          screenplay.intensityLevel === level ? "text-[#F97316]" : "text-slate-300"
                        )} />
                        {screenplay.intensityLevel === level && (
                          <div className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
                        )}
                      </div>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mb-1",
                        screenplay.intensityLevel === level ? "text-[#F97316]" : "text-slate-400"
                      )}>
                        {level === 'storytelling' ? 'Bình thường' : level === 'action-drama' ? 'Kịch tính' : 'Hardcore'}
                      </p>
                      <p className={cn(
                        "text-xs leading-relaxed",
                        screenplay.intensityLevel === level ? "text-orange-900 font-medium" : "text-slate-500 font-normal"
                      )}>
                        {level === 'storytelling' ? 'Tập trung vào đối thoại và cảm xúc.' : level === 'action-drama' ? 'Cân bằng giữa cốt truyện và hành động.' : 'Hành động dồn dập, nhịp độ cực nhanh.'}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="space-y-6">
                  <label className="luxury-label">Danh sách tập phim</label>
                  <div className="grid grid-cols-1 gap-4">
                    {screenplay.episodes.map((ep) => (
                      <div key={ep.id} className="bg-white border border-orange-100 rounded-3xl p-4 md:p-8 hover:border-[#F97316] hover:shadow-xl hover:shadow-orange-500/5 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F97316] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex flex-col md:flex-row gap-8">
                          <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-4">
                              <span className="text-4xl font-bold text-orange-100 group-hover:text-orange-200 transition-colors">0{ep.id}</span>
                              <input 
                                value={ep.title}
                                onChange={(e) => updateEpisode(ep.id, 'title', e.target.value)}
                                className="bg-transparent border-none text-xl font-bold text-[#1F2937] group-hover:text-[#F97316] focus:ring-0 p-0 w-full transition-colors"
                                placeholder="Tiêu đề tập..."
                              />
                            </div>
                            <textarea 
                              value={ep.summary}
                              onChange={(e) => updateEpisode(ep.id, 'summary', e.target.value)}
                              rows={3}
                              className="bg-transparent border-none text-sm text-orange-800 focus:ring-0 p-0 w-full resize-none font-medium leading-relaxed"
                              placeholder="Tóm tắt nội dung tập này..."
                            />
                          </div>
                          <div className="w-full md:w-48 flex flex-col justify-between items-start md:items-end gap-6">
                            <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-xl border border-orange-100">
                              <Clock className="w-3 h-3 text-orange-500" />
                              <input 
                                type="number"
                                value={ep.duration || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '') updateEpisode(ep.id, 'duration', 0);
                                  else updateEpisode(ep.id, 'duration', parseInt(val) || 0);
                                }}
                                onBlur={() => {
                                  if (!ep.duration || ep.duration < 1) updateEpisode(ep.id, 'duration', 1);
                                }}
                                className="bg-transparent border-none text-xs font-medium text-orange-500 focus:ring-0 p-0 w-6 text-left min-w-0"
                              />
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => updateEpisode(ep.id, 'duration', Math.max(1, ep.duration - 1))}
                                  className="p-1 hover:bg-white/5 rounded text-orange-400 hover:text-orange-500 transition-all active:scale-90"
                                  type="button"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <button 
                                  onClick={() => updateEpisode(ep.id, 'duration', ep.duration + 1)}
                                  className="p-1 hover:bg-white/5 rounded text-orange-400 hover:text-orange-500 transition-all active:scale-90"
                                  type="button"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                              <span className="text-[10px] font-medium text-orange-400 uppercase tracking-widest">Phút</span>
                            </div>
                            <button 
                              onClick={() => handleBreakdown(ep.id)}
                              disabled={loading}
                              className="btn-primary w-full py-4"
                            >
                              {loading && activeEpisodeId === ep.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                              CHIA CẢNH
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: SCENE BREAKDOWN */}
        {step === 3 && screenplay && activeEpisodeId !== null && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="luxury-card relative overflow-hidden">
              {/* Card Signature */}
              <div className="absolute top-4 right-6 opacity-20 pointer-events-none">
                <span className="text-[8px] font-medium text-orange-500 uppercase tracking-[0.4em]">BY NAM LÊ</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start mb-8 md:mb-12 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-100 rounded-2xl border border-orange-200 flex-shrink-0">
                    <Scissors className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-serif text-orange-600 font-medium tracking-tight">Chia cảnh chi tiết</h2>
                    <p className="text-orange-300 text-[8px] md:text-[10px] font-medium uppercase tracking-[0.3em]">Bước 3: Scene Breakdown — Tập {activeEpisodeId}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 w-full sm:w-auto">
                  <button onClick={() => setStep(2)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors border border-orange-100">
                    <ArrowLeft className="w-5 h-5 text-orange-500" />
                  </button>
                  <button 
                    onClick={handleExportAll}
                    disabled={loading}
                    className="btn-secondary flex-1 sm:flex-none px-4 md:px-6"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    TẠO TẤT CẢ
                  </button>
                  <button onClick={() => setStep(4)} className="btn-primary flex-1 sm:flex-none px-4 md:px-6">
                    XEM TỔNG HỢP
                  </button>
                </div>
              </div>

              <div className="space-y-10">
                {screenplay.episodes.find(e => e.id === activeEpisodeId)?.scenes.map((scene, idx) => (
                  <div key={scene.id} className="bg-orange-50-light/20 border border-orange-100 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-10 group hover:border-luxury-gold/40 transition-all">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 md:mb-10 gap-6">
                      <div className="flex items-center gap-4">
                        <span className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-medium shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                          {idx + 1}
                        </span>
                        <h3 className="text-lg font-serif font-medium text-orange-600 tracking-tight">Cảnh quay chi tiết</h3>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
                        <div className="flex flex-wrap gap-2 md:gap-3 items-center">
                          <span className="text-[9px] font-medium text-orange-400 uppercase tracking-[0.2em]">Nhân vật:</span>
                          {scene.characters && scene.characters.length > 0 ? (
                            scene.characters.map(char => (
                              <div 
                                key={char.id} 
                                className={cn(
                                  "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all relative overflow-hidden",
                                  char.useCameoOutfit 
                                    ? "bg-orange-100 border-luxury-gold/40" 
                                    : "bg-white/5 border-orange-100 opacity-80"
                                )}
                              >
                                {char.isMain && (
                                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-orange-500 text-[6px] font-medium text-white rounded-bl-lg uppercase tracking-widest">
                                    Main
                                  </div>
                                )}
                                <div className={cn("w-2 h-2 rounded-full shrink-0", char.color)} />
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-medium text-orange-600 whitespace-nowrap">{char.name}</span>
                                  <span className="text-[7px] font-medium text-orange-500 uppercase tracking-widest">
                                    {char.isMain ? 'Nhân vật chính' : 'Nhân vật phụ'}
                                  </span>
                                </div>
                                <div className="w-px h-4 bg-white/20 mx-1 shrink-0" />
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => toggleCharacterGender(activeEpisodeId, scene.id, char.id)}
                                    className={cn(
                                      "px-2 py-1 rounded-lg text-[8px] font-medium uppercase tracking-widest transition-all border",
                                      char.gender === 'male' 
                                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30" 
                                        : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                    )}
                                  >
                                    {char.gender === 'male' ? 'NAM' : 'NỮ'}
                                  </button>
                                  <button 
                                    onClick={() => toggleCharacterCameoOutfit(activeEpisodeId, scene.id, char.id)}
                                    className={cn(
                                      "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-medium uppercase tracking-widest transition-all border",
                                      char.useCameoOutfit 
                                        ? "bg-orange-500 text-white border-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]" 
                                        : "bg-white/10 text-orange-600 border-white/20"
                                    )}
                                  >
                                    {char.useCameoOutfit ? (
                                      <>
                                        <ZapIcon className="w-2.5 h-2.5 fill-current" />
                                        CAMEO
                                      </>
                                    ) : (
                                      <>
                                        <Shirt className="w-2.5 h-2.5" />
                                        FREE
                                      </>
                                    )}
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
                                      "p-1.5 rounded-lg transition-all border",
                                      (char.customOutfit || char.outfitRefImage) 
                                        ? "bg-orange-100 border-orange-200 text-orange-600" 
                                        : "bg-white/10 border-white/20 text-orange-400 hover:text-orange-500"
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
                                      className="overflow-hidden bg-white/5 rounded-xl mt-2 border border-orange-100/30"
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
                                            onChange={(e) => updateCharacterOutfit(activeEpisodeId, scene.id, char.id, e.target.value)}
                                            placeholder="Ví dụ: Áo sơ mi trắng, quần âu đen..."
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
                                            onChange={(e) => updateCharacterRefImage(activeEpisodeId, scene.id, char.id, e.target.value)}
                                            placeholder="Dán link ảnh vào đây..."
                                            className="w-full bg-white/10 border border-orange-100/20 rounded-lg px-3 py-1.5 text-[10px] text-orange-600 focus:ring-1 focus:ring-orange-500 outline-none"
                                          />
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))
                        ) : (
                            <button 
                              onClick={() => {
                                const detected = detectCharacters(scene.description);
                                if (detected.length > 0) {
                                  const updatedEpisodes = screenplay.episodes.map(ep => 
                                    ep.id === activeEpisodeId ? {
                                      ...ep,
                                      scenes: ep.scenes.map(s => s.id === scene.id ? { ...s, characters: detected } : s)
                                    } : ep
                                  );
                                  setScreenplay({ ...screenplay, episodes: updatedEpisodes });
                                }
                              }}
                              className="text-[9px] font-medium text-orange-500 uppercase tracking-widest hover:underline"
                            >
                              Quét nhân vật
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button className="p-3 hover:bg-white/10 rounded-xl text-orange-400 hover:text-orange-600 transition-all border border-transparent hover:border-white/20">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (!screenplay || activeEpisodeId === null) return;
                              const updatedEpisodes = screenplay.episodes.map(ep => 
                                ep.id === activeEpisodeId ? {
                                  ...ep,
                                  scenes: ep.scenes.filter(s => s.id !== scene.id)
                                } : ep
                              );
                              setScreenplay({ ...screenplay, episodes: updatedEpisodes });
                            }}
                            className="p-3 hover:bg-white/10 rounded-xl text-orange-400 hover:text-rose-400 transition-all border border-transparent hover:border-white/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <label className="luxury-label">Mô tả hành động & bối cảnh</label>
                        <textarea 
                          value={scene.description}
                          onChange={(e) => {
                            const newDesc = e.target.value;
                            const updatedEpisodes = screenplay.episodes.map(ep => 
                              ep.id === activeEpisodeId ? {
                                ...ep,
                                scenes: ep.scenes.map(s => {
                                  if (s.id === scene.id) {
                                    const detected = detectCharacters(newDesc, s.characters);
                                    return { ...s, description: newDesc, characters: detected };
                                  }
                                  return s;
                                })
                              } : ep
                            );
                            setScreenplay({ ...screenplay, episodes: updatedEpisodes });
                          }}
                          className="input-field h-[200px] resize-none font-light leading-relaxed"
                        />
                        <button 
                          onClick={() => handleGeneratePrompt(activeEpisodeId, scene.id)}
                          disabled={scene.loading}
                          className="w-full py-5 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/20 text-white font-medium uppercase tracking-[0.3em] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20"
                        >
                          {scene.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                          TẠO PROMPT V2 (NEW)
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <label className="luxury-label">Kết quả Prompt (Jimeng/Veo)</label>
                          {scene.finalPrompt && (
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => handleGeneratePrompt(activeEpisodeId, scene.id)}
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
                          )}
                        </div>
                        
                        <div className="bg-white/60 border border-orange-100 rounded-3xl p-4 md:p-8 h-[400px] overflow-y-auto relative custom-scrollbar">
                          {!scene.finalPrompt && !scene.loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-600/10">
                              <Sparkle className="w-12 h-12 mb-4 opacity-30" />
                              <span className="text-[10px] font-medium uppercase tracking-[0.3em]">Chưa có prompt</span>
                            </div>
                          )}
                          {scene.loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md z-10 overflow-hidden rounded-3xl">
                              {/* Background Image of Lê Tuấn */}
                              <div 
                                className="absolute inset-0 opacity-40 scale-110"
                                style={{
                                  backgroundImage: `url("/api/attachments/67da5908-410a-493f-8086-44b413693e23")`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  filter: 'blur(2px)'
                                }}
                              />
                              
                              <div className="relative z-20 flex flex-col items-center w-full px-4 md:px-12">
                                <div className="relative mb-8">
                                  <Loader2 className="w-16 h-16 animate-spin text-orange-500 opacity-20" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-medium text-orange-500">
                                      {Math.round(scene.progress || 0)}%
                                    </span>
                                  </div>
                                </div>
                                
                                <h3 className="text-xs font-medium text-orange-500 uppercase tracking-[0.4em] mb-6 text-center leading-loose">
                                  NAM LÊ ĐANG VIẾT CÂU LỆNH<br/>
                                  <span className="text-[10px] text-orange-600">VUI LÒNG ĐỢI TRONG GIÂY LÁT...</span>
                                </h3>

                                {/* Progress Bar */}
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-orange-100">
                                  <motion.div 
                                    className="h-full bg-gradient-to-r from-luxury-gold/40 via-luxury-gold to-luxury-gold/40"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${scene.progress || 0}%` }}
                                    transition={{ duration: 0.3 }}
                                  />
                                </div>
                                
                                <div className="mt-4 flex justify-between w-full text-[8px] font-medium text-orange-300 uppercase tracking-widest">
                                  <span>KHỞI TẠO CẤU TRÚC</span>
                                  <span>HOÀN THÀNH</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {scene.finalPrompt && (
                            <PromptEditor 
                              prompt={scene.finalPrompt} 
                              sceneId={scene.id} 
                              onUpdate={(updated) => updateScenePrompt(activeEpisodeId!, scene.id, updated)} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    if (!screenplay || activeEpisodeId === null) return;
                    const updatedEpisodes = screenplay.episodes.map(ep => 
                      ep.id === activeEpisodeId ? {
                        ...ep,
                        scenes: [
                          ...ep.scenes,
                          {
                            id: "scene-" + Date.now(),
                            description: "",
                            characters: [],
                            loading: false,
                            progress: 0
                          }
                        ]
                      } : ep
                    );
                    setScreenplay({ ...screenplay, episodes: updatedEpisodes });
                  }}
                  className="w-full border-2 border-dashed border-orange-100 rounded-[2.5rem] p-6 md:p-12 flex flex-col items-center justify-center text-orange-400 hover:border-luxury-gold/50 hover:text-orange-500 transition-all bg-orange-50-light/10"
                >
                  <Plus className="w-10 h-10 mb-4" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.4em]">Thêm cảnh quay mới</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: FINAL PROMPT OUTPUT */}
        {step === 4 && screenplay && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="luxury-card relative overflow-hidden">
              {/* Card Signature */}
              <div className="absolute top-4 right-6 opacity-20 pointer-events-none">
                <span className="text-[8px] font-medium text-orange-500 uppercase tracking-[0.4em]">BY NAM LÊ</span>
              </div>
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                    <Send className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif text-orange-600 font-medium tracking-tight">Xuất Prompt Điện Ảnh</h2>
                    <p className="text-orange-300 text-[10px] font-medium uppercase tracking-[0.3em]">Bước 4: Final Prompt Output</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors border border-orange-100">
                    <ArrowLeft className="w-5 h-5 text-orange-500" />
                  </button>
                  <button onClick={reset} className="p-3 hover:bg-white/10 rounded-2xl transition-colors border border-orange-100">
                    <RotateCcw className="w-5 h-5 text-orange-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-16">
                {screenplay.episodes.map((ep) => (
                   ep.scenes.some(s => s.finalPrompt) && (
                    <div key={ep.id} className="space-y-10">
                      <div className="flex items-center gap-6">
                        <div className="h-px bg-white/10 flex-1" />
                        <h3 className="text-[11px] font-medium text-orange-500 uppercase tracking-[0.4em]">Tập {ep.id}: {ep.title}</h3>
                        <div className="h-px bg-white/10 flex-1" />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-10">
                        {ep.scenes.map((scene, idx) => (
                          scene.finalPrompt && (
                            <div key={scene.id} className="space-y-6">
                              <PromptEditor 
                                prompt={scene.finalPrompt} 
                                sceneId={scene.id} 
                                onUpdate={(updated) => updateScenePrompt(ep.id, scene.id, updated)} 
                              />
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CinematicPromptModule;
