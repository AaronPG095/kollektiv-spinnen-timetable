# Refactoring Agent Prompt

## Objective

You are a refactoring agent tasked with systematically improving a React/TypeScript/Supabase codebase to ensure the highest levels of security, efficiency, functionality, and maintainability. Your goal is to identify and fix issues while maintaining existing functionality and improving code quality.

## Scope and Context

**Tech Stack:**
- Frontend: React 18 with TypeScript
- Build Tool: Vite
- Backend: Supabase (PostgreSQL + Auth + Storage)
- UI: shadcn/ui components with Tailwind CSS
- State Management: React Context API
- Routing: React Router DOM

**Project Type:** Festival timetable application with admin panel, ticket purchasing, and content management.

## Refactoring Priorities

### 🔴 CRITICAL (Must Fix Immediately)
1. **Security Vulnerabilities**
   - Hardcoded credentials or API keys
   - Missing input validation/sanitization
   - SQL injection risks (even with Supabase)
   - XSS vulnerabilities
   - Exposed sensitive data in error messages
   - Missing authentication/authorization checks

2. **Runtime Errors**
   - Undefined variable references
   - Null pointer exceptions
   - Type errors that could cause crashes
   - Race conditions in async code

### 🟡 IMPORTANT (High Priority)
3. **Performance Issues**
   - Unnecessary API calls (missing caching)
   - Missing debouncing on user inputs
   - Sequential API calls that could be parallel
   - Large component re-renders
   - Memory leaks (missing cleanup)

4. **Code Quality**
   - Inconsistent error handling
   - Missing error boundaries
   - Poor error messages (too technical or too vague)
   - Code duplication
   - Missing TypeScript types

### 🟢 NICE-TO-HAVE (Enhancements)
5. **Developer Experience**
   - Missing documentation
   - Inconsistent code style
   - Unused code/dead code
   - Missing utility functions

## Security Refactoring Checklist

### Credentials and Secrets
- [ ] **Remove all hardcoded credentials**
  - Check for hardcoded Supabase URLs/keys
  - Ensure environment variables are required (no fallbacks)
  - Verify `.env` file is in `.gitignore`
  - Example: `src/integrations/supabase/client.ts` should require env vars

- [ ] **Validate environment variables**
  - Throw clear errors if required vars are missing
  - Provide helpful error messages with setup instructions
  - Check at application startup

### Input Validation and Sanitization
- [ ] **Validate all user inputs**
  - Email addresses (format validation)
  - Names (length, character restrictions)
  - URLs (protocol validation, prevent javascript:)
  - Numbers (range validation, prevent NaN)
  - Text fields (XSS prevention, length limits)

- [ ] **Sanitize before storage**
  - Remove HTML tags from user input
  - Trim whitespace
  - Normalize email addresses (lowercase)
  - Validate URLs before storing

- [ ] **Create validation utilities**
  - Centralized validation functions
  - Reusable across forms
  - Consistent error messages

### Error Handling Security
- [ ] **Prevent information leakage**
  - Don't expose stack traces in production
  - Don't expose database errors directly
  - Don't expose internal file paths
  - Use generic error messages for users
  - Log detailed errors server-side only

- [ ] **Centralized error handling**
  - Create error handler utility
  - Format Supabase errors safely
  - Provide user-friendly messages

### Authentication and Authorization
- [ ] **Verify admin checks**
  - Remove race conditions (no setTimeout hacks)
  - Use proper async/await patterns
  - Check permissions before sensitive operations
  - Validate user sessions

- [ ] **Protect routes**
  - Ensure admin routes require authentication
  - Redirect unauthorized users
  - Show appropriate error messages

## Performance Optimization Checklist

### API Call Optimization
- [ ] **Implement caching**
  - Cache frequently accessed data (ticket settings, etc.)
  - Use TTL (Time To Live) for cache invalidation
  - Clear cache on updates
  - Example: Cache ticket settings for 30 seconds

- [ ] **Parallelize API calls**
  - Use `Promise.all()` for independent requests
  - Load admin data in parallel, not sequentially
  - Example: Load events, FAQs, and settings simultaneously

- [ ] **Add retry logic**
  - Retry failed API calls with exponential backoff
  - Limit retry attempts (3-5 max)
  - Log retry attempts for monitoring

### User Input Optimization
- [ ] **Debounce search inputs**
  - Add 300ms debounce to search fields
  - Prevent excessive filtering operations
  - Use custom `useDebounce` hook

- [ ] **Optimize form submissions**
  - Prevent double submissions
  - Show loading states
  - Disable submit button during processing

### React Performance
- [ ] **Optimize re-renders**
  - Use `React.memo` for expensive components
  - Memoize callbacks with `useCallback`
  - Memoize computed values with `useMemo`
  - Split large components

- [ ] **Lazy loading**
  - Code-split routes with `React.lazy`
  - Load admin components only when needed
  - Reduce initial bundle size

## Code Quality Checklist

### Error Handling
- [ ] **Add error boundaries**
  - Wrap app in error boundary
  - Catch React component errors gracefully
  - Show user-friendly error UI
  - Log errors for debugging

- [ ] **Consistent error handling**
  - Use centralized error handler
  - Consistent error message format
  - Proper error logging
  - User-friendly error messages

- [ ] **Handle async errors**
  - Proper try/catch blocks
  - Handle promise rejections
  - Show loading/error states in UI

### Type Safety
- [ ] **Improve TypeScript types**
  - Add missing type annotations
  - Use proper interfaces/types
  - Avoid `any` types
  - Use type guards where needed

- [ ] **Validate data at boundaries**
  - Validate API responses
  - Validate form inputs
  - Use type assertions carefully

### Code Organization
- [ ] **Create utility modules**
  - Validation utilities (`src/lib/validation.ts`)
  - Error handling utilities (`src/lib/errorHandler.ts`)
  - Caching utilities (`src/lib/cache.ts`)
  - Retry utilities (`src/lib/retry.ts`)

- [ ] **Extract reusable hooks**
  - Custom hooks for common patterns
  - Debounce hook
  - Data fetching hooks

- [ ] **Consistent naming**
  - Use consistent naming conventions
  - Clear, descriptive function names
  - Consistent file naming

## Execution Workflow

### Phase 1: Discovery and Analysis
1. **Read key files** to understand the codebase:
   - `src/App.tsx` - Application structure
   - `src/integrations/supabase/client.ts` - Database setup
   - `src/contexts/AuthContext.tsx` - Authentication
   - `src/pages/Admin.tsx` - Admin functionality
   - `src/lib/*.ts` - Utility functions

2. **Identify issues** using the checklists above:
   - Security vulnerabilities
   - Performance bottlenecks
   - Code quality issues
   - Missing error handling

3. **Prioritize fixes**:
   - Critical security issues first
   - Runtime errors second
   - Performance optimizations third
   - Code quality improvements last

### Phase 2: Implementation
1. **Create utility modules** (if needed):
   - Validation utilities
   - Error handling utilities
   - Caching system
   - Retry logic

2. **Fix security issues**:
   - Remove hardcoded credentials
   - Add input validation
   - Improve error handling
   - Fix authentication issues

3. **Optimize performance**:
   - Add caching
   - Implement debouncing
   - Parallelize API calls
   - Optimize React components

4. **Improve code quality**:
   - Add error boundaries
   - Improve error handling consistency
   - Enhance type safety
   - Refactor duplicated code

### Phase 3: Validation
1. **Run linter**: `npm run lint`
   - Fix all linting errors
   - Ensure no new warnings

2. **Type checking**: `tsc --noEmit`
   - Fix all TypeScript errors
   - Ensure type safety

3. **Test functionality**:
   - Verify forms work correctly
   - Test error scenarios
   - Verify authentication flow
   - Test admin operations

4. **Check for regressions**:
   - Ensure existing functionality still works
   - Verify no breaking changes
   - Test edge cases

## Specific Patterns for React/TypeScript/Supabase

### Error Boundary Pattern
```typescript
// ✅ GOOD: Error boundary component (from src/components/ErrorBoundary.tsx)
import React, { Component, ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card>
            <CardContent>
              <p>
                {import.meta.env.DEV && this.state.error
                  ? this.state.error.message
                  : 'An unexpected error occurred. Please try refreshing the page.'}
              </p>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage in App.tsx
const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <LanguageProvider>
        {/* ... rest of app */}
      </LanguageProvider>
    </AuthProvider>
  </ErrorBoundary>
);

// ❌ BAD: No error boundary (app crashes on any error)
const App = () => (
  <AuthProvider>
    <LanguageProvider>
      {/* ... rest of app */}
    </LanguageProvider>
  </AuthProvider>
);
```

### Supabase Client Setup
```typescript
// ✅ GOOD: Require environment variables (from src/integrations/supabase/client.ts)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set. ' +
    'Please create a .env file with these variables or set them in your hosting platform.'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// ❌ BAD: Hardcoded fallbacks (security risk)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ndhfsjroztkhlupzvjzh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGci...";
```

### Input Validation Pattern
```typescript
// ✅ GOOD: Validate and sanitize (from src/pages/TicketCheckout.tsx)
import { validateAndSanitizeEmail, validateAndSanitizeName, sanitizeString } from '@/lib/validation';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate name
  const nameValidation = validateAndSanitizeName(formData.purchaser_name);
  if (!nameValidation.valid) {
    toast({
      title: "Validation Error",
      description: nameValidation.error || "Please enter a valid name",
      variant: "destructive",
    });
    return;
  }
  
  // Validate email
  const emailValidation = validateAndSanitizeEmail(formData.purchaser_email);
  if (!emailValidation.valid) {
    toast({
      title: "Validation Error",
      description: emailValidation.error || "Please enter a valid email address",
      variant: "destructive",
    });
    return;
  }
  
  // Use sanitized values
  await createTicketPurchase({
    purchaser_name: nameValidation.sanitized,
    purchaser_email: emailValidation.sanitized,
    notes: formData.notes ? sanitizeString(formData.notes) : undefined,
  });
};

// ❌ BAD: No validation (security risk)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await createTicketPurchase({
    purchaser_name: formData.purchaser_name.trim(),
    purchaser_email: formData.purchaser_email.trim(),
  });
};
```

### Error Handling Pattern

**CRITICAL: Always throw errors for critical failures. Don't return null/undefined silently.**

```typescript
// ✅ GOOD: Throw errors for critical data fetching (from src/lib/ticketSettings.ts)
export const getTicketSettings = async (): Promise<TicketSettings> => {
  try {
    const { data, error } = await supabase
      .from('ticket_settings')
      .select('*')
      .eq('id', DEFAULT_SETTINGS_ID)
      .single();

    if (error) {
      logError('TicketSettings', error, { operation: 'getTicketSettings' });
      throw new Error(formatSupabaseError(error)); // ✅ Throw to propagate error
    }

    if (!data) {
      throw new Error('Ticket settings not found');
    }

    return data;
  } catch (error) {
    logError('TicketSettings', error, { operation: 'getTicketSettings' });
    throw error; // ✅ Re-throw to propagate
  }
};

// ✅ GOOD: Return result object for operations (from src/lib/ticketPurchases.ts)
export const createTicketPurchase = async (
  purchaseData: CreatePurchaseData
): Promise<{ success: boolean; purchase?: TicketPurchase; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('ticket_purchases')
      .insert({
        user_id: user?.id || null,
        ...purchaseData,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logError('TicketPurchases', error, { operation: 'createTicketPurchase', purchaseData });
      return {
        success: false,
        error: formatSupabaseError(error),
      };
    }

    return { success: true, purchase: data };
  } catch (error: any) {
    logError('TicketPurchases', error, { operation: 'createTicketPurchase', purchaseData });
    return {
      success: false,
      error: formatSupabaseError(error),
    };
  }
};

// ✅ GOOD: Return empty array for queries that can legitimately be empty
export const getUserPurchases = async (): Promise<TicketPurchase[]> => {
  try {
    const { data, error } = await supabase
      .from('ticket_purchases')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      logError('TicketPurchases', error, { operation: 'getUserPurchases' });
      throw new Error(formatSupabaseError(error)); // ✅ Throw for errors
    }

    return data || []; // ✅ Empty array is valid (no purchases yet)
  } catch (error) {
    logError('TicketPurchases', error, { operation: 'getUserPurchases' });
    throw error; // ✅ Re-throw
  }
};

// ❌ BAD: Returning null on error (hides failures, breaks Promise.all)
export const getTicketSettings = async (): Promise<TicketSettings | null> => {
  const { data, error } = await supabase
    .from('ticket_settings')
    .select('*')
    .single();
  
  if (error) {
    return null; // ❌ Error is swallowed, Promise.all() won't catch it
  }
  return data;
};

// ❌ BAD: Inconsistent error handling (security and UX issues)
export const createTicketPurchase = async (purchaseData: CreatePurchaseData) => {
  try {
    const { data, error } = await supabase.from('ticket_purchases').insert(purchaseData);
    if (error) {
      console.error('[TicketPurchases] Error:', error);
      return { success: false, error: error.message }; // Exposes internal error
    }
    return { success: true, purchase: data };
  } catch (error: any) {
    console.error('[TicketPurchases] Exception:', error);
    return { success: false, error: error.message }; // Exposes stack trace in dev
  }
};
```

### Caching Pattern
```typescript
// ✅ GOOD: Cache with TTL and proper error handling (from src/lib/ticketSettings.ts)
import { cache } from '@/lib/cache';
import { formatSupabaseError, logError } from '@/lib/errorHandler';

const CACHE_KEY = 'ticket_settings';
const CACHE_TTL = 30000; // 30 seconds

export const getTicketSettings = async (): Promise<TicketSettings> => {
  try {
    // Check cache first
    const cached = cache.get<TicketSettings>(CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('ticket_settings')
      .select('*')
      .eq('id', DEFAULT_SETTINGS_ID)
      .single();

    if (error) {
      logError('TicketSettings', error, { operation: 'getTicketSettings' });
      throw new Error(formatSupabaseError(error)); // ✅ Throw error instead of returning null
    }

    if (!data) {
      throw new Error('Ticket settings not found');
    }

    // Cache the result
    cache.set(CACHE_KEY, data, CACHE_TTL);
    return data;
  } catch (error) {
    logError('TicketSettings', error, { operation: 'getTicketSettings' });
    throw error; // ✅ Re-throw to propagate error
  }
};

// Clear cache on update
export const updateTicketSettings = async (settings: Partial<TicketSettings>) => {
  // ... update logic ...
  cache.delete(CACHE_KEY); // Clear cache
  cache.set(CACHE_KEY, updateData, CACHE_TTL); // Set new data
};

// ❌ BAD: Returning null on error (hides failures, breaks Promise.all)
export const getTicketSettings = async (): Promise<TicketSettings | null> => {
  const { data, error } = await supabase
    .from('ticket_settings')
    .select('*')
    .eq('id', DEFAULT_SETTINGS_ID)
    .single();
  
  if (error) {
    return null; // ❌ Error is swallowed, Promise.all() won't catch it
  }
  return data;
};
```

### Debouncing Pattern
```typescript
// ✅ GOOD: Debounce user input (from src/pages/Admin.tsx)
import { useDebounce } from '@/hooks/useDebounce';

const Admin = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms delay
  
  // Filter events based on debounced search query
  const filteredEvents = events.filter(event => {
    const query = debouncedSearchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query) ||
      event.day.toLowerCase().includes(query) ||
      event.type.toLowerCase().includes(query) ||
      (event.description && event.description.toLowerCase().includes(query))
    );
  });
  
  return (
    <Input
      placeholder="Search events..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  );
};

// Custom hook (from src/hooks/useDebounce.ts)
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// ❌ BAD: No debouncing (performance issue)
const [searchQuery, setSearchQuery] = useState("");
const filteredEvents = events.filter(event => 
  event.title.includes(searchQuery) // Filters on every keystroke
);
```

### Parallel API Calls Pattern
```typescript
// ✅ GOOD: Load in parallel with proper error handling (from src/pages/Admin.tsx)
useEffect(() => {
  if (!authLoading && !user) {
    navigate('/auth');
    return;
  }
  
  if (!authLoading && user && !isAdmin) {
    navigate('/');
    return;
  }

  if (isAdmin) {
    // Load all data in parallel for better performance
    // Use Promise.allSettled to handle partial failures gracefully
    Promise.allSettled([
      loadEvents(),
      loadFAQs(),
      loadTicketSettings(),
      loadAboutPageData(),
      loadTicketPurchases(),
    ]).then((results) => {
      // Check each result individually
      const errors = results
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ result, index }) => ({
          index,
          error: result.status === 'rejected' ? result.reason : null,
        }));

      if (errors.length > 0) {
        console.error('[Admin] Some data failed to load:', errors);
        toast({
          title: "Warning",
          description: `Failed to load ${errors.length} data source(s). Some features may be unavailable.`,
          variant: "destructive",
        });
      }
    });
  }
}, [user, isAdmin, authLoading, navigate]);

// ✅ ALTERNATIVE: Promise.all with individual error handling in each loader
// Each loader function handles its own errors and throws if critical
useEffect(() => {
  if (isAdmin) {
    Promise.all([
      loadEvents().catch(err => {
        console.error('[Admin] Failed to load events:', err);
        // Set empty state or show error in UI
      }),
      loadFAQs().catch(err => {
        console.error('[Admin] Failed to load FAQs:', err);
      }),
      // ... etc
    ]);
  }
}, [isAdmin]);

// ❌ BAD: Sequential loading (slow)
useEffect(() => {
  if (isAdmin) {
    loadEvents().then(() => {
      loadFAQs().then(() => {
        loadTicketSettings().then(() => {
          loadAboutPageData().then(() => {
            loadTicketPurchases();
          });
        });
      });
    });
  }
}, [isAdmin]);

// ❌ BAD: Promise.all with functions that return null on error (won't catch failures)
Promise.all([
  getTicketSettings(), // Returns null on error, doesn't throw
  loadEvents(),        // Returns null on error, doesn't throw
]).catch((error) => {
  // This catch will NEVER fire if functions return null instead of throwing!
});
```

### Admin Check Pattern
```typescript
// ✅ GOOD: Proper async admin check (from src/contexts/AuthContext.tsx)
useEffect(() => {
  let mounted = true;

  // Helper function to check admin status
  const checkAdminStatus = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();
      
      // Only update state if component is still mounted
      if (mounted) {
        setIsAdmin(!!data && !error);
      }
    } catch (error) {
      console.error('[AuthContext] Error checking admin status:', error);
      if (mounted) {
        setIsAdmin(false);
      }
    }
  };

  // Set up auth state listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check admin status when user changes
      if (session?.user) {
        await checkAdminStatus(session.user.id); // Proper async/await
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    }
  );

  // Check for existing session
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!mounted) return;
    
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      await checkAdminStatus(session.user.id);
    } else {
      setIsAdmin(false);
    }
    
    setLoading(false);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

// ❌ BAD: Race condition with setTimeout (unreliable)
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => { // Race condition!
          const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .single();
          setIsAdmin(!!data);
        }, 0);
      }
    }
  );
  return () => subscription.unsubscribe();
}, []);
```

## Success Criteria

### Security
- ✅ No hardcoded credentials
- ✅ All user inputs validated
- ✅ No sensitive data in error messages
- ✅ Proper authentication checks
- ✅ Environment variables required

### Performance
- ✅ Caching implemented for frequent queries
- ✅ Debouncing on search inputs
- ✅ Parallel API calls where possible
- ✅ No unnecessary re-renders
- ✅ Optimized bundle size

### Code Quality
- ✅ Error boundaries in place
- ✅ Consistent error handling
- ✅ Proper TypeScript types
- ✅ No linting errors
- ✅ Clear error messages

### Functionality
- ✅ All existing features work
- ✅ No regressions introduced
- ✅ Better error handling
- ✅ Improved user experience

## Validation Steps

### 1. Security Audit
- [ ] **Credentials Check**
  - [ ] Search codebase for hardcoded URLs/keys: `grep -r "https://.*supabase" src/`
  - [ ] Verify `.env` is in `.gitignore`
  - [ ] Test app startup without env vars (should fail gracefully)
  - [ ] Check production build doesn't contain secrets

- [ ] **Input Validation Check**
  - [ ] All form inputs have validation
  - [ ] Email validation on all email fields
  - [ ] URL validation on all URL fields
  - [ ] XSS prevention (no raw HTML rendering)
  - [ ] Length limits on text inputs

- [ ] **Error Handling Check**
  - [ ] No stack traces in production error messages
  - [ ] No database error details exposed to users
  - [ ] Generic error messages for users
  - [ ] Detailed errors logged server-side only

- [ ] **Authentication Check**
  - [ ] Admin routes require authentication
  - [ ] Admin operations check permissions
  - [ ] No race conditions in auth checks
  - [ ] Proper session management

### 2. Performance Test
- [ ] **API Call Optimization**
  - [ ] Open browser DevTools → Network tab
  - [ ] Verify caching reduces duplicate calls
  - [ ] Check parallel loading (multiple requests at once)
  - [ ] Verify no unnecessary sequential calls

- [ ] **User Input Optimization**
  - [ ] Test search input debouncing (type fast, check network)
  - [ ] Verify filtering doesn't lag
  - [ ] Check form submission prevents double-submit

- [ ] **React Performance**
  - [ ] Use React DevTools Profiler
  - [ ] Check for unnecessary re-renders
  - [ ] Verify memoization where needed
  - [ ] Check bundle size: `npm run build` → check `dist/` size

### 3. Code Quality Check
- [ ] **Linting**
  ```bash
  npm run lint
  ```
  - [ ] Fix all errors
  - [ ] Address warnings
  - [ ] No new warnings introduced

- [ ] **Type Checking**
  ```bash
  npx tsc --noEmit
  ```
  - [ ] Fix all TypeScript errors
  - [ ] Remove `any` types where possible
  - [ ] Add missing type annotations

- [ ] **Code Review**
  - [ ] Error handling is consistent
  - [ ] No code duplication
  - [ ] Functions are properly named
  - [ ] Comments explain complex logic

### 4. Functionality Test
- [ ] **Forms**
  - [ ] Ticket checkout form validates inputs
  - [ ] Admin forms save correctly
  - [ ] Error messages are user-friendly
  - [ ] Loading states work correctly

- [ ] **Error Scenarios**
  - [ ] Network errors handled gracefully
  - [ ] Invalid inputs show clear errors
  - [ ] Error boundary catches React errors
  - [ ] 404 pages work correctly

- [ ] **Admin Operations**
  - [ ] Can create/edit/delete events
  - [ ] Can create/edit/delete FAQs
  - [ ] Can update ticket settings
  - [ ] Can manage ticket purchases

- [ ] **Authentication Flow**
  - [ ] Login works correctly
  - [ ] Logout clears session
  - [ ] Admin check works reliably
  - [ ] Protected routes redirect properly

## Documentation Requirements

After refactoring, create or update:

1. **REFACTORING_SUMMARY.md** - Document all changes made
2. **ENV_SETUP.md** - Environment variable setup guide
3. **Update README.md** - If setup process changed
4. **Code comments** - Document complex logic

## Notes

- **Don't break existing functionality** - All changes should be backward compatible
- **Incremental improvements** - Fix critical issues first, then optimize
- **Test thoroughly** - Verify each change works before moving on
- **Document changes** - Help future developers understand improvements
- **Follow existing patterns** - Maintain consistency with codebase style

## Quick Reference: Common Issues and Fixes

### Issue: Hardcoded Credentials
**Symptom:** API keys or URLs hardcoded in source code  
**Fix:** Move to environment variables, require them at startup  
**File:** `src/integrations/supabase/client.ts`  
**Pattern:** See "Supabase Client Setup" pattern above

### Issue: Missing Input Validation
**Symptom:** Forms accept invalid data, potential XSS  
**Fix:** Add validation utilities, validate before submission  
**File:** `src/lib/validation.ts`  
**Pattern:** See "Input Validation Pattern" above

### Issue: Inconsistent Error Handling
**Symptom:** Different error formats, exposed sensitive info  
**Fix:** Centralize error handling, use error handler utility  
**File:** `src/lib/errorHandler.ts`  
**Pattern:** See "Error Handling Pattern" above

### Issue: Too Many API Calls
**Symptom:** Same data fetched multiple times  
**Fix:** Implement caching with TTL  
**File:** `src/lib/cache.ts`  
**Pattern:** See "Caching Pattern" above

### Issue: Search Input Lag
**Symptom:** Filtering happens on every keystroke  
**Fix:** Add debouncing to search inputs  
**File:** `src/hooks/useDebounce.ts`  
**Pattern:** See "Debouncing Pattern" above

### Issue: Slow Page Load
**Symptom:** Sequential API calls delay page load  
**Fix:** Use Promise.all() for parallel loading  
**File:** `src/pages/Admin.tsx`  
**Pattern:** See "Parallel API Calls Pattern" above

### Issue: Race Condition in Auth
**Symptom:** Admin status check unreliable  
**Fix:** Use proper async/await, avoid setTimeout  
**File:** `src/contexts/AuthContext.tsx`  
**Pattern:** See "Admin Check Pattern" above

### Issue: App Crashes on Error
**Symptom:** Unhandled errors crash entire app  
**Fix:** Add error boundary component  
**File:** `src/components/ErrorBoundary.tsx`  
**Pattern:** See "Error Boundary Pattern" above

## File Structure Reference

After refactoring, your project should have:

```
src/
├── lib/
│   ├── validation.ts          # Input validation utilities
│   ├── errorHandler.ts        # Centralized error handling
│   ├── cache.ts               # Caching system
│   ├── retry.ts               # Retry logic
│   ├── ticketSettings.ts      # Ticket settings (with caching)
│   ├── ticketPurchases.ts     # Ticket purchases (with error handling)
│   └── aboutPage.ts           # About page (with error handling)
├── hooks/
│   └── useDebounce.ts         # Debounce hook
├── components/
│   └── ErrorBoundary.tsx     # Error boundary component
├── contexts/
│   └── AuthContext.tsx       # Auth (with proper admin check)
├── integrations/
│   └── supabase/
│       └── client.ts         # Supabase client (env vars required)
└── pages/
    ├── Admin.tsx             # Admin (parallel loading, debouncing)
    └── TicketCheckout.tsx     # Checkout (input validation)
```

## Command Reference

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Check bundle size
npm run build && du -sh dist/

# Search for hardcoded credentials
grep -r "https://.*supabase" src/
grep -r "eyJ" src/  # JWT tokens

# Test without environment variables
unset VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY
npm run dev  # Should fail with clear error
```

---

**Use this prompt as a comprehensive guide for refactoring React/TypeScript/Supabase applications. Adapt priorities and checklists based on specific project needs.**

