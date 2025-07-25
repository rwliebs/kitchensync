# Meal Orchestration & Timeline Generator

A comprehensive meal planning application that coordinates multiple recipes into a synchronized cooking timeline with real-time task management and equipment constraint handling.

## Features

- **Recipe Parser**: Extract ingredients, steps, and timing from recipe text
- **Smart Scaling**: Automatically adjust quantities and timing based on serving size
- **Timeline Orchestration**: Schedule tasks in 5-minute increments with equipment constraints
- **Real-time Updates**: Live task completion with dynamic timeline adjustments
- **Mobile Optimized**: Kitchen-friendly interface with large touch targets
- **API Integration**: RESTful API with standardized JSON structures

## API Endpoints

### POST /meal
Create a new meal timeline from recipes.

**Request Body:**
```json
{
  "recipes": [
    {
      "name": "Grilled Chicken",
      "ingredients": [
        {
          "name": "Chicken breast",
          "amount": 4,
          "unit": "pieces",
          "category": "protein"
        }
      ],
      "steps": [
        {
          "instruction": "Preheat grill to medium-high heat",
          "duration": 10,
          "type": "prep",
          "equipment": ["grill"],
          "temperature": 400
        }
      ],
      "servings": 4,
      "priority": "high"
    }
  ],
  "diners": 6,
  "capacity": {
    "oven": 1,
    "stovetop": 4,
    "prep_space": 2,
    "mixer": 1
  },
  "target_time": "2024-01-15T18:00:00.000Z"
}
```

**Response:**
```json
{
  "meal_id": "uuid-here",
  "timeline": [
    {
      "task_id": "uuid-here",
      "meal_id": "uuid-here",
      "recipe_name": "Grilled Chicken",
      "instruction": "Preheat grill to medium-high heat",
      "start_time": "2024-01-15T17:50:00.000Z",
      "end_time": "2024-01-15T18:00:00.000Z",
      "duration": 10,
      "type": "prep",
      "equipment": ["grill"],
      "status": "pending",
      "priority": "high",
      "dependencies": []
    }
  ],
  "created_at": "2024-01-15T16:00:00.000Z",
  "target_time": "2024-01-15T18:00:00.000Z",
  "diners": 6,
  "status": "pending"
}
```

### GET /timeline/:id
Get current timeline state.

**Response:**
```json
{
  "meal_id": "uuid-here",
  "timeline": [...],
  "current_time": "2024-01-15T17:45:00.000Z",
  "status": "active",
  "progress": {
    "completed_tasks": 2,
    "total_tasks": 8,
    "percentage": 25
  }
}
```

### PUT /task/:id/complete
Mark a task as completed.

**Request Body:**
```json
{
  "completed_at": "2024-01-15T17:48:00.000Z"
}
```

**Response:**
```json
{
  "task_id": "uuid-here",
  "status": "completed",
  "completed_at": "2024-01-15T17:48:00.000Z",
  "timeline_adjustments": [
    {
      "task_id": "uuid-here",
      "old_start_time": "2024-01-15T18:00:00.000Z",
      "new_start_time": "2024-01-15T17:58:00.000Z",
      "old_end_time": "2024-01-15T18:10:00.000Z",
      "new_end_time": "2024-01-15T18:08:00.000Z",
      "reason": "Task completed early"
    }
  ]
}
```

### GET /current-task/:timeline_id
Get active task details.

**Response:**
```json
{
  "task": {
    "task_id": "uuid-here",
    "meal_id": "uuid-here",
    "recipe_name": "Grilled Chicken",
    "instruction": "Grill chicken for 6-8 minutes per side",
    "start_time": "2024-01-15T17:50:00.000Z",
    "end_time": "2024-01-15T18:05:00.000Z",
    "duration": 15,
    "type": "cook",
    "equipment": ["grill"],
    "status": "active",
    "priority": "high",
    "dependencies": []
  },
  "upcoming_tasks": [...],
  "time_until_next": 5,
  "active_tasks_count": 1
}
```

## Development

### Start Development Server
```bash
npm run dev:full
```

This starts both the frontend (port 5173) and API server (port 3001) concurrently.

### Frontend Only
```bash
npm run dev
```

### API Server Only
```bash
npm run dev:api
```

## Technical Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **State Management**: Custom hooks with API integration
- **Time Handling**: ISO 8601 timestamps with timezone support
- **Error Handling**: Standard HTTP status codes with structured error responses

## Key Features

- **UUID-based Identification**: All meals and tasks use UUID format
- **Standardized Status Enums**: `pending`, `active`, `completed`
- **Equipment Constraint Handling**: Respects cooking capacity limitations
- **Backward Scheduling**: Plans from target meal time backwards
- **Dynamic Timeline Adjustment**: Real-time updates based on task completion
- **Mobile-First Design**: Optimized for kitchen tablet/phone use