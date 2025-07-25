import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  MealRequest,
  MealResponse,
  TimelineResponse,
  TaskCompletionRequest,
  TaskCompletionResponse,
  CurrentTaskResponse,
  ApiError,
  TimelineTask,
  TaskStatus,
  MealStatus
} from '../types/api';
import { Recipe, Equipment } from '../types';
import { TimelineGenerator } from '../utils/timelineGenerator';
import { RecipeParser } from '../utils/recipeParser';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (in production, use a proper database)
const meals = new Map<string, MealData>();
const tasks = new Map<string, TimelineTask>();

interface MealData {
  meal_id: string;
  timeline: TimelineTask[];
  created_at: string;
  target_time: string;
  diners: number;
  status: MealStatus;
  recipes: Recipe[];
  equipment: Equipment[];
}

// Error handler
const createError = (code: number, error: string, message: string): ApiError => ({
  error,
  message,
  code,
  timestamp: new Date().toISOString()
});

// POST /meal - Create new meal timeline
app.post('/meal', (req, res) => {
  try {
    const mealRequest: MealRequest = req.body;
    
    // Validate request
    if (!mealRequest.recipes || !Array.isArray(mealRequest.recipes) || mealRequest.recipes.length === 0) {
      return res.status(400).json(createError(400, 'INVALID_REQUEST', 'At least one recipe is required'));
    }
    
    if (!mealRequest.target_time || !mealRequest.diners || !mealRequest.capacity) {
      return res.status(400).json(createError(400, 'MISSING_FIELDS', 'target_time, diners, and capacity are required'));
    }

    // Validate target time
    const targetTime = new Date(mealRequest.target_time);
    if (isNaN(targetTime.getTime())) {
      return res.status(400).json(createError(400, 'INVALID_TIME', 'target_time must be a valid ISO 8601 timestamp'));
    }

    // Convert API format to internal format
    const recipes: Recipe[] = mealRequest.recipes.map(recipeInput => ({
      id: uuidv4(),
      name: recipeInput.name,
      servings: recipeInput.servings,
      totalTime: recipeInput.steps.reduce((sum, step) => sum + step.duration, 0),
      ingredients: recipeInput.ingredients.map(ing => ({
        id: uuidv4(),
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        category: ing.category
      })),
      steps: recipeInput.steps.map(step => ({
        id: uuidv4(),
        instruction: step.instruction,
        duration: step.duration,
        type: step.type,
        equipment: step.equipment?.map(eq => ({ id: eq, name: eq, type: 'other' as const, capacity: 1 })) || [],
        temperature: step.temperature
      })),
      equipment: [],
      priority: recipeInput.priority
    }));

    // Convert capacity to equipment
    const equipment: Equipment[] = [
      ...Array(mealRequest.capacity.oven).fill(0).map((_, i) => ({
        id: `oven-${i + 1}`,
        name: 'Oven',
        type: 'oven' as const,
        capacity: 1
      })),
      ...Array(mealRequest.capacity.stovetop).fill(0).map((_, i) => ({
        id: `stovetop-${i + 1}`,
        name: 'Stovetop',
        type: 'stovetop' as const,
        capacity: 1
      })),
      ...Array(mealRequest.capacity.prep_space).fill(0).map((_, i) => ({
        id: `prep-${i + 1}`,
        name: 'Prep Space',
        type: 'prep-space' as const,
        capacity: 1
      })),
      ...Array(mealRequest.capacity.mixer).fill(0).map((_, i) => ({
        id: `mixer-${i + 1}`,
        name: 'Mixer',
        type: 'mixer' as const,
        capacity: 1
      }))
    ];

    // Generate timeline
    const timelineTasks = TimelineGenerator.generateTimeline(
      recipes,
      targetTime,
      mealRequest.diners,
      equipment
    );

    // Convert to API format
    const apiTasks: TimelineTask[] = timelineTasks.map(task => ({
      task_id: uuidv4(),
      meal_id: '',
      recipe_name: task.recipeName,
      instruction: task.instruction,
      start_time: task.startTime.toISOString(),
      end_time: task.endTime.toISOString(),
      duration: task.duration,
      type: task.type,
      equipment: task.equipment?.map(eq => eq.name) || [],
      status: 'pending' as TaskStatus,
      priority: task.priority,
      dependencies: []
    }));

    const mealId = uuidv4();
    
    // Update meal_id in tasks
    apiTasks.forEach(task => {
      task.meal_id = mealId;
      tasks.set(task.task_id, task);
    });

    const mealData: MealData = {
      meal_id: mealId,
      timeline: apiTasks,
      created_at: new Date().toISOString(),
      target_time: mealRequest.target_time,
      diners: mealRequest.diners,
      status: 'pending',
      recipes,
      equipment
    };

    meals.set(mealId, mealData);

    const response: MealResponse = {
      meal_id: mealId,
      timeline: apiTasks,
      created_at: mealData.created_at,
      target_time: mealData.target_time,
      diners: mealData.diners,
      status: mealData.status
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating meal:', error);
    res.status(500).json(createError(500, 'INTERNAL_ERROR', 'Failed to create meal timeline'));
  }
});

// GET /timeline/:id - Get current timeline state
app.get('/timeline/:id', (req, res) => {
  try {
    const mealId = req.params.id;
    const meal = meals.get(mealId);

    if (!meal) {
      return res.status(404).json(createError(404, 'MEAL_NOT_FOUND', 'Meal not found'));
    }

    const completedTasks = meal.timeline.filter(task => task.status === 'completed').length;
    const totalTasks = meal.timeline.length;

    const response: TimelineResponse = {
      meal_id: mealId,
      timeline: meal.timeline,
      current_time: new Date().toISOString(),
      status: meal.status,
      progress: {
        completed_tasks: completedTasks,
        total_tasks: totalTasks,
        percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting timeline:', error);
    res.status(500).json(createError(500, 'INTERNAL_ERROR', 'Failed to retrieve timeline'));
  }
});

// PUT /task/:id/complete - Mark task as completed
app.put('/task/:id/complete', (req, res) => {
  try {
    const taskId = req.params.id;
    const completionRequest: TaskCompletionRequest = req.body;
    
    const task = tasks.get(taskId);
    if (!task) {
      return res.status(404).json(createError(404, 'TASK_NOT_FOUND', 'Task not found'));
    }

    const meal = meals.get(task.meal_id);
    if (!meal) {
      return res.status(404).json(createError(404, 'MEAL_NOT_FOUND', 'Associated meal not found'));
    }

    // Validate completion time
    const completedAt = new Date(completionRequest.completed_at);
    if (isNaN(completedAt.getTime())) {
      return res.status(400).json(createError(400, 'INVALID_TIME', 'completed_at must be a valid ISO 8601 timestamp'));
    }

    // Mark task as completed
    task.status = 'completed';
    
    // Update task in meal timeline
    const taskIndex = meal.timeline.findIndex(t => t.task_id === taskId);
    if (taskIndex !== -1) {
      meal.timeline[taskIndex] = task;
    }

    // Calculate timeline adjustments
    const scheduledEndTime = new Date(task.end_time);
    const timeDifference = completedAt.getTime() - scheduledEndTime.getTime();
    
    const adjustments = meal.timeline
      .filter(t => t.status === 'pending' && new Date(t.start_time) > scheduledEndTime)
      .map(t => {
        const oldStartTime = t.start_time;
        const oldEndTime = t.end_time;
        const newStartTime = new Date(new Date(t.start_time).getTime() + timeDifference).toISOString();
        const newEndTime = new Date(new Date(t.end_time).getTime() + timeDifference).toISOString();
        
        // Update the task
        t.start_time = newStartTime;
        t.end_time = newEndTime;
        tasks.set(t.task_id, t);
        
        return {
          task_id: t.task_id,
          old_start_time: oldStartTime,
          new_start_time: newStartTime,
          old_end_time: oldEndTime,
          new_end_time: newEndTime,
          reason: timeDifference > 0 ? 'Task completed late' : 'Task completed early'
        };
      });

    // Update meal status if all tasks completed
    const allCompleted = meal.timeline.every(t => t.status === 'completed');
    if (allCompleted) {
      meal.status = 'completed';
    } else if (meal.status === 'pending') {
      meal.status = 'active';
    }

    const response: TaskCompletionResponse = {
      task_id: taskId,
      status: 'completed',
      completed_at: completedAt.toISOString(),
      timeline_adjustments: adjustments
    };

    res.json(response);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json(createError(500, 'INTERNAL_ERROR', 'Failed to complete task'));
  }
});

// GET /current-task/:timeline_id - Get active task details
app.get('/current-task/:timeline_id', (req, res) => {
  try {
    const mealId = req.params.timeline_id;
    const meal = meals.get(mealId);

    if (!meal) {
      return res.status(404).json(createError(404, 'MEAL_NOT_FOUND', 'Meal not found'));
    }

    const now = new Date();
    
    // Find current active task
    const currentTask = meal.timeline.find(task => 
      task.status !== 'completed' &&
      new Date(task.start_time) <= now && 
      new Date(task.end_time) > now
    ) || null;

    // Find upcoming tasks (next 3)
    const upcomingTasks = meal.timeline
      .filter(task => task.status === 'pending' && new Date(task.start_time) > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3);

    // Calculate time until next task
    const nextTask = upcomingTasks[0];
    const timeUntilNext = nextTask 
      ? Math.ceil((new Date(nextTask.start_time).getTime() - now.getTime()) / (60 * 1000))
      : null;

    // Count active tasks
    const activeTasksCount = meal.timeline.filter(task =>
      task.status !== 'completed' &&
      new Date(task.start_time) <= now &&
      new Date(task.end_time) > now
    ).length;

    const response: CurrentTaskResponse = {
      task: currentTask,
      upcoming_tasks: upcomingTasks,
      time_until_next: timeUntilNext,
      active_tasks_count: activeTasksCount
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting current task:', error);
    res.status(500).json(createError(500, 'INTERNAL_ERROR', 'Failed to retrieve current task'));
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;