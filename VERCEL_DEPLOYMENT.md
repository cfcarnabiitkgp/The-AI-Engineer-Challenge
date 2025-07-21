# 🚀 Vercel Deployment Guide

## Current Setup
Your project is configured to deploy both frontend and backend to Vercel using a monorepo structure.

## 📋 Deployment Steps

### 1. Environment Variables Setup

In your Vercel dashboard, add these environment variables:

**Required:**
- `OPENAI_API_KEY`: Your OpenAI API key

**Optional:**
- `VERCEL_URL`: Automatically set by Vercel

### 2. Deploy to Vercel

1. **Connect your GitHub repository** to Vercel
2. **Set the root directory** to `/` (root of the project)
3. **Deploy automatically** - Vercel will detect both frontend and backend

### 3. Verify Deployment

After deployment, test these endpoints:

- **Frontend:** `https://your-app.vercel.app`
- **Backend Health:** `https://your-app.vercel.app/api/health`
- **Backend Chat:** `https://your-app.vercel.app/api/chat`

## 🔧 Configuration Details

### Frontend (Next.js)
- **Location:** `/frontend`
- **Framework:** Next.js 14
- **Build Command:** `npm run build` (in frontend directory)
- **Output Directory:** `.next`

### Backend (FastAPI)
- **Location:** `/api`
- **Framework:** FastAPI
- **Runtime:** Python 3.9+
- **Entry Point:** `app.py`

### Routing
- **Frontend routes:** `/*` → `/frontend/*`
- **Backend routes:** `/api/*` → `/api/app.py`

## 🐛 Troubleshooting

### If the backend doesn't work:

1. **Check environment variables:**
   - Ensure `OPENAI_API_KEY` is set in Vercel dashboard

2. **Check function logs:**
   - Go to Vercel dashboard → Functions → View logs

3. **Test backend directly:**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

### If the frontend can't connect to backend:

1. **Check the API call:**
   - Frontend calls `/api/chat` directly
   - This should route to the backend function

2. **Verify routing:**
   - `/api/*` routes should go to the backend
   - `/*` routes should go to the frontend

## 🎯 Expected Result

After successful deployment:
- ✅ Frontend loads at your Vercel URL
- ✅ Backend responds to `/api/health`
- ✅ Recipe generation works via `/api/chat`
- ✅ Real-time streaming functions properly

## 📞 Need Help?

- Check Vercel function logs in the dashboard
- Verify environment variables are set correctly
- Test backend endpoints directly
- Check the Vercel documentation for more details 