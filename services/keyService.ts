
import { GoogleGenAI } from "@google/genai";
import { AuthSession } from "../types";

const STORAGE_KEY = 'koc_studio_api_keys';
const INDEX_KEY = 'koc_studio_current_key_index';
const SESSION_KEY = 'nam_ai_auth_session';

export const getAuthSession = (): AuthSession | null => {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

export const saveAuthSession = (session: AuthSession | null) => {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const getAiClient = (): GoogleGenAI => {
  const session = getAuthSession();
  const keys = session?.extraApiKeys || [];
  
  if (keys.length === 0) {
    // Fallback if no keys in session
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  // Rotate keys using sessionStorage index
  let currentIndex = parseInt(sessionStorage.getItem(INDEX_KEY) || '0');
  if (currentIndex >= keys.length) currentIndex = 0;

  const apiKey = keys[currentIndex];

  // Increment index for next call
  sessionStorage.setItem(INDEX_KEY, ((currentIndex + 1) % keys.length).toString());

  console.debug(`Using API Key #${currentIndex + 1} of ${keys.length}`);
  return new GoogleGenAI({ apiKey });
};
