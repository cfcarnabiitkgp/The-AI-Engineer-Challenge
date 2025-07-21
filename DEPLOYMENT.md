# 🚀 Deployment Guide

## Current Issue
The Vercel app is only deploying the frontend. The FastAPI backend needs to be deployed separately.

## 🔧 Quick Fix Options

### Option 1: Deploy Backend to Railway (Recommended)

1. **Go to [Railway](https://railway.app/)**
2. **Create a new project**
3. **Connect your GitHub repository**
4. **Deploy the `/api` folder:**
   - Set the source directory to `/api`
   - Railway will automatically detect it as a Python app
5. **Add environment variable:**
   - `OPENAI_API_KEY`: Your OpenAI API key
6. **Get the deployment URL** (e.g., `https://your-app.railway.app`)
7. **Update Vercel environment variables:**
   - Go to your Vercel dashboard
   - Add `BACKEND_URL` = `https://your-app.railway.app`

### Option 2: Deploy Backend to Render

1. **Go to [Render](https://render.com/)**
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Root Directory:** `api`
5. **Add environment variable:**
   - `OPENAI_API_KEY`: Your OpenAI API key
6. **Deploy and get the URL**
7. **Update Vercel environment variables** with the new backend URL

### Option 3: Deploy Backend to Vercel (Advanced)

1. **Create a separate Vercel project for the backend**
2. **Deploy the `/api` folder to Vercel**
3. **Set environment variables in Vercel:**
   - `OPENAI_API_KEY`: Your OpenAI API key
4. **Update the frontend's `BACKEND_URL`** to point to the new backend URL

## 🔍 Testing the Fix

After deploying the backend:

1. **Test the backend directly:**
   ```bash
   curl https://your-backend-url.railway.app/api/health
   ```

2. **Update the frontend's backend URL** in Vercel environment variables

3. **Test the full app** at your Vercel URL

## 🎯 Expected Result

Once the backend is deployed and connected:
- ✅ Recipe generation will work
- ✅ Real-time streaming will function
- ✅ All features will be available

## 📞 Need Help?

If you need assistance with deployment, check:
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs) 