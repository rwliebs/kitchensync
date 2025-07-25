import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import {
  MealRequest,
  MealResponse,
  TimelineResponse,
  CurrentTaskResponse,
  TimelineTask,
  TaskStatus
} from '../types/api';

interface ApiTimelineState {
  mealId: string | null;
  timeline: TimelineTask[];
  currentTask: TimelineTask | null;
  upcomingTasks: TimelineTask[];
  completedTasks: TimelineTask[];
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export const useApiTimeline = () => {
  const [state, setState] = useState<ApiTimelineState>({
    mealId: null,
    timeline: [],
    currentTask: null,
    upcomingTasks: [],
    completedTasks: [],
    isActive: false,
    isLoading: false,
    error: null,
    progress: { completed: 0, total: 0, percentage: 0 }
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Refresh timeline data periodically when active
  useEffect(() => {
    if (!state.mealId || !state.isActive) return;

    const refreshTimer = setInterval(async () => {
      try {
        const [timelineResponse, currentTaskResponse] = await Promise.all([
          apiClient.getTimeline(state.mealId!),
          apiClient.getCurrentTask(state.mealId!)
        ]);

        setState(prev => ({
          ...prev,
          timeline: timelineResponse.timeline,
          currentTask: currentTaskResponse.task,
          upcomingTasks: currentTaskResponse.upcoming_tasks,
          completedTasks: timelineResponse.timeline.filter(task => task.status === 'completed'),
          progress: timelineResponse.progress,
          error: null
        }));
      } catch (error) {
        console.error('Error refreshing timeline:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to refresh timeline'
        }));
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshTimer);
  }, [state.mealId, state.isActive]);

  const createMeal = useCallback(async (mealRequest: MealRequest): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response: MealResponse = await apiClient.createMeal(mealRequest);
      
      setState(prev => ({
        ...prev,
        mealId: response.meal_id,
        timeline: response.timeline,
        completedTasks: [],
        upcomingTasks: response.timeline.filter(task => task.status === 'pending'),
        progress: {
          completed: 0,
          total: response.timeline.length,
          percentage: 0
        },
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create meal'
      }));
    }
  }, []);

  const startTimeline = useCallback(async (): Promise<void> => {
    if (!state.mealId) return;

    setState(prev => ({ ...prev, isActive: true }));

    try {
      const currentTaskResponse = await apiClient.getCurrentTask(state.mealId);
      setState(prev => ({
        ...prev,
        currentTask: currentTaskResponse.task,
        upcomingTasks: currentTaskResponse.upcoming_tasks
      }));
    } catch (error) {
      console.error('Error starting timeline:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start timeline'
      }));
    }
  }, [state.mealId]);

  const pauseTimeline = useCallback((): void => {
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  const completeTask = useCallback(async (taskId: string): Promise<void> => {
    if (!state.mealId) return;

    try {
      const completionResponse = await apiClient.completeTask(taskId, {
        completed_at: new Date().toISOString()
      });

      // Refresh timeline after completion
      const [timelineResponse, currentTaskResponse] = await Promise.all([
        apiClient.getTimeline(state.mealId),
        apiClient.getCurrentTask(state.mealId)
      ]);

      setState(prev => ({
        ...prev,
        timeline: timelineResponse.timeline,
        currentTask: currentTaskResponse.task,
        upcomingTasks: currentTaskResponse.upcoming_tasks,
        completedTasks: timelineResponse.timeline.filter(task => task.status === 'completed'),
        progress: timelineResponse.progress,
        error: null
      }));

      // Show adjustment notifications if any
      if (completionResponse.timeline_adjustments.length > 0) {
        console.log('Timeline adjusted:', completionResponse.timeline_adjustments);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete task'
      }));
    }
  }, [state.mealId]);

  const resetTimeline = useCallback((): void => {
    setState({
      mealId: null,
      timeline: [],
      currentTask: null,
      upcomingTasks: [],
      completedTasks: [],
      isActive: false,
      isLoading: false,
      error: null,
      progress: { completed: 0, total: 0, percentage: 0 }
    });
  }, []);

  const getTimeUntilNext = useCallback((): number | null => {
    if (!state.upcomingTasks.length) return null;
    
    const nextTask = state.upcomingTasks[0];
    const timeDiff = new Date(nextTask.start_time).getTime() - currentTime.getTime();
    return timeDiff > 0 ? Math.ceil(timeDiff / (60 * 1000)) : 0;
  }, [state.upcomingTasks, currentTime]);

  const getActiveTasksCount = useCallback((): number => {
    const now = currentTime;
    return state.timeline.filter(task => 
      task.status !== 'completed' &&
      new Date(task.start_time) <= now && 
      new Date(task.end_time) > now
    ).length;
  }, [state.timeline, currentTime]);

  return {
    ...state,
    currentTime,
    createMeal,
    startTimeline,
    pauseTimeline,
    completeTask,
    resetTimeline,
    getTimeUntilNext,
    getActiveTasksCount
  };
};