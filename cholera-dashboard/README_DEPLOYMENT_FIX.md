# Fix: GitHub Pages Still Showing README

## Immediate Steps to Fix

### Step 1: Check Workflow Status

1. Go to: https://github.com/dicalvin/HIP-Chloera-Watch/actions
2. Look for "Deploy to GitHub Pages" workflow
3. Check:
   - Has it run? (Should show recent runs)
   - Did it succeed? (Green checkmark)
   - Did it fail? (Red X - check the error)

### Step 2: Verify GitHub Pages Settings

1. Go to: https://github.com/dicalvin/HIP-Chloera-Watch/settings/pages
2. **IMPORTANT**: Under "Source", it MUST say **"GitHub Actions"**
3. If it says "Deploy from a branch", change it to "GitHub Actions"
4. Click **Save**

### Step 3: Manually Trigger Workflow

1. Go to: https://github.com/dicalvin/HIP-Chloera-Watch/actions
2. Click "Deploy to GitHub Pages" in the left sidebar
3. Click the blue **"Run workflow"** button (top right)
4. Select branch: **main**
5. Click **"Run workflow"** (green button)

### Step 4: Wait and Check

1. Wait 2-5 minutes for the workflow to complete
2. Go back to Actions tab
3. Click on the running workflow to see progress
4. Wait for both jobs to complete:
   - ✅ **build** job (builds the React app)
   - ✅ **deploy** job (deploys to GitHub Pages)

### Step 5: Clear Cache and Refresh

After workflow completes:
1. Hard refresh your browser: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Or try incognito/private browsing
3. Visit: https://dicalvin.github.io/HIP-Chloera-Watch/

## If Workflow Fails

### Common Errors:

**Error: "Workflow run failed"**
- Check the error message in Actions tab
- Common issues:
  - `npm ci` fails → Check if `package-lock.json` exists
  - Build fails → Check for syntax errors
  - Path errors → Verify `cholera-dashboard/` folder structure

**Error: "Permission denied"**
- The workflow already has correct permissions
- If this appears, check repository settings → Actions → General → Workflow permissions

**Error: "No such file or directory"**
- Verify `cholera-dashboard/package.json` exists
- Verify `cholera-dashboard/src/` folder exists

## Alternative: Quick Manual Fix

If the workflow keeps failing, you can manually deploy:

```bash
cd cholera-dashboard
npm install
npm run build
npx gh-pages -d dist
```

Then in GitHub Settings → Pages, select "Deploy from a branch" → branch: `gh-pages` → folder: `/ (root)`

## Verify It's Working

After successful deployment, you should see:
- ✅ React dashboard with navigation menu
- ✅ Charts and interactive elements
- ✅ NOT the README.md content
- ✅ URL: https://dicalvin.github.io/HIP-Chloera-Watch/

## Still Not Working?

1. **Check the exact error** in Actions tab
2. **Verify file structure** - make sure `cholera-dashboard/` folder exists
3. **Check base path** - should be `/HIP-Chloera-Watch/` (matches repo name)
4. **Wait 10 minutes** - GitHub Pages can take time to update

