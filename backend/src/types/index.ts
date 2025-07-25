export interface Recipe {
  id: string;
  name: string;
  servings: number;
  totalTime: number; // in minutes
  ingredients: Ingredient[];
  steps: RecipeStep[];
  equipment: Equipment[];
  priority: 'high' | 'medium' | 'low'; // freshness priority
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: 'protein' | 'vegetable' | 'grain' | 'dairy' | 'spice' | 'other';
}

export interface RecipeStep {
  id: string;
  instruction: string;
  duration: number; // in minutes
  type: 'prep' | 'cook' | 'rest' | 'serve';
  equipment?: Equipment[];
  temperature?: number;
  dependencies?: string[]; // step IDs this depends on
}

export interface Equipment {
  id: string;
  name: string;
  type: 'oven' | 'stovetop' | 'prep-space' | 'mixer' | 'other';
  capacity: number;
}

export interface TimelineTask {
  id: string;
  recipeId: string;
  recipeName: string;
  stepId: string;
  instruction: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  type: 'prep' | 'cook' | 'rest' | 'serve';
  equipment?: Equipment[];
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface MealPlan {
  id: string;
  name: string;
  recipes: Recipe[];
  targetTime: Date;
  diners: number;
  timeline: TimelineTask[];
  createdAt: Date;
  equipment: Equipment[];
}

export interface TimelineState {
  currentTask?: TimelineTask;
  upcomingTasks: TimelineTask[];
  completedTasks: TimelineTask[];
  isActive: boolean;
  startTime?: Date;
}