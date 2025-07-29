import { Search, Filter, Calendar, MapPin, Music2, Languages } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewToggle } from "./ViewToggle";
import { useLanguage } from "@/contexts/LanguageContext";

interface FestivalHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDay: string;
  onDayChange: (day: string) => void;
  selectedVenues: string[];
  onVenueToggle: (venue: string) => void;
  selectedEventTypes: string[];
  onEventTypeToggle: (eventType: string) => void;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
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
    { id: "workshop", label: t('workshop'), color: "type-workshop" },
    { id: "performance", label: t('performance'), color: "type-performance" },
    { id: "dj", label: t('dj'), color: "type-dj" },
    { id: "live", label: t('live'), color: "type-live" },
    { id: "interaktiv", label: t('interaktiv'), color: "type-interaktiv" }
  ];
  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Header with Language Toggle */}
          <div className="text-center relative">
            <div className="absolute top-0 right-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
                className="flex items-center gap-2"
              >
                <Languages className="h-4 w-4" />
                {language.toUpperCase()}
              </Button>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Kollektiv Spinnen
            </h1>
            <h2 className="text-xl md:text-2xl text-muted-foreground">
              Timetable
            </h2>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {/* Filters and View Toggle */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Day Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-2">
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

              {/* Venue Filter */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-2">
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
              <div className="flex items-center gap-2">
                <Music2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-2 flex-wrap">
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

            {/* View Toggle */}
            <ViewToggle view={view} onViewChange={onViewChange} />
          </div>
        </div>
      </div>
    </div>
  );
};