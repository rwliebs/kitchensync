import React, { useState } from 'react';
import { ChefHat, Plus, Calendar } from 'lucide-react';
import { Recipe, Equipment } from './types';
import { MealRequest, RecipeInput as ApiRecipeInput, EquipmentCapacity } from './types/api';
import { useApiTimeline } from './hooks/useApiTimeline';
import { RecipeInput } from './components/RecipeInput';
import { RecipeCard } from './components/RecipeCard';
import { MealPlanSetup } from './components/MealPlanSetup';
import { ApiTimelineView } from './components/ApiTimelineView';

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipeInput, setShowRecipeInput] = useState(false);
  const [currentView, setCurrentView] = useState<'setup' | 'timeline'>('setup');
  const [mealSettings, setMealSettings] = useState<{
    diners: number;
    targetTime: Date;
    equipment: Equipment[];
  } | null>(null);

  const apiTimeline = useApiTimeline();

  const handleAddRecipe = (recipe: Recipe) => {
    setRecipes(prev => [...prev, recipe]);
  };

  const handleRemoveRecipe = (id: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== id));
  };

  const handleGenerateTimeline = async (diners: number, targetTime: Date, equipment: Equipment[]) => {
    // Convert recipes to API format
    const apiRecipes: ApiRecipeInput[] = recipes.map(recipe => ({
      name: recipe.name,
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        category: ing.category
      })),
      steps: recipe.steps.map(step => ({
        instruction: step.instruction,
        duration: step.duration,
        type: step.type,
        equipment: step.equipment?.map(eq => eq.name) || [],
        temperature: step.temperature
      })),
      servings: recipe.servings,
      priority: recipe.priority
    }));

    // Convert equipment to capacity format
    const capacity: EquipmentCapacity = {
      oven: equipment.filter(eq => eq.type === 'oven').length,
      stovetop: equipment.filter(eq => eq.type === 'stovetop').reduce((sum, eq) => sum + eq.capacity, 0),
      prep_space: equipment.filter(eq => eq.type === 'prep-space').length,
      mixer: equipment.filter(eq => eq.type === 'mixer').length
    };

    const mealRequest: MealRequest = {
      recipes: apiRecipes,
      diners,
      capacity,
      target_time: targetTime.toISOString()
    };

    await apiTimeline.createMeal(mealRequest);
    setMealSettings({ diners, targetTime, equipment });
    setCurrentView('timeline');
  };

  const handleBackToSetup = () => {
    apiTimeline.resetTimeline();
    setCurrentView('setup');
    setMealSettings(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ChefHat className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Meal Orchestrator
                </h1>
                <p className="text-sm text-gray-600">
                  Coordinate multiple recipes into a perfect timeline
                </p>
              </div>
            </div>
            
            {currentView === 'timeline' && (
              <button
                onClick={handleBackToSetup}
                className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Back to Setup
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'setup' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recipes Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Your Recipes ({recipes.length})
                </h2>
                <button
                  onClick={() => setShowRecipeInput(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Recipe
                </button>
              </div>

              {recipes.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No recipes added yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add your first recipe to start building your meal timeline
                  </p>
                  <button
                    onClick={() => setShowRecipeInput(true)}
                    className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Recipe
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onRemove={handleRemoveRecipe}
                      servings={mealSettings?.diners}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Setup Section */}
            <div className="lg:col-span-1">
              <MealPlanSetup
                recipes={recipes}
                onGenerateTimeline={handleGenerateTimeline}
              />
            </div>
          </div>
        ) : (
          <ApiTimelineView
            mealId={apiTimeline.mealId}
            timeline={apiTimeline.timeline}
            completedTasks={apiTimeline.completedTasks}
            currentTask={apiTimeline.currentTask}
            upcomingTasks={apiTimeline.upcomingTasks}
            currentTime={apiTimeline.currentTime}
            isActive={apiTimeline.isActive}
            isLoading={apiTimeline.isLoading}
            error={apiTimeline.error}
            progress={apiTimeline.progress}
            onCompleteTask={apiTimeline.completeTask}
            onStartTimeline={apiTimeline.startTimeline}
            onPauseTimeline={apiTimeline.pauseTimeline}
            onResetTimeline={handleBackToSetup}
            timeUntilNext={apiTimeline.getTimeUntilNext()}
            activeTasksCount={apiTimeline.getActiveTasksCount()}
          />
        )}
      </main>

      {/* Recipe Input Modal */}
      {showRecipeInput && (
        <RecipeInput
          onAddRecipe={handleAddRecipe}
          onClose={() => setShowRecipeInput(false)}
        />
      )}
    </div>
  );
}

export default App;