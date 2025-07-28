import { Clock, MapPin, Music, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Event } from "@/components/EventCard";

interface ChronologicalTimetableProps {
  events: Event[];
  selectedDay: string;
  selectedVenues: string[];
  searchQuery: string;
  onEventClick: (event: Event) => void;
}

const venueConfig = {
  draussen: { 
    label: "Draußen", 
    color: "venue-draussen",
    bgColor: "bg-venue-draussen/10",
    borderColor: "border-venue-draussen/20",
    icon: Music
  },
  oben: { 
    label: "Oben", 
    color: "venue-oben",
    bgColor: "bg-venue-oben/10", 
    borderColor: "border-venue-oben/20",
    icon: Users
  },
  unten: { 
    label: "Unten", 
    color: "venue-unten",
    bgColor: "bg-venue-unten/10",
    borderColor: "border-venue-unten/20", 
    icon: Music
  }
};

const typeConfig = {
  performance: { label: "Performance", color: "type-performance" },
  dj: { label: "DJ", color: "type-dj" },
  workshop: { label: "Workshop", color: "type-workshop" },
  live: { label: "Live-Konzert", color: "type-live" },
  interaktiv: { label: "Interaktiv", color: "type-interaktiv" }
};

export const ChronologicalTimetable = ({ 
  events, 
  selectedDay, 
  selectedVenues, 
  searchQuery, 
  onEventClick 
}: ChronologicalTimetableProps) => {
  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesDay = selectedDay === "Alle" || event.day === selectedDay;
    const matchesVenue = selectedVenues.length === 0 || selectedVenues.includes(event.venue);
    const matchesSearch = searchQuery === "" || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesDay && matchesVenue && matchesSearch;
  });

  // Group events by day, preserving order
  const eventsByDay = filteredEvents.reduce((acc, event) => {
    if (!acc[event.day]) {
      acc[event.day] = [];
    }
    acc[event.day].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Sort events within each day by time
  Object.keys(eventsByDay).forEach(day => {
    eventsByDay[day].sort((a, b) => {
      const timeA = a.time.split(' - ')[0];
      const timeB = b.time.split(' - ')[0];
      return timeA.localeCompare(timeB);
    });
  });

  const dayOrder = ["Freitag", "Samstag", "Sonntag"];
  const sortedDays = dayOrder.filter(day => eventsByDay[day]);

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Keine Events gefunden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDays.map(day => (
        <div key={day} className="space-y-4">
          {/* Day Header - only show if viewing all days */}
          {selectedDay === "Alle" && (
            <h2 className="text-2xl font-bold text-festival-light border-b border-festival-medium/30 pb-2">
              {day}
            </h2>
          )}
          
          {/* Three-column venue layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {Object.entries(venueConfig).map(([venueId, venueInfo]) => {
              const venueEvents = eventsByDay[day]?.filter(event => event.venue === venueId) || [];
              
              return (
                <div key={venueId} className={`space-y-3 p-6 rounded-lg ${venueInfo.bgColor} ${venueInfo.borderColor} border`}>
                  {/* Venue Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <venueInfo.icon className="h-6 w-6" />
                    <h3 className={`text-xl font-bold text-${venueInfo.color}`}>
                      {venueInfo.label}
                    </h3>
                  </div>
                  
                  {/* Events for this venue */}
                  <div className="space-y-3">
                    {venueEvents.length > 0 ? (
                      venueEvents.map(event => {
                        const type = typeConfig[event.type as keyof typeof typeConfig];
                        
                        return (
                          <Card 
                            key={event.id}
                            className={`p-3 cursor-pointer transition-smooth hover:shadow-glow hover:scale-[1.02] backdrop-blur-sm border-2 bg-${type.color}/10 border-${type.color}/40`}
                            onClick={() => onEventClick(event)}
                          >
                            <div className="space-y-2">
                              {/* Title and Type */}
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-foreground text-sm leading-tight flex-1">
                                  {event.title}
                                </h4>
                                <div 
                                  className={`px-2 py-1 rounded text-xs font-medium bg-${type.color}/20 text-${type.color} border border-${type.color}/30 shrink-0`}
                                >
                                  {type.label}
                                </div>
                              </div>
                              
                              {/* Time */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{event.time}</span>
                              </div>
                              
                              {/* Description */}
                              {event.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        Keine Events
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};