import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (in production, use a proper database)
const meals = new Map();
const tasks = new Map();

// Error handler
const createError = (code, error, message) => ({
  error,
  message,
  code,
  timestamp: new Date().toISOString()
});

// Recipe Parser Class
class RecipeParser {
  static parseRecipeText(text, name) {
    const lines = text.split('\n').filter(line => line.trim());
    
    let ingredients = [];
    let steps = [];
    let currentSection = 'none';
    
    lines.forEach((line, index) => {
      const lower = line.toLowerCase().trim();
      
      if (lower.includes('ingredient') || lower.includes('you need') || lower.startsWith('*') || lower.match(/^\d+\s+(cup|tbsp|tsp|lb|oz)/)) {
        currentSection = 'ingredients';
        if (!lower.includes('ingredient')) {
          ingredients.push(this.parseIngredient(line, `ing-${index}`));
        }
      } else if (lower.includes('instruction') || lower.includes('step') || lower.match(/^\d+\./)) {
        currentSection = 'steps';
        if (!lower.includes('instruction')) {
          steps.push(this.parseStep(line, `step-${index}`));
        }
      } else if (currentSection === 'ingredients' && line.trim()) {
        ingredients.push(this.parseIngredient(line, `ing-${index}`));
      } else if (currentSection === 'steps' && line.trim()) {
        steps.push(this.parseStep(line, `step-${index}`));
      }
    });

    return {
      id: `recipe-${Date.now()}`,
      name,
      servings: 4,
      totalTime: steps.reduce((sum, step) => sum + step.duration, 0),
      ingredients,
      steps,
      equipment: this.inferEquipment(steps),
      priority: this.inferPriority(steps)
    };
  }

  static parseIngredient(text, id) {
    const match = text.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)/);
    
    if (match) {
      return {
        id,
        amount: parseFloat(match[1]),
        unit: match[2] || 'unit',
        name: match[3].trim(),
        category: this.categorizeIngredient(match[3])
      };
    }

    return {
      id,
      amount: 1,
      unit: 'unit',
      name: text.replace(/^[\d\.\s]*/, '').trim(),
      category: 'other'
    };
  }

  static parseStep(text, id) {
    const cleanText = text.replace(/^\d+\.\s*/, '').trim();
    
    return {
      id,
      instruction: cleanText,
      duration: this.estimateDuration(cleanText),
      type: this.classifyStepType(cleanText),
      equipment: this.extractEquipment(cleanText)
    };
  }

  static estimateDuration(instruction) {
    const lower = instruction.toLowerCase();
    
    const timeMatch = lower.match(/(\d+)\s*(minute|min|hour|hr)/);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2];
      return unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 : value;
    }

    if (lower.includes('bake') || lower.includes('roast')) return 30;
    if (lower.includes('simmer') || lower.includes('braise')) return 20;
    if (lower.includes('sauté') || lower.includes('fry')) return 10;
    if (lower.includes('boil')) return 15;
    if (lower.includes('chop') || lower.includes('dice') || lower.includes('slice')) return 5;
    if (lower.includes('mix') || lower.includes('stir') || lower.includes('combine')) return 3;
    if (lower.includes('preheat')) return 10;
    if (lower.includes('rest') || lower.includes('cool') || lower.includes('chill')) return 15;

    return 5;
  }

  static classifyStepType(instruction) {
    const lower = instruction.toLowerCase();
    
    if (lower.includes('serve') || lower.includes('plate') || lower.includes('garnish')) return 'serve';
    if (lower.includes('rest') || lower.includes('cool') || lower.includes('chill') || lower.includes('stand')) return 'rest';
    if (lower.includes('cook') || lower.includes('bake') || lower.includes('fry') || lower.includes('sauté') || 
        lower.includes('boil') || lower.includes('simmer') || lower.includes('roast') || lower.includes('grill')) return 'cook';
    
    return 'prep';
  }

  static extractEquipment(instruction) {
    const lower = instruction.toLowerCase();
    const equipment = [];
    
    if (lower.includes('oven') || lower.includes('bake') || lower.includes('roast')) {
      equipment.push({ id: 'oven-1', name: 'Oven', type: 'oven', capacity: 1 });
    }
    if (lower.includes('pan') || lower.includes('skillet') || lower.includes('sauté') || lower.includes('fry')) {
      equipment.push({ id: 'stovetop-1', name: 'Stovetop', type: 'stovetop', capacity: 4 });
    }
    if (lower.includes('pot') || lower.includes('boil') || lower.includes('simmer')) {
      equipment.push({ id: 'stovetop-2', name: 'Stovetop', type: 'stovetop', capacity: 4 });
    }
    if (lower.includes('mixer') || lower.includes('whip') || lower.includes('beat')) {
      equipment.push({ id: 'mixer-1', name: 'Mixer', type: 'mixer', capacity: 1 });
    }

    return equipment;
  }

  static categorizeIngredient(name) {
    const lower = name.toLowerCase();
    
    if (lower.includes('chicken') || lower.includes('beef') || lower.includes('pork') || 
        lower.includes('fish') || lower.includes('egg')) return 'protein';
    if (lower.includes('onion') || lower.includes('carrot') || lower.includes('potato') || 
        lower.includes('pepper') || lower.includes('tomato')) return 'vegetable';
    if (lower.includes('rice') || lower.includes('pasta') || lower.includes('bread') || 
        lower.includes('flour')) return 'grain';
    if (lower.includes('milk') || lower.includes('cheese') || lower.includes('butter') || 
        lower.includes('cream')) return 'dairy';
    if (lower.includes('salt') || lower.includes('pepper') || lower.includes('herb') || 
        lower.includes('spice')) return 'spice';
    
    return 'other';
  }

  static inferEquipment(steps) {
    const equipmentSet = new Set();
    steps.forEach(step => {
      step.equipment?.forEach(eq => equipmentSet.add(eq.id));
    });
    
    return Array.from(equipmentSet).map(id => ({
      id,
      name: id.split('-')[0],
      type: id.split('-')[0],
      capacity: 1
    }));
  }

  static inferPriority(steps) {
    const hasQuickDegrading = steps.some(step => {
      const lower = step.instruction.toLowerCase();
      return lower.includes('fry') || lower.includes('crispy') || 
             lower.includes('fresh') || lower.includes('immediately');
    });
    
    if (hasQuickDegrading) return 'high';
    
    const hasCooking = steps.some(step => step.type === 'cook');
    return hasCooking ? 'medium' : 'low';
  }
}

// Timeline Generator Class
class TimelineGenerator {
  static generateTimeline(recipes, targetTime, diners, availableEquipment) {
    const scaledRecipes = recipes.map(recipe => this.scaleRecipe(recipe, diners));
    
    const sortedRecipes = [...scaledRecipes].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const timeline = [];
    const equipmentSchedule = new Map();
    
    availableEquipment.forEach(eq => {
      equipmentSchedule.set(eq.id, []);
    });

    let currentTargetTime = new Date(targetTime);

    for (let i = sortedRecipes.length - 1; i >= 0; i--) {
      const recipe = sortedRecipes[i];
      const recipeTasks = this.scheduleRecipe(
        recipe,
        currentTargetTime,
        equipmentSchedule
      );
      
      timeline.unshift(...recipeTasks);
      
      if (i > 0) {
        currentTargetTime = new Date(currentTargetTime.getTime() - 5 * 60 * 1000);
      }
    }

    return timeline
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .map(task => ({
        ...task,
        startTime: this.roundToFiveMinutes(task.startTime),
        endTime: this.roundToFiveMinutes(task.endTime)
      }));
  }

  static scaleRecipe(recipe, targetServings) {
    const scaleFactor = targetServings / recipe.servings;
    
    return {
      ...recipe,
      servings: targetServings,
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        amount: ing.amount * scaleFactor
      })),
      steps: recipe.steps.map(step => ({
        ...step,
        duration: step.type === 'prep' ? Math.ceil(step.duration * scaleFactor) : step.duration
      }))
    };
  }

  static scheduleRecipe(recipe, targetEndTime, equipmentSchedule) {
    const tasks = [];
    let currentTime = new Date(targetEndTime);

    for (let i = recipe.steps.length - 1; i >= 0; i--) {
      const step = recipe.steps[i];
      
      const availableTime = this.findAvailableEquipmentTime(
        step.equipment || [],
        currentTime,
        step.duration,
        equipmentSchedule
      );

      const startTime = new Date(availableTime.getTime() - step.duration * 60 * 1000);
      
      const task = {
        id: `${recipe.id}-${step.id}`,
        recipeId: recipe.id,
        recipeName: recipe.name,
        stepId: step.id,
        instruction: step.instruction,
        startTime,
        endTime: availableTime,
        duration: step.duration,
        type: step.type,
        equipment: step.equipment,
        completed: false,
        priority: recipe.priority
      };

      tasks.unshift(task);

      step.equipment?.forEach(eq => {
        const schedule = equipmentSchedule.get(eq.id) || [];
        schedule.push(startTime, availableTime);
        equipmentSchedule.set(eq.id, schedule.sort((a, b) => a.getTime() - b.getTime()));
      });

      currentTime = startTime;
    }

    return tasks;
  }

  static findAvailableEquipmentTime(requiredEquipment, preferredEndTime, duration, equipmentSchedule) {
    if (requiredEquipment.length === 0) {
      return preferredEndTime;
    }

    let earliestTime = preferredEndTime;
    
    for (const equipment of requiredEquipment) {
      const schedule = equipmentSchedule.get(equipment.id) || [];
      
      const needsAdjustment = this.hasEquipmentConflict(
        new Date(preferredEndTime.getTime() - duration * 60 * 1000),
        preferredEndTime,
        schedule
      );

      if (needsAdjustment) {
        const availableSlot = this.findNextAvailableSlot(
          schedule,
          duration,
          preferredEndTime
        );
        if (availableSlot.getTime() < earliestTime.getTime()) {
          earliestTime = availableSlot;
        }
      }
    }

    return earliestTime;
  }

  static hasEquipmentConflict(startTime, endTime, schedule) {
    for (let i = 0; i < schedule.length; i += 2) {
      const bookedStart = schedule[i];
      const bookedEnd = schedule[i + 1];
      
      if (
        (startTime >= bookedStart && startTime < bookedEnd) ||
        (endTime > bookedStart && endTime <= bookedEnd) ||
        (startTime <= bookedStart && endTime >= bookedEnd)
      ) {
        return true;
      }
    }
    return false;
  }

  static findNextAvailableSlot(schedule, duration, preferredTime) {
    if (schedule.length === 0) {
      return preferredTime;
    }

    if (schedule[0].getTime() - preferredTime.getTime() >= duration * 60 * 1000) {
      return preferredTime;
    }

    for (let i = 0; i < schedule.length - 1; i += 2) {
      const gapStart = schedule[i + 1];
      const gapEnd = schedule[i + 2] || new Date(Date.now() + 24 * 60 * 60 * 1000);
      const gapDuration = (gapEnd.getTime() - gapStart.getTime()) / (60 * 1000);
      
      if (gapDuration >= duration) {
        return new Date(gapStart.getTime() + duration * 60 * 1000);
      }
    }

    const lastEnd = schedule[schedule.length - 1];
    return new Date(lastEnd.getTime() + duration * 60 * 1000);
  }

  static roundToFiveMinutes(date) {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    const remainder = minutes % 5;
    
    if (remainder !== 0) {
      rounded.setMinutes(minutes - remainder);
    }
    rounded.setSeconds(0, 0);
    
    return rounded;
  }

  static adjustTimelineForCompletion(timeline, completedTaskId) {
    const now = new Date();
    const completedIndex = timeline.findIndex(task => task.id === completedTaskId);
    
    if (completedIndex === -1) return timeline;

    timeline[completedIndex].completed = true;

    const scheduledEndTime = timeline[completedIndex].endTime;
    const timeDifference = now.getTime() - scheduledEndTime.getTime();

    return timeline.map((task, index) => {
      if (index <= completedIndex) return task;
      
      return {
        ...task,
        startTime: new Date(task.startTime.getTime() + timeDifference),
        endTime: new Date(task.endTime.getTime() + timeDifference)
      };
    });
  }
}

// POST /meal - Create new meal timeline
app.post('/meal', (req, res) => {
  try {
    const mealRequest = req.body;
    
    if (!mealRequest.recipes || !Array.isArray(mealRequest.recipes) || mealRequest.recipes.length === 0) {
      return res.status(400).json(createError(400, 'INVALID_REQUEST', 'At least one recipe is required'));
    }
    
    if (!mealRequest.target_time || !mealRequest.diners || !mealRequest.capacity) {
      return res.status(400).json(createError(400, 'MISSING_FIELDS', 'target_time, diners, and capacity are required'));
    }

    const targetTime = new Date(mealRequest.target_time);
    if (isNaN(targetTime.getTime())) {
      return res.status(400).json(createError(400, 'INVALID_TIME', 'target_time must be a valid ISO 8601 timestamp'));
    }

    // Convert API format to internal format
    const recipes = mealRequest.recipes.map(recipeInput => ({
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
        equipment: step.equipment?.map(eq => ({ id: eq, name: eq, type: 'other', capacity: 1 })) || [],
        temperature: step.temperature
      })),
      equipment: [],
      priority: recipeInput.priority
    }));

    // Convert capacity to equipment
    const equipment = [
      ...Array(mealRequest.capacity.oven).fill(0).map((_, i) => ({
        id: `oven-${i + 1}`,
        name: 'Oven',
        type: 'oven',
        capacity: 1
      })),
      ...Array(mealRequest.capacity.stovetop).fill(0).map((_, i) => ({
        id: `stovetop-${i + 1}`,
        name: 'Stovetop',
        type: 'stovetop',
        capacity: 1
      })),
      ...Array(mealRequest.capacity.prep_space).fill(0).map((_, i) => ({
        id: `prep-${i + 1}`,
        name: 'Prep Space',
        type: 'prep-space',
        capacity: 1
      })),
      ...Array(mealRequest.capacity.mixer).fill(0).map((_, i) => ({
        id: `mixer-${i + 1}`,
        name: 'Mixer',
        type: 'mixer',
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
    const apiTasks = timelineTasks.map(task => ({
      task_id: uuidv4(),
      meal_id: '',
      recipe_name: task.recipeName,
      instruction: task.instruction,
      start_time: task.startTime.toISOString(),
      end_time: task.endTime.toISOString(),
      duration: task.duration,
      type: task.type,
      equipment: task.equipment?.map(eq => eq.name) || [],
      status: 'pending',
      priority: task.priority,
      dependencies: []
    }));

    const mealId = uuidv4();
    
    // Update meal_id in tasks
    apiTasks.forEach(task => {
      task.meal_id = mealId;
      tasks.set(task.task_id, task);
    });

    const mealData = {
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

    const response = {
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

    const response = {
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
    const completionRequest = req.body;
    
    const task = tasks.get(taskId);
    if (!task) {
      return res.status(404).json(createError(404, 'TASK_NOT_FOUND', 'Task not found'));
    }

    const meal = meals.get(task.meal_id);
    if (!meal) {
      return res.status(404).json(createError(404, 'MEAL_NOT_FOUND', 'Associated meal not found'));
    }

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

    const response = {
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

    const response = {
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