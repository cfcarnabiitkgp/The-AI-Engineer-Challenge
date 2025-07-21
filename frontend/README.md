# 🍳 Recipe Generator Frontend

A beautiful and intuitive Next.js web application that generates delicious recipes based on your available ingredients and preferences. Built with modern web technologies and designed for a seamless user experience.

## ✨ Features

- **Smart Recipe Generation**: AI-powered recipe creation based on your ingredients
- **Enhanced Recipe Output**: Beautiful recipe cards with nutrition facts and structured layout
- **Strict Time Constraints**: Recipes never exceed your selected cooking time
- **Real-time Streaming**: Watch your recipe being generated in real-time
- **Modern UI**: Clean, responsive design with beautiful animations
- **Easy Ingredient Management**: Add and remove ingredients with a simple interface
- **Multiple Cuisine Types**: 8 different cuisines to choose from
- **Dietary Restrictions**: 8 different dietary options
- **Nutrition Information**: Calories, protein, carbs, fat, fiber, and sugar
- **Difficulty Indicators**: Color-coded difficulty levels (Easy/Medium/Hard)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- FastAPI backend running (see backend setup)

### Installation

1. **Clone and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional):**
   ```bash
   # Create .env.local if you need to customize backend URL
   echo "BACKEND_URL=http://localhost:8000" > .env.local
   ```
   
   **Note:** Environment variables are optional. The app works with default settings.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
frontend/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   │   └── chat/         # Chat API proxy
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page component
├── public/               # Static assets
└── package.json          # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BACKEND_URL` | FastAPI backend URL | `http://localhost:8000` | No |

**Note:** Environment variables are optional. The OpenAI API key is securely stored on the backend server.

### Backend Integration

The frontend communicates with the FastAPI backend through:
- **POST** `/api/chat` - Recipe generation endpoint
- **Streaming responses** - Real-time recipe generation
- **Error handling** - Graceful error messages

## 🎨 UI Components

### Recipe Parameters Section
- **Ingredients Input**: Add/remove ingredients with tags
- **Servings Dropdown**: 2, 4, 6, or 8 people
- **Cooking Time**: 15, 30, 45, 60, or 90 minutes (strict limits)
- **Cuisine Type**: Indian, Mediterranean, Chinese, American, Continental, Italian, Mexican, Thai
- **Dietary Restrictions**: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Keto, Paleo, Low-Carb, Nut-Free

### Enhanced Recipe Output Section
- **Recipe Header**: Title, description, servings, time, calories, difficulty
- **Time Breakdown**: Prep time, cook time, total time with visual indicators
- **Nutrition Facts**: Complete nutritional breakdown (calories, protein, carbs, fat, fiber, sugar)
- **Ingredients Grid**: Clean, organized ingredient display
- **Numbered Instructions**: Step-by-step with visual numbering
- **Chef's Tips**: Highlighted tips section
- **Difficulty Indicator**: Color-coded difficulty badges
- **Raw Text Toggle**: For debugging and full recipe view

## 🔒 Security Features

- **Server-side API key storage**: API key is stored securely on the backend
- **No client-side API key handling**: Users don't need to enter API keys
- **Secure streaming responses**: Real-time recipe generation with proper error handling
- **CORS configuration**: Safe cross-origin requests

## ⏰ Time Constraint Features

- **Strict Time Enforcement**: Total time never exceeds selected cooking time
- **Smart Time Calculation**: 30% prep time, 70% cooking time (with minimum 5 min prep)
- **Visual Time Indicators**: Shows "✓ Within [time] limit" confirmation
- **Enhanced AI Prompts**: Explicitly tells AI to respect time limits
- **Time Breakdown Display**: Shows prep time, cook time, and total time separately

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard:
   - `BACKEND_URL`: Your FastAPI backend URL
3. **Deploy automatically** on push to main branch

### Manual Deployment

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - Feel free to use this project for your own recipes! 🍽️

---

**Happy Cooking! 👨‍🍳**
