import React from 'react';
import { CheckCircle, Clock, ChefHat, Utensils, Timer, Pause } from 'lucide-react';
import { TimelineTask } from '../types/api';

interface ApiTaskCardProps {
  task: TimelineTask;
  isCurrent?: boolean;
  isActive?: boolean;
  isCompleted?: boolean;
  onComplete?: (taskId: string) => void;
  currentTime: Date;
}

export const ApiTaskCard: React.FC<ApiTaskCardProps> = ({
  task,
  isCurrent = false,
  isActive = false,
  isCompleted = false,
  onComplete,
  currentTime
}) => {
  const typeIcons = {
    prep: ChefHat,
    cook: Utensils,
    rest: Pause,
    serve: CheckCircle
  };

  const typeColors = {
    prep: 'bg-blue-100 text-blue-800 border-blue-200',
    cook: 'bg-orange-100 text-orange-800 border-orange-200',
    rest: 'bg-purple-100 text-purple-800 border-purple-200',
    serve: 'bg-green-100 text-green-800 border-green-200'
  };

  const priorityBorders = {
    high: 'border-l-red-500',
    medium: 'border-l-orange-500',
    low: 'border-l-green-500'
  };

  const Icon = typeIcons[task.type];

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTimeRemaining = () => {
    if (task.status === 'completed') return null;
    const now = currentTime.getTime();
    const end = new Date(task.end_time).getTime();
    const remaining = Math.max(0, Math.ceil((end - now) / (60 * 1000)));
    return remaining;
  };

  const timeRemaining = getTimeRemaining();
  const isTaskCompleted = task.status === 'completed';
  const isTaskActive = task.status !== 'completed' && 
    new Date(task.start_time) <= currentTime && 
    new Date(task.end_time) > currentTime;

  const cardClasses = `
    bg-white border border-gray-200 rounded-lg shadow-sm p-4 border-l-4 transition-all
    ${priorityBorders[task.priority]}
    ${isCurrent ? 'ring-2 ring-blue-500 shadow-md' : ''}
    ${isTaskActive ? 'bg-orange-50' : ''}
    ${isTaskCompleted ? 'opacity-60' : ''}
  `;

  return (
    <div className={cardClasses}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-lg border ${typeColors[task.type]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{task.recipe_name}</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="capitalize">{task.type} Task</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'active' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status}
                </span>
              </div>
            </div>
          </div>

          {/* Instruction */}
          <p className="text-gray-800 mb-3 leading-relaxed">
            {task.instruction}
          </p>

          {/* Time Info */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(task.start_time)} - {formatTime(task.end_time)}
            </div>
            <div className="flex items-center">
              <Timer className="w-4 h-4 mr-1" />
              {task.duration}m duration
            </div>
            {timeRemaining !== null && timeRemaining > 0 && !isTaskCompleted && (
              <div className={`flex items-center ${isCurrent || isTaskActive ? 'text-orange-600 font-medium' : ''}`}>
                <span>{timeRemaining}m remaining</span>
              </div>
            )}
          </div>

          {/* Equipment */}
          {task.equipment && task.equipment.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.equipment.map((eq, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  {eq}
                </span>
              ))}
            </div>
          )}

          {/* Dependencies */}
          {task.dependencies && task.dependencies.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Depends on: {task.dependencies.length} task{task.dependencies.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Action Button */}
        {!isTaskCompleted && onComplete && (isCurrent || isTaskActive) && (
          <button
            onClick={() => onComplete(task.task_id)}
            className={`
              ml-4 px-4 py-2 rounded-lg font-medium transition-colors
              ${isCurrent 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
              }
            `}
          >
            Complete
          </button>
        )}

        {isTaskCompleted && (
          <div className="ml-4 text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};