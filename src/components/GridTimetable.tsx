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

  // Generate fixed time slots from Friday 19:00 to Sunday 20:00
  const generateTimeSlots = () => {
    const slots = [];
    
    // Friday 19:00-23:00
    for (let hour = 19; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    // Saturday 00:00-23:00
    for (let hour = 0; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    // Sunday 00:00-20:00
    for (let hour = 0; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    return slots;
  };

  // Get day label for time slot
  const getDayLabel = (timeSlot: string, slotIndex: number) => {
    if (slotIndex <= 4) return 'freitag'; // Friday 19:00-23:00
    if (slotIndex >= 5 && slotIndex <= 28) return 'samstag'; // Saturday 00:00-23:00
    return 'sonntag'; // Sunday 00:00-20:00
  };

  // Check if this is the first slot of a new day
  const isNewDay = (slotIndex: number) => {
    return slotIndex === 0 || slotIndex === 5 || slotIndex === 29;
  };

  const timeSlots = generateTimeSlots();

  // Function to get events for specific venue and time
  const getEventForSlot = (venueId: string, timeSlot: string, slotIndex: number) => {
    return filteredEvents.find(event => {
      if (event.venue !== venueId) return false;
      
      const [startTime, endTime] = event.time.split(' - ');
      const [startHour, startMin = '0'] = startTime.split(':');
      const [endHour, endMin = '0'] = endTime.split(':');
      
      // Convert to minutes for precise calculation
      const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
      let endMinutes = parseInt(endHour) * 60 + parseInt(endMin);
      
      // Handle cross-day events
      if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60; // Add 24 hours for next day
      }
      
      // Calculate event start slot based on day and time
      let eventStartSlot = 0;
      if (event.day === 'Freitag') {
        eventStartSlot = parseInt(startHour) - 19; // Friday 19:00-23:00 (slots 0-4)
      } else if (event.day === 'Samstag') {
        eventStartSlot = parseInt(startHour) + 5; // Saturday 00:00-23:00 (slots 5-28)
      } else if (event.day === 'Sonntag') {
        eventStartSlot = parseInt(startHour) + 29; // Sunday 00:00-20:00 (slots 29-49)
      }
      
      // Special handling for cross-day events (like Fireshow 22:30-00:00)
      if (event.day === 'Freitag' && endMinutes > startMinutes + 60 && parseInt(endHour) < parseInt(startHour)) {
        // This is a Friday event that goes into Saturday
        return slotIndex === eventStartSlot;
      }
      
      // Round down start time to nearest hour for grid alignment
      const eventHourSlot = Math.floor(startMinutes / 60);
      if (event.day === 'Freitag') {
        eventStartSlot = eventHourSlot - 19;
      } else if (event.day === 'Samstag') {
        eventStartSlot = eventHourSlot + 5;
      } else if (event.day === 'Sonntag') {
        eventStartSlot = eventHourSlot + 29;
      }
      
      return slotIndex === eventStartSlot;
    });
  };

  // Function to calculate event span in hours
  const getEventSpan = (event: Event) => {
    const [startTime, endTime] = event.time.split(' - ');
    const [startHour, startMin = '0'] = startTime.split(':');
    const [endHour, endMin = '0'] = endTime.split(':');
    
    // Convert to minutes for precise calculation
    const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
    let endMinutes = parseInt(endHour) * 60 + parseInt(endMin);
    
    // Handle cross-day events
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours for next day
    }
    
    // Calculate duration in hours (rounded up to nearest hour)
    const durationMinutes = endMinutes - startMinutes;
    return Math.max(1, Math.ceil(durationMinutes / 60));
  };

  // Check if a slot should be skipped (part of a multi-hour event)
  const shouldSkipSlot = (venueId: string, slotIndex: number) => {
    return filteredEvents.some(event => {
      if (event.venue !== venueId) return false;
      
      const [startTime, endTime] = event.time.split(' - ');
      const [startHour, startMin = '0'] = startTime.split(':');
      const span = getEventSpan(event);
      
      // Calculate event start slot index
      let eventStartSlot = 0;
      const eventHourSlot = parseInt(startHour);
      
      if (event.day === 'Freitag') {
        eventStartSlot = eventHourSlot - 19;
      } else if (event.day === 'Samstag') {
        eventStartSlot = eventHourSlot + 5;
      } else if (event.day === 'Sonntag') {
        eventStartSlot = eventHourSlot + 29;
      }
      
      // Check if this slot is within the event span but not the start
      return slotIndex > eventStartSlot && slotIndex < eventStartSlot + span;
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
      <ScrollArea className="w-full h-[1000px]">
        <div className="min-w-[900px]">
          {/* Header with venues */}
          <div className="grid grid-cols-[60px_60px_repeat(3,1fr)] bg-muted/50 sticky top-0 z-10">
            <div className="p-2 font-bold text-center border-r border-border/30 bg-background/80 text-xs">
              {t('day')}
            </div>
            <div className="p-2 font-bold text-center border-r border-border/30 bg-background/80 text-xs">
              {t('time')}
            </div>
            {venues.map(venue => (
              <div 
                key={venue.id} 
                className={`p-2 text-center font-semibold border-r border-border/30 bg-${venue.color}/10 text-xs`}
              >
                {t(venue.id)}
              </div>
            ))}
          </div>

          {/* Time slot rows */}
          {timeSlots.map((timeSlot, timeIndex) => (
            <div key={timeSlot} className="grid grid-cols-[60px_60px_repeat(3,1fr)] border-b border-border/30 min-h-[60px]">
              {/* Day label */}
              <div className="p-2 bg-muted/20 border-r border-border/30 flex items-center justify-center">
                {isNewDay(timeIndex) && (
                  <span className="font-bold text-xs text-foreground transform -rotate-90 whitespace-nowrap">
                    {t(getDayLabel(timeSlot, timeIndex))}
                  </span>
                )}
              </div>
              
              {/* Time label */}
              <div className="p-2 bg-muted/20 border-r border-border/30 flex items-center justify-center">
                <span className="font-bold text-xs">
                  {timeSlot}
                </span>
              </div>

              {/* Venue columns for this time */}
              {venues.map((venue, venueIndex) => {
                const event = getEventForSlot(venue.id, timeSlot, timeIndex);
                const shouldSkip = shouldSkipSlot(venue.id, timeIndex);

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
                        minHeight: `${slotHeight * 60}px` 
                      }}
                    >
                      <div
                        className={`
                          absolute inset-1 rounded-md cursor-pointer transition-smooth border-2
                          bg-${typeConfig[event.type as keyof typeof typeConfig].color}/20 
                          border-${typeConfig[event.type as keyof typeof typeConfig].color}
                          hover:scale-[1.02] hover:shadow-glow hover:z-10
                          flex flex-col items-center justify-center p-2 text-center
                        `}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="font-bold text-3xl text-foreground mb-2 line-clamp-2 leading-tight">
                          {event.title}
                        </div>
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
                    className="border-r border-border/30 min-h-[60px] bg-background/10 hover:bg-background/20 transition-colors"
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