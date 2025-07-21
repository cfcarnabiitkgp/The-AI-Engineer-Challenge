'use client'

import { useState } from 'react'

interface RecipeForm {
  ingredients: string[]
  servings: string
  cookingTime: string
  cuisineType: string
  dietaryRestrictions: string[]
}

interface EnhancedRecipe {
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  prepTime: string
  cookTime: string
  totalTime: string
  servings: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  instructions: string[]
  tips: string[]
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
  }
}

const dietaryOptions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Keto', 'Paleo', 'Low-Carb', 'Nut-Free'
]

const servingOptions = ['2 people', '4 people', '6 people', '8 people']
const cookingTimeOptions = ['15 minutes', '30 minutes', '45 minutes', '60 minutes', '90 minutes']
const cuisineOptions = ['Indian', 'Mediterranean', 'Chinese', 'American', 'Continental', 'Italian', 'Mexican', 'Thai']

export default function Home() {
  const [form, setForm] = useState<RecipeForm>({
    ingredients: [],
    servings: '4 people',
    cookingTime: '30 minutes',
    cuisineType: 'Continental',
    dietaryRestrictions: []
  })
  
  const [newIngredient, setNewIngredient] = useState('')
  const [recipe, setRecipe] = useState('')
  const [enhancedRecipe, setEnhancedRecipe] = useState<EnhancedRecipe | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const addIngredient = () => {
    if (newIngredient.trim() && !form.ingredients.includes(newIngredient.trim())) {
      setForm(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }))
      setNewIngredient('')
    }
  }

  const removeIngredient = (index: number) => {
    setForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  const toggleDietaryRestriction = (restriction: string) => {
    setForm(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }))
  }

  const parseEnhancedRecipe = (rawRecipe: string): EnhancedRecipe => {
    // Default values
    const defaultRecipe: EnhancedRecipe = {
      title: 'Delicious Recipe',
      description: 'A tasty dish made with your ingredients',
      difficulty: 'Medium',
      prepTime: '15 minutes',
      cookTime: '30 minutes',
      totalTime: '45 minutes',
      servings: form.servings,
      calories: 350,
      protein: 15,
      carbs: 45,
      fat: 12,
      ingredients: form.ingredients,
      instructions: [],
      tips: [],
      nutrition: {
        calories: 350,
        protein: 15,
        carbs: 45,
        fat: 12,
        fiber: 8,
        sugar: 10
      }
    }

    try {
      const lines = rawRecipe.split('\n').filter(line => line.trim())
      
      // Extract title
      const titleMatch = lines.find(line => 
        line.includes('Recipe Title:') || 
        line.includes('Title:') ||
        (line.length < 100 && !line.includes(':') && !line.includes('-'))
      )
      if (titleMatch) {
        defaultRecipe.title = titleMatch.replace(/^(Recipe Title:|Title:)/, '').trim()
      }

      // Extract description
      const descMatch = lines.find(line => line.includes('Description:'))
      if (descMatch) {
        defaultRecipe.description = descMatch.replace('Description:', '').trim()
      }

      // Extract ingredients
      const ingredientsStart = lines.findIndex(line => line.includes('Ingredients:'))
      if (ingredientsStart !== -1) {
        const ingredients = []
        for (let i = ingredientsStart + 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line.startsWith('-') || line.startsWith('•')) {
            ingredients.push(line.replace(/^[-•]\s*/, '').trim())
          } else if (line.includes('Instructions:') || line.includes('Tips:')) {
            break
          } else if (line && !line.includes(':')) {
            ingredients.push(line)
          }
        }
        if (ingredients.length > 0) {
          defaultRecipe.ingredients = ingredients
        }
      }

      // Extract instructions
      const instructionsStart = lines.findIndex(line => line.includes('Instructions:'))
      if (instructionsStart !== -1) {
        const instructions = []
        for (let i = instructionsStart + 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (/^\d+\./.test(line)) {
            instructions.push(line.replace(/^\d+\.\s*/, '').trim())
          } else if (line.includes('Tips:') || line.includes('Description:')) {
            break
          }
        }
        if (instructions.length > 0) {
          defaultRecipe.instructions = instructions
        }
      }

      // Extract tips
      const tipsStart = lines.findIndex(line => line.includes('Tips:'))
      if (tipsStart !== -1) {
        const tips = []
        for (let i = tipsStart + 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line.startsWith('-') || line.startsWith('•')) {
            tips.push(line.replace(/^[-•]\s*/, '').trim())
          } else if (line && !line.includes(':')) {
            tips.push(line)
          }
        }
        if (tips.length > 0) {
          defaultRecipe.tips = tips
        }
      }

      // Parse cooking time constraint
      const cookingTimeMinutes = parseInt(form.cookingTime) || 30
      
      // Estimate difficulty based on ingredients and cooking time
      const ingredientCount = defaultRecipe.ingredients.length
      
      if (cookingTimeMinutes <= 20 && ingredientCount <= 5) {
        defaultRecipe.difficulty = 'Easy'
      } else if (cookingTimeMinutes >= 60 || ingredientCount >= 10) {
        defaultRecipe.difficulty = 'Hard'
      } else {
        defaultRecipe.difficulty = 'Medium'
      }

      // Calculate times based on cooking time constraint
      const prepTimeMinutes = Math.max(5, Math.floor(cookingTimeMinutes * 0.3)) // 30% for prep
      const cookTimeMinutes = cookingTimeMinutes - prepTimeMinutes // Remaining for cooking
      
      // Ensure total time never exceeds the constraint
      const totalTimeMinutes = Math.min(cookingTimeMinutes, prepTimeMinutes + cookTimeMinutes)
      
      defaultRecipe.prepTime = `${prepTimeMinutes} minutes`
      defaultRecipe.cookTime = `${cookTimeMinutes} minutes`
      defaultRecipe.totalTime = `${totalTimeMinutes} minutes`

      // Estimate nutrition based on ingredients
      const nutritionEstimate = estimateNutrition(defaultRecipe.ingredients, form.dietaryRestrictions)
      defaultRecipe.nutrition = nutritionEstimate
      defaultRecipe.calories = nutritionEstimate.calories
      defaultRecipe.protein = nutritionEstimate.protein
      defaultRecipe.carbs = nutritionEstimate.carbs
      defaultRecipe.fat = nutritionEstimate.fat

      return defaultRecipe
    } catch (error) {
      console.error('Error parsing recipe:', error)
      return defaultRecipe
    }
  }

  const estimateNutrition = (ingredients: string[], dietaryRestrictions: string[]) => {
    // Simple nutrition estimation based on ingredients
    let calories = 0
    let protein = 0
    let carbs = 0
    let fat = 0
    let fiber = 0
    let sugar = 0

    ingredients.forEach(ingredient => {
      const lowerIngredient = ingredient.toLowerCase()
      
      // Protein sources
      if (lowerIngredient.includes('chicken') || lowerIngredient.includes('beef') || 
          lowerIngredient.includes('fish') || lowerIngredient.includes('pork')) {
        calories += 200
        protein += 25
        fat += 8
      }
      
      // Carbs
      if (lowerIngredient.includes('rice') || lowerIngredient.includes('pasta') || 
          lowerIngredient.includes('bread') || lowerIngredient.includes('potato')) {
        calories += 150
        carbs += 30
        fiber += 3
      }
      
      // Vegetables
      if (lowerIngredient.includes('tomato') || lowerIngredient.includes('onion') || 
          lowerIngredient.includes('garlic') || lowerIngredient.includes('pepper')) {
        calories += 30
        carbs += 7
        fiber += 2
      }
      
      // Dairy
      if (lowerIngredient.includes('cheese') || lowerIngredient.includes('milk') || 
          lowerIngredient.includes('yogurt')) {
        calories += 100
        protein += 8
        fat += 6
      }
      
      // Fats
      if (lowerIngredient.includes('oil') || lowerIngredient.includes('butter') || 
          lowerIngredient.includes('olive')) {
        calories += 120
        fat += 14
      }
    })

    // Adjust for dietary restrictions
    if (dietaryRestrictions.includes('Vegan')) {
      protein = Math.max(protein - 10, 5)
      fat = Math.max(fat - 5, 3)
    }
    
    if (dietaryRestrictions.includes('Low-Carb')) {
      carbs = Math.max(carbs - 15, 5)
      fat += 10
    }

    return { calories, protein, carbs, fat, fiber, sugar }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const generateRecipe = async () => {
    if (form.ingredients.length === 0) {
      alert('Please add at least one ingredient')
      return
    }

    setIsGenerating(true)
    setRecipe('')
    setEnhancedRecipe(null)

    const userMessage = `Ingredients: ${form.ingredients.join(', ')}
Servings: ${form.servings}
Cooking Time: ${form.cookingTime} (STRICT LIMIT - total time must not exceed this)
Cuisine Type: ${form.cuisineType}
Dietary Restrictions: ${form.dietaryRestrictions.length > 0 ? form.dietaryRestrictions.join(', ') : 'None'}

Please generate a delicious recipe with the following structure:

Recipe Title: [Creative recipe name]

Description: [Brief description of the dish]

Ingredients:
- [List all ingredients with quantities]

Instructions:
1. [Step-by-step instructions with timing - TOTAL TIME MUST NOT EXCEED ${form.cookingTime}]
2. [Continue with numbered steps]
3. [Include cooking times for each step]

Tips:
- [Helpful cooking tips]
- [Serving suggestions]
- [Storage recommendations]

IMPORTANT: The total cooking time must be ${form.cookingTime} or less. Break down the time between prep and cooking steps accordingly. Make it easy to follow and ensure it's delicious!`

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: 'Generate a recipe',
          user_message: userMessage,
          model: 'gpt-4.1-mini'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate recipe')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let accumulatedRecipe = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        accumulatedRecipe += chunk
        setRecipe(accumulatedRecipe)
      }

      // Parse the recipe into enhanced format
      const parsedRecipe = parseEnhancedRecipe(accumulatedRecipe)
      setEnhancedRecipe(parsedRecipe)
    } catch (error) {
      console.error('Error generating recipe:', error)
      setRecipe('Sorry, there was an error generating your recipe. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          🍳 Recipe Generator
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recipe Parameters Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="text-primary-500 mr-2">⚙️</span>
              Recipe Parameters
            </h2>

            {/* Ingredients */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Ingredients
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                  placeholder="Enter an ingredient..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={addIngredient}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  +
                </button>
              </div>
              
              {/* Ingredients List */}
              <div className="mt-3 flex flex-wrap gap-2">
                {form.ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(index)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Servings */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="mr-2">👥</span>
                Servings
              </label>
              <select
                value={form.servings}
                onChange={(e) => setForm(prev => ({ ...prev, servings: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {servingOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Cooking Time */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="mr-2">⏰</span>
                Cooking Time
              </label>
              <select
                value={form.cookingTime}
                onChange={(e) => setForm(prev => ({ ...prev, cookingTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {cookingTimeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Cuisine Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="mr-2">🌍</span>
                Cuisine Type
              </label>
              <select
                value={form.cuisineType}
                onChange={(e) => setForm(prev => ({ ...prev, cuisineType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {cuisineOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Dietary Restrictions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Restrictions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {dietaryOptions.map(option => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.dietaryRestrictions.includes(option)}
                      onChange={() => toggleDietaryRestriction(option)}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateRecipe}
              disabled={isGenerating || form.ingredients.length === 0}
              className="w-full bg-gradient-to-r from-primary-500 to-pink-500 text-white py-3 px-6 rounded-md font-medium hover:from-primary-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Recipe...
                </>
              ) : (
                <>
                  Generate Recipe ✨
                </>
              )}
            </button>
          </div>

          {/* Enhanced Recipe Output Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="text-primary-500 mr-2">👨‍🍳</span>
              Your Recipe
            </h2>

            {!recipe && !isGenerating ? (
              <div className="text-center py-12">
                <div className="text-gray-300 text-6xl mb-4">👨‍🍳</div>
                <p className="text-gray-500 mb-2">Add your ingredients and click "Generate Recipe" to get started!</p>
                <p className="text-gray-400 text-sm">AI will create a delicious recipe just for you</p>
              </div>
            ) : enhancedRecipe ? (
              <div className="space-y-6">
                {/* Recipe Header */}
                <div className="text-center border-b border-gray-200 pb-6">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{enhancedRecipe.title}</h1>
                  <p className="text-gray-600 mb-4">{enhancedRecipe.description}</p>
                  
                                     {/* Recipe Stats */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="text-center">
                       <div className="text-2xl font-bold text-primary-600">{enhancedRecipe.servings}</div>
                       <div className="text-sm text-gray-500">Servings</div>
                     </div>
                     <div className="text-center">
                       <div className="text-2xl font-bold text-primary-600">{enhancedRecipe.totalTime}</div>
                       <div className="text-sm text-gray-500">Total Time</div>
                       <div className="text-xs text-green-600 font-medium">✓ Within {form.cookingTime} limit</div>
                     </div>
                     <div className="text-center">
                       <div className="text-2xl font-bold text-primary-600">{enhancedRecipe.calories}</div>
                       <div className="text-sm text-gray-500">Calories</div>
                     </div>
                     <div className="text-center">
                       <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(enhancedRecipe.difficulty)}`}>
                         {enhancedRecipe.difficulty}
                       </span>
                       <div className="text-sm text-gray-500 mt-1">Difficulty</div>
                     </div>
                   </div>
                </div>

                {/* Time Breakdown */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="text-primary-500 mr-2">⏰</span>
                    Time Breakdown
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{enhancedRecipe.prepTime}</div>
                      <div className="text-sm text-gray-500">Prep Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{enhancedRecipe.cookTime}</div>
                      <div className="text-sm text-gray-500">Cook Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{enhancedRecipe.totalTime}</div>
                      <div className="text-sm text-gray-500">Total Time</div>
                    </div>
                  </div>
                </div>

                {/* Nutrition Facts */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="text-primary-500 mr-2">📊</span>
                    Nutrition Facts
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">{enhancedRecipe.nutrition.calories}</div>
                      <div className="text-sm text-gray-500">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">{enhancedRecipe.nutrition.protein}g</div>
                      <div className="text-sm text-gray-500">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">{enhancedRecipe.nutrition.carbs}g</div>
                      <div className="text-sm text-gray-500">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">{enhancedRecipe.nutrition.fat}g</div>
                      <div className="text-sm text-gray-500">Fat</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">{enhancedRecipe.nutrition.fiber}g</div>
                      <div className="text-sm text-gray-500">Fiber</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">{enhancedRecipe.nutrition.sugar}g</div>
                      <div className="text-sm text-gray-500">Sugar</div>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="text-primary-500 mr-2">🥘</span>
                    Ingredients
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {enhancedRecipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                        <span className="text-primary-500 mr-2">•</span>
                        <span className="text-gray-700">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                {enhancedRecipe.instructions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="text-primary-500 mr-2">📝</span>
                      Instructions
                    </h3>
                    <div className="space-y-3">
                      {enhancedRecipe.instructions.map((instruction, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">
                            {index + 1}
                          </div>
                          <p className="text-gray-700 leading-relaxed">{instruction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {enhancedRecipe.tips.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="text-primary-500 mr-2">💡</span>
                      Chef's Tips
                    </h3>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
                      {enhancedRecipe.tips.map((tip, index) => (
                        <p key={index} className="text-gray-700 mb-2 last:mb-0">
                          {tip}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Recipe (for debugging) */}
                <details className="mt-6">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Show raw recipe text
                  </summary>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md">
                    <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed">
                      {recipe}
                    </pre>
                  </div>
                </details>
              </div>
            ) : (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed">
                  {recipe}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* MIT License */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>MIT License - Feel free to use this project for your own recipes! 🍽️</p>
        </div>
      </div>
    </div>
  )
} 