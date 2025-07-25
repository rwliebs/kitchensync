import { useState, useEffect, useCallback } from 'react';
import { TimelineTask, TimelineState } from '../types';
import { TimelineGenerator } from '../utils/timelineGenerator';

export const useTimeline = (initialTasks: TimelineTask[] = []) => {
  const [state, setState] = useState<TimelineState>({
    upcomingTasks: initialTasks,
    completedTasks: [],
    isActive: false
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Update current task based on time
  useEffect(() => {
    if (!state.isActive) return;

    const now = currentTime;
    const currentTask = state.upcomingTasks.find(task => 
      task.startTime <= now && task.endTime > now && !task.completed
    );

    setState(prev => ({
      ...prev,
      currentTask
    }));
  }, [currentTime, state.upcomingTasks, state.isActive]);

  const startTimeline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: true,
      startTime: new Date()
    }));
  }, []);

  const pauseTimeline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  const completeTask = useCallback((taskId: string) => {
    setState(prev => {
      const taskIndex = prev.upcomingTasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) return prev;

      const completedTask = { ...prev.upcomingTasks[taskIndex], completed: true };
      const remainingTasks = prev.upcomingTasks.filter(task => task.id !== taskId);
      
      // Adjust timeline for early/late completion
      const adjustedTasks = TimelineGenerator.adjustTimelineForCompletion(
        [...remainingTasks, completedTask],
        taskId
      ).filter(task => !task.completed);

      return {
        ...prev,
        upcomingTasks: adjustedTasks,
        completedTasks: [...prev.completedTasks, completedTask]
      };
    });
  }, []);

  const resetTimeline = useCallback((newTasks: TimelineTask[]) => {
    setState({
      upcomingTasks: newTasks,
      completedTasks: [],
      isActive: false,
      currentTask: undefined
    });
  }, []);

  const getTimeUntilNext = useCallback(() => {
    if (!state.upcomingTasks.length) return null;
    
    const nextTask = state.upcomingTasks
      .filter(task => !task.completed)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
    
    if (!nextTask) return null;
    
    const timeDiff = nextTask.startTime.getTime() - currentTime.getTime();
    return timeDiff > 0 ? Math.ceil(timeDiff / (60 * 1000)) : 0;
  }, [state.upcomingTasks, currentTime]);

  const getActiveTasksCount = useCallback(() => {
    const now = currentTime;
    return state.upcomingTasks.filter(task => 
      task.startTime <= now && task.endTime > now && !task.completed
    ).length;
  }, [state.upcomingTasks, currentTime]);

  return {
    ...state,
    currentTime,
    startTimeline,
    pauseTimeline,
    completeTask,
    resetTimeline,
    getTimeUntilNext,
    getActiveTasksCount
  };
}