import React, { useMemo, useState, useEffect } from 'react';
import { Award, Zap, Flame, Target, Activity, Plus, X, HeartPulse, Timer, Route } from 'lucide-react';
import { LoggedMeal, ActivityLog, UserProfile } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export function Dashboard({ 
  loggedMeals, 
  activities,
  setActivities,
  profile 
}: { 
  loggedMeals: LoggedMeal[], 
  activities: ActivityLog[],
  setActivities: React.Dispatch<React.SetStateAction<ActivityLog[]>>,
  profile: UserProfile
}) {
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activityForm, setActivityForm] = useState({
    type: 'Caminar',
    duration: 30,
    distance: 2,
    heartRate: 110,
    time: new Date().toTimeString().slice(0, 5)
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate consumed macros
  const consumedCarbs = loggedMeals.reduce((acc, meal) => acc + meal.carbs, 0);
  const consumedProtein = loggedMeals.reduce((acc, meal) => acc + meal.protein, 0);
  const consumedFat = loggedMeals.reduce((acc, meal) => acc + meal.fat, 0);

  // Generate simulated glycemic curve
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i <= 24; i++) {
      let glucose = 85; // Baseline glucose mg/dL
      
      // Add spikes from meals
      loggedMeals.forEach(meal => {
        const mealHour = meal.timestamp.getHours() + meal.timestamp.getMinutes() / 60;
        if (i >= mealHour && i <= mealHour + 3) {
          const hoursSinceMeal = i - mealHour;
          if (hoursSinceMeal <= 1) {
            glucose += meal.carbs * (hoursSinceMeal); // Peak at 1 hour
          } else {
            glucose += meal.carbs * (1 - (hoursSinceMeal - 1) / 2); // Decay over next 2 hours
          }
        }
      });

      // Reduce glucose from activities
      activities.forEach(act => {
        const actHour = act.timestamp.getHours() + act.timestamp.getMinutes() / 60;
        if (i >= actHour && i <= actHour + 4) {
          // Exercise lowers glucose for a few hours
          glucose -= (act.duration / 10); 
        }
      });
      
      data.push({
        time: `${i.toString().padStart(2, '0')}:00`,
        glucose: Math.max(60, Math.round(glucose)) // Prevent dropping below 60
      });
    }
    return data;
  }, [loggedMeals, activities]);

  const handleSaveActivity = () => {
    const [hours, minutes] = activityForm.time.split(':').map(Number);
    const timestamp = new Date();
    timestamp.setHours(hours, minutes, 0, 0);

    const newActivity: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      type: activityForm.type,
      duration: activityForm.duration,
      distance: activityForm.distance,
      heartRate: activityForm.heartRate,
      timestamp
    };

    setActivities(prev => [...prev, newActivity]);
    setShowActivityModal(false);
  };

  return (
    <div className="p-4 space-y-6 pb-24 h-full overflow-y-auto relative">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Hola, {profile.name}</h1>
          <p className="text-emerald-400 font-medium text-sm mt-1">Nivel 5: Capitán Metabólico</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
          <Award className="text-emerald-400 w-6 h-6" />
        </div>
      </div>

      {/* Points & Streak */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#16181d] p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">Puntos</span>
          </div>
          <div className="text-2xl font-bold text-white">{2450 + loggedMeals.length * 50 + activities.length * 100}</div>
          <div className="text-xs text-emerald-400 mt-1">+{loggedMeals.length * 50 + activities.length * 100} hoy</div>
        </div>
        <div className="bg-[#16181d] p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium">Racha</span>
          </div>
          <div className="text-2xl font-bold text-white">12 Días</div>
          <div className="text-xs text-slate-500 mt-1">¡Sigue así!</div>
        </div>
      </div>

      {/* Live Glycemic Curve */}
      <div className="bg-[#16181d] p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-white">Curva Glucémica (Est.)</h2>
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="h-40 w-full" style={{ minHeight: 160 }}>
          {isMounted && (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#ffffff50" fontSize={10} tickMargin={5} minTickGap={20} />
                <YAxis stroke="#ffffff50" fontSize={10} domain={[60, 180]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#16181d', border: '1px solid #ffffff20', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                <ReferenceLine y={100} stroke="#eab308" strokeDasharray="3 3" opacity={0.5} />
                <Line type="monotone" dataKey="glucose" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="text-xs text-slate-500 text-center">Basado en tu ingesta de macros y actividad</p>
      </div>

      {/* Daily Macros */}
      <div className="bg-[#16181d] p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-white">Objetivos Diarios</h2>
          <Target className="w-5 h-5 text-slate-400" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300 font-medium">Carbohidratos Netos</span>
            <span className="text-white">{consumedCarbs}g / {profile.targetCarbs}g</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (consumedCarbs / profile.targetCarbs) * 100)}%` }} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300 font-medium">Proteína</span>
            <span className="text-white">{consumedProtein}g / {profile.targetProtein}g</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (consumedProtein / profile.targetProtein) * 100)}%` }} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300 font-medium">Grasas Saludables</span>
            <span className="text-white">{consumedFat}g / {profile.targetFat}g</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (consumedFat / profile.targetFat) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Physical Activity */}
      <div className="bg-[#16181d] p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-white">Actividad Física</h2>
          <button 
            onClick={() => setShowActivityModal(true)}
            className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No has registrado actividad hoy.</p>
        ) : (
          <div className="space-y-3">
            {activities.map(act => (
              <div key={act.id} className="flex items-center justify-between p-3 bg-[#0f1115] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{act.type}</p>
                    <p className="text-xs text-slate-500">{act.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1"><Timer className="w-3 h-3" /> {act.duration}m</div>
                  {act.distance && <div className="flex items-center gap-1"><Route className="w-3 h-3" /> {act.distance}km</div>}
                  {act.heartRate && <div className="flex items-center gap-1"><HeartPulse className="w-3 h-3 text-red-400" /> {act.heartRate}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#16181d] w-full max-w-sm rounded-3xl border border-white/10 p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Registrar Actividad</h3>
              <button onClick={() => setShowActivityModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Tipo de Actividad</label>
                <select 
                  value={activityForm.type}
                  onChange={(e) => setActivityForm({...activityForm, type: e.target.value})}
                  className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option>Caminar</option>
                  <option>Correr</option>
                  <option>Ciclismo</option>
                  <option>Fuerza / Pesas</option>
                  <option>Yoga</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Duración (min)</label>
                  <input 
                    type="number" 
                    value={activityForm.duration}
                    onChange={(e) => setActivityForm({...activityForm, duration: Number(e.target.value)})}
                    className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Hora</label>
                  <input 
                    type="time" 
                    value={activityForm.time}
                    onChange={(e) => setActivityForm({...activityForm, time: e.target.value})}
                    className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Distancia (km) <span className="text-[10px] text-slate-600">Opcional</span></label>
                  <input 
                    type="number" 
                    value={activityForm.distance}
                    onChange={(e) => setActivityForm({...activityForm, distance: Number(e.target.value)})}
                    className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Ritmo Cardíaco (bpm)</label>
                  <input 
                    type="number" 
                    value={activityForm.heartRate}
                    onChange={(e) => setActivityForm({...activityForm, heartRate: Number(e.target.value)})}
                    className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveActivity}
                className="w-full py-3 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
              >
                Guardar Actividad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
