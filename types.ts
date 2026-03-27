
export interface User {
  username: string;
  password?: string;
  durationDays: number | 'unlimited';
  isAdmin?: boolean;
}

export interface AuthSession {
  username: string;
  loginTime: number; // timestamp
  expirationTime: number | 'unlimited'; // timestamp or 'unlimited'
  apiKey?: string;
  extraApiKeys?: string[];
}

export interface CinematicPrompt {
  prompt: string;
  translation: string;
  chinesePrompt: string;
}

export interface Character {
  id: string;
  name: string;
  gender: 'male' | 'female';
  isMain: boolean;
  useCameoOutfit: boolean;
  customOutfit?: string;
  outfitRefImage?: string;
  color: string;
  description?: string;
}

export interface Scene {
  id: string;
  description: string; // Vietnamese description
  finalPrompt?: CinematicPrompt;
  loading?: boolean;
  progress?: number;
  characters?: Character[];
}

export interface Episode {
  id: number;
  title: string;
  summary: string;
  duration: number; // Duration in minutes for this specific episode
  scenes: Scene[];
}

export interface Screenplay {
  overallPlot: string;
  intensityLevel: 'storytelling' | 'action-drama' | 'hardcore';
  episodes: Episode[];
}

export interface IdeaSuggestion {
  title: string;
  description: string;
}

export interface ScriptContinuity {
  previousScript: string;
  nextEpisodeIdea?: string;
  duration: number;
  episodeNumber: number;
}

export interface ContinuityResult {
  title: string;
  summary: string;
  scenes: Scene[];
}

export type StoryTheme = 'ceo-reveal' | 'inspirational' | 'emotional-family' | 'comedy' | 'culinary' | 'horror' | 'historical' | 'action';

export interface StoryIdea {
  theme: StoryTheme;
  content: string;
}

export interface StoryScript {
  title: string;
  summary: string;
  episodes: Episode[];
}
