import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { validateAndSanitizeEmail } from '@/lib/validation';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const { signIn, signUp, resetPasswordForEmail } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for forgot-password mode in URL
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'forgot-password') {
      setIsForgotPassword(true);
      setIsLogin(true);
    }
  }, [searchParams]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailTouched) {
      const validation = validateAndSanitizeEmail(value);
      setEmailError(validation.valid ? null : validation.error || null);
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    const validation = validateAndSanitizeEmail(email);
    setEmailError(validation.valid ? null : validation.error || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submission
    setEmailTouched(true);
    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || null);
      toast({
        title: t("validationError"),
        description: emailValidation.error || t("pleaseEnterValidEmail"),
        variant: "destructive",
      });
      return;
    }

    // Handle forgot password flow
    if (isForgotPassword) {
      setLoading(true);
      try {
        const sanitizedEmail = emailValidation.sanitized;
        const result = await resetPasswordForEmail(sanitizedEmail);
        
        if (result?.error) {
          toast({
            title: t("error"),
            description: result.error.message || t("unexpectedError"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("resetEmailSent"),
            description: t("resetEmailSentDesc"),
          });
          setIsForgotPassword(false);
        }
      } catch (error: any) {
        toast({
          title: t("error"),
          description: error?.message || t("unexpectedError"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validate password length
    if (password.length < 6) {
      toast({
        title: t("validationError"),
        description: t("passwordMustBeAtLeast6Characters"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('[Auth] Attempting to', isLogin ? 'sign in' : 'sign up', 'with email:', email);
      
      // Use sanitized email
      const sanitizedEmail = emailValidation.sanitized;
      
      let result;
      if (isLogin) {
        console.log('[Auth] Calling signIn...');
        result = await signIn(sanitizedEmail, password);
        console.log('[Auth] signIn returned:', { 
          hasError: !!result?.error, 
          hasData: !!result?.data,
          error: result?.error,
          data: result?.data 
        });
      } else {
        console.log('[Auth] Calling signUp...');
        result = await signUp(sanitizedEmail, password);
        console.log('[Auth] signUp returned:', { hasError: !!result?.error });
      }

      const error = result?.error;

      if (error) {
        console.error('[Auth] Authentication error:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        
        // Provide user-friendly error messages
        let errorMessage = error.message || 'Failed to authenticate. Please check your credentials.';
        if (error.status === 400 || error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address before signing in. Check your inbox for the verification link.';
        }
        
        toast({
          title: t("authenticationError"),
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        console.log('[Auth] ✅ Authentication successful! Navigating...');
        if (isLogin) {
          // Reset loading state before navigation to prevent UI freeze
          setLoading(false);
          
          // Show success message
          toast({
            title: t("welcomeBackToast"),
            description: t("signedInSuccessfully"),
          });
          
          // Small delay to ensure auth state is updated, then navigate
          // This prevents navigation before auth context is ready
          setTimeout(() => {
            console.log('[Auth] Calling navigate("/")...');
            navigate('/', { replace: true });
            console.log('[Auth] Navigation called');
          }, 100);
        } else {
          setLoading(false);
          toast({
            title: t("accountCreated"),
            description: t("checkEmailVerify"),
          });
        }
      }
    } catch (error: any) {
      console.error('[Auth] Unexpected error:', error);
      console.error('[Auth] Error stack:', error?.stack);
      toast({
        title: t("error"),
        description: error?.message || t("unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
              {isForgotPassword ? t("forgotPassword") : (isLogin ? t("signIn") : t("signUp"))}
            </CardTitle>
            <CardDescription>
              {isForgotPassword 
                ? t("forgotPasswordDesc")
                : (isLogin ? t("welcomeBack") : t("createAccount"))
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  required
                  placeholder="your@email.com"
                  aria-invalid={emailTouched && !!emailError}
                  aria-describedby={emailTouched && emailError ? "email-error" : undefined}
                  className={emailTouched && emailError ? "border-destructive" : ""}
                />
                {emailTouched && emailError && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription id="email-error" className="text-sm">
                      {emailError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                  {isLogin && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setPassword('');
                        }}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {t("forgotPassword")}
                      </button>
                    </div>
                  )}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isForgotPassword 
                  ? t("sendResetEmail")
                  : (isLogin ? t("signIn") : t("signUp"))
                }
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setEmail('');
                    setEmailError(null);
                    setEmailTouched(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("backToFestival")} / {t("signIn")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin 
                    ? t("dontHaveAccount")
                    : t("alreadyHaveAccount")
                  }
                </button>
              )}
            </div>
            
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-sm"
              >
                {t("backToFestival")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;