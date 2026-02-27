import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client dynamically to pick up keys selected via UI
export const getAI = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: apiKey as string });
};
