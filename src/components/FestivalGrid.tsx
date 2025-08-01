import React, { useMemo } from 'react';
import { Event } from '@/components/EventCard';
import { useLanguage } from '@/contexts/LanguageContext';

interface FestivalGridProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

interface GridEvent extends Event {
  startMinutes: number;
  endMinutes: number;
  duration: number;
  gridRowStart: number;
  gridRowEnd: number;
  gridColumn: number;
  lane: number;
  totalLanes: number;
  pixelTop: number;
  pixelHeight: number;
}

const venues = ['draussen', 'oben', 'unten'] as const;
const venueLabels = {
  draussen: 'NEUE UFER',
  oben: 'SALON', 
  unten: 'FLORA'
};

// Constants for precise positioning
const HOUR_HEIGHT = 60; // pixels per hour
const HEADER_HEIGHT = 50;
const TIME_COLUMN_WIDTH = 60;
const VENUE_COLUMN_WIDTH = 200;

const FestivalGrid: React.FC<FestivalGridProps> = ({ events, onEventClick }) => {
  const { t } = useLanguage();

  // Generate time slots with more granular control
  const timeSlots = useMemo(() => {
    const slots = [];
    let totalMinutes = 0;
    
    // Friday 19:00-23:59
    for (let hour = 19; hour < 24; hour++) {
      slots.push({
        day: 'Freitag',
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        totalMinutes: totalMinutes,
        dayStart: hour === 19
      });
      totalMinutes += 60;
    }
    
    // Saturday 00:00-23:59
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        day: 'Samstag',
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        totalMinutes: totalMinutes,
        dayStart: hour === 0
      });
      totalMinutes += 60;
    }
    
    // Sunday 00:00-20:00
    for (let hour = 0; hour <= 20; hour++) {
      slots.push({
        day: 'Sonntag',
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        totalMinutes: totalMinutes,
        dayStart: hour === 0
      });
      totalMinutes += 60;
    }
    
    return slots;
  }, []);

  // Helper function to convert time to total minutes from start
  const timeToMinutes = (timeStr: string, day: string): number => {
    const [hour, min = 0] = timeStr.split(':').map(Number);
    
    let baseMinutes = 0;
    if (day === 'Freitag') {
      baseMinutes = (hour >= 19) ? (hour - 19) * 60 : -1;
    } else if (day === 'Samstag') {
      baseMinutes = 5 * 60 + hour * 60; // 5 hours of Friday + Saturday hours
    } else if (day === 'Sonntag') {
      baseMinutes = 29 * 60 + hour * 60; // 5 + 24 hours + Sunday hours
    }
    
    return baseMinutes >= 0 ? baseMinutes + min : -1;
  };

  // Advanced conflict detection and lane assignment
  const processEventsForGrid = (rawEvents: Event[]): GridEvent[] => {
    // Group events by venue
    const eventsByVenue: Record<string, GridEvent[]> = {
      draussen: [],
      oben: [],
      unten: []
    };

    // First pass: convert events to grid events with time calculations
    const gridEvents = rawEvents.map(event => {
      const [startTimeStr, endTimeStr] = (event.time || '19:00 - 20:00').split(' - ');
      
      const startMinutes = timeToMinutes(startTimeStr.trim(), event.day);
      const endMinutes = timeToMinutes(endTimeStr.trim(), event.day);
      
      if (startMinutes === -1 || endMinutes === -1) {
        console.warn(`Invalid time for event ${event.title}: ${event.time} on ${event.day}`);
        return null;
      }

      // Handle cross-day events
      let adjustedEndMinutes = endMinutes;
      if (endMinutes < startMinutes) {
        // Event crosses midnight
        if (event.day === 'Freitag') {
          adjustedEndMinutes = timeToMinutes(endTimeStr.trim(), 'Samstag');
        } else if (event.day === 'Samstag') {
          adjustedEndMinutes = timeToMinutes(endTimeStr.trim(), 'Sonntag');
        }
      }

      const duration = adjustedEndMinutes - startMinutes;
      const pixelTop = HEADER_HEIGHT + (startMinutes / 60) * HOUR_HEIGHT;
      const pixelHeight = (duration / 60) * HOUR_HEIGHT;

      return {
        ...event,
        startMinutes,
        endMinutes: adjustedEndMinutes,
        duration,
        gridRowStart: Math.floor(startMinutes / 60) + 2,
        gridRowEnd: Math.ceil(adjustedEndMinutes / 60) + 2,
        gridColumn: venues.indexOf(event.venue as any) + 1,
        lane: 0,
        totalLanes: 1,
        pixelTop,
        pixelHeight
      } as GridEvent;
    }).filter(Boolean) as GridEvent[];

    // Group by venue for conflict resolution
    gridEvents.forEach(event => {
      eventsByVenue[event.venue as keyof typeof eventsByVenue].push(event);
    });

    // Second pass: resolve conflicts using interval scheduling algorithm
    Object.entries(eventsByVenue).forEach(([venue, venueEvents]) => {
      if (venueEvents.length === 0) return;

      // Sort events by start time
      venueEvents.sort((a, b) => a.startMinutes - b.startMinutes);

      // Use interval scheduling to assign lanes
      const lanes: GridEvent[][] = [];

      venueEvents.forEach(event => {
        let assignedLane = -1;

        // Find the first available lane
        for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
          const lane = lanes[laneIndex];
          const lastEvent = lane[lane.length - 1];

          // Check if there's enough gap (minimum 15 minutes between events)
          if (lastEvent.endMinutes + 15 <= event.startMinutes) {
            lane.push(event);
            assignedLane = laneIndex;
            break;
          }
        }

        // If no lane available, create a new one
        if (assignedLane === -1) {
          lanes.push([event]);
          assignedLane = lanes.length - 1;
        }

        event.lane = assignedLane;
      });

      // Update total lanes for all events in this venue
      const totalLanes = lanes.length;
      venueEvents.forEach(event => {
        event.totalLanes = totalLanes;
      });
    });

    return gridEvents;
  };

  const gridEvents = useMemo(() => processEventsForGrid(events), [events]);

  const getEventTypeColor = (type: string) => {
    const colors = {
      dj: 'bg-blue-500',
      live: 'bg-red-500',
      performance: 'bg-purple-500',
      workshop: 'bg-green-500',
      interaktiv: 'bg-orange-500',
      default: 'bg-amber-600'
    };
    return colors[type as keyof typeof colors] || colors.default;
  };

  const totalGridHeight = timeSlots.length * HOUR_HEIGHT + HEADER_HEIGHT;

  return (
    <div className="festival-grid-container bg-background text-foreground rounded-lg overflow-hidden border border-border">
      {/* Header */}
      <div className="grid sticky top-0 z-50 bg-card border-b border-border" style={{ gridTemplateColumns: '80px 80px 1fr 1fr 1fr' }}>
        <div className="h-12 flex items-center justify-center font-bold border-r border-border text-sm">
          Tag
        </div>
        <div className="h-12 flex items-center justify-center font-bold border-r border-border text-sm">
          Zeit
        </div>
        {venues.map((venue, index) => (
          <div 
            key={venue}
            className="h-12 flex items-center justify-center font-bold border-r border-border text-sm"
            style={{ 
              backgroundColor: index === 0 ? 'hsl(var(--venue-draussen))' : 
                               index === 1 ? 'hsl(var(--venue-oben))' : 
                               'hsl(var(--venue-unten))'
            }}
          >
            {venueLabels[venue as keyof typeof venueLabels]}
          </div>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="overflow-auto max-h-[80vh]">
        <div className="grid relative" style={{ gridTemplateColumns: '80px 80px 1fr 1fr 1fr', minHeight: `${totalGridHeight}px` }}>
          {/* Time grid and content */}
          {timeSlots.map((slot, index) => {
            return (
              <React.Fragment key={`${slot.day}-${slot.hour}`}>
                {/* Day label */}
                {slot.dayStart ? (
                  <div 
                    className="bg-card border-r border-border flex items-center justify-center font-bold text-sm"
                    style={{ 
                      gridRowEnd: `span ${slot.day === 'Freitag' ? 5 : slot.day === 'Samstag' ? 24 : 21}`,
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed'
                    }}
                  >
                    {slot.day.toUpperCase()}
                  </div>
                ) : (
                  <div></div>
                )}
                
                {/* Time label */}
                <div 
                  className="bg-card border-r border-border border-b border-border flex items-center justify-center text-xs font-medium"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {slot.label}
                </div>

                {/* Venue columns */}
                {venues.map((venue, venueIndex) => (
                  <div
                    key={`${slot.day}-${slot.hour}-${venue}`}
                    className="relative border-r border-border border-b border-border bg-card/50"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    {/* Events for this time slot and venue */}
                    {gridEvents
                      .filter(event => {
                        const eventVenueIndex = venues.indexOf(event.venue as any);
                        const eventStartHour = Math.floor(event.startMinutes / 60);
                        const slotHour = slot.totalMinutes / 60;
                        return eventVenueIndex === venueIndex && 
                               eventStartHour === slotHour;
                      })
                      .map(event => {
                        const width = 100 / event.totalLanes;
                        const leftOffset = event.lane * width;
                        const minuteOffset = event.startMinutes % 60;
                        const topOffset = (minuteOffset / 60) * HOUR_HEIGHT;
                        const height = (event.duration / 60) * HOUR_HEIGHT;

                        return (
                          <div
                            key={event.id}
                            className={`absolute ${getEventTypeColor(event.type)} rounded-md border border-white/30 
                                       shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] 
                                       hover:shadow-xl hover:border-white/50 hover:z-40 overflow-hidden z-30`}
                            style={{
                              left: `${leftOffset}%`,
                              width: `${width - 2}%`,
                              top: topOffset,
                              height: Math.max(height - 4, 30)
                            }}
                            onClick={() => onEventClick(event)}
                          >
                            <div className="h-full p-2 flex flex-col justify-center text-center">
                              <div className={`font-semibold leading-tight text-white ${
                                event.title.length > 20 ? 'text-xs' : 'text-sm'
                              }`}>
                                {event.title}
                              </div>
                              {height > 40 && (
                                <div className="text-xs text-white/80 mt-1">
                                  {event.time}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <style>{`
        .festival-grid-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .festival-grid-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .festival-grid-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .festival-grid-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .festival-grid-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default FestivalGrid;