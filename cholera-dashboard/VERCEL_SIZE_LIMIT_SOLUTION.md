# Vercel 250 MB Size Limit Solution

## Problem

Vercel serverless functions have a 250 MB unzipped size limit. The Python ML dependencies (scikit-learn, numpy, pandas, joblib) exceed this limit even after optimization.

## Solution: Host API Separately

The recommended approach is to:
1. **Deploy the frontend on Vercel** (works perfectly - it's just static files)
2. **Host the API on a different platform** that supports larger Python packages:
   - **Railway** (recommended) - Easy setup, good free tier
   - **Render** - Free tier available
   - **Fly.io** - Good for Python apps
   - **Heroku** - Requires credit card for free tier

## Quick Setup: Railway

### Step 1: Deploy API to Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository: `dicalvin/HIP-Chloera-Watch`
5. Add service → Select `cholera-dashboard/api` folder
6. Railway will auto-detect Python
7. Set start command: `python rf_predict.py` (for local testing) or leave empty (functions will be called directly)
8. Add environment variables if needed
9. Railway will provide a URL like: `https://your-api.railway.app`

### Step 2: Update Frontend to Use External API

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add:
- `VITE_LSTM_API_URL` = `https://your-api.railway.app`

Or update `cholera-dashboard/src/hooks/useLSTMPredictions.js`:

```javascript
const LSTM_API_URL = 'https://your-api.railway.app'
```

### Step 3: Redeploy Frontend

After setting the environment variable, redeploy the Vercel project.

## Alternative: Keep API on Vercel (Pro Plan)

If you have Vercel Pro plan, you can:
- Use larger function sizes
- Or contact Vercel support for custom limits

## Why This Approach Works

- **Frontend**: Small, fast, perfect for Vercel
- **API**: Can use full Python ML stack without size constraints
- **Separation of Concerns**: Frontend and backend can scale independently
- **Cost**: Both platforms have free tiers

## Testing

After deployment:
1. Test frontend: `https://your-project.vercel.app`
2. Test API: `https://your-api.railway.app/health`
3. Verify frontend can connect to API

## Troubleshooting

### CORS Issues
Make sure your API (Railway/Render) allows requests from your Vercel domain. The API already includes CORS headers, but verify they're working.

### API Not Found
- Check the API URL is correct
- Verify the API is deployed and running
- Check Railway/Render logs for errors

