import { Search, Filter, Calendar, MapPin, Music2, Languages, LogIn, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
}

export const FestivalHeader = ({
  searchQuery,
  onSearchChange,
  selectedDay,
  onDayChange,
  selectedVenues,
  onVenueToggle,
  selectedEventTypes,
  onEventTypeToggle
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
  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Kollektiv Spinnen
            </h1>
            <h2 className="text-lg md:text-2xl text-muted-foreground">
              Timetable
            </h2>
          </div>

          {/* Top Controls: Search + Filters + Language/Auth */}
          <div className="flex flex-col gap-4">
            {/* Search and Controls Row */}
            <div className="flex items-center justify-center gap-3">
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
                            <Badge
                              key={venue.id}
                              variant={selectedVenues.includes(venue.id) ? "default" : "outline"}
                              className={`cursor-pointer text-xs ${
                                selectedVenues.includes(venue.id) 
                                  ? `bg-${venue.color} hover:bg-${venue.color}/80 text-white border-${venue.color}` 
                                  : "hover:bg-accent"
                              }`}
                              onClick={() => onVenueToggle(venue.id)}
                            >
                              {venue.label}
                            </Badge>
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
                            <Badge
                              key={eventType.id}
                              variant={selectedEventTypes.includes(eventType.id) ? "default" : "outline"}
                              className={`cursor-pointer text-xs ${
                                selectedEventTypes.includes(eventType.id) 
                                  ? `bg-${eventType.color} hover:bg-${eventType.color}/80 text-white border-${eventType.color}` 
                                  : "hover:bg-accent"
                              }`}
                              onClick={() => onEventTypeToggle(eventType.id)}
                            >
                              {eventType.label}
                            </Badge>
                          ))}
                        </div>
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
                {/* Day Filter */}
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
                      <Badge
                        key={venue.id}
                        variant={selectedVenues.includes(venue.id) ? "default" : "outline"}
                        className={`cursor-pointer transition-smooth ${
                          selectedVenues.includes(venue.id) 
                            ? `bg-${venue.color} hover:bg-${venue.color}/80 text-white border-${venue.color} shadow-md ring-2 ring-${venue.color}/20` 
                            : "hover:bg-accent hover:scale-105"
                        }`}
                        onClick={() => onVenueToggle(venue.id)}
                      >
                        {venue.label}
                      </Badge>
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
                      <Badge
                        key={eventType.id}
                        variant={selectedEventTypes.includes(eventType.id) ? "default" : "outline"}
                        className={`cursor-pointer transition-smooth ${
                          selectedEventTypes.includes(eventType.id) 
                            ? `bg-${eventType.color} hover:bg-${eventType.color}/80 text-white border-${eventType.color} shadow-md ring-2 ring-${eventType.color}/20` 
                            : "hover:bg-accent hover:scale-105"
                        }`}
                        onClick={() => onEventTypeToggle(eventType.id)}
                      >
                        {eventType.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};