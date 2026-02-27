import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Save, UserCircle, Target, Activity, HeartOff } from 'lucide-react';

export function Profile({ profile, setProfile }: { profile: UserProfile, setProfile: React.Dispatch<React.SetStateAction<UserProfile>> }) {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: ['name', 'dietaryRestrictions', 'foodPreferences'].includes(name) ? value : Number(value) 
    }));
  };

  const handleSave = () => {
    setProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 space-y-6 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
          <p className="text-slate-400 text-sm">Configuración y objetivos</p>
        </div>
        <UserCircle className="w-10 h-10 text-emerald-400" />
      </div>

      <div className="bg-[#16181d] p-5 rounded-2xl border border-white/5 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-slate-400" />
          Datos Personales
        </h2>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nombre</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Edad</label>
              <input 
                type="number" 
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Peso (kg)</label>
              <input 
                type="number" 
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#16181d] p-5 rounded-2xl border border-white/5 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <HeartOff className="w-5 h-5 text-slate-400" />
          Preferencias y Restricciones
        </h2>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Restricciones Dietéticas (Alergias, Vegano, Celíaco...)</label>
            <textarea 
              name="dietaryRestrictions"
              value={formData.dietaryRestrictions}
              onChange={handleChange}
              placeholder="Ej: Alérgico a los cacahuetes, intolerante a la lactosa"
              className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50 resize-none h-20"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Preferencias de Alimentos (Gustos, formas de cocción...)</label>
            <textarea 
              name="foodPreferences"
              value={formData.foodPreferences}
              onChange={handleChange}
              placeholder="Ej: No me gusta el brócoli hervido, prefiero la espinaca cruda"
              className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50 resize-none h-20"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#16181d] p-5 rounded-2xl border border-white/5 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-slate-400" />
          Objetivos Diarios (Macros)
        </h2>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Carbohidratos Netos (g) - <span className="text-red-400">Crítico para Insulina</span></label>
            <input 
              type="number" 
              name="targetCarbs"
              value={formData.targetCarbs}
              onChange={handleChange}
              className="w-full bg-[#0f1115] border border-red-500/30 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Proteína (g)</label>
            <input 
              type="number" 
              name="targetProtein"
              value={formData.targetProtein}
              onChange={handleChange}
              className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Grasas Saludables (g)</label>
            <input 
              type="number" 
              name="targetFat"
              value={formData.targetFat}
              onChange={handleChange}
              className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-yellow-500/50"
            />
          </div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {saved ? 'Guardado' : 'Guardar Perfil'}
      </button>
    </div>
  );
}
