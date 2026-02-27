import React, { useState } from 'react';
import { BookOpen, AlertCircle, CheckCircle2, Loader2, RefreshCw, Clock, Activity, Utensils } from 'lucide-react';
import { LoggedMeal, ActivityLog, UserProfile } from '../types';
import { ai } from '../lib/gemini';
import { Type } from '@google/genai';

interface DiaryProps {
  loggedMeals: LoggedMeal[];
  activities: ActivityLog[];
  profile: UserProfile;
}

interface AnalysisResult {
  status: 'ok' | 'warning' | 'danger';
  message: string;
  recommendation: string;
}

export function Diary({ loggedMeals, activities, profile }: DiaryProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Get today's logs
  const today = new Date().toDateString();
  const todaysMeals = loggedMeals.filter(m => m.timestamp.toDateString() === today).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const todaysActivities = activities.filter(a => a.timestamp.toDateString() === today).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Combine and sort all events
  const timelineEvents = [
    ...todaysMeals.map(m => ({ ...m, eventType: 'meal' as const })),
    ...todaysActivities.map(a => ({ ...a, eventType: 'activity' as const }))
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const totalCarbs = todaysMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalProtein = todaysMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalFat = todaysMeals.reduce((sum, meal) => sum + meal.fat, 0);

  const analyzeDay = async () => {
    setAnalyzing(true);
    try {
      const prompt = `Actúa como un Nutricionista Clínico y Entrenador Personal.
      Perfil del usuario: ${profile.age} años, resistencia a la insulina.
      Objetivos diarios: Carbs < ${profile.targetCarbs}g, Proteína ~${profile.targetProtein}g, Grasa ~${profile.targetFat}g.
      
      Consumo de hoy:
      Carbohidratos: ${totalCarbs}g
      Proteína: ${totalProtein}g
      Grasa: ${totalFat}g
      
      Comidas registradas hoy: ${JSON.stringify(todaysMeals.map(m => ({ name: m.name, carbs: m.carbs, time: m.timestamp.toLocaleTimeString() })))}
      Actividades registradas hoy: ${JSON.stringify(todaysActivities.map(a => ({ type: a.type, duration: a.duration, time: a.timestamp.toLocaleTimeString() })))}
      
      Analiza el día. Si el usuario se ha pasado de carbohidratos (ej. comió un croissant o exceso de azúcar), el estado debe ser 'warning' o 'danger' y debes proponer una corrección inmediata (ej. "Haz 15 min de caminata ahora" o "Cena solo proteína y vegetales"). Si va bien, estado 'ok' y motivación.
      
      Devuelve un JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, description: "ok, warning, o danger" },
              message: { type: Type.STRING, description: "Mensaje de evaluación del día" },
              recommendation: { type: Type.STRING, description: "Consejo o corrección adaptativa para minimizar impacto" }
            },
            required: ["status", "message", "recommendation"]
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        setAnalysis(data);
      }
    } catch (error) {
      console.error("Error analyzing day:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24 h-full overflow-y-auto relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Diario Adaptativo</h1>
          <p className="text-slate-400 text-sm">Análisis y corrección en tiempo real</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
          <BookOpen className="text-blue-400 w-6 h-6" />
        </div>
      </div>

      {/* Daily Summary */}
      <div className="bg-[#16181d] p-4 rounded-2xl border border-white/5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Consumo Actual vs Objetivo</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Carbohidratos Netos</span>
              <span className={totalCarbs > profile.targetCarbs ? 'text-red-400 font-bold' : 'text-white'}>
                {totalCarbs}g / {profile.targetCarbs}g
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${totalCarbs > profile.targetCarbs ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min((totalCarbs / profile.targetCarbs) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Proteína</span>
              <span className="text-white">{totalProtein}g / {profile.targetProtein}g</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min((totalProtein / profile.targetProtein) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-[#16181d] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-white">Análisis Inteligente</h2>
          <button 
            onClick={analyzeDay}
            disabled={analyzing || timelineEvents.length === 0}
            className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          </button>
        </div>

        {timelineEvents.length === 0 ? (
          <p className="text-sm text-slate-400">Registra comidas o entrenamientos para obtener un análisis de tu día.</p>
        ) : !analysis && !analyzing ? (
          <p className="text-sm text-slate-400">Toca el botón de actualizar para que la IA evalúe tu progreso de hoy y te sugiera correcciones si son necesarias.</p>
        ) : analysis ? (
          <div className="space-y-4 animate-in fade-in">
            <div className={`p-3 rounded-xl flex gap-3 items-start border ${
              analysis.status === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' :
              analysis.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200' :
              'bg-red-500/10 border-red-500/20 text-red-200'
            }`}>
              {analysis.status === 'ok' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p className="text-sm leading-relaxed">{analysis.message}</p>
            </div>
            
            <div className="bg-[#0f1115] p-4 rounded-xl border border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Corrección / Siguiente Paso</h3>
              <p className="text-sm text-white leading-relaxed">{analysis.recommendation}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Línea de Tiempo de Hoy</h2>
        {timelineEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No hay eventos registrados hoy</p>
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
            {timelineEvents.map((event, idx) => (
              <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0f1115] bg-slate-800 text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10">
                  {event.eventType === 'meal' ? <Utensils className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#16181d] p-4 rounded-2xl border border-white/5 shadow">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium text-slate-400">
                      {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {event.eventType === 'meal' && (event as any).type === 'custom' && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Voz/Texto</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    {event.eventType === 'meal' ? (event as any).name : (event as any).type}
                  </h3>
                  {event.eventType === 'meal' ? (
                    <div className="flex gap-2 text-xs text-slate-400">
                      <span>C: {(event as any).carbs}g</span>
                      <span>P: {(event as any).protein}g</span>
                      <span>G: {(event as any).fat}g</span>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-400 font-medium">{(event as any).duration} minutos</p>
                  )}
                  {event.eventType === 'meal' && (event as any).transcript && (
                    <p className="text-[10px] text-slate-500 mt-2 italic border-t border-white/5 pt-2">
                      "{ (event as any).transcript }"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
