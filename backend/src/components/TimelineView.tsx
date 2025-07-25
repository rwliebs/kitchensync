import React from 'react';
import { Clock, CheckCircle, Play, Pause, RotateCcw } from 'lucide-react';
import { TimelineTask } from '../types';
import { TaskCard } from './TaskCard';

interface TimelineViewProps {
  tasks: TimelineTask[];
  completedTasks: TimelineTask[];
  currentTask?: TimelineTask;
  currentTime: Date;
  isActive: boolean;
  onCompleteTask: (taskId: string) => void;
  onStartTimeline: () => void;
  onPauseTimeline: () => void;
  onResetTimeline: () => void;
  timeUntilNext?: number | null;
  activeTasksCount: number;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  completedTasks,
  currentTask,
  currentTime,
  isActive,
  onCompleteTask,
  onStartTimeline,
  onPauseTimeline,
  onResetTimeline,
  timeUntilNext,
  activeTasksCount
}) => {
  const upcomingTasks = tasks
    .filter(task => !task.completed && task.startTime > currentTime)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5);

  const activeTasks = tasks.filter(task => 
    task.startTime <= currentTime && 
    task.endTime > currentTime && 
    !task.completed
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTimeStatus = () => {
    if (!isActive) return 'Ready to start';
    if (activeTasksCount > 0) return `${activeTasksCount} active task${activeTasksCount > 1 ? 's' : ''}`;
    if (timeUntilNext && timeUntilNext > 0) return `Next task in ${timeUntilNext} minutes`;
    if (tasks.length === completedTasks.length) return 'All tasks completed!';
    return 'Timeline active';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cooking Timeline</h2>
            <p className="text-gray-600">{getTimeStatus()}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-500">Current Time</div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-3">
          {!isActive ? (
            <button
              onClick={onStartTimeline}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Timeline
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
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{completedTasks.length} of {tasks.length + completedTasks.length} tasks completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((completedTasks.length) / (tasks.length + completedTasks.length)) * 100}%`
              }}
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
          <TaskCard
            task={currentTask}
            isCurrent={true}
            onComplete={onCompleteTask}
            currentTime={currentTime}
          />
        </div>
      )}

      {/* Active Tasks */}
      {activeTasks.filter(task => task.id !== currentTask?.id).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Active Tasks
          </h3>
          <div className="space-y-3">
            {activeTasks
              .filter(task => task.id !== currentTask?.id)
              .map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isActive={true}
                  onComplete={onCompleteTask}
                  currentTime={currentTime}
                />
              ))}
          </div>
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
              <TaskCard
                key={task.id}
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
              .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
              .slice(0, 5)
              .map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isCompleted={true}
                  currentTime={currentTime}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};