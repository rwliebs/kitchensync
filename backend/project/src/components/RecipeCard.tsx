import React from 'react';
import { Clock, Users, ChefHat, X } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onRemove: (id: string) => void;
  servings?: number;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  onRemove,
  servings 
}) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  const priorityLabels = {
    high: 'Serve Fresh',
    medium: 'Medium Priority',
    low: 'Can Wait'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {recipe.name}
          </h3>
          <button
            onClick={() => onRemove(recipe.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {recipe.totalTime}m
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {servings || recipe.servings} servings
          </div>
          <div className="flex items-center">
            <ChefHat className="w-4 h-4 mr-1" />
            {recipe.steps.length} steps
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[recipe.priority]}`}>
            {priorityLabels[recipe.priority]}
          </span>
          
          <div className="text-xs text-gray-500">
            {recipe.equipment.length} equipment needed
          </div>
        </div>

        {/* Equipment Preview */}
        {recipe.equipment.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {recipe.equipment.slice(0, 3).map((eq, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  {eq.name}
                </span>
              ))}
              {recipe.equipment.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                  +{recipe.equipment.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};