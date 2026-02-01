import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { FestivalHeader } from '@/components/FestivalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order_index: number;
  is_visible: boolean;
  category?: string;
  subcategory?: string;
  language: string;
}

const FAQ = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFAQs();
  }, [language]);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      console.log(`[FAQ] Loading FAQs for language: ${language}`);
      
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_visible', true)
        .eq('language', language)
        .order('category', { ascending: true })
        .order('subcategory', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[FAQ] Supabase query error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log(`[FAQ] Successfully loaded ${data?.length || 0} FAQs`);
      setFaqs(data || []);
    } catch (error: any) {
      console.error('[FAQ] Error loading FAQs:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      toast({
        title: "Error",
        description: error?.message || "Failed to load FAQs. Please check your connection and try again.",
        variant: "destructive",
      });
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter FAQs based on search term
  const filteredFaqs = useMemo(() => {
    if (!searchTerm.trim()) return faqs;
    
    const term = searchTerm.toLowerCase();
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(term) ||
      faq.answer.toLowerCase().includes(term) ||
      (faq.category && faq.category.toLowerCase().includes(term)) ||
      (faq.subcategory && faq.subcategory.toLowerCase().includes(term))
    );
  }, [faqs, searchTerm]);

  // Group filtered FAQs by category and subcategory
  const groupedFAQs = filteredFaqs.reduce((acc, faq) => {
    const category = faq.category || t('allgemein');
    const subcategory = faq.subcategory || t('allgemein');
    
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][subcategory]) {
      acc[category][subcategory] = [];
    }
    acc[category][subcategory].push(faq);
    return acc;
  }, {} as Record<string, Record<string, FAQItem[]>>);

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FestivalHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* FAQ Content */}
          {faqs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-4xl mb-4">❓</div>
                <h3 className="text-xl font-semibold mb-2">{t("noFAQsAvailable")}</h3>
                <p className="text-muted-foreground">
                  {t("checkBackLater")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Intro Text */}
              <Card className="bg-card/30 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  {language === 'de' ? (
                    <div className="text-center space-y-4">
                      <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        Kollektiv Spinnen Festival - das FAQ von A bis Z
                      </h2>
                      <p className="text-lg font-semibold text-primary">
                        [Privatveranstaltung vom 07.08.2026 - 09.08.2026]
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        Wir (Aaron, Nico und Momo) wollen mit euch Kollektiv Spinnen und unsere drei Geburtstage feiern – Freitag planen wir ein buntes und sweetes Miteinander, ab Samstag Nachmittag dann über 24h Musik und Tanzen - insgesamt ein festivalhaftes Wochenende von Friends für Friends 🪩
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        Kollektiv Spinnen Festival - FAQ from A to Z
                      </h2>
                      <p className="text-lg font-semibold text-primary">
                        [Private event from 07.08.2026 - 09.08.2026]
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        We (Aaron, Nico, and Momo) want to celebrate Kollektiv Spinnen and our three birthdays with you: On Friday, we're planning a colorful and sweet get-together, and then starting Saturday afternoon, there will be over 24 hours of music and dancing – all in all, a festival-like weekend by friends for friends 🪩
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Search Bar */}
              <Card className="bg-card/30 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("searchFAQs")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10 bg-background/50"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearch}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-background/80"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {searchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {filteredFaqs.length} {filteredFaqs.length !== 1 ? t("results") : t("result")} {t("found")}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Show message when no search results */}
              {searchTerm && Object.keys(groupedFAQs).length === 0 && (
                <Card className="bg-card/30 backdrop-blur-sm border-border/50">
                  <CardContent className="p-12 text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">
                      {t("noResultsFound")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t("noFAQsMatchSearch")} "{searchTerm}"
                    </p>
                    <Button variant="outline" onClick={clearSearch}>
                      {t("clearSearch")}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* FAQ Categories */}
              {Object.entries(groupedFAQs).map(([category, subcategories]) => (
                <Card key={category} className="bg-card/30 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-3">
                      <span className="bg-gradient-primary bg-clip-text text-transparent font-bold text-2xl">
                        {category}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(subcategories).map(([subcategory, subcategoryFaqs]) => (
                      <div key={subcategory} className="space-y-3">
                        {subcategory !== t('allgemein') && (
                          <h3 className="text-lg font-semibold mb-3 text-primary">
                            {subcategory}
                          </h3>
                        )}
                        <Accordion type="single" collapsible className="space-y-2">
                          {subcategoryFaqs.map((faq) => (
                            <AccordionItem 
                              key={faq.id} 
                              value={faq.id}
                              className="border border-border/30 rounded-lg bg-background/50 px-4"
                            >
                              <AccordionTrigger className="text-left font-medium hover:no-underline">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

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

export default FAQ;