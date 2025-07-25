import React, { useState } from 'react';
import { Plus, Upload, Link } from 'lucide-react';
import { Recipe } from '../types';
import { RecipeParser } from '../utils/recipeParser';

interface RecipeInputProps {
  onAddRecipe: (recipe: Recipe) => void;
  onClose: () => void;
}

export const RecipeInput: React.FC<RecipeInputProps> = ({ onAddRecipe, onClose }) => {
  const [inputMethod, setInputMethod] = useState<'text' | 'url'>('text');
  const [recipeName, setRecipeName] = useState('');
  const [recipeText, setRecipeText] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName.trim()) return;

    setIsLoading(true);
    
    try {
      let recipe: Recipe;
      
      if (inputMethod === 'text') {
        recipe = RecipeParser.parseRecipeText(recipeText, recipeName);
      } else {
        // For now, just create a placeholder for URL parsing
        // In production, this would use web scraping
        recipe = RecipeParser.parseRecipeText(
          `Ingredients:\n1 cup flour\n2 eggs\n\nInstructions:\n1. Mix ingredients\n2. Cook for 20 minutes`,
          recipeName
        );
      }
      
      onAddRecipe(recipe);
      onClose();
    } catch (error) {
      console.error('Error parsing recipe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add Recipe</h2>
          <p className="text-gray-600 mt-1">Add a recipe to your meal plan</p>
        </div>

        <div className="p-6">
          {/* Input Method Selector */}
          <div className="flex space-x-4 mb-6">
            <button
              type="button"
              onClick={() => setInputMethod('text')}
              className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                inputMethod === 'text'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Paste Recipe Text
            </button>
            <button
              type="button"
              onClick={() => setInputMethod('url')}
              className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                inputMethod === 'url'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Link className="w-4 h-4 mr-2" />
              Recipe URL
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipe Name */}
            <div>
              <label htmlFor="recipeName" className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Name
              </label>
              <input
                type="text"
                id="recipeName"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter recipe name..."
                required
              />
            </div>

            {/* Recipe Input */}
            {inputMethod === 'text' ? (
              <div>
                <label htmlFor="recipeText" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Content
                </label>
                <textarea
                  id="recipeText"
                  value={recipeText}
                  onChange={(e) => setRecipeText(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder={`Paste your recipe here. Example format:

Ingredients:
- 1 cup flour
- 2 eggs
- 1/2 cup milk

Instructions:
1. Mix dry ingredients
2. Add wet ingredients and stir
3. Cook for 20 minutes at 350°F`}
                  required
                />
              </div>
            ) : (
              <div>
                <label htmlFor="recipeUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe URL
                </label>
                <input
                  type="url"
                  id="recipeUrl"
                  value={recipeUrl}
                  onChange={(e) => setRecipeUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/recipe"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  URL parsing is coming soon! For now, please use the text input method.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !recipeName.trim() || (inputMethod === 'text' && !recipeText.trim())}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Recipe
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};