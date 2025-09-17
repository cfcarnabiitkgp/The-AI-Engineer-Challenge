'use client'

import { useState, useRef, useEffect } from 'react'

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

interface PDFFile {
  filename: string
  status: 'uploaded' | 'processed'
  size: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SuggestedQuestion {
  question: string
  category: string
  confidence: number
}

interface QuestionSuggestionsResponse {
  questions: SuggestedQuestion[]
  content_summary: string
}


// Utility function to format chat content
const formatChatContent = (content: string): string => {
  return content
    // Remove markdown headers (# ## ###)
    .replace(/^#{1,6}\s+/gm, '')
    // Convert **bold** to bold (we'll handle this with CSS)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Convert *italic* to italic
    .replace(/\*(.*?)\*/g, '$1')
    // Convert bullet points to cleaner format
    .replace(/^[\s]*[-*+]\s+/gm, '• ')
    // Convert numbered lists to cleaner format
    .replace(/^[\s]*\d+\.\s+/gm, (match, offset, string) => {
      const num = match.trim().replace('.', '')
      return `${num}. `
    })
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudioText, setCurrentAudioText] = useState('')
  const [audioTitle, setAudioTitle] = useState('')
  const [playbackSpeed, setPlaybackSpeed] = useState(0.8)
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  
  // PDF and RAG functionality state
  const [activeTab, setActiveTab] = useState<'recipe' | 'pdf'>('recipe')
  const [uploadedPDFs, setUploadedPDFs] = useState<PDFFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [ragMessages, setRagMessages] = useState<ChatMessage[]>([])
  const [ragInput, setRagInput] = useState('')
  const [isRagGenerating, setIsRagGenerating] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([])
  const [contentSummary, setContentSummary] = useState('')
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [showUploadHelp, setShowUploadHelp] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [bottomPanelTab, setBottomPanelTab] = useState<'audio'>('audio')
  const [showShareModal, setShowShareModal] = useState(false)
  const [currentRecipe, setCurrentRecipe] = useState<EnhancedRecipe | string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const addIngredient = () => {
    if (newIngredient.trim() && !form.ingredients.includes(newIngredient.trim())) {
      setForm(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }))
      setNewIngredient('')
    }
  }

  const formatRecipeForText = (recipe: EnhancedRecipe | string): string => {
    if (typeof recipe === 'string') {
      return recipe
    }
    
    // Format EnhancedRecipe object into readable text
    let text = `🍳 ${recipe.title}\n`
    text += `${'='.repeat(recipe.title.length + 4)}\n\n`
    
    if (recipe.description) {
      text += `📝 Description:\n${recipe.description}\n\n`
    }
    
    text += `⏱️  Cooking Time:\n`
    text += `   Prep Time: ${recipe.prepTime}\n`
    text += `   Cook Time: ${recipe.cookTime}\n`
    text += `   Total Time: ${recipe.totalTime}\n\n`
    
    text += `👥 Servings: ${recipe.servings}\n`
    text += `🔥 Difficulty: ${recipe.difficulty}\n`
    text += `📊 Calories: ${recipe.calories}\n\n`
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      text += `🥘 Ingredients:\n`
      recipe.ingredients.forEach((ingredient, index) => {
        text += `   ${index + 1}. ${ingredient}\n`
      })
      text += `\n`
    }
    
    if (recipe.instructions && recipe.instructions.length > 0) {
      text += `📋 Instructions:\n`
      recipe.instructions.forEach((instruction, index) => {
        text += `   ${index + 1}. ${instruction}\n`
      })
      text += `\n`
    }
    
    if (recipe.tips && recipe.tips.length > 0) {
      text += `💡 Chef's Tips:\n`
      recipe.tips.forEach((tip, index) => {
        text += `   • ${tip}\n`
      })
      text += `\n`
    }
    
    if (recipe.nutrition) {
      text += `📊 Nutrition (per serving):\n`
      text += `   Calories: ${recipe.nutrition.calories}\n`
      text += `   Protein: ${recipe.nutrition.protein}g\n`
      text += `   Carbs: ${recipe.nutrition.carbs}g\n`
      text += `   Fat: ${recipe.nutrition.fat}g\n`
      text += `   Fiber: ${recipe.nutrition.fiber}g\n`
      text += `   Sugar: ${recipe.nutrition.sugar}g\n\n`
    }
    
    text += `Generated by AI Recipe Generator\n`
    text += `Shared on ${new Date().toLocaleDateString()}\n`
    
    return text
  }

  const downloadRecipeAsText = (recipe: EnhancedRecipe | string) => {
    const textContent = formatRecipeForText(recipe)
    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    // Generate filename
    const recipeTitle = typeof recipe === 'string' 
      ? 'Recipe' 
      : recipe.title.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${recipeTitle}_${new Date().toISOString().split('T')[0]}.txt`
    
    // Create download link
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleShare = (recipe: EnhancedRecipe | string) => {
    setCurrentRecipe(recipe)
    setShowShareModal(true)
  }

  const handleDownload = () => {
    if (currentRecipe) {
      downloadRecipeAsText(currentRecipe)
      setShowShareModal(false)
    }
  }

  const formatRecipeForSocial = (recipe: EnhancedRecipe | string): string => {
    if (typeof recipe === 'string') {
      // Extract title from raw text if possible
      const lines = recipe.split('\n')
      const titleLine = lines.find(line => line.includes('Recipe Title:') || line.includes('Title:'))
      const title = titleLine ? titleLine.replace(/^(Recipe Title:|Title:)/, '').trim() : 'Delicious Recipe'
      
      return `🍳 ${title}\n\n${recipe.substring(0, 200)}${recipe.length > 200 ? '...' : ''}\n\n#Recipe #Cooking #Food`
    }
    
    // Format EnhancedRecipe for social media
    let text = `🍳 ${recipe.title}\n\n`
    
    if (recipe.description) {
      text += `${recipe.description}\n\n`
    }
    
    text += `⏱️ ${recipe.totalTime} | 👥 ${recipe.servings} servings | 🔥 ${recipe.difficulty}\n\n`
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      text += `🥘 Ingredients:\n`
      recipe.ingredients.slice(0, 5).forEach((ingredient, index) => {
        text += `• ${ingredient}\n`
      })
      if (recipe.ingredients.length > 5) {
        text += `• ... and ${recipe.ingredients.length - 5} more ingredients\n`
      }
      text += `\n`
    }
    
    text += `#Recipe #Cooking #Food #${recipe.title.replace(/[^a-zA-Z0-9]/g, '')}`
    
    return text
  }

  const shareToFacebook = () => {
    if (!currentRecipe) return
    
    const text = formatRecipeForSocial(currentRecipe)
    const encodedText = encodeURIComponent(text)
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodedText}`
    
    window.open(url, '_blank', 'width=600,height=400')
    setShowShareModal(false)
  }

  const clearChat = () => {
    setRagMessages([])
    setShowClearConfirm(false)
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

  const getCategoryColor = (category: string) => {
    // Normalize category to lowercase for comparison
    const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_')
    
    switch (normalizedCategory) {
      case 'recipe_creation':
      case 'recipe creation': return 'bg-red-100 text-red-800'
      case 'techniques':
      case 'cooking_techniques':
      case 'cooking techniques': return 'bg-purple-100 text-purple-800'
      case 'instructions': return 'bg-green-100 text-green-800'
      case 'flavor_pairing':
      case 'flavor pairing': return 'bg-yellow-100 text-yellow-800'
      case 'meal_planning':
      case 'meal planning': return 'bg-blue-100 text-blue-800'
      case 'tips': return 'bg-orange-100 text-orange-800'
      case 'timing': return 'bg-indigo-100 text-indigo-800'
      case 'equipment': return 'bg-gray-100 text-gray-800'
      case 'substitutions': return 'bg-pink-100 text-pink-800'
      case 'servings': return 'bg-teal-100 text-teal-800'
      case 'nutrition': return 'bg-emerald-100 text-emerald-800'
      case 'storage': return 'bg-cyan-100 text-cyan-800'
      case 'dietary_considerations':
      case 'dietary considerations': return 'bg-green-100 text-green-800'
      case 'time_efficient_cooking':
      case 'time-efficient cooking': return 'bg-orange-100 text-orange-800'
      // Legacy categories for backward compatibility
      case 'ingredients': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  // PDF and RAG functionality
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('https://arnab-ai-challenge-problem-i9h4e2t73.vercel.app/api/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadMessage(`✅ ${result.message}`)
        await loadPDFs() // Refresh the PDF list
      } else {
        setUploadMessage(`❌ ${result.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadMessage('❌ Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const loadPDFs = async () => {
    try {
      const response = await fetch('https://arnab-ai-challenge-problem-i9h4e2t73.vercel.app/api/pdfs')
      const result = await response.json()
      
      if (response.ok) {
        setUploadedPDFs(result.pdfs || [])
        // Load question suggestions when PDFs are loaded
        await loadQuestionSuggestions()
      }
    } catch (error) {
      console.error('Error loading PDFs:', error)
    }
  }

  const loadQuestionSuggestions = async () => {
    setIsLoadingQuestions(true)
    try {
      const response = await fetch('https://arnab-ai-challenge-problem-i9h4e2t73.vercel.app/api/suggest-questions')
      const result: QuestionSuggestionsResponse = await response.json()
      
      if (response.ok) {
        setSuggestedQuestions(result.questions || [])
        setContentSummary(result.content_summary || '')
      } else {
        console.error('Failed to load question suggestions')
        setSuggestedQuestions([])
        setContentSummary('')
      }
    } catch (error) {
      console.error('Error loading question suggestions:', error)
      setSuggestedQuestions([])
      setContentSummary('')
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const deletePDF = async (filename: string) => {
    try {
        const response = await fetch(`https://arnab-ai-challenge-problem-i9h4e2t73.vercel.app/api/pdfs/${filename}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Refresh PDF list and question suggestions
        await loadPDFs()
        await loadQuestionSuggestions()
        setUploadMessage(`✅ PDF '${filename}' deleted successfully`)
      } else {
        const error = await response.json()
        setUploadMessage(`❌ Failed to delete PDF: ${error.detail}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      setUploadMessage('❌ Delete failed. Please try again.')
    }
  }

  const clearAllPDFs = async () => {
    try {
        const response = await fetch('https://arnab-ai-challenge-problem-i9h4e2t73.vercel.app/api/pdfs', {
        method: 'DELETE',
      })
      
      if (response.ok) {
        const result = await response.json()
        // Refresh PDF list and question suggestions
        await loadPDFs()
        await loadQuestionSuggestions()
        setUploadMessage(`✅ ${result.message}`)
        setBottomPanelTab('audio') // Switch back to audio tab
      } else {
        const error = await response.json()
        setUploadMessage(`❌ Failed to clear PDFs: ${error.detail}`)
      }
    } catch (error) {
      console.error('Clear all error:', error)
      setUploadMessage('❌ Clear all failed. Please try again.')
    }
  }

  const sendRAGMessage = async () => {
    if (!ragInput.trim() || isRagGenerating) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: ragInput.trim(),
      timestamp: new Date()
    }

    setRagMessages(prev => [...prev, userMessage])
    setRagInput('')
    setIsRagGenerating(true)

    try {
        const response = await fetch('https://arnab-ai-challenge-problem-i9h4e2t73.vercel.app/api/rag-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_message: userMessage.content,
          model: 'gpt-4o-mini'
        }),
      })

      if (!response.ok) {
        throw new Error('RAG chat failed')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let assistantMessage = ''

      const assistantMessageObj: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }

      setRagMessages(prev => [...prev, assistantMessageObj])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantMessage += chunk
        
        // Update the last message (assistant's response)
        setRagMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: assistantMessage
          }
          return updated
        })
      }

    } catch (error) {
      console.error('RAG chat error:', error)
      setRagMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your question. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsRagGenerating(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Load PDFs on component mount
  useEffect(() => {
    loadPDFs()
  }, [])

  // Load user preferences
  useEffect(() => {
    const savedSpeed = localStorage.getItem('audioPlaybackSpeed')
    if (savedSpeed) setPlaybackSpeed(parseFloat(savedSpeed))
  }, [])

  // Simple and reliable audio functionality
  const playAudio = (text: string, title: string) => {
    if (!text) {
      console.log('No text provided to playAudio')
      return
    }
    
    if ('speechSynthesis' in window) {
      console.log('Starting audio playback:', title)
      
      // Stop any current speech
      window.speechSynthesis.cancel()
      
      setCurrentAudioText(text)
      setAudioTitle(title)
      setAudioProgress(0)
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = playbackSpeed
      utterance.pitch = 1
      utterance.volume = 1
      // Use browser's default voice
      
      utterance.onstart = () => {
        console.log('Audio started playing')
        setIsPlaying(true)
        setCurrentUtterance(utterance)
        setAudioProgress(0)
        
        // Dynamic progress tracking using multiple approaches
        const wordCount = text.split(/\s+/).length
        const roughWordsPerMinute = 150 * playbackSpeed
        const roughDuration = (wordCount / roughWordsPerMinute) * 60 * 1000
        setAudioDuration(roughDuration)
        
        // Track progress with multiple methods for accuracy
        const startTime = Date.now()
        let progressInterval: NodeJS.Timeout
        
        // Method 1: Time-based estimation with speech synthesis checks
        const updateProgress = () => {
          const elapsed = Date.now() - startTime
          const isSpeaking = window.speechSynthesis.speaking
          
          if (isSpeaking) {
            // While speaking, use time-based progress but cap it
            const timeBasedProgress = Math.min((elapsed / roughDuration) * 100, 90)
            setAudioProgress(timeBasedProgress)
          } else {
            // Speech ended, complete the progress
            setAudioProgress(100)
            if (progressInterval) clearInterval(progressInterval)
          }
        }
        
        // Start progress tracking
        progressInterval = setInterval(updateProgress, 150)
        
        // Method 2: Use utterance events for more accurate tracking
        utterance.onboundary = (event) => {
          // This fires when speech reaches word/sentence boundaries
          if (event.name === 'word' || event.name === 'sentence') {
            // Calculate progress based on character position
            const charProgress = (event.charIndex / text.length) * 100
            const timeProgress = Math.min((Date.now() - startTime) / roughDuration * 100, 95)
            
            // Use the more conservative of the two progress indicators
            const progress = Math.min(charProgress, timeProgress)
            setAudioProgress(progress)
          }
        }
        
        // Method 3: Fallback progress tracking for browsers that don't support onboundary well
        utterance.onstart = () => {
          // Reset progress when speech actually starts
          setAudioProgress(0)
        }
        
        // Store interval for cleanup
        ;(utterance as any).progressInterval = progressInterval
      }
      
      utterance.onend = () => {
        console.log('Audio finished playing')
        setIsPlaying(false)
        setCurrentUtterance(null)
        setAudioProgress(100)
        
        // Clear progress interval
        if ((utterance as any).progressInterval) {
          clearInterval((utterance as any).progressInterval)
        }
        
        // Keep audio player visible - don't clear text/title
      }
      
      utterance.onerror = (event) => {
        console.error('Audio error:', event)
        setIsPlaying(false)
        setCurrentUtterance(null)
        setAudioProgress(0)
        
        // Clear progress interval
        if ((utterance as any).progressInterval) {
          clearInterval((utterance as any).progressInterval)
        }
        
        // Keep audio player visible even on error - user can retry
      }
      
      console.log('Speaking utterance with rate:', utterance.rate, 'voice:', utterance.voice?.name || 'default')
      window.speechSynthesis.speak(utterance)
    } else {
      alert('Speech synthesis not supported in this browser')
    }
  }

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      
      // Clear progress interval
      if (currentUtterance && (currentUtterance as any).progressInterval) {
        clearInterval((currentUtterance as any).progressInterval)
      }
      
      setCurrentUtterance(null)
      // Keep audio player visible for settings adjustment
    }
  }

  const clearAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      
      // Clear progress interval
      if (currentUtterance && (currentUtterance as any).progressInterval) {
        clearInterval((currentUtterance as any).progressInterval)
      }
      
      setCurrentAudioText('')
      setAudioTitle('')
      setCurrentUtterance(null)
      setAudioProgress(0)
      setAudioDuration(0)
    }
  }

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio()
    } else if (currentAudioText) {
      // Resume playing the current audio
      playAudio(currentAudioText, audioTitle)
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    localStorage.setItem('audioPlaybackSpeed', speed.toString())
    
    // Apply speed change to current utterance if playing
    if (currentUtterance && isPlaying) {
      currentUtterance.rate = speed
      console.log('Speed changed to:', speed)
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
      // Call the backend directly - it's deployed as a serverless function
        const response = await fetch('https://arnab-ai-challenge-problem-i9h4e2t73.vercel.app/api/chat', {
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
    <div className="min-h-screen bg-gray-50 py-8 pb-24">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Culinary Compass
        </h1>
        

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => setActiveTab('recipe')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'recipe'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🍳 Recipe Generator
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'pdf'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🤖 Recipe Copilot
            </button>
          </div>
        </div>

        {/* Enhanced Bottom Panel with Tabs */}
        {currentAudioText && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-4xl w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              {/* Audio Player Header */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900">Audio Player</h3>
                </div>
              </div>

              {/* Audio Player Content */}
              <div className="p-4">
                {currentAudioText && (
                  <div>
                    {/* Audio Player Content */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          🔊 {audioTitle}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {isPlaying ? (
                            <>
                              Playing audio
                              <span className="ml-2 text-primary-500">●</span>
                            </>
                          ) : (
                            'Ready to play'
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={toggleAudio}
                          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 hover:border-gray-300"
                        >
                          {isPlaying ? (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Pause
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h10a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                              </svg>
                              Play
                            </>
                          )}
                        </button>
                        <button
                          onClick={clearAudio}
                          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 hover:border-gray-300"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Close
                        </button>
                      </div>
                    </div>

                    {/* Audio Controls */}
                    <div className="max-w-md mx-auto">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Playback Speed
                          {isPlaying && (
                            <span className="ml-1 text-green-500 text-xs">● Live</span>
                          )}
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">0.5x</span>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={playbackSpeed}
                            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                            className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${
                              isPlaying ? 'ring-2 ring-green-200' : ''
                            }`}
                          />
                          <span className="text-xs text-gray-500">2x</span>
                          <span className={`text-xs font-medium min-w-[3rem] ${
                            isPlaying ? 'text-green-600' : 'text-primary-600'
                          }`}>
                            {playbackSpeed}x
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Audio Progress Bar */}
                    {currentAudioText && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full transition-all duration-100 ease-out"
                            style={{ width: `${audioProgress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{Math.round(audioProgress)}%</span>
                          <span>{isPlaying ? 'Playing...' : 'Ready'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}


              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Share Recipe</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">Choose how you'd like to share this recipe:</p>
                
                {/* Social Media Sharing */}
                <div className="space-y-3 mb-6">
                  <h4 className="text-sm font-medium text-gray-700">Share on Social Media</h4>
                  
                  <button
                    onClick={shareToFacebook}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Share on Facebook
                  </button>
                </div>
                
                {/* Download Option */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Download Recipe</h4>
                  
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download as Text File
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                <p>Share your delicious recipe with friends and family!</p>
              </div>
            </div>
          </div>
        )}

        {/* Clear Chat Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Clear Chat History</h3>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to clear all chat messages? This action cannot be undone.
                </p>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={clearChat}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Clear Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Generator Tab */}
        {activeTab === 'recipe' && (
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
                  
                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4 pb-4">
                    <button
                      onClick={() => playAudio(recipe, `Recipe: ${enhancedRecipe.title}`)}
                      className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-primary-500 text-white hover:bg-primary-600"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      Listen to Recipe
                    </button>
                    <button
                      onClick={() => handleShare(enhancedRecipe)}
                      className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-green-500 text-white hover:bg-green-600"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.632-2.684 3 3 0 00-5.632 2.684zm0 9.316a3 3 0 105.632 2.684 3 3 0 00-5.632-2.684z" />
                      </svg>
                      Share Recipe
                    </button>
                  </div>
                  
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
                {/* Audio Button for Raw Recipe */}
                <div className="mb-4 text-center">
                  <button
                    onClick={() => playAudio(recipe, 'Generated Recipe')}
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-primary-500 text-white hover:bg-primary-600"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    Listen to Recipe
                  </button>
                </div>
                
                <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed">
                  {recipe}
                </pre>
              </div>
            )}
          </div>
          </div>
        )}

        {/* PDF Chat Tab */}
        {activeTab === 'pdf' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* PDF Upload Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="text-primary-500 mr-2">📄</span>
                Upload Relevant Documents
                <button
                  onClick={() => setShowUploadHelp(!showUploadHelp)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="What documents can I upload?"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </button>
              </h2>

              {/* Help Tooltip */}
              {showUploadHelp && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 mb-2">
                        What documents can I upload?
                      </h3>
                      <div className="text-sm text-blue-700">
                        <p className="mb-2">Upload any cooking-related documents such as:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>📝 Grocery lists and ingredient lists</li>
                          <li>📚 Cooking books and recipe collections</li>
                          <li>🍳 Recipe cards and cooking guides</li>
                          <li>📋 Meal planning documents</li>
                          <li>🥘 Nutrition guides and dietary information</li>
                          <li>📖 Food blogs and cooking articles</li>
                        </ul>
                        <p className="mt-2 text-xs text-blue-600">
                          The AI will analyze your documents and help you create recipes, answer cooking questions, and provide personalized suggestions!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-primary-600 hover:text-primary-800 font-medium disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Click to upload PDF'}
                  </button>
                  <p className="text-gray-500 text-sm mt-2">
                    Supports cooking recipes, ingredient lists, and food guides
                  </p>
                </div>
              </div>

              {/* Upload Status */}
              {uploadMessage && (
                <div className={`p-3 rounded-md text-sm ${
                  uploadMessage.includes('✅') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {uploadMessage}
                </div>
              )}

              {/* Uploaded PDFs List */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Uploaded Documents
                </h3>
                {uploadedPDFs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No PDFs uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {uploadedPDFs.map((pdf, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <span className="text-primary-500 mr-2">📄</span>
                          <div>
                            <p className="font-medium text-gray-800">{pdf.filename}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(pdf.size)} • {pdf.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pdf.status === 'processed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {pdf.status}
                          </span>
                          <button
                            onClick={() => deletePDF(pdf.filename)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete PDF"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Clear All Data Button */}
                {uploadedPDFs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={clearAllPDFs}
                      className="w-full flex items-center justify-center px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear All Documents
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      This will permanently delete all uploaded PDFs and clear the vector database.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RAG Chat Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Chat with our AI assistant
                </h2>
                {ragMessages.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-800 rounded-lg transition-colors"
                    title="Clear chat history"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Chat
                  </button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                {ragMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-4">💬</div>
                    <p>Ask questions based on your uploaded documents!</p>
                    <p className="text-sm mt-2">The AI will only answer using information from your documents.</p>
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        <span className="font-medium">⚠️ Disclaimer:</span> AI can sometimes provide incorrect answers. Please verify important information.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ragMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">
                            {formatChatContent(message.content).split('\n').map((line, lineIndex) => {
                              // Handle different line types for better formatting
                              if (line.startsWith('• ')) {
                                return (
                                  <div key={lineIndex} className="flex items-start mb-1">
                                    <span className="text-primary-500 mr-2 mt-0.5">•</span>
                                    <span className="flex-1">{line.substring(2)}</span>
                                  </div>
                                )
                              } else if (/^\d+\.\s/.test(line)) {
                                return (
                                  <div key={lineIndex} className="flex items-start mb-1">
                                    <span className="text-primary-500 mr-2 mt-0.5 font-medium">
                                      {line.match(/^\d+/)?.[0]}.
                                    </span>
                                    <span className="flex-1">{line.replace(/^\d+\.\s/, '')}</span>
                                  </div>
                                )
                              } else if (line.trim() === '') {
                                return <div key={lineIndex} className="h-2" />
                              } else {
                                return (
                                  <div key={lineIndex} className="mb-1">
                                    {line}
                                  </div>
                                )
                              }
                            })}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <p className={`text-xs ${
                              message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                            {message.role === 'assistant' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => playAudio(message.content, 'AI Response')}
                                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 hover:scale-105 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
                                  title="Listen to response"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                  </svg>
                                  Listen
                                </button>
                                <button
                                  onClick={() => handleShare(message.content)}
                                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-green-50 hover:bg-green-100 hover:text-green-900 rounded-lg transition-all duration-200 hover:scale-105 border border-green-200 hover:border-green-300 shadow-sm hover:shadow-md"
                                  title="Share or download"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.632-2.684 3 3 0 00-5.632 2.684zm0 9.316a3 3 0 105.632 2.684 3 3 0 00-5.632-2.684z" />
                                  </svg>
                                  Share
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isRagGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                            Thinking...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ragInput}
                  onChange={(e) => setRagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendRAGMessage()}
                  placeholder="Ask questions based on your uploaded documents..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isRagGenerating}
                />
                <button
                  onClick={sendRAGMessage}
                  disabled={!ragInput.trim() || isRagGenerating}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>

              {/* Dynamic Question Suggestions */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-bold text-gray-700">Suggested questions:</p>
                  <button
                    onClick={loadQuestionSuggestions}
                    disabled={isLoadingQuestions || uploadedPDFs.length === 0}
                    className="text-xs text-primary-600 hover:text-primary-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoadingQuestions ? '🔄 Loading...' : '🔄 Refresh'}
                  </button>
                </div>
                
                
                {suggestedQuestions.length > 0 ? (
                  <div className="space-y-2">
                    {/* Group questions by category */}
                    {Array.from(new Set(suggestedQuestions.map(q => q.category))).map(category => {
                      const categoryQuestions = suggestedQuestions.filter(q => q.category === category)
                      return (
                        <div key={category}>
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-semibold text-gray-600">
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 ml-4">
                            {categoryQuestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => setRagInput(suggestion.question)}
                                className={`text-sm px-3 py-2 rounded hover:opacity-80 transition-opacity ${getCategoryColor(category)}`}
                                title={`Confidence: ${Math.round(suggestion.confidence * 100)}%`}
                              >
                                {suggestion.question}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : uploadedPDFs.length > 0 ? (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500">
                      {isLoadingQuestions ? 'Generating questions...' : 'No questions available'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500">
                      Upload a PDF to see relevant questions
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MIT License */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>MIT License - Culinary Compass - Your guide to perfect recipes! 🍽️</p>
        </div>
      </div>
    </div>
  )
} 