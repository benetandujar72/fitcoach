import React, { useState } from 'react';
import { ai } from '../lib/gemini';
import { Type } from '@google/genai';
import { Utensils, Loader2, Heart, RefreshCw, Check, Plus, Mic, X, Clock, Camera, Search, Edit3 } from 'lucide-react';
import { LoggedMeal, UserProfile } from '../types';

interface Meal {
  type: string;
  name: string;
  description: string;
  carbs: number;
  protein: number;
  fat: number;
}

export function MealPlanner({ loggedMeals, setLoggedMeals, profile }: { loggedMeals: LoggedMeal[], setLoggedMeals: React.Dispatch<React.SetStateAction<LoggedMeal[]>>, profile: UserProfile }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTab, setLogTab] = useState<'text' | 'manual' | 'photo' | 'api'>('text');
  
  // Text/Voice State
  const [voiceInput, setVoiceInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [processingVoice, setProcessingVoice] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  // Manual State
  const [manualForm, setManualForm] = useState({
    name: '', carbs: 0, protein: 0, fat: 0, time: new Date().toTimeString().slice(0, 5)
  });

  // Photo State
  const [processingPhoto, setProcessingPhoto] = useState(false);

  // API State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [apiQuantity, setApiQuantity] = useState<number>(100);

  const generateMeals = async () => {
    setLoading(true);
    try {
      const restrictions = profile.dietaryRestrictions ? `Restricciones dietéticas: ${profile.dietaryRestrictions}. ` : '';
      const preferences = profile.foodPreferences ? `Preferencias de alimentos: ${profile.foodPreferences}. ` : '';
      
      const prompt = `Genera un plan de comidas de 1 día (Desayuno, Almuerzo, Cena) para una persona de ${profile.age} años con resistencia a la insulina. 
      El objetivo es mantener los carbohidratos netos por debajo de ${profile.targetCarbs}g al día, alta proteína (aprox ${profile.targetProtein}g) y grasas saludables (aprox ${profile.targetFat}g). 
      ${restrictions}
      ${preferences}
      IMPORTANTE: Excluye estrictamente cualquier alimento mencionado en las restricciones. Adapta las recetas a las preferencias indicadas (ej. si no le gusta hervido, propón a la plancha o al horno).
      Devuelve platos reales, apetitosos y fáciles de preparar.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "Desayuno, Almuerzo, o Cena" },
                name: { type: Type.STRING, description: "Nombre corto del plato" },
                description: { type: Type.STRING, description: "Breve descripción de los ingredientes y método de cocción" },
                carbs: { type: Type.NUMBER, description: "Gramos de carbohidratos" },
                protein: { type: Type.NUMBER, description: "Gramos de proteína" },
                fat: { type: Type.NUMBER, description: "Gramos de grasa" }
              },
              required: ["type", "name", "description", "carbs", "protein", "fat"]
            }
          }
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        setMeals(data);
      }
    } catch (error) {
      console.error("Error generating meals:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmMeal = (meal: Meal) => {
    const newLog: LoggedMeal = {
      id: Math.random().toString(36).substr(2, 9),
      name: meal.name,
      carbs: meal.carbs,
      protein: meal.protein,
      fat: meal.fat,
      timestamp: new Date(),
      type: 'suggested'
    };
    setLoggedMeals(prev => [...prev, newLog]);
  };

  const isMealLogged = (mealName: string) => {
    return loggedMeals.some(log => log.name === mealName && log.type === 'suggested');
  };

  const handleVoiceLog = async () => {
    if (!voiceInput.trim()) return;
    setProcessingVoice(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `El usuario acaba de comer lo siguiente: "${voiceInput}". Analiza el texto y extrae los macronutrientes aproximados.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nombre resumido de la comida" },
              carbs: { type: Type.NUMBER, description: "Gramos de carbohidratos estimados" },
              protein: { type: Type.NUMBER, description: "Gramos de proteína estimados" },
              fat: { type: Type.NUMBER, description: "Gramos de grasa estimados" }
            },
            required: ["name", "carbs", "protein", "fat"]
          }
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        const newLog: LoggedMeal = {
          id: Math.random().toString(36).substr(2, 9),
          name: data.name,
          carbs: data.carbs,
          protein: data.protein,
          fat: data.fat,
          timestamp: new Date(),
          type: 'custom',
          transcript: voiceInput
        };
        setLoggedMeals(prev => [...prev, newLog]);
        setShowLogModal(false);
        setVoiceInput('');
      }
    } catch (error) {
      console.error("Error parsing voice input:", error);
    } finally {
      setProcessingVoice(false);
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setProcessingVoice(true);
          
          try {
            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: {
                parts: [
                  { text: 'Escucha este audio donde el usuario describe lo que ha comido. Transcribe exactamente lo que dice y extrae los macronutrientes aproximados. Devuelve un JSON.' },
                  { inlineData: { data: base64Audio, mimeType: 'audio/webm' } }
                ]
              },
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    transcript: { type: Type.STRING, description: "Transcripción exacta de lo que dijo el usuario" },
                    name: { type: Type.STRING, description: "Nombre resumido de la comida" },
                    carbs: { type: Type.NUMBER, description: "Gramos de carbohidratos estimados" },
                    protein: { type: Type.NUMBER, description: "Gramos de proteína estimados" },
                    fat: { type: Type.NUMBER, description: "Gramos de grasa estimados" }
                  },
                  required: ["transcript", "name", "carbs", "protein", "fat"]
                }
              }
            });

            if (response.text) {
              const data = JSON.parse(response.text);
              setVoiceInput(data.transcript); // Show what was transcribed
              
              const newLog: LoggedMeal = {
                id: Math.random().toString(36).substr(2, 9),
                name: data.name,
                carbs: data.carbs,
                protein: data.protein,
                fat: data.fat,
                timestamp: new Date(),
                type: 'custom',
                transcript: data.transcript
              };
              setLoggedMeals(prev => [...prev, newLog]);
              setTimeout(() => {
                setShowLogModal(false);
                setVoiceInput('');
              }, 2000); // Give user 2 seconds to read the transcript before closing
            }
          } catch (error) {
            console.error("Error processing audio with Gemini:", error);
            alert("Error al procesar el audio con IA.");
          } finally {
            setProcessingVoice(false);
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
          }
        };
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Error al acceder al micrófono. Asegúrate de dar permisos en tu navegador.");
      setIsListening(false);
    }
  };

  const handleManualLog = () => {
    if (!manualForm.name) return;
    const [hours, minutes] = manualForm.time.split(':').map(Number);
    const timestamp = new Date();
    timestamp.setHours(hours, minutes, 0, 0);

    const newLog: LoggedMeal = {
      id: Math.random().toString(36).substr(2, 9),
      name: manualForm.name,
      carbs: manualForm.carbs,
      protein: manualForm.protein,
      fat: manualForm.fat,
      timestamp,
      type: 'manual'
    };
    setLoggedMeals(prev => [...prev, newLog]);
    setShowLogModal(false);
    setManualForm({ name: '', carbs: 0, protein: 0, fat: 0, time: new Date().toTimeString().slice(0, 5) });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setProcessingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: 'Analiza esta imagen de comida. Estima los macronutrientes totales. Devuelve un JSON con: name, carbs, protein, fat.' },
              { inlineData: { data: base64Data, mimeType: file.type } }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Nombre resumido de la comida" },
                carbs: { type: Type.NUMBER, description: "Gramos de carbohidratos estimados" },
                protein: { type: Type.NUMBER, description: "Gramos de proteína estimados" },
                fat: { type: Type.NUMBER, description: "Gramos de grasa estimados" }
              },
              required: ["name", "carbs", "protein", "fat"]
            }
          }
        });
        
        if (response.text) {
          const data = JSON.parse(response.text);
          const newLog: LoggedMeal = {
            id: Math.random().toString(36).substr(2, 9),
            name: data.name,
            carbs: data.carbs,
            protein: data.protein,
            fat: data.fat,
            timestamp: new Date(),
            type: 'photo'
          };
          setLoggedMeals(prev => [...prev, newLog]);
          setShowLogModal(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error analyzing photo:", error);
      alert("Error al analizar la foto.");
    } finally {
      setProcessingPhoto(false);
    }
  };

  const searchOpenFoodFacts = async () => {
    if (!searchQuery) return;
    setSearching(true);
    setSelectedProduct(null);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=5`);
      const data = await res.json();
      setSearchResults(data.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const confirmApiProduct = () => {
    if (!selectedProduct) return;
    
    const multiplier = apiQuantity / 100;
    
    const newLog: LoggedMeal = {
      id: Math.random().toString(36).substr(2, 9),
      name: selectedProduct.product_name || 'Producto Desconocido',
      carbs: Math.round((selectedProduct.nutriments?.carbohydrates_100g || 0) * multiplier),
      protein: Math.round((selectedProduct.nutriments?.proteins_100g || 0) * multiplier),
      fat: Math.round((selectedProduct.nutriments?.fat_100g || 0) * multiplier),
      timestamp: new Date(),
      type: 'api'
    };
    setLoggedMeals(prev => [...prev, newLog]);
    setShowLogModal(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedProduct(null);
    setApiQuantity(100);
  };

  return (
    <div className="p-4 space-y-6 pb-24 h-full overflow-y-auto relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Plan de Comidas</h1>
          <p className="text-slate-400 text-sm">Optimizado para tu sensibilidad a la insulina</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowLogModal(true)}
            className="p-3 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={generateMeals}
            disabled={loading}
            className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Custom Logged Meals */}
      {loggedMeals.filter(m => m.type !== 'suggested').length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Comidas Extra Registradas</h2>
          <div className="space-y-3">
            {loggedMeals.filter(m => m.type !== 'suggested').map(meal => (
              <div key={meal.id} className="bg-[#16181d] p-3 rounded-xl border border-blue-500/20 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{meal.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">{meal.type}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-400 mt-1">
                    <span>C: {meal.carbs}g</span>
                    <span>P: {meal.protein}g</span>
                    <span>G: {meal.fat}g</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {meal.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {meals.length === 0 && !loading ? (
        <div className="text-center py-12 px-4 bg-[#16181d] rounded-2xl border border-white/5 mt-8">
          <Utensils className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Sin plan activo</h3>
          <p className="text-slate-400 text-sm mb-6">Genera un plan personalizado basado en tus métricas actuales y preferencias.</p>
          <button 
            onClick={generateMeals}
            className="w-full py-3 bg-emerald-500/10 text-emerald-400 font-medium rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            Generar Plan de Hoy
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal, idx) => {
            const isLogged = isMealLogged(meal.name);
            return (
              <div key={idx} className={`bg-[#16181d] p-4 rounded-2xl border transition-colors relative overflow-hidden ${isLogged ? 'border-emerald-500/30' : 'border-white/5'}`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${isLogged ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{meal.type}</span>
                  {isLogged ? (
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full">
                      <Check className="w-3 h-3" /> Ingerido
                    </span>
                  ) : (
                    <button onClick={() => confirmMeal(meal)} className="text-xs font-medium text-slate-400 hover:text-emerald-400 flex items-center gap-1 bg-white/5 hover:bg-emerald-500/10 px-2 py-1 rounded-full transition-colors">
                      <Plus className="w-3 h-3" /> Confirmar
                    </button>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{meal.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{meal.description}</p>
                
                <div className="flex gap-4 text-xs font-medium">
                  <div className="bg-slate-800/50 px-2 py-1 rounded text-red-300">
                    Carbs: {meal.carbs}g
                  </div>
                  <div className="bg-slate-800/50 px-2 py-1 rounded text-blue-300">
                    Prot: {meal.protein}g
                  </div>
                  <div className="bg-slate-800/50 px-2 py-1 rounded text-yellow-300">
                    Grasa: {meal.fat}g
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-purpose Log Modal */}
      {showLogModal && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#16181d] w-full max-w-sm rounded-3xl border border-white/10 p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Registrar Comida</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              <button onClick={() => setLogTab('text')} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${logTab === 'text' ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                <Mic className="w-3 h-3 inline mr-1" /> Voz/Texto
              </button>
              <button onClick={() => setLogTab('manual')} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${logTab === 'manual' ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                <Edit3 className="w-3 h-3 inline mr-1" /> Manual
              </button>
              <button onClick={() => setLogTab('photo')} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${logTab === 'photo' ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                <Camera className="w-3 h-3 inline mr-1" /> Foto
              </button>
              <button onClick={() => setLogTab('api')} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${logTab === 'api' ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                <Search className="w-3 h-3 inline mr-1" /> Buscar
              </button>
            </div>
            
            {/* Tab Contents */}
            {logTab === 'text' && (
              <div className="flex flex-col items-center justify-center py-2">
                <button 
                  onClick={toggleListening}
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${
                    isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                  }`}
                >
                  <Mic className={`w-6 h-6 ${isListening ? 'animate-bounce' : ''}`} />
                </button>
                <p className="text-xs text-slate-400 text-center mb-4">
                  {isListening ? 'Escuchando...' : 'Toca para hablar o escribe abajo'}
                </p>
                <textarea 
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  placeholder='Ej: "Me comí dos huevos con aguacate"'
                  className="w-full bg-[#0f1115] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none h-20 mb-4"
                />
                <button 
                  onClick={handleVoiceLog}
                  disabled={!voiceInput.trim() || processingVoice}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {processingVoice ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analizar y Guardar'}
                </button>
              </div>
            )}

            {logTab === 'manual' && (
              <div className="space-y-3">
                <input 
                  type="text" placeholder="Nombre de la comida" 
                  value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})}
                  className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 ml-1">Carbs (g)</label>
                    <input type="number" value={manualForm.carbs} onChange={e => setManualForm({...manualForm, carbs: Number(e.target.value)})} className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 ml-1">Prot (g)</label>
                    <input type="number" value={manualForm.protein} onChange={e => setManualForm({...manualForm, protein: Number(e.target.value)})} className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 ml-1">Grasa (g)</label>
                    <input type="number" value={manualForm.fat} onChange={e => setManualForm({...manualForm, fat: Number(e.target.value)})} className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 ml-1">Hora</label>
                  <input type="time" value={manualForm.time} onChange={e => setManualForm({...manualForm, time: e.target.value})} className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <button onClick={handleManualLog} disabled={!manualForm.name} className="w-full py-3 mt-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium rounded-xl transition-colors">
                  Guardar Manualmente
                </button>
              </div>
            )}

            {logTab === 'photo' && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Camera className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-sm text-slate-400 mb-6">Sube una foto de tu plato y la IA estimará los macronutrientes.</p>
                
                <div className="flex gap-3 w-full">
                  <label className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2">
                    {processingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tomar Foto'}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={processingPhoto} />
                  </label>
                  <label className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2">
                    {processingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Galería'}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={processingPhoto} />
                  </label>
                </div>
              </div>
            )}

            {logTab === 'api' && (
              <div className="space-y-4">
                {!selectedProduct ? (
                  <>
                    <div className="flex gap-2">
                      <input 
                        type="text" placeholder="Buscar alimento (ej. Manzana)" 
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchOpenFoodFacts()}
                        className="flex-1 bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                      />
                      <button onClick={searchOpenFoodFacts} disabled={searching || !searchQuery} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl disabled:opacity-50">
                        {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {searchResults.map((prod, i) => (
                        <div key={i} onClick={() => setSelectedProduct(prod)} className="p-3 bg-[#0f1115] border border-white/5 rounded-xl hover:border-blue-500/30 cursor-pointer transition-colors">
                          <p className="text-sm text-white font-medium truncate">{prod.product_name || 'Desconocido'}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            C: {Math.round(prod.nutriments?.carbohydrates_100g || 0)}g | 
                            P: {Math.round(prod.nutriments?.proteins_100g || 0)}g | 
                            G: {Math.round(prod.nutriments?.fat_100g || 0)}g (por 100g)
                          </p>
                        </div>
                      ))}
                      {searchResults.length === 0 && !searching && searchQuery && (
                        <p className="text-xs text-slate-500 text-center py-4">Pulsa buscar para ver resultados.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-3 bg-[#0f1115] border border-blue-500/30 rounded-xl">
                      <p className="text-sm text-white font-medium">{selectedProduct.product_name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Valores base por 100g</p>
                    </div>
                    
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Cantidad consumida (gramos)</label>
                      <input 
                        type="number" 
                        value={apiQuantity} 
                        onChange={e => setApiQuantity(Number(e.target.value))}
                        className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center p-3 bg-white/5 rounded-xl">
                      <div>
                        <p className="text-[10px] text-slate-400">Carbs</p>
                        <p className="text-sm font-medium text-red-400">{Math.round((selectedProduct.nutriments?.carbohydrates_100g || 0) * (apiQuantity / 100))}g</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Prot</p>
                        <p className="text-sm font-medium text-blue-400">{Math.round((selectedProduct.nutriments?.proteins_100g || 0) * (apiQuantity / 100))}g</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Grasa</p>
                        <p className="text-sm font-medium text-yellow-400">{Math.round((selectedProduct.nutriments?.fat_100g || 0) * (apiQuantity / 100))}g</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setSelectedProduct(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors">
                        Volver
                      </button>
                      <button onClick={confirmApiProduct} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors">
                        Añadir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
