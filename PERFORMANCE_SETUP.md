# Performance Optimization Setup

## Required Package Installation

Before building for production, install the following dev dependencies:

```bash
npm install -D terser rollup-plugin-visualizer vite-plugin-compression
```

These packages are required for:
- **terser**: JavaScript minification
- **rollup-plugin-visualizer**: Bundle size analysis (generates `dist/stats.html`)
- **vite-plugin-compression**: Gzip and Brotli compression

## Build Commands

After installing the packages:

```bash
# Production build with all optimizations
npm run build

# View bundle analysis
# Open dist/stats.html in your browser after building
```

## Performance Improvements Implemented

1. **Database Connection Optimization**
   - Removed excessive logging in production
   - Simplified fetch wrapper
   - Deferred connection test to background

2. **Query Optimization**
   - Server-side filtering instead of client-side
   - Specific column selects
   - Caching with 5-minute TTL

3. **Code Splitting**
   - All routes lazy-loaded
   - Manual chunk splitting for vendors
   - Admin and Checkout pages in separate chunks

4. **Component Optimization**
   - React.memo on EventCard
   - Memoized filter calculations
   - Debounced search input

5. **Build Optimizations**
   - Terser minification
   - Gzip and Brotli compression
   - Bundle analyzer

6. **Caching**
   - Events data cached (5 minutes)
   - About page data cached (10 minutes)
   - Cache invalidation on mutations

7. **Image Optimization**
   - Lazy loading on images
   - Width/height attributes for CLS prevention
   - Optimized font loading

## Database Index Recommendations

For optimal query performance, ensure these indexes exist in your Supabase database:

```sql
-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_is_visible ON events(is_visible);
CREATE INDEX IF NOT EXISTS idx_events_day_start_time ON events(day, start_time);
CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue);

-- User roles index (for admin checks)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON user_roles(user_id, role);
```

These indexes will significantly improve query performance, especially for the events filtering.
