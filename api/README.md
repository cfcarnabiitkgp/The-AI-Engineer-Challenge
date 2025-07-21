# 🍳 Recipe Generator Backend

A FastAPI backend that provides secure recipe generation using OpenAI's GPT models. The API key is stored securely on the server side and generates enhanced recipes with strict time constraints.

## 🔒 Security Features

- **Server-side API key storage**: API key is stored in environment variables, not exposed to frontend
- **No client-side API key handling**: Users don't need to enter API keys in the browser
- **Secure streaming responses**: Real-time recipe generation with proper error handling
- **CORS configuration**: Safe cross-origin requests for frontend integration

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- OpenAI API key

### Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   ```

3. **Start the server:**
   ```bash
   python app.py
   ```

4. **Test the API:**
   ```bash
   curl http://localhost:8000/api/health
   ```

## 🔧 API Endpoints

### POST `/api/chat`
Generates enhanced recipes based on user input with strict time constraints.

**Request Body:**
```json
{
  "developer_message": "Generate a recipe",
  "user_message": "Ingredients: chicken, rice, vegetables\nServings: 4 people\nCooking Time: 30 minutes (STRICT LIMIT)\nCuisine Type: Indian\nDietary Restrictions: None",
  "model": "gpt-4.1-mini"
}
```

**Response:** Streaming text response with structured recipe including:
- Recipe title and description
- Ingredients with quantities
- Numbered instructions with timing
- Cooking tips and serving suggestions
- Strict adherence to cooking time constraints

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{"status": "ok"}
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |

## 🛠️ Development

### Running in Development Mode
```bash
python app.py
```

### Running with Uvicorn
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## 🎯 Enhanced Recipe Generation

The backend generates recipes with the following enhanced features:

### ⏰ **Time Constraint Enforcement**
- **Strict time limits**: Recipes never exceed the specified cooking time
- **Smart time breakdown**: 30% prep time, 70% cooking time
- **Enhanced AI prompts**: Explicit instructions to respect time constraints
- **Minimum prep time**: Ensures at least 5 minutes for preparation

### 📊 **Nutritional Estimation**
- **Smart nutrition calculation** based on ingredients
- **Dietary restriction adjustments** (Vegan, Low-Carb, etc.)
- **Complete nutritional breakdown** (calories, protein, carbs, fat, fiber, sugar)

### 🎨 **Structured Output**
- **Recipe title and description**
- **Organized ingredients list**
- **Numbered cooking instructions**
- **Chef's tips and serving suggestions**
- **Difficulty level estimation**

## 📝 Notes

- The API key is loaded from environment variables for security
- Streaming responses provide real-time recipe generation
- CORS is enabled for frontend integration
- Error handling includes proper HTTP status codes
- Enhanced prompts ensure recipes respect time constraints
- Nutritional information is estimated based on ingredients and dietary restrictions

---

**Secure and ready for production! 🔒**
