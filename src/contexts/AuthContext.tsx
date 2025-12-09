import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Helper function to check admin status by email
    const checkAdminStatus = async (userEmail: string | undefined): Promise<void> => {
      console.log('[AuthContext] Checking admin status for:', userEmail);
      try {
        if (!userEmail) {
          console.log('[AuthContext] No email provided, setting isAdmin to false');
          if (mounted) {
            setIsAdmin(false);
          }
          return;
        }

        // Skip admin_emails check for now - RLS policy has infinite recursion bug
        // TODO: Re-enable after running FIX_ADMIN_EMAILS_RLS.sql in Supabase Dashboard
        // The user_roles fallback below will handle admin checks

        // Fallback: Check user_roles table (user_id-based) for backward compatibility
        console.log('[AuthContext] Checking user_roles table...');
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: roleAdmin, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'admin')
              .single();
            
            console.log('[AuthContext] user_roles query result:', { 
              found: !!roleAdmin, 
              error: roleError?.message 
            });
            
            if (mounted) {
              setIsAdmin(!!roleAdmin && !roleError);
            }
          } else {
            console.log('[AuthContext] No user found, setting isAdmin to false');
            if (mounted) {
              setIsAdmin(false);
            }
          }
        } catch (userRolesError: any) {
          console.log('[AuthContext] user_roles check failed:', userRolesError?.message);
          if (mounted) {
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error checking admin status:', error);
        if (mounted) {
          setIsAdmin(false);
        }
      }
      console.log('[AuthContext] Admin check complete');
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] Auth state changed:', event);
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check admin status in background (don't block auth state change)
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth callback
          setTimeout(() => {
            checkAdminStatus(session.user.email).catch(err => {
              console.error('[AuthContext] Background admin check failed:', err);
            });
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session check:', session ? 'found' : 'none');
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check admin status in background
      if (session?.user) {
        checkAdminStatus(session.user.email).catch(err => {
          console.error('[AuthContext] Initial admin check failed:', err);
        });
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        console.error('[AuthContext] Sign in error:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
      } else {
        console.log('[AuthContext] Sign in successful!');
        console.log('[AuthContext] User:', data.user?.email);
        console.log('[AuthContext] Session:', data.session ? 'exists' : 'missing');
        // Auth state listener will automatically update user and isAdmin state
      }
      
      return { error, data };
    } catch (err: any) {
      console.error('[AuthContext] Sign in exception:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};