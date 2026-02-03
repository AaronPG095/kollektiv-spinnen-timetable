import { useState, useMemo, useEffect } from "react";
import { FestivalHeader } from "@/components/FestivalHeader";
import { ChronologicalTimetable } from "@/components/ChronologicalTimetable";
import FestivalGrid from "@/components/FestivalGrid";
import { HeaderActions } from "@/components/HeaderActions";
import { useEvents } from "@/hooks/useEvents";
import { Event } from "@/components/EventCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, Calendar, MapPin, Instagram, Youtube, ExternalLink, Music, Headphones, Filter, Music2, X, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/Footer";
import { useDebounce } from "@/hooks/useDebounce";
import { getCurrentYear, getAvailableYears } from "@/lib/yearEvents";

const Index = () => {
  const { t, language } = useLanguage();
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const { events } = useEvents(selectedYear);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedDay, setSelectedDay] = useState("Alle");
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [view, setView] = useState<"grid" | "list">("list");

  // Load available years on mount
  useEffect(() => {
    getAvailableYears().then(years => {
      setAvailableYears(years);
      // If current year is not in available years, use the first available year
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
      }
    });
  }, []);

  const handleVenueToggle = (venue: string) => {
    setSelectedVenues(prev => 
      prev.includes(venue) 
        ? prev.filter(v => v !== venue)
        : [...prev, venue]
    );
  };

  const handleEventTypeToggle = (eventType: string) => {
    setSelectedEventTypes(prev => 
      prev.includes(eventType) 
        ? prev.filter(t => t !== eventType)
        : [...prev, eventType]
    );
  };

  const venueConfig = {
    draussen: { label: t('draussen'), color: "venue-draussen" },
    oben: { label: t('oben'), color: "venue-oben" },
    unten: { label: t('unten'), color: "venue-unten" }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'dj':
        return 'rgba(233,30,99,0.9)'; // Hot pink
      case 'live':
        return 'rgba(156,39,176,0.9)'; // Purple
      case 'performance':
        return 'rgba(103,58,183,0.9)'; // Deep purple
      case 'workshop':
        return 'rgba(33,150,243,0.9)'; // Light blue
      case 'interaktiv':
        return 'rgba(0,188,212,0.9)'; // Cyan
      default:
        return 'rgba(103,58,183,0.9)';
    }
  };

  // Filter events for both views - memoized with optimized filter order (most selective first)
  const filteredEvents = useMemo(() => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    return events.filter((event) => {
      // Most selective filters first for better performance
      if (selectedDay !== "Alle" && event.day !== selectedDay) return false;
      if (selectedVenues.length > 0 && !selectedVenues.includes(event.venue)) return false;
      if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(event.type)) return false;
      if (searchLower && !event.title.toLowerCase().includes(searchLower) &&
          !(event.description && event.description.toLowerCase().includes(searchLower))) return false;
      
      return true;
    });
  }, [events, debouncedSearchQuery, selectedDay, selectedVenues, selectedEventTypes]);

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
    setSelectedDay("Alle");
    setSelectedVenues([]);
    setSelectedEventTypes([]);
    // Year filter is not cleared - it stays on current selection
  };

  return (
    <div className="min-h-screen bg-background">
      <FestivalHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar and View Toggle */}
        <div className="mb-6 flex items-center justify-center gap-4 flex-wrap">
          <HeaderActions view={view} onViewChange={setView} />
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8 space-y-4">

          {/* Desktop Filters */}
          <div className="hidden md:flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-center">
              {/* Year Filter */}
              {availableYears.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-fit">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t('year')}</span>
                  </div>
                  <div className="flex gap-1">
                    {availableYears.map((year) => (
                      <Button
                        key={year}
                        variant={selectedYear === year ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedYear(year)}
                        className="transition-smooth"
                      >
                        {year === getCurrentYear() ? t('thisYear') : year.toString()}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
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
                        onClick={() => setSelectedDay(day.key)}
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
                      onClick={() => handleVenueToggle(venue.id)}
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
                      onClick={() => handleEventTypeToggle(eventType.id)}
                      className="transition-smooth"
                    >
                      {eventType.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
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
                  
                  {/* Year Filter in Mobile */}
                  {availableYears.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{t('year')}</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {availableYears.map((year) => (
                          <Button
                            key={year}
                            variant={selectedYear === year ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedYear(year)}
                            className="text-xs"
                          >
                            {year === getCurrentYear() ? t('thisYear') : year.toString()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
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
                          onClick={() => setSelectedDay(day.key)}
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
                          onClick={() => handleVenueToggle(venue.id)}
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
                          onClick={() => handleEventTypeToggle(eventType.id)}
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
        </div>
        {view === "list" ? (
          <ChronologicalTimetable
            events={events}
            selectedDay={selectedDay}
            selectedVenues={selectedVenues}
            selectedEventTypes={selectedEventTypes}
            searchQuery={searchQuery}
            onEventClick={setSelectedEvent}
          />
        ) : (
          <FestivalGrid
            events={filteredEvents}
            onEventClick={setSelectedEvent}
          />
        )}
      </main>

      {/* Event Detail Modal for Grid View */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="bg-card border-border">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedEvent.time}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t(selectedEvent.day.toLowerCase())}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`flex items-center gap-1 bg-${venueConfig[selectedEvent.venue].color}/10 border-${venueConfig[selectedEvent.venue].color}/20`}
                  >
                    <MapPin className="h-3 w-3" />
                    {venueConfig[selectedEvent.venue].label}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-1 border"
                    style={{
                      backgroundColor: getEventTypeColor(selectedEvent.type).replace('0.9', '0.1'),
                      borderColor: getEventTypeColor(selectedEvent.type).replace('0.9', '0.2'),
                      color: getEventTypeColor(selectedEvent.type)
                    }}
                  >
                    {t(selectedEvent.type)}
                  </Badge>
                </div>
                {selectedEvent.description && (
                  <p className="text-muted-foreground leading-relaxed">
                     {(() => {
                       const desc = selectedEvent.description;
                       
                       // Try to parse as JSON first (format: {"en": "text", "de": "text"})
                       try {
                         const parsed = JSON.parse(desc);
                         if (typeof parsed === 'object' && parsed !== null && (parsed.en || parsed.de)) {
                           // Return the current language version, fallback to other language or original
                           return parsed[language] || parsed.de || parsed.en || desc;
                         }
                       } catch {
                         // Not valid JSON, continue with other checks
                       }
                       
                       // Check if it's a translation key (ends with 'Desc' or exists in translations)
                       const translated = t(desc);
                       if (translated !== desc) {
                         return translated;
                       }
                       
                       // Return as plain text
                       return desc;
                     })()}
                  </p>
                )}
                
                {/* Dynamic Links */}
                {selectedEvent.links && Object.keys(selectedEvent.links).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">{t('links')}:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedEvent.links).map(([platform, url]) => {
                        // Icon mapping for known platforms (case-insensitive)
                        const getIcon = (platformName: string) => {
                          const normalizedPlatform = platformName.toLowerCase();
                          
                          switch (normalizedPlatform) {
                            case 'instagram':
                              return Instagram;
                            case 'youtube':
                              return Youtube;
                            case 'spotify':
                              return Music;
                            case 'soundcloud':
                              return Headphones;
                            case 'bandcamp':
                              return Music;
                            default:
                              return ExternalLink;
                          }
                        };
                        
                        const Icon = getIcon(platform);
                        
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-type-live/10 border border-type-live/30 text-type-live hover:bg-type-live/20 transition-smooth text-sm"
                          >
                            <Icon className="h-3 w-3" />
                            {platform}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
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

export default Index;