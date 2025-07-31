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
    <div className="festival-grid-container bg-slate-900 text-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex sticky top-0 z-50 bg-indigo-800 border-b-2 border-indigo-600">
        <div className="w-20 h-12 flex items-center justify-center font-bold border-r border-indigo-600">
          Tag
        </div>
        <div className="w-16 h-12 flex items-center justify-center font-bold border-r border-indigo-600">
          Zeit
        </div>
        {venues.map((venue, index) => (
          <div 
            key={venue}
            className="flex-1 min-w-48 h-12 flex items-center justify-center font-bold border-r border-indigo-600"
            style={{ 
              backgroundColor: index === 0 ? '#3b82f6' : 
                               index === 1 ? '#8b5cf6' : 
                               '#ec4899' 
            }}
          >
            {venueLabels[venue as keyof typeof venueLabels]}
          </div>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="overflow-auto max-h-[80vh] relative">
        <div className="relative" style={{ height: totalGridHeight }}>
          {/* Time grid lines and labels */}
          {timeSlots.map((slot, index) => {
            const yPosition = HEADER_HEIGHT + (slot.totalMinutes / 60) * HOUR_HEIGHT;
            
            return (
              <div key={`${slot.day}-${slot.hour}`}>
                {/* Day label */}
                {slot.dayStart && (
                  <div 
                    className="absolute left-0 w-20 bg-indigo-800 border-r border-indigo-600 flex items-center justify-center font-bold text-sm z-10"
                    style={{ 
                      top: yPosition,
                      height: slot.day === 'Freitag' ? HOUR_HEIGHT * 5 :
                              slot.day === 'Samstag' ? HOUR_HEIGHT * 24 :
                              HOUR_HEIGHT * 21,
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed'
                    }}
                  >
                    {slot.day.toUpperCase()}
                  </div>
                )}
                
                {/* Time label */}
                <div 
                  className="absolute left-20 w-16 bg-indigo-800 border-r border-indigo-600 flex items-center justify-center text-xs font-medium z-10"
                  style={{ 
                    top: yPosition,
                    height: HOUR_HEIGHT
                  }}
                >
                  {slot.label}
                </div>

                {/* Grid line */}
                <div 
                  className="absolute left-36 right-0 border-t border-slate-700"
                  style={{ top: yPosition }}
                />

                {/* Venue columns background */}
                {venues.map((venue, venueIndex) => (
                  <div
                    key={`${slot.day}-${slot.hour}-${venue}`}
                    className="absolute border-r border-slate-700 bg-slate-800/30"
                    style={{
                      left: 144 + venueIndex * VENUE_COLUMN_WIDTH,
                      width: VENUE_COLUMN_WIDTH,
                      top: yPosition,
                      height: HOUR_HEIGHT
                    }}
                  />
                ))}
              </div>
            );
          })}

          {/* Event blocks */}
          {gridEvents.map(event => {
            const venueIndex = venues.indexOf(event.venue as any);
            const leftPosition = 144 + venueIndex * VENUE_COLUMN_WIDTH;
            const width = VENUE_COLUMN_WIDTH / event.totalLanes;
            const leftOffset = event.lane * width;

            return (
              <div
                key={event.id}
                className={`absolute ${getEventTypeColor(event.type)} rounded-md border border-white/30 
                           shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] 
                           hover:shadow-xl hover:border-white/50 hover:z-40 overflow-hidden z-30`}
                style={{
                  left: leftPosition + leftOffset + 4,
                  width: width - 8,
                  top: event.pixelTop + 2,
                  height: Math.max(event.pixelHeight - 4, 30) // Minimum height
                }}
                onClick={() => onEventClick(event)}
              >
                <div className="h-full p-2 flex flex-col justify-center text-center">
                  <div className={`font-semibold leading-tight text-white ${
                    event.title.length > 20 ? 'text-xs' : 'text-sm'
                  }`}>
                    {event.title}
                  </div>
                  {event.pixelHeight > 40 && (
                    <div className="text-xs text-white/80 mt-1">
                      {event.time}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
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