# GitHub Pages Deployment Steps (Updated for HIP-Cholera-Watch)

## Repository Name
Your repository is now: **HIP-Cholera-Watch** (note: "Cholera" not "Chloera")

## Step-by-Step Deployment Guide

### Step 1: Enable GitHub Pages

1. Go to: **https://github.com/dicalvin/HIP-Cholera-Watch/settings/pages**
2. Scroll to the **"Source"** section
3. Click the dropdown and select: **"GitHub Actions"**
4. Click **Save**

**⚠️ IMPORTANT**: Make sure you select **"GitHub Actions"** (NOT "Deploy from a branch")

### Step 2: Trigger the Deployment Workflow

**Option A: Manual Trigger (Recommended)**

1. Go to: **https://github.com/dicalvin/HIP-Cholera-Watch/actions**
2. Click **"Deploy to GitHub Pages"** in the left sidebar
3. Click the blue **"Run workflow"** button (top right)
4. Select branch: **main**
5. Click the green **"Run workflow"** button

**Option B: Automatic Trigger**

The workflow will automatically run when you push to `main` branch. Since we just updated the configuration, you can:

```bash
git pull origin main  # Get latest changes
git push origin main  # This will trigger the workflow
```

### Step 3: Monitor the Deployment

1. Stay on the **Actions** tab
2. Click on the running workflow to see progress
3. Wait for both jobs to complete:
   - ✅ **build** job (builds React app) - takes ~2-3 minutes
   - ✅ **deploy** job (deploys to GitHub Pages) - takes ~1-2 minutes
4. Both should show green checkmarks when done

### Step 4: Verify Deployment

1. Go to: **https://github.com/dicalvin/HIP-Cholera-Watch/settings/pages**
2. You should see: **"Your site is live at https://dicalvin.github.io/HIP-Cholera-Watch/"**
3. There should be a green checkmark showing the deployment time
4. Visit the site: **https://dicalvin.github.io/HIP-Cholera-Watch/**
5. Do a **hard refresh**: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

## What the Workflow Does

1. ✅ Checks out your code from the `main` branch
2. ✅ Sets up Node.js 18
3. ✅ Installs dependencies (`npm ci` in `cholera-dashboard/` folder)
4. ✅ Builds the React app (`npm run build`) with base path `/HIP-Cholera-Watch/`
5. ✅ Uploads the built files from `cholera-dashboard/dist/`
6. ✅ Deploys to GitHub Pages

## Your Site URL

After deployment, your site will be available at:
**https://dicalvin.github.io/HIP-Cholera-Watch/**

Note: The URL matches your repository name exactly.

## Troubleshooting

### If Workflow Fails

1. Go to **Actions** tab
2. Click on the failed workflow run
3. Click on the **build** job to see errors
4. Common issues:
   - **"npm ci failed"** → Check if `cholera-dashboard/package-lock.json` exists
   - **"Build failed"** → Check for syntax errors in your code
   - **"Path not found"** → Verify `cholera-dashboard/` folder structure

### If Site Shows README

1. **Double-check** Settings → Pages → Source is set to **"GitHub Actions"**
2. **Verify** the workflow completed successfully (green checkmarks)
3. **Wait 5-10 minutes** - GitHub Pages can take time to update
4. **Clear browser cache** or use incognito mode

### If Assets Don't Load (404 on CSS/JS)

The base path is set to `/HIP-Cholera-Watch/` which matches your repository name. If assets don't load:
1. Check browser console (F12) for 404 errors
2. Verify the base path matches your repository name exactly
3. Make sure the workflow set `VITE_BASE_PATH: /HIP-Cholera-Watch/`

## Quick Checklist

- [ ] GitHub Pages enabled (Settings → Pages → Source: **GitHub Actions**)
- [ ] Repository name is **HIP-Cholera-Watch** (matches base path)
- [ ] Workflow triggered (Actions tab shows running/completed workflow)
- [ ] Both jobs completed successfully (green checkmarks)
- [ ] Site accessible at https://dicalvin.github.io/HIP-Cholera-Watch/
- [ ] React dashboard shows (not README)

## Expected Result

After successful deployment:
- ✅ Site is accessible at https://dicalvin.github.io/HIP-Cholera-Watch/
- ✅ React dashboard loads (navigation menu, charts, maps)
- ✅ NOT showing README.md content
- ✅ All assets (CSS, JS, images) load correctly
- ✅ Interactive features work

## Next Steps After Deployment

Once the frontend is deployed:
1. **Deploy API separately** (Railway/Render) - see `VERCEL_SIZE_LIMIT_SOLUTION.md`
2. **Add environment variable** in GitHub Actions workflow:
   - Edit `.github/workflows/deploy.yml`
   - Add to build step env: `VITE_LSTM_API_URL: https://your-api.railway.app`
3. **Redeploy** to connect frontend to API

