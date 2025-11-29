# GitHub Pages Deployment Setup

## Prerequisites

1. Enable GitHub Pages in your repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (will be created automatically by the workflow)
   - Folder: `/ (root)`

## Automatic Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically:
- Builds the React app when code is pushed to `main`
- Deploys to GitHub Pages

## Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
cd cholera-dashboard
npm install
npm run build
npx gh-pages -d dist
```

## Important Notes

1. **Base Path**: The app is configured to use `/HIP-Chloera-Watch/` as the base path for GitHub Pages
2. **API Endpoint**: The frontend expects the API to be available. You'll need to:
   - Deploy the Flask API separately (e.g., on Railway, Render, or Heroku)
   - Update the `VITE_LSTM_API_URL` environment variable or modify `useLSTMPredictions.js` to point to your deployed API URL
3. **Environment Variables**: For production, set:
   - `VITE_LSTM_API_URL`: Your deployed API URL (e.g., `https://your-api.railway.app`)

## Troubleshooting

- If the site shows 404, ensure GitHub Pages is enabled in repository settings
- If assets don't load, check that the base path in `vite.config.js` matches your repository name
- If the API doesn't work, check CORS settings on your API server

