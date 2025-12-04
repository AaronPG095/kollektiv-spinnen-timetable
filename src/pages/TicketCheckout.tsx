import { useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { FestivalHeader } from "@/components/FestivalHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TicketCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const type = searchParams.get("type");
  const role = searchParams.get("role");

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
                Checkout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Ticket type: {type || "N/A"}
              </p>
              <p className="text-muted-foreground">
                Selected role: {role ? t(role) : "N/A"}
              </p>
              <p className="text-muted-foreground mt-4">
                This is a placeholder checkout page. The full checkout functionality will be implemented here.
              </p>
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

