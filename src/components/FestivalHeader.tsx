import { Languages, LogIn, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

export const FestivalHeader = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Title - Centered, Clickable with animation */}
          <div className="text-center">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent transition-smooth hover:scale-105 hover:drop-shadow-[0_0_20px_rgba(195,100%,75%,0.5)] cursor-pointer">
                Kollektiv Spinnen
              </h1>
            </Link>
          </div>

          {/* Navbar and Language/Login Controls - Centered below title */}
          <div className="flex items-center justify-center gap-4 md:gap-6">
            <Navbar />
            
            {/* Language/Auth Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
                className="min-h-[44px] px-2 md:px-3"
              >
                <Languages className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{language.toUpperCase()}</span>
              </Button>
              
              {user ? (
                <>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin')}
                      className="min-h-[44px] px-2 md:px-3"
                    >
                      <Settings className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Admin</span>
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="min-h-[44px] px-2 md:px-3"
                >
                  <LogIn className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Login</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
