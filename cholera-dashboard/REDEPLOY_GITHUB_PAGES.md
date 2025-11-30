# How to Redeploy GitHub Pages After Unpublishing

## Step-by-Step Redeployment

### Step 1: Re-enable GitHub Pages

1. Go to: **https://github.com/dicalvin/HIP-Chloera-Watch/settings/pages**
2. Under **"Source"**, select: **"GitHub Actions"**
3. Click **Save**

**Important**: Make sure you select **"GitHub Actions"** (NOT "Deploy from a branch")

### Step 2: Trigger the Deployment Workflow

**Option A: Manual Trigger (Recommended)**

1. Go to: **https://github.com/dicalvin/HIP-Chloera-Watch/actions**
2. Click **"Deploy to GitHub Pages"** in the left sidebar
3. Click the blue **"Run workflow"** button (top right)
4. Select branch: **main**
5. Click the green **"Run workflow"** button
6. Wait 2-5 minutes for it to complete

**Option B: Automatic Trigger**

1. Make any small change to trigger the workflow:
   ```bash
   git commit --allow-empty -m "Redeploy GitHub Pages"
   git push origin main
   ```
2. The workflow will automatically run

### Step 3: Monitor the Deployment

1. Go to **Actions** tab
2. Click on the running workflow
3. Watch for both jobs to complete:
   - ✅ **build** job (builds React app)
   - ✅ **deploy** job (deploys to GitHub Pages)
4. Both should show green checkmarks when done

### Step 4: Verify Deployment

1. Go to: **https://github.com/dicalvin/HIP-Chloera-Watch/settings/pages**
2. You should see: **"Your site is live at https://dicalvin.github.io/HIP-Chloera-Watch/"**
3. There should be a green checkmark showing the deployment time
4. Visit the site: **https://dicalvin.github.io/HIP-Chloera-Watch/**
5. Do a **hard refresh**: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

## What Happens During Deployment

The workflow will:
1. ✅ Checkout your code from the `main` branch
2. ✅ Install Node.js dependencies (`npm ci`)
3. ✅ Build the React app (`npm run build`)
4. ✅ Create the `dist/` folder with built files
5. ✅ Upload the built files to GitHub Pages
6. ✅ Deploy to `https://dicalvin.github.io/HIP-Chloera-Watch/`

## Troubleshooting

### If Workflow Fails

1. Go to **Actions** tab
2. Click on the failed workflow run
3. Click on the **build** job to see errors
4. Common issues:
   - **"npm ci failed"** → Check if `package-lock.json` exists
   - **"Build failed"** → Check for syntax errors in code
   - **"Path not found"** → Verify `cholera-dashboard/` folder exists

### If Site Still Shows README

1. **Double-check** Settings → Pages → Source is set to **"GitHub Actions"**
2. **Wait 5-10 minutes** - GitHub Pages can take time to update
3. **Clear browser cache** or use incognito mode
4. **Check workflow completed** - both jobs should be green

### If Workflow Doesn't Appear

1. Check that the workflow file exists: `.github/workflows/deploy.yml`
2. Verify GitHub Actions is enabled: Settings → Actions → General
3. Make sure you're on the `main` branch

## Quick Checklist

- [ ] GitHub Pages enabled (Settings → Pages → Source: GitHub Actions)
- [ ] Workflow triggered (Actions tab shows running/completed workflow)
- [ ] Both jobs completed successfully (green checkmarks)
- [ ] Site accessible at https://dicalvin.github.io/HIP-Chloera-Watch/
- [ ] React dashboard shows (not README)

## Expected Result

After successful redeployment:
- ✅ Site is accessible
- ✅ React dashboard loads (navigation, charts, maps)
- ✅ NOT showing README.md content
- ✅ All assets load correctly

