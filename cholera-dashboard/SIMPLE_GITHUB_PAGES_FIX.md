# Simple Fix: GitHub Pages Still Showing README

## The Real Issue

The workflow is correct, but GitHub Pages might be:
1. Not enabled properly
2. Using wrong source (branch instead of Actions)
3. Workflow not running

## Quick Fix (3 Steps)

### Step 1: Verify GitHub Pages Settings

1. Go to: **https://github.com/dicalvin/HIP-Cholera-Watch/settings/pages**
2. **Source** MUST say: **"GitHub Actions"**
3. If it says anything else, change it to **"GitHub Actions"**
4. Click **Save**

### Step 2: Check Workflow File Location

The workflow MUST be at: `.github/workflows/deploy.yml` (in repository root)

**If it's in `cholera-dashboard/.github/workflows/deploy.yml`**, GitHub won't see it!

**Fix**: Move the workflow file to repository root:
1. Go to: https://github.com/dicalvin/HIP-Cholera-Watch
2. Navigate to: `cholera-dashboard/.github/workflows/deploy.yml`
3. Edit the file
4. Change the path in the URL to: `.github/workflows/deploy.yml` (remove `cholera-dashboard/`)
5. Or create a new file at root: `.github/workflows/deploy.yml`

### Step 3: Trigger Workflow

1. Go to: **Actions** tab
2. Click **"Deploy to GitHub Pages"**
3. Click **"Run workflow"**
4. Wait for completion

## The Workflow Location Issue

**CRITICAL**: The workflow file must be at:
- ✅ `.github/workflows/deploy.yml` (repository root)
- ❌ NOT `cholera-dashboard/.github/workflows/deploy.yml` (subfolder)

GitHub Actions only reads workflows from `.github/workflows/` at the repository root!

## Quick Fix: Move Workflow to Root

1. **Copy the workflow content** from `cholera-dashboard/.github/workflows/deploy.yml`
2. **Create new file** at repository root: `.github/workflows/deploy.yml`
3. **Paste the content** (but keep `cholera-dashboard/` paths since app is in subfolder)
4. **Delete** the old workflow file in `cholera-dashboard/.github/workflows/`

## Updated Workflow for Current Structure

Since your app is in `cholera-dashboard/` subfolder, the workflow should be at root but reference the subfolder:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: cholera-dashboard/package-lock.json

      - name: Install dependencies
        working-directory: ./cholera-dashboard
        run: npm ci

      - name: Build
        working-directory: ./cholera-dashboard
        run: npm run build
        env:
          NODE_ENV: production
          VITE_BASE_PATH: /HIP-Cholera-Watch/

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './cholera-dashboard/dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Key**: This workflow is for the CURRENT structure (app in subfolder).

## Check Workflow Location

1. Go to: https://github.com/dicalvin/HIP-Cholera-Watch
2. Check if `.github/workflows/deploy.yml` exists at ROOT
3. If not, create it there with the content above

