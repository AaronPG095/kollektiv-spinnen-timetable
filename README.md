# Kollektiv Spinnen Timetable

A modern, responsive festival timetable application built with React and TypeScript. This application provides an interactive way to browse and filter festival events with support for multiple views, languages, and real-time updates.

## Features

- 📅 **Interactive Timetable**: View events in chronological list or grid format
- 🔍 **Advanced Filtering**: Filter by day, venue, event type, and search query
- 🌍 **Multi-language Support**: English and German language support
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- 🔐 **Authentication**: User authentication with admin panel for event management
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- ⚡ **Real-time Updates**: Powered by Supabase for real-time data synchronization

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL database with real-time subscriptions)
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Mobile**: Capacitor (iOS & Android support)

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to install)
- A Supabase project (or use the existing configuration)

### Installation

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd kollektiv-spinnen-timetable
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_URL=http://localhost:5173
   ```

4. **Start the development server**
   ```sh
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Feature components
├── contexts/           # React contexts (Auth, Language)
├── data/               # Static data files
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
├── pages/              # Page components
└── main.tsx            # Application entry point
```

## Deployment

### Quick Deploy Options

For the fastest deployment, see the [QUICK_START.md](./QUICK_START.md) guide which covers:
- Vercel deployment (5 minutes)
- Netlify deployment (5 minutes)

### Detailed Migration Guide

For comprehensive deployment instructions and migration from other platforms, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md).

### Environment Variables for Production

Make sure to set these environment variables in your hosting platform:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `VITE_APP_URL` (optional) - Your production URL (for Capacitor mobile apps)

## Mobile App Support

This project includes Capacitor configuration for building native iOS and Android apps. After deploying your web app:

1. Update `capacitor.config.ts` with your production URL
2. Run `npx cap sync` to sync the configuration
3. Build for iOS: `npx cap open ios`
4. Build for Android: `npx cap open android`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues, questions, or contributions, please open an issue in the repository.
