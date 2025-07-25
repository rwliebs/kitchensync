import { Recipe, TimelineTask, MealPlan, Equipment } from '../types';

export class TimelineGenerator {
  static generateTimeline(
    recipes: Recipe[],
    targetTime: Date,
    diners: number,
    availableEquipment: Equipment[]
  ): TimelineTask[] {
    // Scale recipes for number of diners
    const scaledRecipes = recipes.map(recipe => this.scaleRecipe(recipe, diners));
    
    // Sort recipes by priority (high priority finishes last)
    const sortedRecipes = [...scaledRecipes].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const timeline: TimelineTask[] = [];
    const equipmentSchedule = new Map<string, Date[]>();
    
    // Initialize equipment schedule
    availableEquipment.forEach(eq => {
      equipmentSchedule.set(eq.id, []);
    });

    let currentTargetTime = new Date(targetTime);

    // Schedule recipes backwards from target time
    for (let i = sortedRecipes.length - 1; i >= 0; i--) {
      const recipe = sortedRecipes[i];
      const recipeTasks = this.scheduleRecipe(
        recipe,
        currentTargetTime,
        equipmentSchedule
      );
      
      timeline.unshift(...recipeTasks);
      
      // Adjust target time for next recipe (stagger completion)
      if (i > 0) {
        currentTargetTime = new Date(currentTargetTime.getTime() - 5 * 60 * 1000); // 5 minutes earlier
      }
    }

    // Sort timeline by start time and round to 5-minute increments
    return timeline
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .map(task => ({
        ...task,
        startTime: this.roundToFiveMinutes(task.startTime),
        endTime: this.roundToFiveMinutes(task.endTime)
      }));
  }

  private static scaleRecipe(recipe: Recipe, targetServings: number): Recipe {
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
        // Most cooking times don't scale linearly, but prep times do
        duration: step.type === 'prep' ? Math.ceil(step.duration * scaleFactor) : step.duration
      }))
    };
  }

  private static scheduleRecipe(
    recipe: Recipe,
    targetEndTime: Date,
    equipmentSchedule: Map<string, Date[]>
  ): TimelineTask[] {
    const tasks: TimelineTask[] = [];
    let currentTime = new Date(targetEndTime);

    // Schedule steps backwards
    for (let i = recipe.steps.length - 1; i >= 0; i--) {
      const step = recipe.steps[i];
      
      // Find available equipment slot
      const availableTime = this.findAvailableEquipmentTime(
        step.equipment || [],
        currentTime,
        step.duration,
        equipmentSchedule
      );

      const startTime = new Date(availableTime.getTime() - step.duration * 60 * 1000);
      
      const task: TimelineTask = {
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

      // Reserve equipment
      step.equipment?.forEach(eq => {
        const schedule = equipmentSchedule.get(eq.id) || [];
        schedule.push(startTime, availableTime);
        equipmentSchedule.set(eq.id, schedule.sort((a, b) => a.getTime() - b.getTime()));
      });

      currentTime = startTime;
    }

    return tasks;
  }

  private static findAvailableEquipmentTime(
    requiredEquipment: Equipment[],
    preferredEndTime: Date,
    duration: number,
    equipmentSchedule: Map<string, Date[]>
  ): Date {
    if (requiredEquipment.length === 0) {
      return preferredEndTime;
    }

    // Find the earliest time all equipment is available
    let earliestTime = preferredEndTime;
    
    for (const equipment of requiredEquipment) {
      const schedule = equipmentSchedule.get(equipment.id) || [];
      
      // Check for conflicts and adjust time if needed
      const needsAdjustment = this.hasEquipmentConflict(
        new Date(preferredEndTime.getTime() - duration * 60 * 1000),
        preferredEndTime,
        schedule
      );

      if (needsAdjustment) {
        // Find next available slot
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

  private static hasEquipmentConflict(
    startTime: Date,
    endTime: Date,
    schedule: Date[]
  ): boolean {
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

  private static findNextAvailableSlot(
    schedule: Date[],
    duration: number,
    preferredTime: Date
  ): Date {
    if (schedule.length === 0) {
      return preferredTime;
    }

    // Try before first booking
    if (schedule[0].getTime() - preferredTime.getTime() >= duration * 60 * 1000) {
      return preferredTime;
    }

    // Find gap between bookings
    for (let i = 0; i < schedule.length - 1; i += 2) {
      const gapStart = schedule[i + 1];
      const gapEnd = schedule[i + 2] || new Date(Date.now() + 24 * 60 * 60 * 1000);
      const gapDuration = (gapEnd.getTime() - gapStart.getTime()) / (60 * 1000);
      
      if (gapDuration >= duration) {
        return new Date(gapStart.getTime() + duration * 60 * 1000);
      }
    }

    // Schedule after last booking
    const lastEnd = schedule[schedule.length - 1];
    return new Date(lastEnd.getTime() + duration * 60 * 1000);
  }

  private static roundToFiveMinutes(date: Date): Date {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    const remainder = minutes % 5;
    
    if (remainder !== 0) {
      rounded.setMinutes(minutes - remainder);
    }
    rounded.setSeconds(0, 0);
    
    return rounded;
  }

  static adjustTimelineForCompletion(
    timeline: TimelineTask[],
    completedTaskId: string
  ): TimelineTask[] {
    const now = new Date();
    const completedIndex = timeline.findIndex(task => task.id === completedTaskId);
    
    if (completedIndex === -1) return timeline;

    // Mark task as completed
    timeline[completedIndex].completed = true;

    // Adjust remaining tasks if we're ahead or behind schedule
    const scheduledEndTime = timeline[completedIndex].endTime;
    const timeDifference = now.getTime() - scheduledEndTime.getTime();

    // Apply time adjustment to remaining tasks
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