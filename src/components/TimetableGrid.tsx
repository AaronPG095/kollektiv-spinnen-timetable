import { Event, EventCard } from "./EventCard";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimetableGridProps {
  events: Event[];
  selectedDay: string;
  selectedVenues: string[];
  searchQuery: string;
}

export const TimetableGrid = ({ events, selectedDay, selectedVenues, searchQuery }: TimetableGridProps) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { t, language } = useLanguage();

  // Filter events based on criteria
  const filteredEvents = events.filter(event => {
    const matchesDay = selectedDay === "Alle" || event.day === selectedDay;
    const matchesVenue = selectedVenues.length === 0 || selectedVenues.includes(event.venue);
    const matchesSearch = searchQuery === "" || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDay && matchesVenue && matchesSearch;
  });

  // Group events by time slot
  const eventsByTime = filteredEvents.reduce((acc, event) => {
    if (!acc[event.time]) {
      acc[event.time] = [];
    }
    acc[event.time].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Sort time slots
  const sortedTimes = Object.keys(eventsByTime).sort((a, b) => {
    const timeA = a.split(' - ')[0].replace(':', '');
    const timeB = b.split(' - ')[0].replace(':', '');
    return timeA.localeCompare(timeB);
  });

  const venueConfig = {
    draussen: { label: "Draußen", color: "venue-draussen" },
    oben: { label: "Oben", color: "venue-oben" },
    unten: { label: "Unten", color: "venue-unten" }
  };

  return (
    <>
      <div className="space-y-8">
        {sortedTimes.map(timeSlot => (
          <div key={timeSlot} className="space-y-4">
            {/* Time Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-border/30">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{timeSlot}</h2>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventsByTime[timeSlot].map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={setSelectedEvent}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
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
                    {selectedEvent.day}
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
                    {(() => {
                      const desc = selectedEvent.description;
                      
                      // Try to parse as JSON first
                      try {
                        const parsed = JSON.parse(desc);
                        if (typeof parsed === 'object' && parsed !== null && (parsed.en || parsed.de)) {
                          return parsed[language] || parsed.de || parsed.en || desc;
                        }
                      } catch {
                        // Not valid JSON, continue
                      }
                      
                      // Check if it's a translation key
                      const translated = t(desc);
                      return translated !== desc ? translated : desc;
                    })()}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};