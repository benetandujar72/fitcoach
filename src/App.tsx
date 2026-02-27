import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { MealPlanner } from './components/MealPlanner';
import { Chatbot } from './components/Chatbot';
import { Profile } from './components/Profile';
import { Training } from './components/Training';
import { Diary } from './components/Diary';
import { LayoutDashboard, Utensils, MessageSquare, UserCircle, Dumbbell, BookOpen, Key } from 'lucide-react';
import { LoggedMeal, ActivityLog, UserProfile } from './types';

type Tab = 'home' | 'planner' | 'training' | 'diary' | 'chat' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [hasKey, setHasKey] = useState(true);
  const [checkingKey, setCheckingKey] = useState(true);

  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Comandante',
    age: 55,
    weight: 80,
    targetCarbs: 50,
    targetProtein: 120,
    targetFat: 70,
    dietaryRestrictions: '',
    foodPreferences: ''
  });

  useEffect(() => {
    const checkKey = async () => {
      try {
        // @ts-ignore
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          // @ts-ignore
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasKey(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (checkingKey) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-emerald-400">Cargando...</div>;
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
        <div className="bg-[#16181d] p-8 rounded-3xl border border-white/10 max-w-md text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/50">
            <Key className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Requiere API Key</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Para usar las funciones avanzadas de IA (visión, voz, análisis adaptativo y generación de planes), necesitas seleccionar tu clave de API de Gemini.
          </p>
          <button 
            onClick={handleSelectKey} 
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
          >
            Seleccionar API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-0 sm:p-4 font-sans selection:bg-emerald-500/30">
      {/* Mobile App Container Simulation */}
      <div className="w-full h-[100dvh] sm:h-[850px] sm:max-w-[400px] bg-[#0f1115] sm:rounded-[2.5rem] sm:border-[8px] border-[#1e2128] overflow-hidden relative shadow-2xl flex flex-col">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'home' && <Dashboard loggedMeals={loggedMeals} activities={activities} setActivities={setActivities} profile={userProfile} />}
          {activeTab === 'planner' && <MealPlanner loggedMeals={loggedMeals} setLoggedMeals={setLoggedMeals} profile={userProfile} />}
          {activeTab === 'training' && <Training setActivities={setActivities} />}
          {activeTab === 'diary' && <Diary loggedMeals={loggedMeals} activities={activities} profile={userProfile} />}
          {activeTab === 'chat' && <Chatbot />}
          {activeTab === 'profile' && <Profile profile={userProfile} setProfile={setUserProfile} />}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-[#16181d]/90 backdrop-blur-md border-t border-white/10 px-4 py-3 flex justify-between items-center z-50 overflow-x-auto scrollbar-hide">
          <NavItem 
            icon={LayoutDashboard} 
            label="Inicio" 
            isActive={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
          />
          <NavItem 
            icon={Utensils} 
            label="Plan" 
            isActive={activeTab === 'planner'} 
            onClick={() => setActiveTab('planner')} 
          />
          <NavItem 
            icon={Dumbbell} 
            label="Entreno" 
            isActive={activeTab === 'training'} 
            onClick={() => setActiveTab('training')} 
          />
          <NavItem 
            icon={BookOpen} 
            label="Diario" 
            isActive={activeTab === 'diary'} 
            onClick={() => setActiveTab('diary')} 
          />
          <NavItem 
            icon={MessageSquare} 
            label="BioBot" 
            isActive={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
          />
          <NavItem 
            icon={UserCircle} 
            label="Perfil" 
            isActive={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
          />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <Icon className={`w-6 h-6 ${isActive ? 'fill-emerald-400/20' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

