# Hosting Migration Guide

This guide will help you migrate your Kollektiv Spinnen Timetable application from Lovable to any other hosting platform.

## Prerequisites

1. **Environment Variables**: Make sure you have your Supabase credentials ready
2. **Build Command**: `npm run build` (creates a `dist` folder)
3. **Node Version**: Ensure your hosting platform supports Node.js 18+ (for building)

## Step 1: Set Up Environment Variables

1. Create a `.env` file in your project root (for local development) with:
   ```env
   VITE_SUPABASE_URL=https://ndhfsjroztkhlupzvjzh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaGZzanJvenRraGx1cHp2anpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNTAsImV4cCI6MjA2OTQ0NzA1MH0.yv347okmpPHvFajXo1-ap5tjzbP-gCgMb3fCYcFhVkg
   VITE_APP_URL=https://your-domain.com
   ```

2. Add the following environment variables to your hosting platform:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
   - `VITE_APP_URL` (optional) - Your production URL (for Capacitor)

**Note:** The code will fall back to hardcoded values if environment variables aren't set, so your app will continue working during migration.

## Step 2: Choose Your Hosting Platform

### Option A: Vercel (Recommended for React Apps)

**Why Vercel?**
- Excellent React/Vite support
- Automatic deployments from Git
- Free tier available
- Built-in CI/CD

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Or connect your GitHub repo at [vercel.com](https://vercel.com)

**Configuration:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Environment Variables: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel dashboard

**Custom Domain:**
- Go to Project Settings → Domains
- Add your custom domain

---

### Option B: Netlify

**Why Netlify?**
- Great for static sites
- Free tier with good limits
- Easy custom domain setup

**Steps:**
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login: `netlify login`
3. Deploy: `netlify deploy --prod`
4. Or connect your GitHub repo at [netlify.com](https://netlify.com)

**Create `netlify.toml` in project root:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Environment Variables:**
- Go to Site Settings → Environment Variables
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

### Option C: Cloudflare Pages

**Why Cloudflare Pages?**
- Fast global CDN
- Free tier
- Great performance

**Steps:**
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to Pages → Create a project
3. Connect your Git repository
4. Configure:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`

**Environment Variables:**
- Go to Settings → Environment Variables
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

### Option D: GitHub Pages

**Why GitHub Pages?**
- Free for public repos
- Integrated with GitHub
- Simple setup

**Steps:**
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to `package.json` scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Update `vite.config.ts` to add `base: '/your-repo-name/'` if using a subdirectory
4. Deploy: `npm run deploy`

**Note:** For environment variables, you'll need to use GitHub Secrets and a GitHub Actions workflow, or hardcode them (not recommended for production).

---

### Option E: AWS Amplify / S3 + CloudFront

**Why AWS?**
- Enterprise-grade hosting
- Highly scalable
- Full control

**Steps:**
1. Build your app: `npm run build`
2. Upload `dist` folder to S3 bucket
3. Configure CloudFront distribution
4. Set up environment variables in Amplify console or use AWS Systems Manager Parameter Store

---

### Option F: Railway / Render

**Why Railway/Render?**
- Simple deployment
- Good for full-stack apps
- Free tiers available

**Steps:**
1. Connect your GitHub repo
2. Set build command: `npm run build`
3. Set start command: `npm run preview` (or use a static file server)
4. Add environment variables in dashboard

---

## Step 3: Update Capacitor Configuration (If Using Mobile App)

If you're using Capacitor for mobile apps, update `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'app.kollektivspinnen.timetable',
  appName: 'Kollektiv Spinnen',
  webDir: 'dist',
  server: {
    url: process.env.VITE_APP_URL || 'https://your-new-domain.com',
    cleartext: true
  },
  bundledWebRuntime: false
};
```

Then rebuild your mobile app:
```bash
npx cap sync
npx cap copy
```

## Step 4: Update CORS Settings (If Needed)

If you encounter CORS errors, you may need to:
1. Go to your Supabase dashboard
2. Navigate to Settings → API
3. Add your new domain to the allowed origins

## Step 5: Test Your Deployment

1. Visit your new domain
2. Test authentication (if applicable)
3. Test data fetching from Supabase
4. Check browser console for errors
5. Test on mobile devices

## Step 6: Update Any Hardcoded URLs

Search your codebase for any hardcoded Lovable URLs and replace them:
- Check `index.html` for meta tags
- Check any API endpoints
- Update social media links if needed

## Troubleshooting

### Build Errors
- Ensure Node.js version matches (check `.nvmrc` if present)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

### Environment Variables Not Working
- Vite requires `VITE_` prefix for environment variables
- Restart dev server after adding `.env` file
- Check that variables are set in hosting platform dashboard

### Routing Issues (404 on refresh)
- Ensure your hosting platform supports SPA routing
- Add redirect rules (see Netlify example above)
- For Vercel, create `vercel.json`:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

### Supabase Connection Issues
- Verify environment variables are set correctly
- Check Supabase project is active
- Verify CORS settings in Supabase dashboard

## Recommended Next Steps

1. **Set up CI/CD**: Automate deployments on git push
2. **Custom Domain**: Configure your domain with SSL
3. **Monitoring**: Set up error tracking (Sentry, LogRocket, etc.)
4. **Analytics**: Add analytics (Google Analytics, Plausible, etc.)
5. **Backup**: Ensure your Supabase database is backed up

## Need Help?

- Check hosting platform documentation
- Review Vite deployment guide: https://vitejs.dev/guide/static-deploy.html
- Supabase docs: https://supabase.com/docs

