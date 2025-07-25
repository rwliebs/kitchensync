// API utility functions for Kitchen Sync
/**
 * Create a new meal plan
 */
export async function createMeal(mealData) {
  try {
    const response = await fetch('/api/meals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mealData)
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating meal:', error);
    throw error;
  }
}
/**
 * Get a meal plan by ID
 */
export async function getMeal(mealId) {
  try {
    const response = await fetch(`/api/meals/${mealId}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching meal:', error);
    throw error;
  }
}
/**
 * Get the current task for a meal
 */
export async function getCurrentTask(mealId) {
  try {
    const response = await fetch(`/api/meals/${mealId}/current-task`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching current task:', error);
    throw error;
  }
}
/**
 * Mark a task as complete
 */
export async function completeTask(mealId, taskId) {
  try {
    const response = await fetch(`/api/meals/${mealId}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
}
/**
 * Delay a task
 */
export async function delayTask(mealId, taskId, delayMinutes = 5) {
  try {
    const response = await fetch(`/api/meals/${mealId}/tasks/${taskId}/delay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        delayMinutes
      })
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error delaying task:', error);
    throw error;
  }
}