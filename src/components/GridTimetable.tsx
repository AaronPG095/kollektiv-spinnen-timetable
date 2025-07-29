import { Event } from "./EventCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface GridTimetableProps {
  events: Event[];
  selectedDay: string;
  selectedVenues: string[];
  selectedEventTypes: string[];
  searchQuery: string;
  onEventClick: (event: Event) => void;
}

const venues = [
  { id: "draussen", color: "venue-draussen" },
  { id: "oben", color: "venue-oben" },
  { id: "unten", color: "venue-unten" }
];

const typeConfig = {
  performance: { label: "Performance", color: "type-performance" },
  dj: { label: "DJ", color: "type-dj" },
  workshop: { label: "Workshop", color: "type-workshop" },
  live: { label: "Live-Konzert", color: "type-live" },
  interaktiv: { label: "Interaktiv", color: "type-interaktiv" }
};

export const GridTimetable = ({ 
  events, 
  selectedDay, 
  selectedVenues, 
  selectedEventTypes,
  searchQuery,
  onEventClick 
}: GridTimetableProps) => {
  const { t } = useLanguage();

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesDay = selectedDay === "Alle" || event.day === selectedDay;
    const matchesVenue = selectedVenues.length === 0 || selectedVenues.includes(event.venue);
    const matchesEventType = selectedEventTypes.length === 0 || selectedEventTypes.includes(event.type);
    const matchesSearch = searchQuery === "" || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDay && matchesVenue && matchesEventType && matchesSearch;
  });

  // Generate time slots from actual events
  const generateTimeSlots = () => {
    const times = new Set<string>();
    filteredEvents.forEach(event => {
      const [startTime, endTime] = event.time.split(' - ');
      const startHour = parseInt(startTime.split(':')[0]);
      let endHour = parseInt(endTime.split(':')[0]);
      
      // Handle overnight events
      if (endHour < startHour) {
        endHour += 24;
      }
      
      // Add all hours from start to end
      for (let hour = startHour; hour < endHour; hour++) {
        const displayHour = hour >= 24 ? hour - 24 : hour;
        times.add(`${displayHour.toString().padStart(2, '0')}:00`);
      }
    });
    
    // Convert to array and sort
    const sortedTimes = Array.from(times).sort((a, b) => {
      const hourA = parseInt(a.split(':')[0]);
      const hourB = parseInt(b.split(':')[0]);
      
      // Handle day transition (put late hours at beginning)
      const adjustedA = hourA >= 11 ? hourA : hourA + 24;
      const adjustedB = hourB >= 11 ? hourB : hourB + 24;
      
      return adjustedA - adjustedB;
    });
    
    return sortedTimes;
  };

  const timeSlots = generateTimeSlots();

  // Function to get events for specific venue and time
  const getEventForSlot = (venueId: string, timeSlot: string) => {
    return filteredEvents.find(event => {
      const [startTime, endTime] = event.time.split(' - ');
      const slotHour = parseInt(timeSlot.split(':')[0]);
      const startHour = parseInt(startTime.split(':')[0]);
      let endHour = parseInt(endTime.split(':')[0]);
      
      // Handle overnight events
      if (endHour < startHour) {
        endHour += 24;
      }
      
      // Check if this is the starting slot for the event
      return event.venue === venueId && startHour === slotHour;
    });
  };

  // Function to calculate event span in hours
  const getEventSpan = (event: Event) => {
    const [startTime, endTime] = event.time.split(' - ');
    const startHour = parseInt(startTime.split(':')[0]);
    let endHour = parseInt(endTime.split(':')[0]);
    
    // Handle overnight events
    if (endHour < startHour) {
      endHour += 24;
    }
    
    return Math.max(1, endHour - startHour);
  };

  // Check if a slot should be skipped (part of a multi-hour event)
  const shouldSkipSlot = (venueId: string, timeSlot: string) => {
    const slotHour = parseInt(timeSlot.split(':')[0]);
    
    return filteredEvents.some(event => {
      if (event.venue !== venueId) return false;
      
      const [startTime, endTime] = event.time.split(' - ');
      const startHour = parseInt(startTime.split(':')[0]);
      let endHour = parseInt(endTime.split(':')[0]);
      
      // Handle overnight events
      if (endHour < startHour) {
        endHour += 24;
      }
      
      // Check if this slot is within the event duration but not the start
      const adjustedSlotHour = slotHour >= 11 ? slotHour : slotHour + 24;
      const adjustedStartHour = startHour >= 11 ? startHour : startHour + 24;
      const adjustedEndHour = endHour >= 11 ? endHour : endHour + 24;
      
      return adjustedSlotHour > adjustedStartHour && adjustedSlotHour < adjustedEndHour;
    });
  };

  if (filteredEvents.length === 0) {
    return (
      <div className="bg-card/30 backdrop-blur-sm rounded-lg border border-border/50 p-12">
        <div className="text-center">
          <div className="text-4xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold mb-2">{t('noEvents')}</h3>
          <p className="text-muted-foreground">
            {t('noEventsDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/30 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden">
      <ScrollArea className="w-full h-[800px]">
        <div className="min-w-[800px]">
          {/* Header with venues */}
          <div className="grid grid-cols-[100px_repeat(3,1fr)] bg-muted/50 sticky top-0 z-10">
            <div className="p-4 font-bold text-center border-r border-border/30 bg-background/80">
              {t('time')}
            </div>
            {venues.map(venue => (
              <div 
                key={venue.id} 
                className={`p-4 text-center font-semibold border-r border-border/30 bg-${venue.color}/10`}
              >
                <span className="text-sm font-bold">
                  {t(venue.id)}
                </span>
              </div>
            ))}
          </div>

          {/* Time slot rows */}
          {timeSlots.map((timeSlot, timeIndex) => (
            <div key={timeSlot} className="grid grid-cols-[100px_repeat(3,1fr)] border-b border-border/30 min-h-[100px]">
              {/* Time label */}
              <div className="p-4 bg-muted/20 border-r border-border/30 flex items-center justify-center">
                <span className="font-bold text-sm">
                  {timeSlot}
                </span>
              </div>

              {/* Venue columns for this time */}
              {venues.map((venue, venueIndex) => {
                const event = getEventForSlot(venue.id, timeSlot);
                const shouldSkip = shouldSkipSlot(venue.id, timeSlot);

                if (shouldSkip) {
                  return null; // This slot is covered by a previous event
                }

                if (event) {
                  const span = getEventSpan(event);
                  const slotHeight = Math.min(span, timeSlots.length - timeIndex);
                  
                  return (
                    <div
                      key={`${venue.id}-${timeSlot}`}
                      className="relative group border-r border-border/30"
                      style={{ 
                        gridRowEnd: `span ${slotHeight}`,
                        minHeight: `${slotHeight * 100}px` 
                      }}
                    >
                      <div
                        className={`
                          absolute inset-1 rounded-md cursor-pointer transition-smooth border-2
                          bg-${typeConfig[event.type as keyof typeof typeConfig].color}/20 
                          border-${typeConfig[event.type as keyof typeof typeConfig].color}
                          hover:scale-[1.02] hover:shadow-glow hover:z-10
                          flex flex-col items-center justify-center p-3 text-center
                        `}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="font-semibold text-xs text-foreground mb-1 line-clamp-2">
                          {event.title}
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          {event.time}
                        </div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {t(event.description) !== event.description ? t(event.description) : event.description}
                          </div>
                        )}
                        <Badge 
                          variant="secondary" 
                          className={`text-xs bg-${typeConfig[event.type as keyof typeof typeConfig].color}/30`}
                        >
                          {t(event.type)}
                        </Badge>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={`${venue.id}-${timeSlot}`} 
                    className="border-r border-border/30 min-h-[100px] bg-background/10 hover:bg-background/20 transition-colors"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};