# Vercel Deployment Guide

## Quick Start

1. **Install Vercel CLI** (if deploying via CLI):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd cholera-dashboard
   vercel
   ```
   Or connect your GitHub repository to Vercel for automatic deployments.

## Repository Structure for Vercel

```
cholera-dashboard/
├── api/                    # Serverless functions
│   ├── health.py           # Health check endpoint
│   ├── predict.py          # Single prediction endpoint
│   ├── forecast.py         # Multi-step forecast endpoint
│   ├── rf_predict.py       # Shared model logic
│   └── requirements.txt    # Python dependencies
├── src/                    # React frontend
├── public/                 # Static assets
├── vercel.json             # Vercel configuration
└── package.json            # Node.js dependencies
```

## Required Files in Root

For the API to work, these files must be in the **repository root** (not in `cholera-dashboard/`):
- `random_forest_model.pkl` - Trained model
- `cholera_data3.csv` - Dataset

**Important**: The API functions look for these files in the parent directory. If deploying from the `cholera-dashboard` folder, you may need to adjust paths or copy these files.

## Environment Variables

Set in Vercel dashboard (Settings → Environment Variables):

- `VITE_LSTM_API_URL` - Leave empty for relative paths (recommended)
- Or set to your API URL if using external API

## API Endpoints

After deployment, the API will be available at:
- `https://your-project.vercel.app/api/health`
- `https://your-project.vercel.app/api/lstm/predict`
- `https://your-project.vercel.app/api/lstm/forecast`

## Deployment Steps

### Option 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository: `dicalvin/HIP-Chloera-Watch`
5. Configure:
   - **Root Directory**: `cholera-dashboard`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables (if needed)
7. Click "Deploy"

### Option 2: Vercel CLI

```bash
cd cholera-dashboard
vercel login
vercel
```

For production:
```bash
vercel --prod
```

## File Path Configuration

The API functions expect files in the repository root. If your structure is:

```
Cholera/
├── cholera_data3.csv
├── random_forest_model.pkl
└── cholera-dashboard/
    └── api/
```

The API will find the files correctly. If deploying from `cholera-dashboard/` folder, you may need to:

1. Copy files to `cholera-dashboard/` directory, OR
2. Update paths in `api/rf_predict.py` to look in the correct location

## Troubleshooting

### API returns 500 errors
- Check that `random_forest_model.pkl` and `cholera_data3.csv` are accessible
- Check Vercel function logs in the dashboard
- Verify Python dependencies in `api/requirements.txt`

### CORS errors
- The API functions include CORS headers
- If issues persist, check Vercel function logs

### Model not loading
- Verify file paths in `api/rf_predict.py`
- Check that the model file is in the repository
- Check Vercel function logs for path errors

### Build fails
- Ensure `package.json` has correct build script
- Check that all dependencies are listed
- Review build logs in Vercel dashboard

## Memory and Timeout Settings

The `vercel.json` configures:
- **Memory**: 2048 MB for predict/forecast functions
- **Timeout**: 30 seconds max duration

If you need more resources, update `vercel.json`.

## Automatic Deployments

Once connected to GitHub, Vercel will automatically deploy:
- Every push to `main` branch → Production
- Pull requests → Preview deployments

## Cost

Vercel's free tier includes:
- 100 GB bandwidth
- 100 GB-hours serverless function execution
- Unlimited deployments

For most use cases, this is sufficient.
