export interface LoggedMeal {
  id: string;
  name: string;
  carbs: number;
  protein: number;
  fat: number;
  timestamp: Date;
  type: 'suggested' | 'custom' | 'manual' | 'api' | 'photo';
}

export interface ActivityLog {
  id: string;
  type: string;
  duration: number; // in minutes
  distance?: number; // in km
  heartRate?: number; // in bpm
  timestamp: Date;
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  targetCarbs: number;
  targetProtein: number;
  targetFat: number;
  dietaryRestrictions: string; // e.g., "vegano, celíaco, alérgico a los cacahuetes"
  foodPreferences: string; // e.g., "no me gusta el brócoli hervido, me gusta la espinaca en hoja pero no cocinada"
}
