import { Search, Filter, Calendar, MapPin, Music2, Languages, LogIn, Settings, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HeaderActions } from "@/components/HeaderActions";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface FestivalHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDay: string;
  onDayChange: (day: string) => void;
  selectedVenues: string[];
  onVenueToggle: (venue: string) => void;
  selectedEventTypes: string[];
  onEventTypeToggle: (eventType: string) => void;
  view?: "grid" | "list";
  onViewChange?: (view: "grid" | "list") => void;
}

export const FestivalHeader = ({
  searchQuery,
  onSearchChange,
  selectedDay,
  onDayChange,
  selectedVenues,
  onVenueToggle,
  selectedEventTypes,
  onEventTypeToggle,
  view,
  onViewChange
}: FestivalHeaderProps) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const days = [
    { key: "Alle", label: t('allDays') },
    { key: "Freitag", label: t('friday') },
    { key: "Samstag", label: t('saturday') },
    { key: "Sonntag", label: t('sunday') }
  ];

  const venues = [
    { id: "draussen", label: t('draussen'), color: "venue-draussen" },
    { id: "oben", label: t('oben'), color: "venue-oben" },
    { id: "unten", label: t('unten'), color: "venue-unten" }
  ];

  const eventTypes = [
    { id: "performance", label: t('performance'), color: "type-performance" },
    { id: "dj", label: t('dj'), color: "type-dj" },
    { id: "live", label: t('live'), color: "type-live" },
    { id: "interaktiv", label: t('interaktiv'), color: "type-interaktiv" }
  ];

  const clearAllFilters = () => {
    onDayChange("Alle");
    // Clear all venue selections
    selectedVenues.forEach(venue => onVenueToggle(venue));
    // Clear all event type selections  
    selectedEventTypes.forEach(eventType => onEventTypeToggle(eventType));
  };
  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Kollektiv Spinnen
            </h1>
          </div>

            {/* Top Controls: Search + Filters + Language/Auth */}
            <div className="flex flex-col gap-4">
              {/* Search and Controls Row */}
              <div className="flex items-center justify-center gap-3">
                {/* Header Actions - Desktop only, positioned left */}
                {view && onViewChange && (
                  <div className="hidden md:block">
                    <HeaderActions view={view} onViewChange={onViewChange} />
                  </div>
                )}
              
              {/* Search */}
              <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
              </div>

              {/* Mobile Filter Button */}
              <div className="block md:hidden">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="min-h-[44px]">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      
                      {/* Day Filter in Mobile */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{t('days')}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {days.map((day) => (
                            <Button
                              key={day.key}
                              variant={selectedDay === day.key ? "default" : "outline"}
                              size="sm"
                              onClick={() => onDayChange(day.key)}
                              className="text-xs"
                            >
                              {day.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Venue Filter in Mobile */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{t('venues')}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {venues.map((venue) => (
                            <Button
                              key={venue.id}
                              variant={selectedVenues.includes(venue.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => onVenueToggle(venue.id)}
                              className="text-xs transition-smooth"
                            >
                              {venue.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Event Type Filter in Mobile */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Music2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{t('events')}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {eventTypes.map((eventType) => (
                            <Button
                              key={eventType.id}
                              variant={selectedEventTypes.includes(eventType.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => onEventTypeToggle(eventType.id)}
                              className="text-xs transition-smooth"
                            >
                              {eventType.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Clear Filters Button in Mobile */}
                      <div className="pt-2 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="w-full text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t('clearFilters')}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Language/Auth Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
                  className="min-h-[44px] px-2 md:px-3"
                >
                  <Languages className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">{language.toUpperCase()}</span>
                </Button>
                
                {user ? (
                  <>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin')}
                        className="min-h-[44px] px-2 md:px-3"
                      >
                        <Settings className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Admin</span>
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/auth')}
                    className="min-h-[44px] px-2 md:px-3"
                  >
                    <LogIn className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Login</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-center">
                {/* Day Filter and Clear Filters */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 min-w-fit">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">{t('days')}</span>
                    </div>
                    <div className="flex gap-1">
                      {days.map((day) => (
                        <Button
                          key={day.key}
                          variant={selectedDay === day.key ? "default" : "outline"}
                          size="sm"
                          onClick={() => onDayChange(day.key)}
                          className="transition-smooth"
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Clear Filters Button inline with Days */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('clearFilters')}
                  </Button>
                </div>
              </div>

              {/* Venue and Event Type Filters */}
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-center">
                {/* Venue Filter */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-fit">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t('venues')}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {venues.map((venue) => (
                      <Button
                        key={venue.id}
                        variant={selectedVenues.includes(venue.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => onVenueToggle(venue.id)}
                        className="transition-smooth"
                      >
                        {venue.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Event Type Filter */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-fit">
                    <Music2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t('events')}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {eventTypes.map((eventType) => (
                      <Button
                        key={eventType.id}
                        variant={selectedEventTypes.includes(eventType.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => onEventTypeToggle(eventType.id)}
                        className="transition-smooth"
                      >
                        {eventType.label}
                      </Button>
                    ))}
                  </div>
              </div>
            </div>

            </div>
            
            {/* Mobile Header Actions - centered below toolbar */}
            {view && onViewChange && (
              <div className="block md:hidden flex justify-center">
                <HeaderActions view={view} onViewChange={onViewChange} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};