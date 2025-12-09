import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { FestivalHeader } from "@/components/FestivalHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getTicketSettings, type TicketSettings } from "@/lib/ticketSettings";
import { checkRoleAvailability, createTicketPurchase } from "@/lib/ticketPurchases";
import { validateAndSanitizeName, validateAndSanitizeEmail, sanitizeString } from "@/lib/validation";

const TicketCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const type = searchParams.get("type");
  const role = searchParams.get("role");
  
  const [ticketSettings, setTicketSettings] = useState<TicketSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    purchaser_name: "",
    purchaser_email: "",
    notes: "",
  });
  
  const priceFieldByRole: Record<string, { early: keyof TicketSettings; normal: keyof TicketSettings }> = {
    bar: { early: "bar_price_early", normal: "bar_price_normal" },
    kuechenhilfe: { early: "kuechenhilfe_price_early", normal: "kuechenhilfe_price_normal" },
    springerRunner: { early: "springer_runner_price_early", normal: "springer_runner_price_normal" },
    springerToilet: { early: "springer_toilet_price_early", normal: "springer_toilet_price_normal" },
    abbau: { early: "abbau_price_early", normal: "abbau_price_normal" },
    aufbau: { early: "aufbau_price_early", normal: "aufbau_price_normal" },
    awareness: { early: "awareness_price_early", normal: "awareness_price_normal" },
    schichtleitung: { early: "schichtleitung_price_early", normal: "schichtleitung_price_normal" },
    techHelfer: { early: "tech_price_early", normal: "tech_price_normal" },
  };
  
  useEffect(() => {
    const loadData = async () => {
      if (!type || !role) {
        toast({
          title: "Error",
          description: "Missing ticket information",
          variant: "destructive",
        });
        navigate("/tickets");
        return;
      }
      
      setLoading(true);
      try {
        const settings = await getTicketSettings();
        setTicketSettings(settings);
      
        // Check availability
        const field = priceFieldByRole[role];
        if (settings && field) {
          const limitField = role === "bar" ? "bar_limit" :
            role === "kuechenhilfe" ? "kuechenhilfe_limit" :
            role === "springerRunner" ? "springer_runner_limit" :
            role === "springerToilet" ? "springer_toilet_limit" :
            role === "abbau" ? "abbau_limit" :
            role === "aufbau" ? "aufbau_limit" :
            role === "awareness" ? "awareness_limit" :
            role === "schichtleitung" ? "schichtleitung_limit" :
            role === "techHelfer" ? "tech_limit" : null;
          
          if (limitField) {
            const limit = settings[limitField as keyof TicketSettings] as number | null | undefined;
            const isAvailable = await checkRoleAvailability(role, limit);
            
            if (!isAvailable) {
              toast({
                title: "Sold Out",
                description: "This ticket type is no longer available",
                variant: "destructive",
              });
              navigate("/tickets");
              return;
            }
          }
        }
      } catch (error: any) {
        console.error('[TicketCheckout] Error loading ticket settings:', error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load ticket information. Please try again.",
          variant: "destructive",
        });
        navigate("/tickets");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [type, role]);
  
  const getPrice = (): number => {
    if (!ticketSettings || !role) return 0;
    
    const fields = priceFieldByRole[role];
    if (!fields) return 0;
    
    const isEarlyBird = type === "earlyBird" || type === "reducedEarlyBird";
    const priceField = isEarlyBird ? fields.early : fields.normal;
    const price = ticketSettings[priceField] as number | null | undefined;
    
    return price ?? (isEarlyBird ? 100 : 120);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!type || !role) {
      toast({
        title: "Error",
        description: "Missing ticket information",
        variant: "destructive",
      });
      return;
    }
    
    // Validate and sanitize name
    const nameValidation = validateAndSanitizeName(formData.purchaser_name);
    if (!nameValidation.valid) {
      toast({
        title: "Validation Error",
        description: nameValidation.error || "Please enter a valid name",
        variant: "destructive",
      });
      return;
    }
    
    // Validate and sanitize email
    const emailValidation = validateAndSanitizeEmail(formData.purchaser_email);
    if (!emailValidation.valid) {
      toast({
        title: "Validation Error",
        description: emailValidation.error || "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    const price = getPrice();
    const result = await createTicketPurchase({
      ticket_type: type as 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal',
      role,
      price,
      purchaser_name: nameValidation.sanitized,
      purchaser_email: emailValidation.sanitized,
      notes: formData.notes ? sanitizeString(formData.notes) : undefined,
    });
    
    if (result.success && result.purchase) {
      toast({
        title: "Ticket Purchase Created",
        description: "Your ticket purchase has been registered. You will receive a confirmation email shortly.",
      });
      
      // In a real app, you would redirect to payment processing here
      // For now, we'll just show a success message
      setTimeout(() => {
        navigate("/tickets");
      }, 2000);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to process ticket purchase",
        variant: "destructive",
      });
    }
    
    setSubmitting(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!type || !role || !ticketSettings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <FestivalHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/tickets")}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("back")}
                </Button>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t("checkout")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Ticket Summary */}
                <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                  <h3 className="font-semibold mb-3">{t("ticketSummary") || "Ticket Summary"}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("ticketType") || "Ticket Type"}:</span>
                      <span className="font-medium">
                        {type === "earlyBird" ? t("earlyBird") || "Early Bird" :
                         type === "normal" ? t("normal") || "Normal" :
                         type === "reducedEarlyBird" ? `${t("reducedTickets") || "Reduced"} - ${t("earlyBird") || "Early Bird"}` :
                         `${t("reducedTickets") || "Reduced"} - ${t("normal") || "Normal"}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("selectedRole") || "Role"}:</span>
                      <span className="font-medium">{role ? t(role) || role : t("nA")}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border/30">
                      <span className="text-muted-foreground">{t("price") || "Price"}:</span>
                      <span className="font-bold text-lg">{getPrice().toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
                
                {/* Purchaser Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold">{t("purchaserInformation") || "Purchaser Information"}</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purchaser_name">
                      {t("fullName") || "Full Name"} *
                    </Label>
                    <Input
                      id="purchaser_name"
                      value={formData.purchaser_name}
                      onChange={(e) => setFormData({ ...formData, purchaser_name: e.target.value })}
                      required
                      placeholder={t("enterFullName") || "Enter your full name"}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purchaser_email">
                      {t("email") || "Email"} *
                    </Label>
                    <Input
                      id="purchaser_email"
                      type="email"
                      value={formData.purchaser_email}
                      onChange={(e) => setFormData({ ...formData, purchaser_email: e.target.value })}
                      required
                      placeholder={t("enterEmail") || "Enter your email address"}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">
                      {t("notes") || "Additional Notes"} ({t("optional") || "Optional"})
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder={t("anyAdditionalInformation") || "Any additional information..."}
                    />
                  </div>
                </div>
                
                {/* Payment Note */}
                <div className="p-4 bg-muted/50 rounded-lg border border-border/30">
                  <p className="text-sm text-muted-foreground">
                    {t("paymentNote") || "Note: Payment processing will be handled separately. You will receive payment instructions via email after submitting this form."}
                  </p>
                </div>
                
                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/tickets")}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {t("cancel") || "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("processing") || "Processing..."}
                      </>
                    ) : (
                      t("confirmPurchase") || "Confirm Purchase"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-festival-light/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-festival-medium/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-1/2 w-80 h-80 bg-festival-deep/20 rounded-full blur-3xl animate-pulse delay-2000" />
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      </div>
    </div>
  );
};

export default TicketCheckout;

