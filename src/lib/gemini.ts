import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
