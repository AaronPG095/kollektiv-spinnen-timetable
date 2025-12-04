import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { FestivalHeader } from "@/components/FestivalHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Tickets = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [earlyBirdRole, setEarlyBirdRole] = useState<string>("");
  const [normalRole, setNormalRole] = useState<string>("");
  const [reducedRole, setReducedRole] = useState<string>("");

  const standardRoles = [
    { value: "bar", label: t("bar") },
    { value: "kuechenhilfe", label: t("kuechenhilfe") },
    { value: "springerRunner", label: t("springerRunner") },
    { value: "springerToilet", label: t("springerToilet") },
  ];

  const reducedRoles = [
    { value: "abbau", label: t("abbau") },
    { value: "aufbau", label: t("aufbau") },
    { value: "awareness", label: t("awareness") },
    { value: "schichtleitung", label: t("schichtleitung") },
    { value: "techHelfer", label: t("techHelfer") },
  ];

  const handleChooseTicket = (type: string, role: string) => {
    if (!role) {
      // Could show a toast here
      return;
    }
    navigate(`/tickets/checkout?type=${type}&role=${role}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <FestivalHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Standard Tickets Section */}
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t("standardTickets")}
              </CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                {t("standardTicketsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Early Bird */}
              <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground">
                  {t("earlyBird")}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={earlyBirdRole} onValueChange={setEarlyBirdRole}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {standardRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleChooseTicket("earlyBird", earlyBirdRole)}
                    disabled={!earlyBirdRole}
                    className="w-full sm:w-auto"
                  >
                    {t("chooseThisTicket")}
                  </Button>
                </div>
              </div>

              {/* Normal */}
              <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground">
                  {t("normal")}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={normalRole} onValueChange={setNormalRole}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {standardRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleChooseTicket("normal", normalRole)}
                    disabled={!normalRole}
                    className="w-full sm:w-auto"
                  >
                    {t("chooseThisTicket")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reduced Tickets Section */}
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t("reducedTickets")}
              </CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                {t("reducedTicketsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border/30">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={reducedRole} onValueChange={setReducedRole}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {reducedRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleChooseTicket("reduced", reducedRole)}
                    disabled={!reducedRole}
                    className="w-full sm:w-auto"
                  >
                    {t("chooseThisTicket")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Descriptions Section */}
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t("roleDescriptions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p className="text-sm">
                  {t("roleDescriptionsDesc") || "Detailed role descriptions will be available here."}
                </p>
              </div>
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

export default Tickets;

