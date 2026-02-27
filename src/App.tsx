import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { MealPlanner } from './components/MealPlanner';
import { Chatbot } from './components/Chatbot';
import { Profile } from './components/Profile';
import { Training } from './components/Training';
import { LayoutDashboard, Utensils, MessageSquare, UserCircle, Dumbbell } from 'lucide-react';
import { LoggedMeal, ActivityLog, UserProfile } from './types';

type Tab = 'home' | 'planner' | 'training' | 'chat' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-0 sm:p-4 font-sans selection:bg-emerald-500/30">
      {/* Mobile App Container Simulation */}
      <div className="w-full h-[100dvh] sm:h-[850px] sm:max-w-[400px] bg-[#0f1115] sm:rounded-[2.5rem] sm:border-[8px] border-[#1e2128] overflow-hidden relative shadow-2xl flex flex-col">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'home' && <Dashboard loggedMeals={loggedMeals} activities={activities} setActivities={setActivities} profile={userProfile} />}
          {activeTab === 'planner' && <MealPlanner loggedMeals={loggedMeals} setLoggedMeals={setLoggedMeals} profile={userProfile} />}
          {activeTab === 'training' && <Training setActivities={setActivities} />}
          {activeTab === 'chat' && <Chatbot />}
          {activeTab === 'profile' && <Profile profile={userProfile} setProfile={setUserProfile} />}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-[#16181d]/90 backdrop-blur-md border-t border-white/10 px-6 py-4 flex justify-between items-center z-50">
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

