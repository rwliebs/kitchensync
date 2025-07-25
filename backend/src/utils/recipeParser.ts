import { Recipe, RecipeStep, Ingredient, Equipment } from '../types';

export class RecipeParser {
  static parseRecipeText(text: string, name: string): Recipe {
    // Simple text-based recipe parser
    // In production, this would integrate with recipe website APIs
    const lines = text.split('\n').filter(line => line.trim());
    
    let ingredients: Ingredient[] = [];
    let steps: RecipeStep[] = [];
    let currentSection: 'ingredients' | 'steps' | 'none' = 'none';
    
    lines.forEach((line, index) => {
      const lower = line.toLowerCase().trim();
      
      if (lower.includes('ingredient') || lower.includes('you need') || lower.startsWith('*') || lower.match(/^\d+\s+(cup|tbsp|tsp|lb|oz)/)) {
        currentSection = 'ingredients';
        if (!lower.includes('ingredient')) {
          ingredients.push(this.parseIngredient(line, `ing-${index}`));
        }
      } else if (lower.includes('instruction') || lower.includes('step') || lower.match(/^\d+\./)) {
        currentSection = 'steps';
        if (!lower.includes('instruction')) {
          steps.push(this.parseStep(line, `step-${index}`));
        }
      } else if (currentSection === 'ingredients' && line.trim()) {
        ingredients.push(this.parseIngredient(line, `ing-${index}`));
      } else if (currentSection === 'steps' && line.trim()) {
        steps.push(this.parseStep(line, `step-${index}`));
      }
    });

    return {
      id: `recipe-${Date.now()}`,
      name,
      servings: 4, // default
      totalTime: steps.reduce((sum, step) => sum + step.duration, 0),
      ingredients,
      steps,
      equipment: this.inferEquipment(steps),
      priority: this.inferPriority(steps)
    };
  }

  private static parseIngredient(text: string, id: string): Ingredient {
    // Extract amount, unit, and name from ingredient text
    const match = text.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)/);
    
    if (match) {
      return {
        id,
        amount: parseFloat(match[1]),
        unit: match[2] || 'unit',
        name: match[3].trim(),
        category: this.categorizeIngredient(match[3])
      };
    }

    return {
      id,
      amount: 1,
      unit: 'unit',
      name: text.replace(/^[\d\.\s]*/, '').trim(),
      category: 'other'
    };
  }

  private static parseStep(text: string, id: string): RecipeStep {
    const cleanText = text.replace(/^\d+\.\s*/, '').trim();
    
    return {
      id,
      instruction: cleanText,
      duration: this.estimateDuration(cleanText),
      type: this.classifyStepType(cleanText),
      equipment: this.extractEquipment(cleanText)
    };
  }

  private static estimateDuration(instruction: string): number {
    const lower = instruction.toLowerCase();
    
    // Look for explicit time mentions
    const timeMatch = lower.match(/(\d+)\s*(minute|min|hour|hr)/);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2];
      return unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 : value;
    }

    // Estimate based on cooking verbs
    if (lower.includes('bake') || lower.includes('roast')) return 30;
    if (lower.includes('simmer') || lower.includes('braise')) return 20;
    if (lower.includes('sauté') || lower.includes('fry')) return 10;
    if (lower.includes('boil')) return 15;
    if (lower.includes('chop') || lower.includes('dice') || lower.includes('slice')) return 5;
    if (lower.includes('mix') || lower.includes('stir') || lower.includes('combine')) return 3;
    if (lower.includes('preheat')) return 10;
    if (lower.includes('rest') || lower.includes('cool') || lower.includes('chill')) return 15;

    return 5; // default
  }

  private static classifyStepType(instruction: string): 'prep' | 'cook' | 'rest' | 'serve' {
    const lower = instruction.toLowerCase();
    
    if (lower.includes('serve') || lower.includes('plate') || lower.includes('garnish')) return 'serve';
    if (lower.includes('rest') || lower.includes('cool') || lower.includes('chill') || lower.includes('stand')) return 'rest';
    if (lower.includes('cook') || lower.includes('bake') || lower.includes('fry') || lower.includes('sauté') || 
        lower.includes('boil') || lower.includes('simmer') || lower.includes('roast') || lower.includes('grill')) return 'cook';
    
    return 'prep';
  }

  private static extractEquipment(instruction: string): Equipment[] {
    const lower = instruction.toLowerCase();
    const equipment: Equipment[] = [];
    
    if (lower.includes('oven') || lower.includes('bake') || lower.includes('roast')) {
      equipment.push({ id: 'oven-1', name: 'Oven', type: 'oven', capacity: 1 });
    }
    if (lower.includes('pan') || lower.includes('skillet') || lower.includes('sauté') || lower.includes('fry')) {
      equipment.push({ id: 'stovetop-1', name: 'Stovetop', type: 'stovetop', capacity: 4 });
    }
    if (lower.includes('pot') || lower.includes('boil') || lower.includes('simmer')) {
      equipment.push({ id: 'stovetop-2', name: 'Stovetop', type: 'stovetop', capacity: 4 });
    }
    if (lower.includes('mixer') || lower.includes('whip') || lower.includes('beat')) {
      equipment.push({ id: 'mixer-1', name: 'Mixer', type: 'mixer', capacity: 1 });
    }

    return equipment;
  }

  private static categorizeIngredient(name: string): Ingredient['category'] {
    const lower = name.toLowerCase();
    
    if (lower.includes('chicken') || lower.includes('beef') || lower.includes('pork') || 
        lower.includes('fish') || lower.includes('egg')) return 'protein';
    if (lower.includes('onion') || lower.includes('carrot') || lower.includes('potato') || 
        lower.includes('pepper') || lower.includes('tomato')) return 'vegetable';
    if (lower.includes('rice') || lower.includes('pasta') || lower.includes('bread') || 
        lower.includes('flour')) return 'grain';
    if (lower.includes('milk') || lower.includes('cheese') || lower.includes('butter') || 
        lower.includes('cream')) return 'dairy';
    if (lower.includes('salt') || lower.includes('pepper') || lower.includes('herb') || 
        lower.includes('spice')) return 'spice';
    
    return 'other';
  }

  private static inferEquipment(steps: RecipeStep[]): Equipment[] {
    const equipmentSet = new Set<string>();
    steps.forEach(step => {
      step.equipment?.forEach(eq => equipment.add(eq.id));
    });
    
    return Array.from(equipmentSet).map(id => ({
      id,
      name: id.split('-')[0],
      type: id.split('-')[0] as Equipment['type'],
      capacity: 1
    }));
  }

  private static inferPriority(steps: RecipeStep[]): Recipe['priority'] {
    const hasQuickDegrading = steps.some(step => {
      const lower = step.instruction.toLowerCase();
      return lower.includes('fry') || lower.includes('crispy') || 
             lower.includes('fresh') || lower.includes('immediately');
    });
    
    if (hasQuickDegrading) return 'high';
    
    const hasCooking = steps.some(step => step.type === 'cook');
    return hasCooking ? 'medium' : 'low';
  }
}