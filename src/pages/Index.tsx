import { useState } from "react";
import { FestivalHeader } from "@/components/FestivalHeader";
import { TimetableGrid } from "@/components/TimetableGrid";
import { GridTimetable } from "@/components/GridTimetable";
import { ChronologicalTimetable } from "@/components/ChronologicalTimetable";
import { useEvents } from "@/hooks/useEvents";
import { Event } from "@/components/EventCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, MapPin, Instagram, Youtube, ExternalLink, Music } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();
  const { events } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState("Alle");
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "list">("list");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

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
          <GridTimetable
            events={events}
            selectedDay={selectedDay}
            selectedVenues={selectedVenues}
            selectedEventTypes={selectedEventTypes}
            searchQuery={searchQuery}
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
                </div>
                {selectedEvent.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedEvent.description}
                  </p>
                )}
                
                {/* Social Media Links */}
                {selectedEvent.links && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">{t('links')}:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.links.instagram && (
                        <a
                          href={selectedEvent.links.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-type-live/10 border border-type-live/30 text-type-live hover:bg-type-live/20 transition-smooth text-sm"
                        >
                          <Instagram className="h-3 w-3" />
                          Instagram
                        </a>
                      )}
                      {selectedEvent.links.spotify && (
                        <a
                          href={selectedEvent.links.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-type-live/10 border border-type-live/30 text-type-live hover:bg-type-live/20 transition-smooth text-sm"
                        >
                          <Music className="h-3 w-3" />
                          Spotify
                        </a>
                      )}
                      {selectedEvent.links.youtube && (
                        <a
                          href={selectedEvent.links.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-type-live/10 border border-type-live/30 text-type-live hover:bg-type-live/20 transition-smooth text-sm"
                        >
                          <Youtube className="h-3 w-3" />
                          YouTube
                        </a>
                      )}
                      {selectedEvent.links.soundcloud && (
                        <a
                          href={selectedEvent.links.soundcloud}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-type-live/10 border border-type-live/30 text-type-live hover:bg-type-live/20 transition-smooth text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          SoundCloud
                        </a>
                      )}
                      {selectedEvent.links.bandcamp && (
                        <a
                          href={selectedEvent.links.bandcamp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-type-live/10 border border-type-live/30 text-type-live hover:bg-type-live/20 transition-smooth text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Bandcamp
                        </a>
                      )}
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