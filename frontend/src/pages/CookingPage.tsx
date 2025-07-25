import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, AlertTriangleIcon, CheckIcon, AlertCircleIcon, Clock4Icon, MinusIcon, PlusIcon, XIcon } from 'lucide-react';
import { getCurrentTask, completeTask, delayTask } from '../utils/api';
export function CookingPage({
  mealPlan,
  setMealPlan,
  mealId
}) {
  const navigate = useNavigate();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [delayMinutes, setDelayMinutes] = useState(5);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  // Get current task
  const currentTask = mealPlan.tasks[currentTaskIndex] || null;
  const nextTask = mealPlan.tasks[currentTaskIndex + 1] || null;
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  // Poll for current task every 30 seconds
  useEffect(() => {
    if (!mealId || isPaused) return;
    const pollInterval = setInterval(() => {
      fetchCurrentTask();
    }, 30000);
    // Initial fetch
    fetchCurrentTask();
    return () => clearInterval(pollInterval);
  }, [mealId, isPaused]);
  const fetchCurrentTask = async () => {
    if (!mealId) return;
    try {
      const taskData = await getCurrentTask(mealId);
      if (taskData) {
        // Find the index of this task in our tasks array
        const taskIndex = mealPlan.tasks.findIndex(task => task.id === taskData.id || task.title === taskData.title);
        if (taskIndex !== -1) {
          setCurrentTaskIndex(taskIndex);
        }
      }
    } catch (err) {
      console.error('Error fetching current task:', err);
      // Continue with existing task
    }
  };
  const formatTime = timeString => {
    if (!timeString) return '--:--';
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const handlePreviousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };
  const handleNextTask = async () => {
    if (currentTaskIndex < mealPlan.tasks.length - 1) {
      if (mealId && currentTask && currentTask.id) {
        setIsLoading(true);
        try {
          await completeTask(mealId, currentTask.id);
          setCurrentTaskIndex(currentTaskIndex + 1);
        } catch (err) {
          console.error('Error marking task as complete:', err);
          // Continue anyway for demo purposes
          setCurrentTaskIndex(currentTaskIndex + 1);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Fallback if no API integration
        setCurrentTaskIndex(currentTaskIndex + 1);
      }
    }
  };
  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  const handleDelayTask = async () => {
    if (!mealId || !currentTask || !currentTask.id) {
      setIsDelayModalOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      await delayTask(mealId, currentTask.id, delayMinutes);
      // Refresh the meal plan after delay
      const updatedTask = {
        ...currentTask
      };
      // For UI update, adjust times (actual update will come from server on next poll)
      const startTime = new Date(`2000-01-01T${updatedTask.startTime}`);
      startTime.setMinutes(startTime.getMinutes() + delayMinutes);
      updatedTask.startTime = formatTimeString(startTime);
      const endTime = new Date(`2000-01-01T${updatedTask.endTime}`);
      endTime.setMinutes(endTime.getMinutes() + delayMinutes);
      updatedTask.endTime = formatTimeString(endTime);
      // Update the task in the meal plan
      const updatedTasks = [...mealPlan.tasks];
      updatedTasks[currentTaskIndex] = updatedTask;
      setMealPlan({
        ...mealPlan,
        tasks: updatedTasks
      });
      setIsDelayModalOpen(false);
    } catch (err) {
      console.error('Error delaying task:', err);
      setError('Failed to delay task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const calculateProgress = () => {
    if (!currentTask) return 0;
    // For demo purposes, calculate a mock progress
    return currentTaskIndex / (mealPlan.tasks.length - 1) * 100;
  };
  // Helper function to format a Date object as a time string (HH:MM)
  const formatTimeString = date => {
    return date.toTimeString().substring(0, 5);
  };
  const handleBack = () => {
    navigate('/timeline');
  };
  if (!currentTask) {
    return <div className="text-center py-10">
        <button onClick={handleBack} className="mb-4 flex items-center text-gray-600 hover:text-gray-900 mx-auto">
          <ChevronLeftIcon size={20} className="mr-1" /> Back to Timeline
        </button>
        <p className="text-xl">No tasks available</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">
          Back to Setup
        </button>
      </div>;
  }
  return <div className="max-w-md mx-auto">
      {/* Back button */}
      <button onClick={handleBack} className="mb-4 flex items-center text-gray-600 hover:text-gray-900">
        <ChevronLeftIcon size={20} className="mr-1" /> Back to Timeline
      </button>
      {/* Header with time info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-gray-700">
          <ClockIcon size={18} className="mr-1" />
          <span>
            Current:{' '}
            {currentTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">
            Target:{' '}
            <span className="text-blue-700">
              {formatTime(mealPlan.targetTime)}
            </span>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start">
          <AlertCircleIcon size={20} className="mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
          <button className="ml-auto text-red-700 hover:text-red-900" onClick={() => setError(null)}>
            <XIcon size={16} />
          </button>
        </div>}

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
        <div className="h-2 bg-blue-600 rounded-full" style={{
        width: `${calculateProgress()}%`
      }}></div>
      </div>

      {/* Emergency controls */}
      <div className={`mb-4 p-3 rounded-lg ${isPaused ? 'bg-red-100 border border-red-300' : 'bg-gray-100 border border-gray-300'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isPaused ? <AlertTriangleIcon size={20} className="mr-2 text-red-600" /> : <ClockIcon size={20} className="mr-2 text-gray-600" />}
            <span className={`font-medium ${isPaused ? 'text-red-700' : 'text-gray-700'}`}>
              {isPaused ? 'Timeline Paused' : 'Timeline Active'}
            </span>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setIsDelayModalOpen(true)} className="px-3 py-1 rounded-md flex items-center bg-yellow-600 text-white hover:bg-yellow-700">
              <Clock4Icon size={16} className="mr-1" /> Delay
            </button>
            <button onClick={togglePause} className={`px-3 py-1 rounded-md flex items-center ${isPaused ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
              {isPaused ? <>
                  <PlayIcon size={16} className="mr-1" /> Resume
                </> : <>
                  <PauseIcon size={16} className="mr-1" /> Pause
                </>}
            </button>
          </div>
        </div>
      </div>

      {/* Current task - takes 70% of screen height */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 mb-4" style={{
      minHeight: '50vh'
    }}>
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-xl font-bold text-gray-800">
            {currentTask.title}
          </h2>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-500">
              Start: {formatTime(currentTask.startTime)}
            </div>
            <div className="text-sm font-medium text-gray-700">
              End: {formatTime(currentTask.endTime)}
            </div>
          </div>
        </div>
        <div className="mb-4 pb-4 border-b border-gray-200">
          <p className="text-lg leading-relaxed">{currentTask.description}</p>
        </div>
        <div className="space-y-2">
          {currentTask.steps && currentTask.steps.map((step, idx) => <div key={idx} className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                  {idx + 1}
                </div>
                <p>{step}</p>
              </div>)}
        </div>
      </div>

      {/* Next task preview */}
      {nextTask && <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Next Task:
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{nextTask.title}</div>
              <div className="text-sm text-gray-600">
                {formatTime(nextTask.startTime)} -{' '}
                {formatTime(nextTask.endTime)}
              </div>
            </div>
          </div>
        </div>}

      {/* Navigation controls */}
      <div className="flex justify-between mb-4">
        <button onClick={handlePreviousTask} disabled={currentTaskIndex === 0} className={`px-4 py-2 rounded-md flex items-center ${currentTaskIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
          <ChevronLeftIcon size={20} className="mr-1" /> Previous
        </button>
        <button onClick={handleNextTask} disabled={currentTaskIndex === mealPlan.tasks.length - 1 || isLoading} className={`px-4 py-2 rounded-md flex items-center ${currentTaskIndex === mealPlan.tasks.length - 1 || isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
          Next <ChevronRightIcon size={20} className="ml-1" />
        </button>
      </div>

      {/* Task completion button */}
      <button onClick={handleNextTask} disabled={currentTaskIndex === mealPlan.tasks.length - 1 || isLoading} className={`w-full py-3 px-4 rounded-md shadow-sm text-lg font-medium flex items-center justify-center ${currentTaskIndex === mealPlan.tasks.length - 1 || isLoading ? 'bg-green-100 text-green-800 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>
        {isLoading ? <>
            <div size={20} className="mr-2 animate-spin" /> Updating...
          </> : currentTaskIndex === mealPlan.tasks.length - 1 ? 'Meal Complete!' : <>
            Task Complete <CheckIcon size={20} className="ml-2" />
          </>}
      </button>

      {/* Delay Modal */}
      {isDelayModalOpen && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">Delay Current Task</h3>
            <p className="text-gray-600 mb-4">
              Running behind? Adjust the timeline by delaying the current task.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delay by (minutes):
              </label>
              <div className="flex items-center">
                <button onClick={() => setDelayMinutes(Math.max(1, delayMinutes - 1))} className="p-2 bg-gray-100 rounded-l-md border border-gray-300">
                  <MinusIcon size={16} />
                </button>
                <input type="number" min="1" max="60" value={delayMinutes} onChange={e => setDelayMinutes(parseInt(e.target.value) || 5)} className="p-2 w-16 text-center border-t border-b border-gray-300" />
                <button onClick={() => setDelayMinutes(Math.min(60, delayMinutes + 1))} className="p-2 bg-gray-100 rounded-r-md border border-gray-300">
                  <PlusIcon size={16} />
                </button>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setIsDelayModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelayTask} disabled={isLoading} className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-yellow-400">
                {isLoading ? <>
                    <div size={16} className="inline mr-1 animate-spin" />{' '}
                    Processing...
                  </> : 'Apply Delay'}
              </button>
            </div>
          </div>
        </div>}
    </div>;
}