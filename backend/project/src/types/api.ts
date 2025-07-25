export interface MealRequest {
  recipes: RecipeInput[];
  diners: number;
  capacity: EquipmentCapacity;
  target_time: string; // ISO 8601
}

export interface RecipeInput {
  name: string;
  ingredients: IngredientInput[];
  steps: StepInput[];
  servings: number;
  priority: 'high' | 'medium' | 'low';
}

export interface IngredientInput {
  name: string;
  amount: number;
  unit: string;
  category: 'protein' | 'vegetable' | 'grain' | 'dairy' | 'spice' | 'other';
}

export interface StepInput {
  instruction: string;
  duration: number; // minutes
  type: 'prep' | 'cook' | 'rest' | 'serve';
  equipment?: string[];
  temperature?: number;
}

export interface EquipmentCapacity {
  oven: number;
  stovetop: number;
  prep_space: number;
  mixer: number;
}

export interface MealResponse {
  meal_id: string; // UUID
  timeline: TimelineTask[];
  created_at: string; // ISO 8601
  target_time: string; // ISO 8601
  diners: number;
  status: 'pending' | 'active' | 'completed';
}

export interface TimelineTask {
  task_id: string; // UUID
  meal_id: string; // UUID
  recipe_name: string;
  instruction: string;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  duration: number; // minutes
  type: 'prep' | 'cook' | 'rest' | 'serve';
  equipment: string[];
  status: 'pending' | 'active' | 'completed';
  priority: 'high' | 'medium' | 'low';
  dependencies: string[]; // task_ids
}

export interface TimelineResponse {
  meal_id: string;
  timeline: TimelineTask[];
  current_time: string; // ISO 8601
  status: 'pending' | 'active' | 'completed';
  progress: {
    completed_tasks: number;
    total_tasks: number;
    percentage: number;
  };
}

export interface TaskCompletionRequest {
  completed_at: string; // ISO 8601
}

export interface TaskCompletionResponse {
  task_id: string;
  status: 'completed';
  completed_at: string; // ISO 8601
  timeline_adjustments: TimelineAdjustment[];
}

export interface TimelineAdjustment {
  task_id: string;
  old_start_time: string; // ISO 8601
  new_start_time: string; // ISO 8601
  old_end_time: string; // ISO 8601
  new_end_time: string; // ISO 8601
  reason: string;
}

export interface CurrentTaskResponse {
  task: TimelineTask | null;
  upcoming_tasks: TimelineTask[];
  time_until_next: number | null; // minutes
  active_tasks_count: number;
}

export interface ApiError {
  error: string;
  message: string;
  code: number;
  timestamp: string; // ISO 8601
}

export type TaskStatus = 'pending' | 'active' | 'completed';
export type MealStatus = 'pending' | 'active' | 'completed';
export type TaskType = 'prep' | 'cook' | 'rest' | 'serve';
export type Priority = 'high' | 'medium' | 'low';