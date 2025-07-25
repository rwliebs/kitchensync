import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MinusIcon, ChevronRightIcon, ClockIcon, UsersIcon, CookingPotIcon, AlertCircleIcon } from 'lucide-react';
import { generateMockTasks } from '../utils/mockData';
import { createMeal } from '../utils/api';
import { TimeSelect } from '../components/TimeSelect';
export function SetupPage({
  mealPlan,
  setMealPlan,
  setMealId
}) {
  const navigate = useNavigate();
  const [recipeUrls, setRecipeUrls] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const addRecipeField = () => {
    if (recipeUrls.length < 5) {
      setRecipeUrls([...recipeUrls, '']);
    }
  };
  const removeRecipeField = index => {
    const newUrls = [...recipeUrls];
    newUrls.splice(index, 1);
    setRecipeUrls(newUrls);
  };
  const updateRecipeUrl = (index, value) => {
    const newUrls = [...recipeUrls];
    newUrls[index] = value;
    setRecipeUrls(newUrls);
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    // Filter out empty URLs
    const filteredUrls = recipeUrls.filter(url => url.trim() !== '');
    try {
      // Prepare data for API
      const mealData = {
        recipes: filteredUrls,
        diners: mealPlan.diners,
        cookingCapacity: mealPlan.capacity,
        targetTime: mealPlan.targetTime
      };
      // Call API to create meal
      const result = await createMeal(mealData);
      // Update meal ID from API response
      setMealId(result.id);
      // Update meal plan with API data or fallback to mock data
      if (result.tasks && result.tasks.length > 0) {
        setMealPlan({
          ...mealPlan,
          recipes: filteredUrls.map(url => ({
            url
          })),
          tasks: result.tasks
        });
      } else {
        // Fallback to mock data if API doesn't return tasks
        const mockTasks = generateMockTasks(filteredUrls.length, mealPlan.diners, mealPlan.capacity, mealPlan.targetTime);
        setMealPlan({
          ...mealPlan,
          recipes: filteredUrls.map(url => ({
            url
          })),
          tasks: mockTasks
        });
      }
      navigate('/timeline');
    } catch (err) {
      console.error('Error submitting meal plan:', err);
      setError('Failed to create meal plan. Please try again.');
      // Fallback to mock data for demo purposes
      const mockTasks = generateMockTasks(filteredUrls.length, mealPlan.diners, mealPlan.capacity, mealPlan.targetTime);
      setMealPlan({
        ...mealPlan,
        recipes: filteredUrls.map(url => ({
          url
        })),
        tasks: mockTasks
      });
      // Use a mock ID for demo
      setMealId('mock-id-123');
      // Continue to timeline despite error (for demo)
      navigate('/timeline');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Plan Your Meal</h2>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start">
          <AlertCircleIcon size={20} className="mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <label className="block text-lg font-medium text-gray-700">
            Recipe URLs (up to 5)
          </label>
          {recipeUrls.map((url, index) => <div key={index} className="flex items-center space-x-2">
              <input type="url" value={url} onChange={e => updateRecipeUrl(index, e.target.value)} placeholder="https://example.com/recipe" className="flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
              {index > 0 && <button type="button" onClick={() => removeRecipeField(index)} className="p-2 text-red-600 hover:text-red-800">
                  <MinusIcon size={20} />
                </button>}
            </div>)}
          {recipeUrls.length < 5 && <button type="button" onClick={addRecipeField} className="flex items-center text-blue-600 hover:text-blue-800">
              <PlusIcon size={16} className="mr-1" /> Add another recipe
            </button>}
        </div>
        <div>
          <div className="flex items-center mb-2">
            <UsersIcon size={20} className="mr-2 text-gray-600" />
            <label className="block text-lg font-medium text-gray-700">
              Number of Diners
            </label>
          </div>
          <input type="number" min="1" max="20" value={mealPlan.diners} onChange={e => setMealPlan({
          ...mealPlan,
          diners: parseInt(e.target.value) || 1
        })} className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <div className="flex items-center mb-2">
            <CookingPotIcon size={20} className="mr-2 text-gray-600" />
            <label className="block text-lg font-medium text-gray-700">
              Cooking Capacity
            </label>
          </div>
          <select value={mealPlan.capacity} onChange={e => setMealPlan({
          ...mealPlan,
          capacity: parseInt(e.target.value)
        })} className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="1">1 dish at a time</option>
            <option value="2">2 dishes at a time</option>
            <option value="3">3 dishes at a time</option>
            <option value="4">4 dishes at a time</option>
            <option value="5">5 dishes at a time</option>
          </select>
        </div>
        <div>
          <div className="flex items-center mb-2">
            <ClockIcon size={20} className="mr-2 text-gray-600" />
            <label className="block text-lg font-medium text-gray-700">
              Target Meal Time
            </label>
          </div>
          <TimeSelect value={mealPlan.targetTime} onChange={time => setMealPlan({
          ...mealPlan,
          targetTime: time
        })} className="w-full" />
        </div>
        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed">
          {isLoading ? 'Generating Timeline...' : <>
              Generate Timeline <ChevronRightIcon size={20} className="ml-2" />
            </>}
        </button>
      </form>
    </div>;
}