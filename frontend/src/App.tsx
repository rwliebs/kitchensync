import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SetupPage } from './pages/SetupPage';
import { TimelinePage } from './pages/TimelinePage';
import { CookingPage } from './pages/CookingPage';
export function App() {
  const [mealPlan, setMealPlan] = useState({
    recipes: [],
    diners: 4,
    capacity: 2,
    targetTime: '',
    tasks: []
  });
  // Add mealId state to track the created meal
  const [mealId, setMealId] = useState(null);
  return <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
        <div className="w-full bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Kitchen Sync</h1>
            <p className="text-sm text-gray-500">
              Sync your cooking, serve everything fresh
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<SetupPage mealPlan={mealPlan} setMealPlan={setMealPlan} setMealId={setMealId} />} />
            <Route path="/timeline" element={<TimelinePage mealPlan={mealPlan} setMealPlan={setMealPlan} mealId={mealId} />} />
            <Route path="/cooking" element={<CookingPage mealPlan={mealPlan} setMealPlan={setMealPlan} mealId={mealId} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>;
}