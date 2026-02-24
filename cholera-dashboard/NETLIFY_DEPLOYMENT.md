# Netlify Deployment Guide

## Quick Deploy (Drag & Drop)

### Step 1: Build Locally

1. **Open terminal** in the `cholera-dashboard` folder
2. **Install dependencies** (if not done):
   ```bash
   npm install
   ```
3. **Build the project**:
   ```bash
   npm run build
   ```
4. **Verify** the `dist` folder was created

### Step 2: Deploy to Netlify

1. **Go to**: https://app.netlify.com/drop
2. **Drag and drop** the `dist` folder onto the page
3. **Wait** for deployment (30 seconds - 2 minutes)
4. **Get your URL**: `https://random-name-123.netlify.app`

## Continuous Deployment (Recommended)

### Step 1: Connect GitHub Repository

1. **Go to**: https://app.netlify.com
2. **Click**: "Add new site" → "Import an existing project"
3. **Connect to Git provider**: Choose GitHub
4. **Select repository**: `HIP-Cholera-Watch`
5. **Configure**:
   - **Base directory**: `cholera-dashboard`
   - **Build command**: `npm run build`
   - **Publish directory**: `cholera-dashboard/dist`
6. **Click**: "Deploy site"

### Step 2: Verify Settings

After connecting, verify in **Site settings** → **Build & deploy**:

- **Base directory**: `cholera-dashboard`
- **Build command**: `npm run build`
- **Publish directory**: `cholera-dashboard/dist`

## Environment Variables (If Needed)

If you need to set environment variables:

1. Go to: **Site settings** → **Environment variables**
2. Add any variables (e.g., `VITE_LSTM_API_URL` for API endpoint)

## Configuration File

The `netlify.toml` file is already configured:
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist`
- ✅ SPA redirects (all routes → `index.html`)

## Custom Domain

1. Go to: **Site settings** → **Domain management**
2. Click: "Add custom domain"
3. Follow the DNS setup instructions

## Troubleshooting

### Build Fails

- Check **Deploy logs** in Netlify dashboard
- Verify Node.js version (should be 18+)
- Check that `package.json` exists in `cholera-dashboard/`

### 404 Errors on Routes

- The `netlify.toml` redirect rule should fix this
- If not, verify the redirect is in place

### API Not Working

- The frontend is deployed, but the API needs to be hosted separately
- Update `VITE_LSTM_API_URL` environment variable in Netlify to point to your API

## Notes

- **Base path**: Set to `/` (root) for Netlify
- **No subfolder**: Unlike GitHub Pages, Netlify serves from root
- **Automatic HTTPS**: Enabled by default
- **Free tier**: Includes 100GB bandwidth/month

