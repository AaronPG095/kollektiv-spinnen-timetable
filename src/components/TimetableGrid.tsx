import { Event } from "./EventCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo } from "react";

interface GridTimetableProps {
  events: Event[];
  selectedDay: string;
  selectedVenues: string[];
  selectedEventTypes: string[];
  searchQuery: string;
  onEventClick: (event: Event) => void;
}

const venues = [
  { id: "draussen", color: "bg-venue-draussen" },
  { id: "oben", color: "bg-venue-oben" },
  { id: "unten", color: "bg-venue-unten" }
];

const typeConfig = {
  performance: { label: "Performance", color: "bg-type-performance" },
  dj: { label: "DJ", color: "bg-type-dj" },
  workshop: { label: "Workshop", color: "bg-type-workshop" },
  live: { label: "Konzert", color: "bg-type-live" },
  interaktiv: { label: "Interaktiv", color: "bg-type-interaktiv" }
};

// Helper type for processed events
interface ProcessedEvent extends Event {
  startSlotIndex: number;
  endSlotIndex: number;
  startMinuteOffset: number;
  durationSlots: number;
  conflictDepth?: number;
}

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

  // Generate fixed time slots from Friday 19:00 to Sunday 20:00
  const timeSlots = useMemo(() => {
    const slots = [];
    
    // Friday 19:00-23:00
    for (let hour = 19; hour <= 23; hour++) {
      slots.push({ hour, day: 'Freitag', slotIndex: slots.length });
    }
    
    // Saturday 00:00-23:00
    for (let hour = 0; hour <= 23; hour++) {
      slots.push({ hour, day: 'Samstag', slotIndex: slots.length });
    }
    
    // Sunday 00:00-20:00
    for (let hour = 0; hour <= 20; hour++) {
      slots.push({ hour, day: 'Sonntag', slotIndex: slots.length });
    }
    
    return slots;
  }, []);

  // Process events to calculate their grid positions
  const processedEvents = useMemo(() => {
    return filteredEvents.map(event => {
      const [startTime, endTime] = event.time.split(' - ');
      const [startHour, startMin = '0'] = startTime.split(':');
      const [endHour, endMin = '0'] = endTime.split(':');
      
      const startH = parseInt(startHour);
      const startM = parseInt(startMin);
      let endH = parseInt(endHour);
      let endM = parseInt(endMin);
      
      // Handle cross-day events
      if (event.day === 'Freitag' && endH < 19) endH += 24;
      if (event.day === 'Samstag' && endH < startH) endH += 24;
      if (event.day === 'Sonntag' && endH < startH) endH += 24;
      
      // Find start slot index
      let startSlotIndex = -1;
      if (event.day === 'Freitag') {
        startSlotIndex = Math.max(0, startH - 19);
      } else if (event.day === 'Samstag') {
        startSlotIndex = 5 + startH;
      } else if (event.day === 'Sonntag') {
        startSlotIndex = 29 + startH;
      }
      
      // Calculate end slot index
      let endSlotIndex = startSlotIndex;
      if (event.day === 'Freitag') {
        endSlotIndex = Math.min(4, endH - 19);
        if (endH >= 24) endSlotIndex = 4; // Ends after midnight
      } else if (event.day === 'Samstag') {
        endSlotIndex = 5 + (endH >= 24 ? 23 : endH);
        if (endH >= 24) endSlotIndex = Math.min(28, endSlotIndex);
      } else if (event.day === 'Sonntag') {
        endSlotIndex = Math.min(49, 29 + endH);
      }
      
      // If event ends with minutes, include next slot
      if (endM > 0) endSlotIndex++;
      
      // Ensure we don't exceed grid bounds
      endSlotIndex = Math.min(timeSlots.length - 1, endSlotIndex);
      
      const durationSlots = Math.max(1, endSlotIndex - startSlotIndex + 1);
      
      return {
        ...event,
        startSlotIndex,
        endSlotIndex,
        startMinuteOffset: startM,
        durationSlots
      } as ProcessedEvent;
    });
  }, [filteredEvents, timeSlots.length]);

  // Group events by venue and detect conflicts
  const eventsByVenue = useMemo(() => {
    const grouped: Record<string, ProcessedEvent[][]> = {};
    
    venues.forEach(venue => {
      const venueEvents = processedEvents
        .filter(e => e.venue === venue.id)
        .sort((a, b) => a.startSlotIndex - b.startSlotIndex);
      
      // Detect overlapping events and assign conflict depths
      const lanes: ProcessedEvent[][] = [];
      
      venueEvents.forEach(event => {
        // Find first available lane
        let placed = false;
        for (let i = 0; i < lanes.length; i++) {
          const lane = lanes[i];
          const lastEvent = lane[lane.length - 1];
          
          if (lastEvent.endSlotIndex < event.startSlotIndex) {
            lane.push({ ...event, conflictDepth: i });
            placed = true;
            break;
          }
        }
        
        if (!placed) {
          lanes.push([{ ...event, conflictDepth: lanes.length }]);
        }
      });
      
      grouped[venue.id] = lanes;
    });
    
    return grouped;
  }, [processedEvents]);

  // Get all events for a specific slot and venue
  const getEventsForSlot = (venueId: string, slotIndex: number): ProcessedEvent[] => {
    const lanes = eventsByVenue[venueId] || [];
    const eventsInSlot: ProcessedEvent[] = [];
    
    lanes.forEach(lane => {
      lane.forEach(event => {
        if (event.startSlotIndex <= slotIndex && event.endSlotIndex >= slotIndex) {
          eventsInSlot.push(event);
        }
      });
    });
    
    return eventsInSlot;
  };

  // Check if this is the first slot of a new day
  const isNewDay = (slotIndex: number) => {
    return slotIndex === 0 || slotIndex === 5 || slotIndex === 29;
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
      <ScrollArea className="w-full h-[500px] md:h-[850px]">
        <div className="min-w-[320px] md:min-w-[600px] lg:min-w-[900px]">
          {/* Header with venues */}
          <div className="grid grid-cols-[50px_50px_repeat(3,1fr)] md:grid-cols-[60px_60px_repeat(3,1fr)] bg-muted/50 sticky top-0 z-10">
            <div className="p-1 md:p-2 font-bold text-center border-r border-border/30 bg-background/80 text-xs">
              {t('day')}
            </div>
            <div className="p-1 md:p-2 font-bold text-center border-r border-border/30 bg-background/80 text-xs">
              {t('time')}
            </div>
            {venues.map(venue => (
              <div 
                key={venue.id} 
                className={`p-1 md:p-2 text-center font-semibold border-r border-border/30 bg-${venue.color}/10 text-xs`}
              >
                {t(venue.id)}
              </div>
            ))}
          </div>

          {/* Time slot rows */}
          {timeSlots.map((slot, slotIndex) => (
            <div key={slotIndex} className="grid grid-cols-[50px_50px_repeat(3,1fr)] md:grid-cols-[60px_60px_repeat(3,1fr)] border-b border-border/30 h-[60px] md:h-[80px]">
              {/* Day label */}
              <div className="p-1 md:p-2 bg-muted/20 border-r border-border/30 flex items-center justify-center">
                {isNewDay(slotIndex) && (
                  <span className="font-bold text-xs text-foreground transform -rotate-90 whitespace-nowrap">
                    {t(slot.day.toLowerCase())}
                  </span>
                )}
              </div>
              
              {/* Time label */}
              <div className="p-1 md:p-2 bg-muted/20 border-r border-border/30 flex items-center justify-center">
                <span className="font-bold text-[10px] md:text-xs">
                  {slot.hour.toString().padStart(2, '0')}:00
                </span>
              </div>

              {/* Venue columns for this time */}
              {venues.map(venue => {
                const eventsInSlot = getEventsForSlot(venue.id, slotIndex);
                const maxConflictDepth = Math.max(0, ...eventsInSlot.map(e => e.conflictDepth || 0));

                return (
                  <div 
                    key={`${venue.id}-${slotIndex}`} 
                    className="border-r border-border/30 relative h-[60px] md:h-[80px] bg-background/10"
                  >
                    {eventsInSlot.map(event => {
                      // Only render if this is the start slot
                      if (event.startSlotIndex !== slotIndex) return null;
                      
                      const totalLanes = maxConflictDepth + 1;
                      const laneWidth = 100 / totalLanes;
                      const leftOffset = (event.conflictDepth || 0) * laneWidth;
                      
                      // Calculate visual height and position
                      const topOffset = (event.startMinuteOffset / 60) * 100;
                      const heightInPixels = event.durationSlots * (slotIndex < 29 ? 80 : 60) - 8;
                      
                      return (
                        <div
                          key={event.id}
                          className={`
                            absolute group p-1 overflow-hidden
                            bg-${typeConfig[event.type as keyof typeof typeConfig].color}/20 
                            border-2 border-${typeConfig[event.type as keyof typeof typeConfig].color}
                            hover:scale-[1.02] hover:shadow-glow hover:z-20 cursor-pointer transition-smooth
                            rounded-md
                          `}
                          style={{ 
                            top: `${topOffset}%`,
                            left: `${leftOffset}%`,
                            width: `${laneWidth - 2}%`,
                            height: `${heightInPixels}px`,
                            minHeight: '40px'
                          }}
                          onClick={() => onEventClick(event)}
                        >
                          <div className="flex flex-col h-full">
                            <div className="font-bold text-xs text-foreground line-clamp-2 leading-tight">
                              {event.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-auto">
                              {event.time}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};