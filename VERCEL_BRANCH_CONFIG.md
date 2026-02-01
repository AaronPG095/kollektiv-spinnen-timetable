# Vercel Branch Configuration Guide

This guide explains how to configure Vercel to deploy `main` to production and `develop` to preview environments.

## Configuration Steps

### 1. Access Vercel Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **kollektiv-spinnen-timetable** (or your project name)
3. Click on **Settings** (top navigation)

### 2. Configure Git Integration

1. In Settings, go to **Git** section
2. Ensure your GitHub repository is connected
3. Verify the repository: `AaronPG095/kollektiv-spinnen-timetable`

### 3. Configure Production Branch

1. In Settings, go to **General** section
2. Under **Production Branch**, ensure it's set to: `main`
   - This ensures only `main` branch deploys to your production domain

### 4. Configure Preview Deployments

1. In Settings, go to **Git** section
2. Under **Preview Deployments**, ensure:
   - ✅ **Automatic Preview Deployments** is enabled
   - This will automatically create preview deployments for all branches, including `develop`

### 5. Branch-Specific Settings (Optional)

For more control, you can configure branch-specific settings:

1. In Settings, go to **Git** section
2. Under **Branch Protection**, you can:
   - Set which branches trigger deployments
   - Configure deployment settings per branch

### 6. Environment Variables

Ensure environment variables are set for both production and preview:

1. In Settings, go to **Environment Variables** section
2. Add/verify these variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PAYPAL_PAYMENT_LINK` (optional)
   - `VITE_PAYPAL_QR_CODE_URL` (optional)
   - `VITE_APP_URL` (optional)

3. For each variable, select which environments it applies to:
   - **Production** - for `main` branch
   - **Preview** - for `develop` and other branches
   - **Development** - for local development (if using Vercel CLI)

## Expected Behavior After Configuration

### Main Branch (Production)
- Every push to `main` triggers a production deployment
- Deploys to your production domain (e.g., `your-app.vercel.app` or custom domain)
- Uses production environment variables

### Develop Branch (Preview)
- Every push to `develop` triggers a preview deployment
- Deploys to a unique preview URL (e.g., `develop-your-app-abc123.vercel.app`)
- Uses preview environment variables
- Perfect for testing before merging to `main`

## Verification

After configuration:

1. **Test Production Deployment**
   - Make a small change on `develop`
   - Merge `develop` → `main` via PR
   - Check Vercel dashboard - you should see a production deployment

2. **Test Preview Deployment**
   - Make a change on `develop` branch
   - Push to `develop`
   - Check Vercel dashboard - you should see a preview deployment with a unique URL

## Quick Links

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Documentation: https://vercel.com/docs

## Troubleshooting

### Deployments Not Triggering

- Ensure GitHub integration is properly connected
- Check that webhooks are set up correctly in GitHub repository settings
- Verify branch names match exactly (`main` and `develop`)

### Wrong Environment Variables

- Double-check environment variable settings in Vercel
- Ensure variables are assigned to the correct environments (Production/Preview)
- Redeploy after changing environment variables

### Preview URLs Not Working

- Check that preview deployments are enabled in Git settings
- Verify the branch exists and has been pushed to GitHub
- Check deployment logs in Vercel dashboard for errors
