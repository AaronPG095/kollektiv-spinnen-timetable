import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowUp, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Footer = () => {
  const { t } = useLanguage();

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sitemapItems = [
    { path: "/", label: t("timetable") },
    { path: "/faq", label: t("faq") },
    { path: "/tickets", label: t("tickets") },
  ];

  return (
    <footer className="border-t border-border bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col items-center gap-4 md:gap-6">
          {/* Additional Navigation - Centered */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Sitemap Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm md:text-base font-medium text-muted-foreground hover:text-festival-light min-h-[44px]"
                >
                  <Map className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">{t("sitemap")}</span>
                  <span className="md:hidden">{t("sitemapShort")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sitemapItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link
                      to={item.path}
                      className="cursor-pointer"
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Back to Top Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToTop}
              className="text-sm md:text-base font-medium text-muted-foreground hover:text-festival-light min-h-[44px]"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">{t("backToTop")}</span>
              <span className="md:hidden">{t("backToTopShort")}</span>
            </Button>
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground text-center">
            © KollektivSpinnenFestival 2025
          </div>
        </div>
      </div>
    </footer>
  );
};

