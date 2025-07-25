import {
  MealRequest,
  MealResponse,
  TimelineResponse,
  TaskCompletionRequest,
  TaskCompletionResponse,
  CurrentTaskResponse,
  ApiError
} from '../types/api';

const API_BASE_URL = 'http://localhost:3001';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(`API Error ${error.code}: ${error.message}`);
    }

    return response.json();
  }

  async createMeal(mealRequest: MealRequest): Promise<MealResponse> {
    return this.request<MealResponse>('/meal', {
      method: 'POST',
      body: JSON.stringify(mealRequest),
    });
  }

  async getTimeline(mealId: string): Promise<TimelineResponse> {
    return this.request<TimelineResponse>(`/timeline/${mealId}`);
  }

  async completeTask(
    taskId: string,
    completionRequest: TaskCompletionRequest
  ): Promise<TaskCompletionResponse> {
    return this.request<TaskCompletionResponse>(`/task/${taskId}/complete`, {
      method: 'PUT',
      body: JSON.stringify(completionRequest),
    });
  }

  async getCurrentTask(timelineId: string): Promise<CurrentTaskResponse> {
    return this.request<CurrentTaskResponse>(`/current-task/${timelineId}`);
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiClient = new ApiClient();