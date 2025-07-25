import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, CheckIcon, XIcon, AlertCircleIcon, ChevronLeftIcon } from 'lucide-react';
import { getMeal } from '../utils/api';
export function TimelinePage({
  mealPlan,
  setMealPlan,
  mealId
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Fetch meal data from API when component mounts
  useEffect(() => {
    if (mealId) {
      fetchMealData();
    }
  }, [mealId]);
  const fetchMealData = async () => {
    if (!mealId) return;
    setIsLoading(true);
    setError(null);
    try {
      const mealData = await getMeal(mealId);
      // Update meal plan with API data
      if (mealData && mealData.tasks) {
        setMealPlan(prevPlan => ({
          ...prevPlan,
          tasks: mealData.tasks
        }));
      }
    } catch (err) {
      console.error('Error fetching meal data:', err);
      setError('Failed to load meal data. Using cached data.');
      // Continue with existing data
    } finally {
      setIsLoading(false);
    }
  };
  const formatTime = timeString => {
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const handleStartCooking = () => {
    navigate('/cooking');
  };
  const handleEditPlan = () => {
    navigate('/');
  };
  const handleRefresh = () => {
    fetchMealData();
  };
  const handleBack = () => {
    navigate('/');
  };
  return <div className="max-w-md mx-auto">
      {/* Back button */}
      <button onClick={handleBack} className="mb-4 flex items-center text-gray-600 hover:text-gray-900">
        <ChevronLeftIcon size={20} className="mr-1" /> Back to Setup
      </button>
      <h2 className="text-2xl font-bold mb-2 text-center">
        Your Cooking Timeline
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Review your timeline before starting
      </p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start">
          <AlertCircleIcon size={20} className="mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {mealId ? `Meal ID: ${mealId.substring(0, 8)}...` : 'No meal ID'}
        </div>
        <button onClick={handleRefresh} disabled={isLoading} className="p-2 text-blue-600 hover:text-blue-800 disabled:text-blue-400 disabled:cursor-not-allowed">
          <div size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {mealId ? `Meal ID: ${mealId.substring(0, 8)}...` : 'No meal ID'}
        </div>
        <button onClick={handleRefresh} disabled={isLoading} className="p-2 text-blue-600 hover:text-blue-800 disabled:text-blue-400 disabled:cursor-not-allowed">
          <div size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-blue-800">
            <ClockIcon size={18} className="mr-2" />
            <span className="font-medium">Target meal time:</span>
          </div>
          <span className="font-bold">{formatTime(mealPlan.targetTime)}</span>
        </div>
        <div className="text-sm text-blue-700">
          Start cooking at{' '}
          <span className="font-bold">
            {mealPlan.tasks.length > 0 ? formatTime(mealPlan.tasks[0].startTime) : '--:--'}
          </span>
        </div>
      </div>
      {isLoading && mealPlan.tasks.length === 0 ? <div className="text-center py-8">
          <div size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
          <p>Loading timeline...</p>
        </div> : <div className="mb-6">
          <div className="relative">
            {mealPlan.tasks.map((task, index) => <div key={index} className="mb-4 relative">
                {index < mealPlan.tasks.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300 z-0"></div>}
                <div className="flex items-start">
                  <div className="bg-white z-10">
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-medium">
                        {index + 1}
                      </div>
                      <div className="text-sm font-medium mt-1 text-gray-600">
                        {formatTime(task.startTime)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {task.description.substring(0, 60)}...
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Duration: {task.duration} min
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
        </div>}
      <div className="flex flex-col space-y-3">
        <button onClick={handleStartCooking} className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center" disabled={isLoading || mealPlan.tasks.length === 0}>
          <CheckIcon size={20} className="mr-2" /> Start Cooking
        </button>
        <button onClick={handleEditPlan} className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center">
          <XIcon size={20} className="mr-2" /> Edit Plan
        </button>
      </div>
    </div>;
}