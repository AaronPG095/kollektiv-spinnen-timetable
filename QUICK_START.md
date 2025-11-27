# Quick Migration Start Guide

## Fastest Way to Deploy

### Option 1: Vercel (5 minutes)

1. **Push your code to GitHub** (if not already)
2. **Go to [vercel.com](https://vercel.com)** and sign up/login
3. **Click "Add New Project"**
4. **Import your GitHub repository**
5. **Configure:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `./`
6. **Add Environment Variables:**
   - `VITE_SUPABASE_URL` = `https://ndhfsjroztkhlupzvjzh.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaGZzanJvenRraGx1cHp2anpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNTAsImV4cCI6MjA2OTQ0NzA1MH0.yv347okmpPHvFajXo1-ap5tjzbP-gCgMb3fCYcFhVkg`
7. **Click Deploy**

Done! Your site will be live in ~2 minutes.

---

### Option 2: Netlify (5 minutes)

1. **Push your code to GitHub** (if not already)
2. **Go to [netlify.com](https://netlify.com)** and sign up/login
3. **Click "Add new site" → "Import an existing project"**
4. **Connect to GitHub** and select your repository
5. **Configure:**
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Go to Site settings → Environment variables** and add:
   - `VITE_SUPABASE_URL` = `https://ndhfsjroztkhlupzvjzh.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaGZzanJvenRraGx1cHp2anpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNTAsImV4cCI6MjA2OTQ0NzA1MH0.yv347okmpPHvFajXo1-ap5tjzbP-gCgMb3fCYcFhVkg`
7. **Click "Deploy site"**

Done! The `netlify.toml` file is already configured for you.

---

## After Deployment

1. **Test your site** - Visit the provided URL
2. **Update Capacitor config** (if using mobile app):
   - Edit `capacitor.config.ts`
   - Replace the `serverUrl` with your new domain
   - Run `npx cap sync`
3. **Add custom domain** (optional):
   - Vercel: Project Settings → Domains
   - Netlify: Domain settings → Add custom domain

---

## Troubleshooting

**Build fails?**
- Make sure Node.js version is 18+ on your hosting platform
- Check that all dependencies are in `package.json`

**Environment variables not working?**
- Restart the build after adding variables
- Make sure they start with `VITE_` prefix
- Check for typos in variable names

**404 errors on page refresh?**
- This is normal for SPAs - the `vercel.json` and `netlify.toml` files handle this
- If using another platform, add redirect rules (see full guide)

**Need more help?**
- See `MIGRATION_GUIDE.md` for detailed instructions
- Check your hosting platform's documentation

