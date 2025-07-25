// Generate mock tasks for the timeline
export function generateMockTasks(recipeCount, diners, capacity, targetTime) {
  const tasks = [];
  // Parse target time
  const targetDate = new Date(`2000-01-01T${targetTime}`);
  // Create a series of tasks working backward from the target time
  let currentTime = new Date(targetDate);
  // Final task - serving
  currentTime.setMinutes(currentTime.getMinutes() - 5);
  tasks.unshift({
    title: 'Serve the meal',
    description: 'Plate all dishes and serve immediately.',
    startTime: formatTimeString(currentTime),
    endTime: formatTimeString(targetDate),
    duration: 5,
    steps: ['Arrange each dish on warmed plates.', 'Garnish as needed.', 'Serve immediately and enjoy!']
  });
  // Generate recipe-specific tasks
  const recipeNames = ['Roast Chicken', 'Mashed Potatoes', 'Grilled Vegetables', 'Pasta Carbonara', 'Caesar Salad'];
  // Use only as many recipes as specified
  const selectedRecipes = recipeNames.slice(0, recipeCount);
  // Final cooking tasks
  selectedRecipes.forEach((recipe, index) => {
    currentTime.setMinutes(currentTime.getMinutes() - 10 - index * 5);
    tasks.unshift({
      title: `Finish ${recipe}`,
      description: `Complete the final cooking steps for ${recipe}.`,
      startTime: formatTimeString(currentTime),
      endTime: formatTimeString(new Date(currentTime.getTime() + 10 * 60000)),
      duration: 10,
      steps: [`Check that ${recipe.toLowerCase()} is fully cooked.`, 'Adjust seasonings as needed.', 'Keep warm until serving time.']
    });
  });
  // Prep tasks
  selectedRecipes.forEach((recipe, index) => {
    currentTime.setMinutes(currentTime.getMinutes() - 15);
    tasks.unshift({
      title: `Prep ${recipe}`,
      description: `Prepare ingredients and start cooking ${recipe}.`,
      startTime: formatTimeString(currentTime),
      endTime: formatTimeString(new Date(currentTime.getTime() + 15 * 60000)),
      duration: 15,
      steps: [`Gather all ingredients for ${recipe.toLowerCase()}.`, 'Wash, chop, and measure as needed.', 'Begin the cooking process according to the recipe.']
    });
  });
  // Initial setup task
  currentTime.setMinutes(currentTime.getMinutes() - 10);
  tasks.unshift({
    title: 'Kitchen Setup',
    description: 'Prepare your kitchen and gather all equipment.',
    startTime: formatTimeString(currentTime),
    endTime: formatTimeString(new Date(currentTime.getTime() + 10 * 60000)),
    duration: 10,
    steps: ['Preheat oven if needed.', 'Set out all necessary pots, pans, and utensils.', 'Review all recipes and make sure you have all ingredients.']
  });
  return tasks;
}
// Helper function to format a Date object as a time string (HH:MM)
function formatTimeString(date) {
  return date.toTimeString().substring(0, 5);
}