import { Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  const { t } = useLanguage();
  
  return (
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
      {/* Grid view temporarily disabled */}
    </div>
  );
};