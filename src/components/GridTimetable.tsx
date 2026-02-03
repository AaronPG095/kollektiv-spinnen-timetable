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
      
      const startTimeStr = event.startTime || event.time?.split(' - ')[0] || '19:00';
      const [startHour, startMin = '0'] = startTimeStr.split(':');
      
      // Calculate which time slot this event should start in
      const eventHour = parseInt(startHour);
      let expectedSlotIndex = 0;
      
      if (event.day === 'Freitag') {
        // Friday: starts from slot 0 (19:00)
        expectedSlotIndex = eventHour - 19;
      } else if (event.day === 'Samstag') {
        // Saturday: starts from slot 5 (00:00)
        expectedSlotIndex = 5 + eventHour;
      } else if (event.day === 'Sonntag') {
        // Sunday: starts from slot 29 (00:00)
        expectedSlotIndex = 29 + eventHour;
      }
      
      return slotIndex === expectedSlotIndex;
    });
  };

  // Function to calculate event span in hours
  const getEventSpan = (event: Event) => {
    const startTimeStr = event.startTime || event.time?.split(' - ')[0] || '19:00';
    const endTimeStr = event.endTime || event.time?.split(' - ')[1] || '20:00';
    const [startHour, startMin = '0'] = startTimeStr.split(':');
    const [endHour, endMin = '0'] = endTimeStr.split(':');
    
    // Convert to minutes for precise calculation
    const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
    let endMinutes = parseInt(endHour) * 60 + parseInt(endMin);
    
    // Handle cross-day events
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    
    // Calculate duration in hours (rounded up to nearest hour)
    const durationMinutes = endMinutes - startMinutes;
    return Math.max(1, Math.ceil(durationMinutes / 60));
  };

  // Get precise positioning within the hour slot
  const getEventPosition = (event: Event) => {
    const startTimeStr = event.startTime || event.time?.split(' - ')[0] || '19:00';
    const endTimeStr = event.endTime || event.time?.split(' - ')[1] || '20:00';
    const [startHour, startMin = '0'] = startTimeStr.split(':');
    const [endHour, endMin = '0'] = endTimeStr.split(':');
    
    const startMinutes = parseInt(startMin);
    const endMinutes = parseInt(endMin);
    const startH = parseInt(startHour);
    let endH = parseInt(endHour);
    
    if (endH < startH) endH += 24; // Handle cross-day
    
    const durationMinutes = (endH - startH) * 60 + (endMinutes - startMinutes);
    const topOffset = (startMinutes / 60) * 100; // Percentage within the hour
    const height = Math.max((durationMinutes / 60) * 100, 25); // Minimum 25% height
    
    return { topOffset, height };
  };

  // Check if a slot should be skipped (part of a multi-hour event)
  const shouldSkipSlot = (venueId: string, slotIndex: number) => {
    return filteredEvents.some(event => {
      if (event.venue !== venueId) return false;
      
      const [startTime] = event.time.split(' - ');
      const [startHour] = startTime.split(':');
      const span = getEventSpan(event);
      
      // Calculate event start slot index
      const eventHour = parseInt(startHour);
      let eventStartSlot = 0;
      
      if (event.day === 'Freitag') {
        eventStartSlot = eventHour - 19;
      } else if (event.day === 'Samstag') {
        eventStartSlot = 5 + eventHour;
      } else if (event.day === 'Sonntag') {
        eventStartSlot = 29 + eventHour;
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
          {timeSlots.map((timeSlot, timeIndex) => (
            <div key={timeSlot} className="grid grid-cols-[50px_50px_repeat(3,1fr)] md:grid-cols-[60px_60px_repeat(3,1fr)] border-b border-border/30 h-[45px] md:h-[60px]">
              {/* Day label */}
              <div className="p-1 md:p-2 bg-muted/20 border-r border-border/30 flex items-center justify-center">
                {isNewDay(timeIndex) && (
                  <span className="font-bold text-xs text-foreground transform -rotate-90 whitespace-nowrap">
                    {t(getDayLabel(timeSlot, timeIndex))}
                  </span>
                )}
              </div>
              
              {/* Time label */}
              <div className="p-1 md:p-2 bg-muted/20 border-r border-border/30 flex items-center justify-center">
                <span className="font-bold text-[10px] md:text-xs">
                  {timeSlot}
                </span>
              </div>

              {/* Venue columns for this time */}
              {venues.map((venue, venueIndex) => {
                const event = getEventForSlot(venue.id, timeSlot, timeIndex);
                const shouldSkip = shouldSkipSlot(venue.id, timeIndex);

                if (shouldSkip) {
                  return (
                    <div 
                      key={`${venue.id}-${timeIndex}-skip`} 
                      className="border-r border-border/30"
                    />
                  );
                }

                if (event) {
                  const span = getEventSpan(event);
                  const maxSpan = timeSlots.length - timeIndex;
                  const actualSpan = Math.min(span, maxSpan);
                  
                  return (
                    <div
                      key={`${venue.id}-${timeIndex}-${event.id}`}
                      className={`
                        group border-r border-border/30 flex items-center justify-center p-1
                        bg-${typeConfig[event.type as keyof typeof typeConfig].color}/20 
                        border-2 border-${typeConfig[event.type as keyof typeof typeConfig].color}
                        hover:scale-[1.02] hover:shadow-glow hover:z-10 cursor-pointer transition-smooth
                        rounded-md m-1
                      `}
                      style={{ 
                        gridRowEnd: `span ${actualSpan}`,
                        minHeight: `${actualSpan * 60 - 8}px`
                      }}
                      onClick={() => onEventClick(event)}
                    >
                      <div className={`font-bold text-foreground line-clamp-2 leading-tight text-center px-1 ${
                        (() => {
                          // Calculate event duration in minutes
                          const startTimeStr = event.startTime || event.time?.split(' - ')[0] || '19:00';
                          const endTimeStr = event.endTime || event.time?.split(' - ')[1] || '20:00';
                          const [startHour, startMin = '0'] = startTimeStr.split(':');
                          const [endHour, endMin = '0'] = endTimeStr.split(':');
                          
                          const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
                          let endMinutes = parseInt(endHour) * 60 + parseInt(endMin);
                          
                          // Handle cross-day events
                          if (endMinutes <= startMinutes) {
                            endMinutes += 24 * 60;
                          }
                          
                          const durationMinutes = endMinutes - startMinutes;
                          
                          // If 15 minutes or less, make text 50% smaller
                          if (durationMinutes <= 15) {
                            return 'text-[5px] md:text-[6px]'; // 50% smaller
                          } else if (actualSpan === 1) {
                            return 'text-[10px] md:text-xs';
                          } else {
                            return 'text-xs';
                          }
                        })()
                      }`}>
                        {event.title}
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={`${venue.id}-${timeIndex}-empty`} 
                    className="border-r border-border/30 h-[60px] bg-background/10 hover:bg-background/20 transition-colors"
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