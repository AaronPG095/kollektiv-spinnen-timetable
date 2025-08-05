import { useState } from "react";
import { FestivalHeader } from "@/components/FestivalHeader";
import { ChronologicalTimetable } from "@/components/ChronologicalTimetable";
import FestivalGrid from "@/components/FestivalGrid";
import { useEvents } from "@/hooks/useEvents";
import { Event } from "@/components/EventCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, MapPin, Instagram, Youtube, ExternalLink, Music, Headphones } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t, language } = useLanguage();
  const { events } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState("Alle");
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [view, setView] = useState<"grid" | "list">("list");

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

  // Filter events for both views
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDay = selectedDay === "Alle" || event.day === selectedDay;
    const matchesVenue = selectedVenues.length === 0 || selectedVenues.includes(event.venue);
    const matchesEventType = selectedEventTypes.length === 0 || selectedEventTypes.includes(event.type);
    
    return matchesSearch && matchesDay && matchesVenue && matchesEventType;
  });

  return (
    <div className="min-h-screen bg-background">
      <FestivalHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDay={selectedDay}
        onDayChange={setSelectedDay}
        selectedVenues={selectedVenues}
        onVenueToggle={handleVenueToggle}
        selectedEventTypes={selectedEventTypes}
        onEventTypeToggle={handleEventTypeToggle}
        view={view}
        onViewChange={setView}
      />
      
      {/* Mobile Day Filter Label */}
      {selectedDay !== "Alle" && (
        <div className="md:hidden bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="bg-festival-light/10 border-festival-light/30 text-festival-light">
              <Calendar className="h-3 w-3 mr-1" />
              {t(selectedDay.toLowerCase())}
            </Badge>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
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
                      backgroundColor: getEventTypeColor(selectedEvent.type).replace('0.9', '0.3'),
                      borderColor: getEventTypeColor(selectedEvent.type),
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
    </div>
  );
};

export default Index;