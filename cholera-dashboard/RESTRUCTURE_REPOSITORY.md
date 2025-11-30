# Restructure Repository - Make cholera-dashboard the Root

## Current Problem

Your repository structure:
```
HIP-Cholera-Watch/ (GitHub repo root)
├── cholera-dashboard/    ← React app is here (subfolder)
│   ├── src/
│   ├── package.json
│   └── ...
├── cholera_data3.csv
├── random_forest_model.pkl
└── ...
```

GitHub Pages expects the app at the root, but it's in a subfolder.

## Solution: Move Files to Repository Root

We need to move everything from `cholera-dashboard/` to the repository root.

## Step-by-Step Restructure

### Option A: Using GitHub Web Interface (Easiest)

1. **Go to your repository**: https://github.com/dicalvin/HIP-Cholera-Watch
2. **Move files manually**:
   - Go into `cholera-dashboard/` folder
   - Move all files/folders to root level
   - This is tedious but safe

### Option B: Using Git Commands (Faster)

**⚠️ WARNING**: This will restructure your repository. Make a backup first!

```bash
# Navigate to your local repository
cd "C:\Users\Family\Desktop\UCU\DS Project\Cholera"

# Create a backup branch (safety)
git checkout -b backup-before-restructure
git push origin backup-before-restructure
git checkout main

# Move all files from cholera-dashboard to root
# This is complex - better to do it step by step
```

### Option C: Create New Repository with Correct Structure (Safest)

1. **Create a new repository** on GitHub (or use the existing one)
2. **Clone it locally**
3. **Copy all files from `cholera-dashboard/` to the new repo root**
4. **Also copy data files** (cholera_data3.csv, random_forest_model.pkl, ug.json)
5. **Commit and push**

## Recommended: Manual Restructure in GitHub

Since you're already on GitHub, the easiest is:

1. **Go to repository**: https://github.com/dicalvin/HIP-Cholera-Watch
2. **Navigate into `cholera-dashboard/`**
3. **For each file/folder**:
   - Click the file
   - Click "Move" or edit the path
   - Move to root (remove `cholera-dashboard/` from path)
4. **Move these to root**:
   - `src/` → root
   - `public/` → root
   - `package.json` → root
   - `vite.config.js` → root
   - `index.html` → root
   - `.github/` → root (keep workflows)
   - All other files

5. **Keep data files at root**:
   - `cholera_data3.csv` (already at root)
   - `random_forest_model.pkl` (already at root)
   - `ug.json` (already at root)

## After Restructure

The workflow I updated will work because it assumes the repo root is the React app root.

## Quick Alternative: Just Update the Workflow

Actually, the workflow I just created assumes the repo root IS the React app. So if you restructure, it will work. But you can also keep the current structure and the workflow will still work (it uses `cholera-dashboard/` paths).

**The key issue**: Make sure GitHub Pages Source is set to **"GitHub Actions"** not "Deploy from a branch".

