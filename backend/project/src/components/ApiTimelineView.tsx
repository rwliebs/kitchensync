import React from 'react';
import { Clock, CheckCircle, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
import { TimelineTask } from '../types/api';
import { ApiTaskCard } from './ApiTaskCard';

interface ApiTimelineViewProps {
  mealId: string | null;
  timeline: TimelineTask[];
  completedTasks: TimelineTask[];
  currentTask: TimelineTask | null;
  upcomingTasks: TimelineTask[];
  currentTime: Date;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  onCompleteTask: (taskId: string) => void;
  onStartTimeline: () => void;
  onPauseTimeline: () => void;
  onResetTimeline: () => void;
  timeUntilNext?: number | null;
  activeTasksCount: number;
}

export const ApiTimelineView: React.FC<ApiTimelineViewProps> = ({
  mealId,
  timeline,
  completedTasks,
  currentTask,
  upcomingTasks,
  currentTime,
  isActive,
  isLoading,
  error,
  progress,
  onCompleteTask,
  onStartTimeline,
  onPauseTimeline,
  onResetTimeline,
  timeUntilNext,
  activeTasksCount
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTimeStatus = () => {
    if (isLoading) return 'Loading...';
    if (error) return 'Error occurred';
    if (!isActive) return 'Ready to start';
    if (activeTasksCount > 0) return `${activeTasksCount} active task${activeTasksCount > 1 ? 's' : ''}`;
    if (timeUntilNext && timeUntilNext > 0) return `Next task in ${timeUntilNext} minutes`;
    if (progress.completed === progress.total && progress.total > 0) return 'All tasks completed!';
    return 'Timeline active';
  };

  if (!mealId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No timeline created yet
          </h3>
          <p className="text-gray-600">
            Create a meal plan to generate your cooking timeline
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cooking Timeline</h2>
            <p className="text-gray-600">{getTimeStatus()}</p>
            {mealId && (
              <p className="text-xs text-gray-400 mt-1">Meal ID: {mealId}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-500">Current Time</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex space-x-3 mb-4">
          {!isActive ? (
            <button
              onClick={onStartTimeline}
              disabled={isLoading}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              {isLoading ? 'Loading...' : 'Start Timeline'}
            </button>
          ) : (
            <button
              onClick={onPauseTimeline}
              className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause Timeline
            </button>
          )}
          <button
            onClick={onResetTimeline}
            className="flex items-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress.completed} of {progress.total} tasks completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Current Task */}
      {currentTask && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Current Task
          </h3>
          <ApiTaskCard
            task={currentTask}
            isCurrent={true}
            onComplete={onCompleteTask}
            currentTime={currentTime}
          />
        </div>
      )}

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Coming Up
          </h3>
          <div className="space-y-3">
            {upcomingTasks.map(task => (
              <ApiTaskCard
                key={task.task_id}
                task={task}
                onComplete={onCompleteTask}
                currentTime={currentTime}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks
              .sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())
              .slice(0, 5)
              .map(task => (
                <ApiTaskCard
                  key={task.task_id}
                  task={task}
                  isCompleted={true}
                  currentTime={currentTime}
                />
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {timeline.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tasks in timeline
          </h3>
          <p className="text-gray-600">
            Your timeline will appear here once created
          </p>
        </div>
      )}
    </div>
  );
};