import React, { useState } from 'react';
import { Dumbbell, Bell, CheckCircle2, PlayCircle, Info } from 'lucide-react';
import { ActivityLog } from '../types';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  description: string;
}

const ELASTIC_BAND_EXERCISES: Exercise[] = [
  {
    id: '1',
    name: 'Sentadilla con Banda',
    sets: 3,
    reps: '12-15',
    description: 'Pisa la banda con ambos pies, sujeta los extremos a la altura de los hombros y realiza una sentadilla. Excelente para piernas y glúteos, clave para la sensibilidad a la insulina.'
  },
  {
    id: '2',
    name: 'Remo Sentado',
    sets: 3,
    reps: '12-15',
    description: 'Siéntate con las piernas estiradas, pasa la banda por tus pies y tira hacia tu abdomen manteniendo la espalda recta. Fortalece la espalda y mejora la postura.'
  },
  {
    id: '3',
    name: 'Press de Pecho de Pie',
    sets: 3,
    reps: '10-12',
    description: 'Ancla la banda detrás de ti (o pásala por tu espalda), empuja hacia adelante extendiendo los brazos. Trabaja pectorales y tríceps.'
  },
  {
    id: '4',
    name: 'Curl de Bíceps',
    sets: 3,
    reps: '15',
    description: 'Pisa la banda, mantén los codos pegados al cuerpo y flexiona los brazos hacia arriba. Movimiento controlado.'
  }
];

export function Training({ setActivities }: { setActivities: React.Dispatch<React.SetStateAction<ActivityLog[]>> }) {
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  const handleCompleteWorkout = () => {
    const newActivity: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Fuerza con Banda',
      duration: 30, // 30 mins default for this routine
      timestamp: new Date()
    };
    setActivities(prev => [...prev, newActivity]);
    setWorkoutCompleted(true);
    setTimeout(() => setWorkoutCompleted(false), 3000);
  };

  return (
    <div className="p-4 space-y-6 pb-24 h-full overflow-y-auto relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Entrenamiento</h1>
          <p className="text-slate-400 text-sm">Fuerza para revertir resistencia</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
          <Dumbbell className="text-emerald-400 w-6 h-6" />
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-200">
          El entrenamiento de fuerza es <strong className="text-blue-400">vital</strong> a partir de los 50 años. El músculo actúa como un "sumidero" de glucosa, mejorando drásticamente la sensibilidad a la insulina sin impacto en las articulaciones.
        </p>
      </div>

      {/* Reminders */}
      <div className="bg-[#16181d] p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-400" />
            Recordatorios
          </h2>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={reminderEnabled}
              onChange={() => setReminderEnabled(!reminderEnabled)}
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
        
        {reminderEnabled && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5 animate-in fade-in">
            <span className="text-sm text-slate-400">Hora de aviso (Lun, Mié, Vie)</span>
            <input 
              type="time" 
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="bg-[#0f1115] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        )}
      </div>

      {/* Routine */}
      <div className="space-y-4">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-lg font-semibold text-white">Rutina Full-Body (Banda)</h2>
          <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-full">30 Minutos</span>
        </div>

        {ELASTIC_BAND_EXERCISES.map((exercise) => (
          <div key={exercise.id} className="bg-[#16181d] p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-white font-medium">{exercise.name}</h3>
              <div className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-[#0f1115] px-2 py-1 rounded-lg border border-white/5">
                <PlayCircle className="w-3 h-3 text-emerald-400" />
                {exercise.sets} series x {exercise.reps}
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{exercise.description}</p>
          </div>
        ))}

        <button 
          onClick={handleCompleteWorkout}
          disabled={workoutCompleted}
          className={`w-full py-4 mt-6 font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
            workoutCompleted 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
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
    </div>
  );
}
