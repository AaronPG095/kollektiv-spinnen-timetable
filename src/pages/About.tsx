import { useState, useEffect } from 'react';
import { FestivalHeader } from '@/components/FestivalHeader';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAboutPageContent, getAboutPagePhotos, type AboutPagePhoto } from '@/lib/aboutPage';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const About = () => {
  const { t } = useLanguage();
  const [content, setContent] = useState<{ title: string | null; content: string | null } | null>(null);
  const [photos, setPhotos] = useState<AboutPagePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pageContent, pagePhotos] = await Promise.all([
        getAboutPageContent(),
        getAboutPagePhotos()
      ]);
      setContent(pageContent);
      setPhotos(pagePhotos);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[About] Error loading data:', error);
      }
      // Set empty state on error - page will still render without content
      setContent(null);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Cache handles TTL, no need for polling - data will refresh on next visit or manual refresh
  }, []);

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'max-w-md mx-auto';
      case 'medium':
        return 'max-w-2xl mx-auto';
      case 'large':
        return 'max-w-4xl mx-auto';
      case 'full':
        return 'w-full';
      default:
        return 'max-w-2xl mx-auto';
    }
  };

  const getAlignmentClasses = (alignment: string) => {
    switch (alignment) {
      case 'left':
        return 'mr-auto ml-0';
      case 'right':
        return 'ml-auto mr-0';
      case 'center':
      default:
        return 'mx-auto';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <FestivalHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FestivalHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="text-center py-4 md:py-6 px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6 tracking-tight">
              About Us
            </h1>
          </div>

          {/* About Content */}
          {content && (content.title || content.content) && (
            <Card className="bg-card/30 backdrop-blur-sm border-border/50">
              {content.title && (
                <CardHeader>
                  <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {content.title}
                  </CardTitle>
                </CardHeader>
              )}
              {content.content && (
                <CardContent className="space-y-6">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {content.content}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Festival Photos */}
          {photos.length > 0 && (
            <div className="space-y-8">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={cn(
                    getSizeClasses(photo.size),
                    getAlignmentClasses(photo.alignment)
                  )}
                >
                  <div className="space-y-2">
                    <img
                      src={photo.image_url}
                      alt={photo.caption || "Festival photo"}
                      loading="lazy"
                      width={photo.size === 'small' ? 400 : photo.size === 'medium' ? 600 : photo.size === 'large' ? 800 : 1200}
                      height={photo.size === 'small' ? 300 : photo.size === 'medium' ? 400 : photo.size === 'large' ? 600 : 500}
                      className={cn(
                        "w-full rounded-lg object-cover",
                        photo.size === 'small' && "h-48",
                        photo.size === 'medium' && "h-64",
                        photo.size === 'large' && "h-96",
                        photo.size === 'full' && "h-[500px]"
                      )}
                    />
                    {photo.caption && (
                      <p className="text-sm text-muted-foreground text-center italic">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-festival-light/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-festival-medium/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-1/2 w-80 h-80 bg-festival-deep/20 rounded-full blur-3xl animate-pulse delay-2000" />
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      </div>

      <Footer />
    </div>
  );
};

export default About;

