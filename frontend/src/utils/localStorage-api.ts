export interface Meal {
  meal_id: string;
  target_time: string;
  diners: number;
  cooking_capacity: number;
  recipes: Recipe[];
  timeline?: Task[];
}

export interface Recipe {
  recipe_id: string;
  url: string;
  title: string;
  estimated_duration: number;
}

export interface Task {
  task_id: string;
  recipe_id: string;
  recipe_title: string;
  instruction: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  task_type: 'prep' | 'active_cooking' | 'passive_cooking';
  equipment_needed: string[];
  status: 'pending' | 'active' | 'completed';
}

const generateMockTimeline = (recipes: Recipe[], diners: number, targetTime: string): Task[] => {
  const tasks: Task[] = [];
  const targetDate = new Date(targetTime);
  let currentTime = new Date(targetDate.getTime() - 120 * 60000);
  
  recipes.forEach((recipe, recipeIndex) => {
    const recipeTasks = [
      {
        task_id: `prep-${recipeIndex}`,
        recipe_id: recipe.recipe_id,
        recipe_title: recipe.title,
        instruction: `Prep ingredients for ${recipe.title}`,
        start_time: currentTime.toISOString(),
        end_time: new Date(currentTime.getTime() + 15 * 60000).toISOString(),
        duration_minutes: 15,
        task_type: 'prep' as const,
        equipment_needed: ['knife', 'cutting board'],
        status: 'pending' as const
      },
      {
        task_id: `cook-${recipeIndex}`,
        recipe_id: recipe.recipe_id,
        recipe_title: recipe.title,
        instruction: `Cook ${recipe.title}`,
        start_time: new Date(currentTime.getTime() + 20 * 60000).toISOString(),
        end_time: new Date(currentTime.getTime() + 50 * 60000).toISOString(),
        duration_minutes: 30,
        task_type: 'active_cooking' as const,
        equipment_needed: ['stovetop'],
        status: 'pending' as const
      }
    ];
    
    tasks.push(...recipeTasks);
    currentTime = new Date(currentTime.getTime() + 60 * 60000);
  });
  
  return tasks;
};

export const localStorageAPI = {
  async createMeal(data: {
    recipes: string[];
    diners: number;
    cooking_capacity: number;
    target_time: string;
  }): Promise<Meal> {
    const mealId = `meal-${Date.now()}`;
    
    const recipes: Recipe[] = data.recipes.map((url, index) => ({
      recipe_id: `recipe-${index}`,
      url,
      title: `Recipe ${index + 1}`,
      estimated_duration: 45
    }));
    
    const timeline = generateMockTimeline(recipes, data.diners, data.target_time);
    
    const meal: Meal = {
      meal_id: mealId,
      target_time: data.target_time,
      diners: data.diners,
      cooking_capacity: data.cooking_capacity,
      recipes,
      timeline
    };
    
    localStorage.setItem(`meal-${mealId}`, JSON.stringify(meal));
    localStorage.setItem('currentMealId', mealId);
    
    return meal;
  },

  async getMeal(mealId: string): Promise<Meal | null> {
    const stored = localStorage.getItem(`meal-${mealId}`);
    return stored ? JSON.parse(stored) : null;
  },

  async getCurrentTask(mealId: string): Promise<Task | null> {
    const meal = await this.getMeal(mealId);
    if (!meal?.timeline) return null;
    
    const now = new Date();
    const currentTask = meal.timeline.find(task => 
      task.status === 'pending' && new Date(task.start_time) <= now
    );
    
    return currentTask || meal.timeline.find(task => task.status === 'pending') || null;
  },

  async completeTask(mealId: string, taskId: string): Promise<void> {
    const meal = await this.getMeal(mealId);
    if (!meal?.timeline) return;
    
    const task = meal.timeline.find(t => t.task_id === taskId);
    if (task) {
      task.status = 'completed';
      localStorage.setItem(`meal-${mealId}`, JSON.stringify(meal));
    }
  },

  async delayTask(mealId: string, taskId: string, delayMinutes: number): Promise<void> {
    const meal = await this.getMeal(mealId);
    if (!meal?.timeline) return;
    
    const task = meal.timeline.find(t => t.task_id === taskId);
    if (task) {
      const startTime = new Date(task.start_time);
      const endTime = new Date(task.end_time);
      
      startTime.setMinutes(startTime.getMinutes() + delayMinutes);
      endTime.setMinutes(endTime.getMinutes() + delayMinutes);
      
      task.start_time = startTime.toISOString();
      task.end_time = endTime.toISOString();
      
      localStorage.setItem(`meal-${mealId}`, JSON.stringify(meal));
    }
  }
};
