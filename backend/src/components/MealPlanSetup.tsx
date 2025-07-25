import React, { useState } from 'react';
import { Users, Clock, Calendar, Settings } from 'lucide-react';
import { Recipe, Equipment } from '../types';

interface MealPlanSetupProps {
  recipes: Recipe[];
  onGenerateTimeline: (diners: number, targetTime: Date, equipment: Equipment[]) => void;
}

export const MealPlanSetup: React.FC<MealPlanSetupProps> = ({
  recipes,
  onGenerateTimeline
}) => {
  const [diners, setDiners] = useState(4);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [equipment, setEquipment] = useState<Equipment[]>([
    { id: 'oven-1', name: 'Oven', type: 'oven', capacity: 1 },
    { id: 'stovetop-1', name: 'Stovetop (4 burners)', type: 'stovetop', capacity: 4 },
    { id: 'prep-1', name: 'Prep Counter', type: 'prep-space', capacity: 2 },
    { id: 'mixer-1', name: 'Stand Mixer', type: 'mixer', capacity: 1 }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetTime = new Date(targetDate);
    onGenerateTimeline(diners, targetTime, equipment);
  };

  const totalCookTime = recipes.reduce((sum, recipe) => sum + recipe.totalTime, 0);
  const estimatedStartTime = new Date(new Date(targetDate).getTime() - totalCookTime * 60 * 1000);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Settings className="w-6 h-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-bold text-gray-900">Meal Setup</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Number of Diners */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 mr-2" />
            Number of Diners
          </label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setDiners(Math.max(1, diners - 1))}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              -
            </button>
            <span className="text-2xl font-semibold text-gray-900 w-12 text-center">
              {diners}
            </span>
            <button
              type="button"
              onClick={() => setDiners(diners + 1)}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Target Time */}
        <div>
          <label htmlFor="targetTime" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 mr-2" />
            Target Meal Time
          </label>
          <input
            type="datetime-local"
            id="targetTime"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Time Estimate */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Clock className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">Timeline Estimate</span>
          </div>
          <p className="text-sm text-blue-800">
            Total cooking time: <span className="font-semibold">{totalCookTime} minutes</span>
          </p>
          <p className="text-sm text-blue-800">
            Estimated start: <span className="font-semibold">
              {estimatedStartTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </span>
          </p>
        </div>

        {/* Equipment Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Available Equipment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {equipment.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-900">{eq.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {eq.capacity} capacity
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={recipes.length === 0}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Generate Cooking Timeline
        </button>

        {recipes.length === 0 && (
          <p className="text-sm text-gray-500 text-center">
            Add recipes to generate your timeline
          </p>
        )}
      </form>
    </div>
  );
};