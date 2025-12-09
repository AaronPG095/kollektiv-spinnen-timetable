# Environment Variables Setup Guide

This guide will help you set up the required environment variables for the application.

## Quick Start

1. **Create a `.env` file** in the root directory of your project
2. **Add your Supabase credentials** (see below for how to get them)
3. **Restart your development server** if it's running

## Step-by-Step Instructions

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. You'll find:
   - **Project URL** → This is your `VITE_SUPABASE_URL`
   - **anon/public key** → This is your `VITE_SUPABASE_ANON_KEY`

### Step 2: Create the `.env` File

In the root directory of your project (same level as `package.json`), create a file named `.env`:

**On Mac/Linux:**
```bash
touch .env
```

**On Windows:**
```bash
type nul > .env
```

Or simply create it using your code editor.

### Step 3: Add Your Credentials

Open the `.env` file and add your credentials:

```env
VITE_SUPABASE_URL=https://ndhfsjroztkhlupzvjzh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaGZzanJvenRraGx1cHp2anpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNTAsImV4cCI6MjA2OTQ0NzA1MH0.yv347okmpPHvFajXo1-ap5tjzbP-gCgMb3fCYcFhVkg
VITE_APP_URL=http://localhost:5173
```

**Important Notes:**
- Replace the values above with your actual Supabase credentials
- Do NOT commit the `.env` file to git (it should already be in `.gitignore`)
- The `.env` file should be in the root directory, not in `src/`

### Step 4: Verify Setup

1. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

2. **Check the browser console** - you should see the app loading without errors

3. **If you see an error** about missing environment variables, double-check:
   - The `.env` file is in the root directory
   - The variable names start with `VITE_`
   - There are no spaces around the `=` sign
   - You've restarted the dev server after creating/modifying `.env`

## File Structure

Your project structure should look like this:

```
kollektiv-spinnen-timetable/
├── .env                 ← Create this file here
├── .env.example        ← Example file (optional)
├── package.json
├── src/
├── ...
```

## Troubleshooting

### Error: "Missing required environment variables"

**Solution:** 
- Make sure `.env` file exists in the root directory
- Check that variable names are correct (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- Restart your development server

### Error: "Cannot read properties of undefined"

**Solution:**
- Verify your Supabase URL and key are correct
- Check that there are no extra spaces or quotes in your `.env` file
- Make sure you're using the `anon/public` key, not the `service_role` key

### Variables not loading

**Solution:**
- Vite only loads `.env` files on server start - restart your dev server
- Make sure variable names start with `VITE_` (required for Vite)
- Check that `.env` is properly listed in `.gitignore` (git should ignore it, but the file should still exist locally on your machine)

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. **Add environment variables in your hosting platform's dashboard:**
   - Go to your project settings
   - Find "Environment Variables" or "Env Vars"
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

2. **Redeploy** your application after adding the variables

### Platform-Specific Instructions

**Vercel:**
- Settings → Environment Variables → Add New
- Add each variable separately
- Select "Production", "Preview", and "Development" as needed

**Netlify:**
- Site settings → Environment variables
- Add each variable with its value

**Railway/Render:**
- Project settings → Environment
- Add variables in the dashboard

## Security Best Practices

✅ **DO:**
- Keep `.env` file local only
- Use environment variables in production
- Use the `anon/public` key (not `service_role`)
- Rotate keys if they're exposed

❌ **DON'T:**
- Commit `.env` to git
- Share your `.env` file publicly
- Use `service_role` key in frontend code
- Hardcode credentials in your code

## Need Help?

If you're still having issues:
1. Check that your Supabase project is active
2. Verify your API keys are correct
3. Check the browser console for specific error messages
4. Make sure your Supabase project has the required tables set up

