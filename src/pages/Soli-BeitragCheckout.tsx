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
import { ArrowLeft, Loader2, AlertCircle, ExternalLink, QrCode, Copy, Check } from "lucide-react";
import { getTicketSettings, type TicketSettings } from "@/lib/ticketSettings";
import { 
  checkRoleAvailability, 
  createTicketPurchase, 
  getRemainingTickets,
  getRemainingEarlyBirdTickets,
  getRemainingNormalTickets 
} from "@/lib/ticketPurchases";
import { validateAndSanitizeName, validateAndSanitizeEmail, sanitizeString } from "@/lib/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

// Role configuration mapping
const ROLE_CONFIG: Record<string, {
  priceEarly: keyof TicketSettings;
  priceNormal: keyof TicketSettings;
  limit: keyof TicketSettings;
}> = {
  bar: { priceEarly: "bar_price_early", priceNormal: "bar_price_normal", limit: "bar_limit" },
  kuechenhilfe: { priceEarly: "kuechenhilfe_price_early", priceNormal: "kuechenhilfe_price_normal", limit: "kuechenhilfe_limit" },
  springerRunner: { priceEarly: "springer_runner_price_early", priceNormal: "springer_runner_price_normal", limit: "springer_runner_limit" },
  springerToilet: { priceEarly: "springer_toilet_price_early", priceNormal: "springer_toilet_price_normal", limit: "springer_toilet_limit" },
  abbau: { priceEarly: "abbau_price_early", priceNormal: "abbau_price_normal", limit: "abbau_limit" },
  aufbau: { priceEarly: "aufbau_price_early", priceNormal: "aufbau_price_normal", limit: "aufbau_limit" },
  awareness: { priceEarly: "awareness_price_early", priceNormal: "awareness_price_normal", limit: "awareness_limit" },
  schichtleitung: { priceEarly: "schichtleitung_price_early", priceNormal: "schichtleitung_price_normal", limit: "schichtleitung_limit" },
};

interface FormErrors {
  first_name?: string;
  last_name?: string;
  purchaser_email?: string;
}

const TicketCheckout = () => {
  // #region agent log
  console.log('[DEBUG] TicketCheckout component rendering');
  // #endregion
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // #region agent log
  console.log('[DEBUG] About to call useLanguage in TicketCheckout');
  // #endregion
  const { t } = useLanguage();
  // #region agent log
  console.log('[DEBUG] useLanguage succeeded in TicketCheckout', { hasT: typeof t === 'function' });
  // #endregion
  const { toast } = useToast();
  const type = searchParams.get("type");
  const role = searchParams.get("role");
  
  const [ticketSettings, setTicketSettings] = useState<TicketSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [remainingTickets, setRemainingTickets] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    purchaser_email: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({
    first_name: false,
    last_name: false,
    purchaser_email: false,
  });
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [referenceCopied, setReferenceCopied] = useState(false);
  const [checklist, setChecklist] = useState({
    enteredDetails: false,
    generatedReference: false,
    paidViaPayPal: false,
  });

  // PayPal configuration - can be moved to env or ticket settings
  const paypalUrl = import.meta.env.VITE_PAYPAL_PAYMENT_LINK || "https://paypal.me/kollektivspinnen";
  const paypalQrCodeUrl = import.meta.env.VITE_PAYPAL_QR_CODE_URL || "/paypal-qr-code.png";
  const [qrCodeError, setQrCodeError] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      if (!type || !role) {
        toast({
          title: t("error"),
          description: t("missingTicketInformation"),
          variant: "destructive",
        });
        navigate("/soli-beitrag");
        return;
      }
      
      setLoading(true);
      try {
        const settings = await getTicketSettings();
        setTicketSettings(settings);
      
        // Check availability
        const roleConfig = ROLE_CONFIG[role];
        if (settings && roleConfig) {
          // Check early bird total limit if this is an early bird ticket
          const isEarlyBird = type === "earlyBird" || type === "reducedEarlyBird";
          if (isEarlyBird && settings.early_bird_total_limit !== null && settings.early_bird_total_limit !== undefined) {
            const remainingEarlyBird = await getRemainingEarlyBirdTickets(settings.early_bird_total_limit);
            if (remainingEarlyBird !== null && remainingEarlyBird <= 0) {
              toast({
                title: t("soldOut"),
                description: t("soldOutDesc"),
                variant: "destructive",
              });
              navigate("/soli-beitrag");
              return;
            }
          }
          
          // Check normal-bird ticket total limit if this is a normal-bird ticket
          const isNormal = type === "normal" || type === "reducedNormal";
          if (isNormal && settings.normal_total_limit !== null && settings.normal_total_limit !== undefined) {
            const remainingNormal = await getRemainingNormalTickets(settings.normal_total_limit);
            if (remainingNormal !== null && remainingNormal <= 0) {
              toast({
                title: t("soldOut"),
                description: t("soldOutDesc"),
                variant: "destructive",
              });
              navigate("/soli-beitrag");
              return;
            }
          }
          
          // Check role-specific availability
          const limit = settings[roleConfig.limit] as number | null | undefined;
          const isAvailable = await checkRoleAvailability(role, limit);
          
          if (!isAvailable) {
            toast({
              title: t("soldOut"),
              description: t("soldOutDesc"),
              variant: "destructive",
            });
            navigate("/soli-beitrag");
            return;
          }
          
          // Get remaining tickets for display
          const remaining = await getRemainingTickets(role, limit);
          setRemainingTickets(remaining);
        }
      } catch (error: any) {
        console.error('[TicketCheckout] Error loading ticket settings:', error);
        toast({
          title: t("error"),
          description: error?.message || t("failedToLoadTicketSettings"),
          variant: "destructive",
        });
        navigate("/soli-beitrag");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [type, role, navigate, toast, t]);
  
  const getPrice = (): number => {
    if (!ticketSettings || !role) return 0;
    
    const roleConfig = ROLE_CONFIG[role];
    if (!roleConfig) return 0;
    
    const isEarlyBird = type === "earlyBird" || type === "reducedEarlyBird";
    const priceField = isEarlyBird ? roleConfig.priceEarly : roleConfig.priceNormal;
    const price = ticketSettings[priceField] as number | null | undefined;
    
    return price ?? (isEarlyBird ? 100 : 120);
  };

  const generateReferenceCode = (firstName: string, lastName: string, role: string, ticketType: string): string => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${day}${month}${year}`;
    
    // Map ticket type to EB or NM
    const ticketTypeCode = (ticketType === 'earlyBird' || ticketType === 'reducedEarlyBird') ? 'EB' : 'NM';
    
    // Get German translation of role and format for reference code
    const roleGerman = t(role); // e.g., "Bar", "Küchenhilfe", "Springer-Runner"
    const roleFormatted = roleGerman
      .toUpperCase()
      .replace(/\s+/g, '') // Remove all spaces
      .replace(/-/g, '') // Remove all hyphens
      .replace(/[^A-Z0-9]/g, '') // Remove all special characters
      .replace(/Ü/g, 'UE') // Convert Ü to UE
      .replace(/Ä/g, 'AE') // Convert Ä to AE
      .replace(/Ö/g, 'OE'); // Convert Ö to OE
    
    // Remove spaces/hyphens from names and concatenate
    const firstNameFormatted = firstName.toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
    const lastNameFormatted = lastName.toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
    const fullNameFormatted = `${firstNameFormatted}${lastNameFormatted}`;
    
    return `KS26-${fullNameFormatted}-${roleFormatted}-${ticketTypeCode}-${dateStr}`;
  };

  const handleGenerateReference = () => {
    if (!formData.first_name || !formData.last_name || !role || !type) {
      toast({
        title: t("validationError"),
        description: t("pleaseFillNameBeforeGenerating"),
        variant: "destructive",
      });
      return;
    }

    const code = generateReferenceCode(formData.first_name, formData.last_name, role, type);
    setReferenceCode(code);
    setChecklist(prev => ({ ...prev, generatedReference: true }));
    toast({
      title: t("referenceCodeGenerated"),
      description: t("referenceCodeGeneratedSuccessfully"),
    });
  };

  const handleCopyReference = async () => {
    if (!referenceCode) return;
    
    try {
      await navigator.clipboard.writeText(referenceCode);
      setReferenceCopied(true);
      toast({
        title: t("referenceCodeCopied"),
      });
      setTimeout(() => setReferenceCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy reference code:', error);
    }
  };

  const validateField = (field: 'first_name' | 'last_name' | 'purchaser_email', value: string) => {
    if (field === 'first_name' || field === 'last_name') {
      const validation = validateAndSanitizeName(value);
      if (!validation.valid) {
        setFormErrors(prev => ({ ...prev, [field]: validation.error }));
        return false;
      }
      setFormErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    } else if (field === 'purchaser_email') {
      const validation = validateAndSanitizeEmail(value);
      if (!validation.valid) {
        setFormErrors(prev => ({ ...prev, purchaser_email: validation.error }));
        return false;
      }
      setFormErrors(prev => {
        const { purchaser_email, ...rest } = prev;
        return rest;
      });
    }
    return true;
  };

  const handleBlur = (field: 'first_name' | 'last_name' | 'purchaser_email') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleChange = (field: 'first_name' | 'last_name' | 'purchaser_email', value: string) => {
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);
    
    // For email field, validate in real-time once user starts typing
    if (field === 'purchaser_email' && value.length > 0) {
      // Mark as touched when user starts typing
      if (!touched.purchaser_email) {
        setTouched(prev => ({ ...prev, purchaser_email: true }));
      }
      // Validate email in real-time
      validateField(field, value);
    }
    
    // Validate on change if field has been touched
    if (touched[field] && field !== 'purchaser_email') {
      validateField(field, value);
    }

    // Auto-check first checklist item when all required fields are filled and valid
    const firstNameValid = updatedFormData.first_name && !formErrors.first_name;
    const lastNameValid = updatedFormData.last_name && !formErrors.last_name;
    const emailValid = updatedFormData.purchaser_email && !formErrors.purchaser_email;
    
    if (firstNameValid && lastNameValid && emailValid) {
      setChecklist(prev => ({ ...prev, enteredDetails: true }));
    } else {
      setChecklist(prev => ({ ...prev, enteredDetails: false }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!type || !role) {
      toast({
        title: t("error"),
        description: t("missingTicketInformation"),
        variant: "destructive",
      });
      return;
    }
    
    // Check if all checklist items are completed
    const allChecklistItemsCompleted = 
      checklist.enteredDetails && 
      checklist.generatedReference && 
      checklist.paidViaPayPal;
    
    if (!allChecklistItemsCompleted) {
      toast({
        title: t("validationError"),
        description: t("allChecklistItemsRequired"),
        variant: "destructive",
      });
      return;
    }

    // Check if reference code has been generated
    if (!referenceCode) {
      toast({
        title: t("validationError"),
        description: t("pleaseGenerateReferenceBeforeConfirming"),
        variant: "destructive",
      });
      return;
    }
    
    // Mark all fields as touched
    setTouched({ first_name: true, last_name: true, purchaser_email: true });
    
    // Validate all fields
    const firstNameValid = validateField('first_name', formData.first_name);
    const lastNameValid = validateField('last_name', formData.last_name);
    const emailValid = validateField('purchaser_email', formData.purchaser_email);
    
    if (!firstNameValid || !lastNameValid || !emailValid) {
      toast({
        title: t("validationError"),
        description: t("pleaseCheckFormErrors"),
        variant: "destructive",
      });
      return;
    }
    
    // Validate and sanitize names
    const firstNameValidation = validateAndSanitizeName(formData.first_name);
    if (!firstNameValidation.valid) {
      setFormErrors(prev => ({ ...prev, first_name: firstNameValidation.error }));
      return;
    }

    const lastNameValidation = validateAndSanitizeName(formData.last_name);
    if (!lastNameValidation.valid) {
      setFormErrors(prev => ({ ...prev, last_name: lastNameValidation.error }));
      return;
    }
    
    // Validate and sanitize email
    const emailValidation = validateAndSanitizeEmail(formData.purchaser_email);
    if (!emailValidation.valid) {
      setFormErrors(prev => ({ ...prev, purchaser_email: emailValidation.error }));
      return;
    }
    
    setSubmitting(true);
    
    try {
      const price = getPrice();
      const result = await createTicketPurchase({
        contribution_type: type as 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal',
        role,
        price,
        purchaser_name: `${firstNameValidation.sanitized} ${lastNameValidation.sanitized}`.trim(),
        purchaser_email: emailValidation.sanitized,
        payment_reference: referenceCode || undefined,
      }, true); // Enable validation for both universal and role limits
      
      if (result.success && result.purchase) {
        toast({
          title: t("ticketPurchaseCreated"),
          description: t("ticketPurchaseCreatedDesc"),
        });
        
        // In a real app, you would redirect to payment processing here
        // For now, we'll just show a success message
        setTimeout(() => {
          navigate("/soli-beitrag");
        }, 2000);
      } else {
        toast({
          title: t("error"),
          description: result.error || t("failedToProcessPurchase"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('[TicketCheckout] Error submitting form:', error);
      toast({
        title: t("error"),
        description: error?.message || t("failedToProcessPurchase"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
                {t("paymentProcess")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Ticket Summary */}
                <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                  <h3 className="font-semibold mb-3">{t("ticketSummary")}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("ticketType")}:</span>
                      <span className="font-medium">
                        {type === "earlyBird" ? t("earlyBird") :
                         type === "normal" ? t("normal") :
                         type === "reducedEarlyBird" ? `${t("reducedTickets")} - ${t("earlyBird")}` :
                         `${t("reducedTickets")} - ${t("normal")}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("selectedRole")}:</span>
                      <span className="font-medium">{role ? t(role) || role : t("nA")}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border/30">
                      <span className="text-muted-foreground">{t("price")}:</span>
                      <span className="font-bold text-lg">{getPrice().toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
                
                {/* Checklist */}
                <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                  <h3 className="font-semibold mb-3">{t("checklist")}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="checklist-1"
                        checked={checklist.enteredDetails}
                        onCheckedChange={(checked) => 
                          setChecklist(prev => ({ ...prev, enteredDetails: checked === true }))
                        }
                        className="h-5 w-5"
                      />
                      <label
                        htmlFor="checklist-1"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {t("checklistItem1")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="checklist-2"
                        checked={checklist.generatedReference}
                        onCheckedChange={(checked) => 
                          setChecklist(prev => ({ ...prev, generatedReference: checked === true }))
                        }
                        className="h-5 w-5"
                      />
                      <label
                        htmlFor="checklist-2"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {t("checklistItem2")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="checklist-3"
                        checked={checklist.paidViaPayPal}
                        onCheckedChange={(checked) => 
                          setChecklist(prev => ({ ...prev, paidViaPayPal: checked === true }))
                        }
                        className="h-5 w-5"
                      />
                      <label
                        htmlFor="checklist-3"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {t("checklistItem3")}
                      </label>
                    </div>
                  </div>
                  <p className="text-sm text-red-500 mt-4 pt-4 border-2 border-destructive/50 dark:border-destructive rounded-lg p-4">
                    {t("pleaseFollowChecklist")}
                  </p>
                </div>
                
                {/* Purchaser Information */}
                <div className="p-4 bg-background/50 rounded-lg border border-border/30 space-y-4">
                  <h3 className="font-semibold">{t("purchaserInformation")}</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="first_name">
                      {t("firstName")} *
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      onBlur={() => handleBlur('first_name')}
                      required
                      aria-invalid={touched.first_name && !!formErrors.first_name}
                      aria-describedby={touched.first_name && formErrors.first_name ? "first_name-error" : undefined}
                      placeholder={t("firstName")}
                      className={touched.first_name && formErrors.first_name ? "border-destructive" : ""}
                    />
                    {touched.first_name && formErrors.first_name && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription id="first_name-error" className="text-sm">
                          {formErrors.first_name}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name">
                      {t("lastName")} *
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      onBlur={() => handleBlur('last_name')}
                      required
                      aria-invalid={touched.last_name && !!formErrors.last_name}
                      aria-describedby={touched.last_name && formErrors.last_name ? "last_name-error" : undefined}
                      placeholder={t("lastName")}
                      className={touched.last_name && formErrors.last_name ? "border-destructive" : ""}
                    />
                    {touched.last_name && formErrors.last_name && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription id="last_name-error" className="text-sm">
                          {formErrors.last_name}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purchaser_email">
                      {t("email")} *
                    </Label>
                    <Input
                      id="purchaser_email"
                      type="email"
                      value={formData.purchaser_email}
                      onChange={(e) => handleChange('purchaser_email', e.target.value)}
                      onBlur={() => handleBlur('purchaser_email')}
                      required
                      aria-invalid={touched.purchaser_email && !!formErrors.purchaser_email}
                      aria-describedby={touched.purchaser_email && formErrors.purchaser_email ? "purchaser_email-error" : "purchaser_email-hint"}
                      placeholder={t("enterEmail")}
                      className={touched.purchaser_email && formErrors.purchaser_email ? "border-destructive" : touched.purchaser_email && formData.purchaser_email && !formErrors.purchaser_email ? "border-green-500" : ""}
                    />
                    {touched.purchaser_email && formErrors.purchaser_email && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription id="purchaser_email-error" className="text-sm">
                          {formErrors.purchaser_email}
                        </AlertDescription>
                      </Alert>
                    )}
                    {touched.purchaser_email && formData.purchaser_email && !formErrors.purchaser_email && (
                      <p id="purchaser_email-hint" className="text-xs text-green-600 dark:text-green-400">
                        {t("validEmailFormat")}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleGenerateReference}
                    disabled={!formData.first_name || !formData.last_name || !formData.purchaser_email}
                    className="w-full"
                  >
                    {t("generateReference")}
                  </Button>
                </div>

                {/* Reference Code Display */}
                {referenceCode && (
                  <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                    <h3 className="font-semibold mb-2">{t("referenceCodeGenerated")}</h3>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background rounded text-sm font-mono break-all">
                        {referenceCode}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyReference}
                        className="flex-shrink-0"
                      >
                        {referenceCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {t("referenceCodeCopied")}
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            {t("copyReferenceCode")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* PayPal Payment Section */}
                <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    {t("payWithPayPal")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("paypalPaymentInstructions").replace("{amount}", getPrice().toFixed(2))}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    {/* QR Code */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div className="w-48 h-48 bg-white rounded-lg border-2 border-border p-4 flex items-center justify-center">
                        {qrCodeError ? (
                          <div className="text-muted-foreground text-sm text-center p-4">
                            <QrCode className="h-12 w-12 mx-auto mb-2" />
                            <p>{t("qrCodeImage")}</p>
                            <p className="text-xs mt-1">{t("placeQRCodeInPublicFolder")}</p>
                          </div>
                        ) : (
                          <img 
                            src={paypalQrCodeUrl} 
                            alt={t("paypalQRCode")}
                            className="w-full h-full object-contain"
                            onError={() => setQrCodeError(true)}
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground text-center max-w-[192px]">
                        {t("scanQRCode")}
                      </p>
                    </div>
                    
                    {/* PayPal Link */}
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{t("paypalLink")}</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.open(paypalUrl, '_blank', 'noopener,noreferrer')}
                        className="w-full sm:w-auto justify-start gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {paypalUrl}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {t("orClickLink")}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Important Warning */}
                <Alert variant="destructive" className="border-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm font-semibold">
                    {t("onlyClickAfterPayment")}
                  </AlertDescription>
                </Alert>
                
                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/tickets")}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !checklist.enteredDetails || !checklist.generatedReference || !checklist.paidViaPayPal || !referenceCode}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("processing")}
                      </>
                    ) : (
                      t("paymentConfirmed")
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
