import React, { useState, useEffect } from 'react';
import { Dumbbell, Bell, CheckCircle2, PlayCircle, Info, Loader2, RefreshCw, Calendar, Image as ImageIcon } from 'lucide-react';
import { ActivityLog, TrainingDay, Exercise } from '../types';
import { ai } from '../lib/gemini';
import { Type } from '@google/genai';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function Training({ setActivities }: { setActivities: React.Dispatch<React.SetStateAction<ActivityLog[]>> }) {
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  
  const [weeklyPlan, setWeeklyPlan] = useState<TrainingDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});

  const generateWeeklyPlan = async () => {
    setLoadingPlan(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Genera un plan de entrenamiento de fuerza de 7 días (0=Domingo a 6=Sábado) utilizando ÚNICAMENTE bandas elásticas y peso corporal. 
        El usuario tiene más de 50 años y busca revertir la resistencia a la insulina. 
        Incluye días de descanso activo. Devuelve un JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayOfWeek: { type: Type.INTEGER, description: "0 para Domingo, 1 para Lunes, etc." },
                focus: { type: Type.STRING, description: "Enfoque del día (ej. Piernas, Torso, Descanso Activo)" },
                exercises: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      sets: { type: Type.INTEGER },
                      reps: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["id", "name", "sets", "reps", "description"]
                  }
                }
              },
              required: ["dayOfWeek", "focus", "exercises"]
            }
          }
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        setWeeklyPlan(data);
      }
    } catch (error) {
      console.error("Error generating weekly plan:", error);
    } finally {
      setLoadingPlan(false);
    }
  };

  const generateExerciseImage = async (dayIndex: number, exerciseIndex: number, exercise: Exercise) => {
    setGeneratingImages(prev => ({ ...prev, [exercise.id]: true }));
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: `A simple, clean, flat vector illustration of a person doing ${exercise.name} with elastic resistance bands. ${exercise.description}. Minimalist fitness app style, solid dark background.`,
      });
      
      // Find image part
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          
          // Update state
          setWeeklyPlan(prev => {
            const newPlan = [...prev];
            newPlan[dayIndex].exercises[exerciseIndex].imageUrl = imageUrl;
            return newPlan;
          });
          break;
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setGeneratingImages(prev => ({ ...prev, [exercise.id]: false }));
    }
  };

  const handleCompleteWorkout = () => {
    const newActivity: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Fuerza con Banda',
      duration: 30,
      timestamp: new Date()
    };
    setActivities(prev => [...prev, newActivity]);
    setWorkoutCompleted(true);
    setTimeout(() => setWorkoutCompleted(false), 3000);
  };

  const currentDayPlan = weeklyPlan.find(d => d.dayOfWeek === selectedDay);
  const currentDayIndex = weeklyPlan.findIndex(d => d.dayOfWeek === selectedDay);

  return (
    <div className="p-4 space-y-6 pb-24 h-full overflow-y-auto relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Entrenamiento</h1>
          <p className="text-slate-400 text-sm">Fuerza para revertir resistencia</p>
        </div>
        <button 
          onClick={generateWeeklyPlan}
          disabled={loadingPlan}
          className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          {loadingPlan ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-200">
          El entrenamiento de fuerza es <strong className="text-blue-400">vital</strong> a partir de los 50 años. El músculo actúa como un "sumidero" de glucosa.
        </p>
      </div>

      {/* Week Selector */}
      {weeklyPlan.length > 0 && (
        <div className="flex justify-between gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {DAYS_OF_WEEK.map((dayName, index) => (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={`flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-colors ${
                selectedDay === index 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-[#16181d] text-slate-400 border border-white/5 hover:bg-white/5'
              }`}
            >
              <span className="text-xs font-medium">{dayName}</span>
            </button>
          ))}
        </div>
      )}

      {weeklyPlan.length === 0 && !loadingPlan ? (
        <div className="text-center py-12 px-4 bg-[#16181d] rounded-2xl border border-white/5 mt-8">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Sin plan semanal</h3>
          <p className="text-slate-400 text-sm mb-6">Genera un plan de 7 días adaptado a ti.</p>
          <button 
            onClick={generateWeeklyPlan}
            className="w-full py-3 bg-emerald-500/10 text-emerald-400 font-medium rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            Generar Plan Semanal
          </button>
        </div>
      ) : currentDayPlan ? (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-lg font-semibold text-white">{currentDayPlan.focus}</h2>
            <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
              {currentDayPlan.exercises.length} Ejercicios
            </span>
          </div>

          {currentDayPlan.exercises.map((exercise, idx) => (
            <div key={exercise.id} className="bg-[#16181d] rounded-2xl border border-white/5 overflow-hidden">
              {exercise.imageUrl ? (
                <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-40 object-cover opacity-80" />
              ) : (
                <div className="w-full h-24 bg-[#0f1115] flex items-center justify-center border-b border-white/5">
                  <button 
                    onClick={() => generateExerciseImage(currentDayIndex, idx, exercise)}
                    disabled={generatingImages[exercise.id]}
                    className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors bg-white/5 px-3 py-1.5 rounded-lg"
                  >
                    {generatingImages[exercise.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    {generatingImages[exercise.id] ? 'Generando imagen...' : 'Generar Imagen IA'}
                  </button>
                </div>
              )}
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium">{exercise.name}</h3>
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-[#0f1115] px-2 py-1 rounded-lg border border-white/5">
                    <PlayCircle className="w-3 h-3 text-emerald-400" />
                    {exercise.sets} series x {exercise.reps}
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{exercise.description}</p>
              </div>
            </div>
          ))}

          <button 
            onClick={handleCompleteWorkout}
            disabled={workoutCompleted || currentDayPlan.exercises.length === 0}
            className={`w-full py-4 mt-6 font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
              workoutCompleted 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50'
            }`}
          >
            {workoutCompleted ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                ¡Rutina Registrada!
              </>
            ) : (
              <>
                <Dumbbell className="w-5 h-5" />
                Completar Rutina Hoy
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
