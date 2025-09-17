# 🚀 Deployment Guide

## ✅ Current Status: FULLY DEPLOYED!

The application is now **successfully deployed** to Vercel with both frontend and backend working together! 🎉

### 🌐 **Live Application**
**[https://arnab-ai-challenge-problem-mqiu00lko.vercel.app/](https://arnab-ai-challenge-problem-mqiu00lko.vercel.app/)**

## 🏗️ **Current Architecture**

The app uses a **monorepo deployment** on Vercel:
- **Frontend**: Next.js deployed as static site
- **Backend**: FastAPI deployed as serverless functions
- **File Storage**: Uses `/tmp` directory for PDF processing
- **Dependencies**: All Python packages included in `api/requirements.txt`

## 🔧 **Deployment Configuration**

### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "api/app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/app.py"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

### Environment Variables Required
- `OPENAI_API_KEY`: Your OpenAI API key (set in Vercel dashboard)

## 🧪 **Testing the Deployment**

### Backend Health Check
```bash
curl https://arnab-ai-challenge-problem-mqiu00lko.vercel.app/api/health
# Expected: {"status":"ok"}
```

### Recipe Generation Test
```bash
curl -X POST "https://arnab-ai-challenge-problem-mqiu00lko.vercel.app/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"developer_message": "Generate a recipe", "user_message": "Ingredients: chicken, rice, vegetables\nServings: 4 people\nCooking Time: 30 minutes", "model": "gpt-4.1-mini"}'
```

### PDF Chat Test
```bash
curl -X POST "https://arnab-ai-challenge-problem-mqiu00lko.vercel.app/api/rag-chat" \
  -H "Content-Type: application/json" \
  -d '{"user_message": "What ingredients are available?"}'
```

## 🎯 **Working Features**

- ✅ **Frontend**: Beautiful Next.js UI loads correctly
- ✅ **Backend**: FastAPI serverless functions respond
- ✅ **Recipe Generation**: AI-powered recipe creation with streaming
- ✅ **PDF Upload**: Upload and process PDF documents
- ✅ **RAG Chat**: Chat with uploaded PDFs using retrieval-augmented generation
- ✅ **Time Constraints**: Strict cooking time enforcement
- ✅ **Nutrition Facts**: Estimated nutritional information
- ✅ **Multiple Cuisines**: 8 different cuisine types
- ✅ **Dietary Restrictions**: 8 different dietary options

## 🚀 **How to Deploy Your Own Version**

1. **Fork the repository** on GitHub
2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your forked repository
3. **Set Environment Variables**:
   - Add `OPENAI_API_KEY` in Vercel dashboard
4. **Deploy**: Vercel will automatically build and deploy both frontend and backend

## 📞 **Need Help?**

If you encounter issues:
- Check [Vercel Function Logs](https://vercel.com/dashboard) for backend errors
- Verify environment variables are set correctly
- Test backend endpoints directly using curl commands above
- Check [Vercel Documentation](https://vercel.com/docs) for troubleshooting

---

**🎉 Congratulations! Your AI Recipe Generator is live and working!** 