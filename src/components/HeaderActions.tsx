import { Grid, List, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface HeaderActionsProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export const HeaderActions = ({ view, onViewChange }: HeaderActionsProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-2">
      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-card/50 rounded-lg p-1 border border-border/30">
        <Button
          variant={view === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("list")}
          className="gap-2"
        >
          <List className="h-4 w-4" />
          {t('listView')}
        </Button>
        <Button
          variant={view === "grid" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("grid")}
          className="gap-2"
        >
          <Grid className="h-4 w-4" />
          {t('gridView')}
        </Button>
      </div>
      
      {/* FAQ Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/faq')}
        className="gap-2 bg-card/50 border-border/30"
      >
        <HelpCircle className="h-4 w-4" />
        {t('faq')}
      </Button>
    </div>
  );
};