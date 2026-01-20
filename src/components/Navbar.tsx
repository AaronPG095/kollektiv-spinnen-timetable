import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    // { path: "/about", label: "About Us" }, // temporarily hidden
    { path: "/faq", label: t("faq") },
    { path: "/", label: t("timetable") },
    { path: "/soli-beitrag", label: t("tickets") },
  ];

  return (
    <nav className="flex items-center gap-4 md:gap-6">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "text-sm md:text-base font-medium transition-smooth",
              "hover:text-festival-light",
              isActive
                ? "text-festival-light border-b-2 border-festival-light pb-1"
                : "text-muted-foreground hover:border-b-2 hover:border-festival-light/50 hover:pb-1"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
