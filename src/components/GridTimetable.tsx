import { Event } from "./EventCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface GridTimetableProps {
  events: Event[];
  selectedDay: string;
  selectedVenues: string[];
  searchQuery: string;
  onEventClick: (event: Event) => void;
}

const timeSlots = [
  "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", 
  "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", 
  "23:00", "00:00", "01:00", "02:00", "03:00", "04:00", 
  "05:00", "06:00", "07:00", "08:00", "09:00", "10:00"
];

const venues = [
  { id: "draussen", label: "DRAUSSEN", color: "venue-draussen" },
  { id: "oben", label: "OBEN", color: "venue-oben" },
  { id: "unten", label: "UNTEN", color: "venue-unten" }
];

const typeColors = {
  performance: "bg-festival-medium border-festival-medium/30",
  dj: "bg-festival-deep border-festival-deep/30", 
  workshop: "bg-festival-light border-festival-light/30",
  live: "bg-festival-dark border-festival-dark/30"
};

export const GridTimetable = ({ 
  events, 
  selectedDay, 
  selectedVenues, 
  searchQuery,
  onEventClick 
}: GridTimetableProps) => {
  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesDay = selectedDay === "Alle" || event.day === selectedDay;
    const matchesVenue = selectedVenues.length === 0 || selectedVenues.includes(event.venue);
    const matchesSearch = searchQuery === "" || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDay && matchesVenue && matchesSearch;
  });

  // Function to get events for specific venue and time
  const getEventsForSlot = (venueId: string, timeSlot: string) => {
    return filteredEvents.filter(event => {
      const eventStartTime = event.time.split(' - ')[0];
      const eventEndTime = event.time.split(' - ')[1];
      
      // Check if the time slot falls within the event duration
      const slotHour = parseInt(timeSlot.split(':')[0]);
      const startHour = parseInt(eventStartTime.split(':')[0]);
      const endHour = parseInt(eventEndTime.split(':')[0]);
      
      return event.venue === venueId && slotHour >= startHour && slotHour < endHour;
    });
  };

  // Function to calculate event span
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

  return (
    <div className="bg-card/30 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden">
      <ScrollArea className="w-full">
        <div className="min-w-[1200px]">
          {/* Header with time slots */}
          <div className="grid grid-cols-[200px_repeat(24,100px)] bg-muted/50">
            <div className="p-4 font-bold text-center border-r border-border/30">
              VENUE
            </div>
            {timeSlots.map(time => (
              <div key={time} className="p-4 text-center font-semibold border-r border-border/30 text-sm">
                {time}
              </div>
            ))}
          </div>

          {/* Venue rows */}
          {venues.map(venue => (
            <div key={venue.id} className="grid grid-cols-[200px_repeat(24,100px)] border-b border-border/30 min-h-[80px]">
              {/* Venue label */}
              <div className="p-4 bg-secondary/30 border-r border-border/30 flex items-center justify-center">
                <span className="font-bold text-sm text-center writing-mode-vertical-rl transform rotate-180">
                  {venue.label}
                </span>
              </div>

              {/* Time slots for this venue */}
              <div className="col-span-24 grid grid-cols-24 relative">
                {timeSlots.map((timeSlot, index) => {
                  const eventsInSlot = getEventsForSlot(venue.id, timeSlot);
                  const mainEvent = eventsInSlot.find(event => {
                    const eventStartTime = event.time.split(' - ')[0];
                    const slotTime = timeSlot;
                    return eventStartTime === slotTime;
                  });

                  if (mainEvent) {
                    const span = getEventSpan(mainEvent);
                    return (
                      <div
                        key={`${venue.id}-${timeSlot}`}
                        className={`col-span-${Math.min(span, 24 - index)} relative group`}
                      >
                        <div
                          className={`
                            absolute inset-1 rounded-md cursor-pointer transition-smooth
                            ${typeColors[mainEvent.type]}
                            hover:scale-105 hover:shadow-glow hover:z-10
                            flex items-center justify-center p-2
                          `}
                          onClick={() => onEventClick(mainEvent)}
                        >
                          <div className="text-center">
                            <div className="font-semibold text-xs text-white drop-shadow-sm">
                              {mainEvent.title}
                            </div>
                            <div className="text-xs text-white/80 mt-1">
                              {mainEvent.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={`${venue.id}-${timeSlot}`} 
                      className="border-r border-border/20 min-h-[72px] bg-background/20"
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

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
  );
};