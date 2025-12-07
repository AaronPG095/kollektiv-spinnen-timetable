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
import { Footer } from "@/components/Footer";
import { X } from "lucide-react";

const Tickets = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [earlyBirdRole, setEarlyBirdRole] = useState<string>("");
  const [normalRole, setNormalRole] = useState<string>("");
  const [earlyBirdReducedRole, setEarlyBirdReducedRole] = useState<string>("");
  const [normalReducedRole, setNormalReducedRole] = useState<string>("");

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

  // Roles to display in the main list (excluding those requiring experience)
  const reducedRolesMainList = [
    { value: "abbau", label: t("abbau") },
    { value: "aufbau", label: t("aufbau") },
    { value: "techHelfer", label: t("techHelfer") },
  ];

  // Roles requiring experience / organiser consent
  const reducedRolesRequiringExperience = [
    { value: "awareness", label: t("awareness") },
    { value: "schichtleitung", label: t("schichtleitung") },
  ];

  const handleChooseTicket = (type: string, role: string) => {
    if (!role) {
      // Could show a toast here
      return;
    }
    navigate(`/tickets/checkout?type=${type}&role=${role}`);
  };

  // Check if any dropdown has a selection
  const hasAnySelection = () => {
    return !!(earlyBirdRole || normalRole || earlyBirdReducedRole || normalReducedRole);
  };

  // Check if a specific dropdown should be disabled
  const isDisabled = (currentValue: string) => {
    return hasAnySelection() && !currentValue;
  };

  const handleRoleChange = (
    setter: (value: string) => void, 
    value: string,
    clearOthers: () => void
  ) => {
    if (value === "__clear__") {
      setter("");
    } else {
      // Clear all other selections before setting the new one
      clearOthers();
      setter(value);
    }
  };

  const handleClearSelection = (setter: (value: string) => void) => {
    setter("");
  };

  // Functions to clear all other dropdowns
  const clearAllExceptEarlyBird = () => {
    setNormalRole("");
    setEarlyBirdReducedRole("");
    setNormalReducedRole("");
  };

  const clearAllExceptNormal = () => {
    setEarlyBirdRole("");
    setEarlyBirdReducedRole("");
    setNormalReducedRole("");
  };

  const clearAllExceptEarlyBirdReduced = () => {
    setEarlyBirdRole("");
    setNormalRole("");
    setNormalReducedRole("");
  };

  const clearAllExceptNormalReduced = () => {
    setEarlyBirdRole("");
    setNormalRole("");
    setEarlyBirdReducedRole("");
  };

  return (
    <div className="min-h-screen bg-background">
      <FestivalHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Festival Banner */}
          <div className="text-center py-4 md:py-6 px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Kollektiv Spinnen Festival II
            </h1>
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
              07.08.2026 - 09.08.2026
            </p>
          </div>

          {/* Ticket Types Explanation */}
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t("ticketTypesExplanation")}
              </CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                {t("ticketTypesExplanationDesc")}
              </CardDescription>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                {t("ticketTypesNote")}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Standard Ticket Type */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("standardTicketType")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("standardTicketTypeDesc")}
                </p>
              </div>

              {/* Reduced Ticket Type */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("reducedTicketType")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("reducedTicketTypeDesc")}
                </p>
              </div>

              {/* Early Bird / Normal */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("earlyBirdNormalTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("earlyBirdNormalDesc")}
                </p>
              </div>

              {/* What is included */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("whatIsIncludedTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("whatIsIncludedDesc")}
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>{t("ticketIncludesAccess")}</li>
                  <li>{t("ticketIncludesSleeping")}</li>
                  <li>{t("ticketIncludesDrinks")}</li>
                  <li>{t("ticketIncludesMeals")}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Standard Tickets Section */}
          <Card className="bg-card/30 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {t("standardTickets")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role Descriptions */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("roleDescriptions")}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("roleDescriptionsDesc") || "Detailed role descriptions will be available here."}
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  {standardRoles.map((role) => (
                    <li key={role.value}>{role.label}</li>
                  ))}
                </ul>
              </div>

              {/* Early Bird */}
              <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground">
                  {t("earlyBird")}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Select 
                      key={`earlyBird-${earlyBirdRole || 'empty'}`}
                      {...(earlyBirdRole ? { value: earlyBirdRole } : {})}
                      onValueChange={(value) => handleRoleChange(setEarlyBirdRole, value, clearAllExceptEarlyBird)}
                      disabled={isDisabled(earlyBirdRole)}
                    >
                      <SelectTrigger className="flex-1 pr-8" disabled={isDisabled(earlyBirdRole)}>
                        <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {standardRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                        {earlyBirdRole && (
                          <SelectItem value="__clear__" className="text-muted-foreground">
                            {t("clearSelection")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {earlyBirdRole && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleClearSelection(setEarlyBirdRole);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-festival-light/20 rounded-full z-10"
                        title={t("clearSelection")}
                      >
                        <X className="h-5 w-5 text-festival-light hover:text-festival-medium" />
                      </Button>
                    )}
                  </div>
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
                  <div className="flex-1 relative">
                    <Select 
                      key={`normal-${normalRole || 'empty'}`}
                      {...(normalRole ? { value: normalRole } : {})}
                      onValueChange={(value) => handleRoleChange(setNormalRole, value, clearAllExceptNormal)}
                      disabled={isDisabled(normalRole)}
                    >
                      <SelectTrigger className="flex-1 pr-8" disabled={isDisabled(normalRole)}>
                        <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {standardRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                        {normalRole && (
                          <SelectItem value="__clear__" className="text-muted-foreground">
                            {t("clearSelection")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {normalRole && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleClearSelection(setNormalRole);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-festival-light/20 rounded-full z-10"
                        title={t("clearSelection")}
                      >
                        <X className="h-5 w-5 text-festival-light hover:text-festival-medium" />
                      </Button>
                    )}
                  </div>
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
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role Descriptions */}
              <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("roleDescriptions")}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("roleDescriptionsDesc") || "Detailed role descriptions will be available here."}
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                  {reducedRolesMainList.map((role) => (
                    <li key={role.value}>{role.label}</li>
                  ))}
                </ul>
                
                {/* Only with experience / organiser consent */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    {t("onlyWithExperience")}
                  </h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {reducedRolesRequiringExperience.map((role) => (
                      <li key={role.value}>{role.label}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Early Bird */}
              <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border/30">
                <h3 className="text-lg font-semibold text-foreground">
                  {t("earlyBird")}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Select 
                      key={`earlyBirdReduced-${earlyBirdReducedRole || 'empty'}`}
                      {...(earlyBirdReducedRole ? { value: earlyBirdReducedRole } : {})}
                      onValueChange={(value) => handleRoleChange(setEarlyBirdReducedRole, value, clearAllExceptEarlyBirdReduced)}
                      disabled={isDisabled(earlyBirdReducedRole)}
                    >
                      <SelectTrigger className="flex-1 pr-8" disabled={isDisabled(earlyBirdReducedRole)}>
                        <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {reducedRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                        {earlyBirdReducedRole && (
                          <SelectItem value="__clear__" className="text-muted-foreground">
                            {t("clearSelection")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {earlyBirdReducedRole && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleClearSelection(setEarlyBirdReducedRole);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-festival-light/20 rounded-full z-10"
                        title={t("clearSelection")}
                      >
                        <X className="h-5 w-5 text-festival-light hover:text-festival-medium" />
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => handleChooseTicket("reducedEarlyBird", earlyBirdReducedRole)}
                    disabled={!earlyBirdReducedRole}
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
                  <div className="flex-1 relative">
                    <Select 
                      key={`normalReduced-${normalReducedRole || 'empty'}`}
                      {...(normalReducedRole ? { value: normalReducedRole } : {})}
                      onValueChange={(value) => handleRoleChange(setNormalReducedRole, value, clearAllExceptNormalReduced)}
                      disabled={isDisabled(normalReducedRole)}
                    >
                      <SelectTrigger className="flex-1 pr-8" disabled={isDisabled(normalReducedRole)}>
                        <SelectValue placeholder={t("selectRole") || "Select a role..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {reducedRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                        {normalReducedRole && (
                          <SelectItem value="__clear__" className="text-muted-foreground">
                            {t("clearSelection")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {normalReducedRole && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleClearSelection(setNormalReducedRole);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-festival-light/20 rounded-full z-10"
                        title={t("clearSelection")}
                      >
                        <X className="h-5 w-5 text-festival-light hover:text-festival-medium" />
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => handleChooseTicket("reducedNormal", normalReducedRole)}
                    disabled={!normalReducedRole}
                    className="w-full sm:w-auto"
                  >
                    {t("chooseThisTicket")}
                  </Button>
                </div>
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

      <Footer />
    </div>
  );
};

export default Tickets;

