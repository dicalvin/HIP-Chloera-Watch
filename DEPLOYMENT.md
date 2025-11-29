# Deployment Guide

## GitHub Pages Setup

### Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/dicalvin/HIP-Chloera-Watch
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Source**: `GitHub Actions`
4. The workflow will automatically deploy when you push to `main` branch

### Step 2: Wait for Deployment

After pushing to `main`, the GitHub Actions workflow will:
1. Build the React app
2. Deploy to GitHub Pages
3. Your site will be available at: https://dicalvin.github.io/HIP-Chloera-Watch/

**Note**: The first deployment may take 5-10 minutes.

### Step 3: Deploy the API Separately

The Flask API (`cholera-dashboard/api/rf_predict.py`) needs to be deployed separately since GitHub Pages only serves static files.

**Recommended Platforms:**
- **Railway** (https://railway.app) - Easy setup, free tier available
- **Render** (https://render.com) - Free tier available
- **Heroku** - Requires credit card for free tier

**API Deployment Steps (Railway example):**
1. Create account on Railway
2. New Project → Deploy from GitHub repo
3. Select your repository
4. Add service → Select `cholera-dashboard/api` folder
5. Set start command: `python rf_predict.py`
6. Add environment variables if needed
7. Railway will provide a URL like: `https://your-api.railway.app`

### Step 4: Update API URL in Frontend

Once your API is deployed, update the frontend to use the production API URL:

1. Option 1: Set environment variable during build (recommended)
   - Add to `.github/workflows/deploy.yml`:
     ```yaml
     env:
       VITE_LSTM_API_URL: https://your-api.railway.app
     ```

2. Option 2: Update `cholera-dashboard/src/hooks/useLSTMPredictions.js`:
   ```javascript
   const LSTM_API_URL = 'https://your-api.railway.app'
   ```

## Troubleshooting

### Site shows 404
- Ensure GitHub Pages is enabled in Settings → Pages
- Check that the workflow completed successfully in Actions tab
- Verify the base path in `vite.config.js` matches your repository name

### Assets not loading
- Check browser console for 404 errors
- Verify base path is `/HIP-Chloera-Watch/` (matches repository name)
- Clear browser cache

### API not working
- Verify API is deployed and accessible
- Check CORS settings on API server (should allow requests from GitHub Pages domain)
- Check browser console for CORS or network errors

## Manual Deployment (Alternative)

If GitHub Actions doesn't work, you can deploy manually:

```bash
cd cholera-dashboard
npm install
npm run build
npx gh-pages -d dist
```

Then in repository Settings → Pages, select `gh-pages` branch.

