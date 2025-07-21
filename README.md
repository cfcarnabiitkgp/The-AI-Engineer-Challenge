<p align = "center" draggable="false" ><img src="https://github.com/AI-Maker-Space/LLM-Dev-101/assets/37101144/d1343317-fa2f-41e1-8af1-1dbb18399719" 
     width="200px"
     height="auto"/>
</p>


## <h1 align="center" id="heading"> 🍳 AI Recipe Generator Challenge</h1>

### 🌐 **Live Demo**
**[🍳 Try the Recipe Generator Now!](https://the-ai-engineer-challenge-nd351lvz3.vercel.app)**

## 🤖 Your First Vibe Coding LLM Application

> If you are a novice, and need a bit more help to get your dev environment off the ground, check out this [Setup Guide](docs/GIT_SETUP.md). This guide will walk you through the 'git' setup you need to get started.

> For additional context on LLM development environments and API key setup, you can also check out our [Interactive Dev Environment for LLM Development](https://github.com/AI-Maker-Space/Interactive-Dev-Environment-for-AI-Engineers).

In this repository, we'll walk you through the steps to create a **LLM-powered Recipe Generator** with a beautiful frontend and secure backend!

## ✨ **What You'll Build**

A sophisticated recipe generator that:
- 🥘 **Generates delicious recipes** based on your available ingredients
- ⏰ **Respects cooking time constraints** (strict time limits)
- 📊 **Shows nutritional information** (calories, protein, carbs, fat)
- 🎨 **Beautiful enhanced output** with structured recipe cards
- 🔒 **Secure API key handling** (server-side only)
- 🌍 **Multiple cuisine types** (Indian, Mediterranean, Chinese, etc.)
- 🥗 **Dietary restrictions** (Vegetarian, Vegan, Gluten-Free, etc.)

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- Python 3.8+
- OpenAI API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/The-AI-Engineer-Challenge.git
   cd The-AI-Engineer-Challenge
   ```

2. **Set up the backend:**
   ```bash
   cd api
   pip install -r requirements.txt
   cp env.example .env
   # Edit .env and add your OpenAI API key
   python app.py
   ```

3. **Set up the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Visit the app:** 
   - **Live demo:** [https://the-ai-engineer-challenge-nd351lvz3.vercel.app](https://the-ai-engineer-challenge-nd351lvz3.vercel.app)

## 🏗️ **Project Structure**

```
The-AI-Engineer-Challenge/
├── api/                    # FastAPI backend
│   ├── app.py             # Main API server
│   ├── requirements.txt   # Python dependencies
│   └── .env              # OpenAI API key (create this)
├── frontend/              # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── package.json      # Node.js dependencies
│   └── README.md         # Frontend documentation
└── README.md             # This file
```

## 🔧 **Key Features**

### 🎨 **Enhanced Recipe Output**
- **Beautiful recipe cards** with structured layout
- **Nutrition facts** (calories, protein, carbs, fat, fiber, sugar)
- **Difficulty indicators** (Easy/Medium/Hard with color coding)
- **Time breakdown** (prep time, cook time, total time)
- **Numbered instructions** with visual step indicators
- **Chef's tips** section for cooking advice

### ⏰ **Strict Time Constraints**
- **Respects cooking time limits** - never exceeds selected time
- **Smart time calculation** (30% prep, 70% cooking)
- **Visual time indicators** showing constraint compliance
- **Enhanced AI prompts** emphasizing time limits

### 🔒 **Security Features**
- **Server-side API key storage** (never exposed to frontend)
- **Secure environment variables** handling
- **CORS configuration** for safe cross-origin requests

### 🌍 **User Experience**
- **Multiple cuisine types** (8 different cuisines)
- **Dietary restrictions** (8 different options)
- **Flexible servings** (2, 4, 6, 8 people)
- **Cooking time options** (15, 30, 45, 60, 90 minutes)
- **Real-time streaming** recipe generation

## 🛠️ **Development**

### Backend (FastAPI)
- **Port:** 8000
- **Health Check:** `GET /api/health`
- **Recipe Generation:** `POST /api/chat`
- **Streaming responses** for real-time output

### Frontend (Next.js)
- **Port:** 3000
- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS
- **API Proxy:** `/api/chat` route for backend communication

## 🚀 **Deployment**

### Vercel Deployment
1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard:
   - `BACKEND_URL`: Your FastAPI backend URL
3. **Deploy automatically** on push to main branch

### Backend Deployment
- Deploy the FastAPI backend to your preferred hosting service
- Update the `BACKEND_URL` environment variable in Vercel

## 🎉 **Congratulations!**

You've built a sophisticated LLM-powered recipe generator! 🚀

### Share Your Success
Post on LinkedIn with this template:

```
🚀🎉 Exciting News! 🎉🚀

🍳 Today, I'm thrilled to announce that I've successfully built and deployed my first LLM-powered Recipe Generator using Next.js, FastAPI, and OpenAI! 

✨ Features:
- AI-powered recipe generation
- Enhanced recipe cards with nutrition facts
- Strict cooking time constraints
- Beautiful responsive UI
- Secure API key handling

Check it out 👇
[https://the-ai-engineer-challenge-nd351lvz3.vercel.app](https://the-ai-engineer-challenge-nd351lvz3.vercel.app)

A big shoutout to @AI Makerspace for making this possible! 🤗🙏

#AI #RecipeGenerator #LLM #NextJS #FastAPI #OpenAI
```

## 📚 **Additional Resources**

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)

---

**Happy Cooking! 👨‍🍳✨**
