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
  conflictIndex: number;
  totalConflicts: number;
  startMinuteOffset: number;
  endMinuteOffset: number;
}

const venues = ['draussen', 'oben', 'unten'] as const;
const venueLabels = {
  draussen: 'NEUE UFER',
  oben: 'SALON', 
  unten: 'FLORA'
};

const FestivalGrid: React.FC<FestivalGridProps> = ({ events, onEventClick }) => {
  const { t } = useLanguage();

  // Generate time slots from Friday 19:00 to Sunday 20:00
  const timeSlots = useMemo(() => {
    const slots = [];
    let slotIndex = 0;
    
    // Friday 19:00-23:59
    for (let hour = 19; hour < 24; hour++) {
      slots.push({
        day: 'Freitag',
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        slotIndex: slotIndex++
      });
    }
    
    // Saturday 00:00-23:59
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        day: 'Samstag',
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        slotIndex: slotIndex++
      });
    }
    
    // Sunday 00:00-20:00
    for (let hour = 0; hour <= 20; hour++) {
      slots.push({
        day: 'Sonntag',
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        slotIndex: slotIndex++
      });
    }
    
    return slots;
  }, []);

  // Helper function to get slot index for a given time and day
  const getSlotIndex = (hour: number, day: string): number => {
    if (day === 'Freitag') {
      return hour >= 19 ? hour - 19 : -1;
    } else if (day === 'Samstag') {
      return 5 + hour; // 5 slots for Friday (19-23)
    } else if (day === 'Sonntag') {
      return 29 + hour; // 5 + 24 slots for Friday + Saturday
    }
    return -1;
  };

  // Process events for grid positioning with conflict detection
  const gridEvents = useMemo(() => {
    // Group events by venue for conflict detection
    const eventsByVenue: Record<string, GridEvent[]> = {
      draussen: [],
      oben: [],
      unten: []
    };

    // First pass: calculate basic positioning
    const processedEvents = events.map(event => {
      const [startTimeStr, endTimeStr] = (event.time || '19:00 - 20:00').split(' - ');
      const [startHour, startMin = 0] = startTimeStr.split(':').map(Number);
      const [endHour, endMin = 0] = endTimeStr.split(':').map(Number);
      
      // Get slot indices
      const startSlotIndex = getSlotIndex(startHour, event.day);
      let endSlotIndex = getSlotIndex(endHour, event.day);
      
      // Handle cross-day events
      if (endHour < startHour && event.day === 'Freitag') {
        endSlotIndex = getSlotIndex(endHour, 'Samstag');
      } else if (endHour < startHour && event.day === 'Samstag') {
        endSlotIndex = getSlotIndex(endHour, 'Sonntag');
      }
      
      // Ensure valid slot indices
      if (startSlotIndex === -1 || endSlotIndex === -1) {
        console.warn(`Invalid time for event ${event.title}: ${event.time} on ${event.day}`);
        return null;
      }
      
      // Calculate total minutes
      const startTotalMinutes = startSlotIndex * 60 + startMin;
      const endTotalMinutes = endSlotIndex * 60 + endMin;
      const duration = endTotalMinutes - startTotalMinutes;
      
      // Grid positioning
      let gridRowEnd = endSlotIndex + 2; // Base end position
      if (endMin > 0) {
        gridRowEnd += 1; // Event extends into next hour
      }
      
      // Get correct venue column
      const venueIndex = venues.indexOf(event.venue.toLowerCase() as any);
      if (venueIndex === -1) {
        console.warn(`Unknown venue "${event.venue}" for event ${event.title}`);
        return null;
      }
      
      const gridEvent: GridEvent = {
        ...event,
        startMinutes: startTotalMinutes,
        endMinutes: endTotalMinutes,
        duration,
        gridRowStart: startSlotIndex + 2, // +2 for header row
        gridRowEnd: gridRowEnd,
        gridColumn: venueIndex + 2, // +2 for time column
        conflictIndex: 0,
        totalConflicts: 1,
        startMinuteOffset: startMin,
        endMinuteOffset: endMin
      };
      
      return gridEvent;
    }).filter(Boolean) as GridEvent[];

    // Second pass: group by venue and detect conflicts
    processedEvents.forEach(event => {
      const venue = event.venue.toLowerCase() as keyof typeof eventsByVenue;
      if (eventsByVenue[venue]) {
        eventsByVenue[venue].push(event);
      }
    });

    // For each venue, detect overlapping events
    Object.keys(eventsByVenue).forEach(venue => {
      const venueEvents = eventsByVenue[venue as keyof typeof eventsByVenue];
      
      if (venueEvents.length === 0) return;
      
      // Sort by start time
      venueEvents.sort((a, b) => a.startMinutes - b.startMinutes);
      
      // Simple overlap detection: check each event against all others
      venueEvents.forEach(event => {
        // Find all events that overlap with this one
        const overlappingEvents = venueEvents.filter(other => 
          other.id !== event.id &&
          other.startMinutes < event.endMinutes && 
          other.endMinutes > event.startMinutes
        );
        
        // If there are overlapping events, distribute them horizontally
        if (overlappingEvents.length > 0) {
          // Include this event in the overlap group
          const overlapGroup = [event, ...overlappingEvents];
          
          // Sort by start time for consistent ordering
          overlapGroup.sort((a, b) => a.startMinutes - b.startMinutes);
          
          // Assign indices based on position in sorted group
          overlapGroup.forEach((groupEvent, index) => {
            const targetEvent = venueEvents.find(e => e.id === groupEvent.id);
            if (targetEvent) {
              targetEvent.conflictIndex = index;
              targetEvent.totalConflicts = overlapGroup.length;
            }
          });
        }
      });
    });

    return processedEvents;
  }, [events, venues]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'dj':
        return 'bg-[#4A90E2]';
      case 'live':
        return 'bg-[#E74C3C]';
      case 'performance':
        return 'bg-[#9B59B6]';
      case 'workshop':
        return 'bg-[#2ECC71]';
      case 'interaktiv':
        return 'bg-[#F39C12]';
      default:
        return 'bg-[#B8860B]';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const typeLabels = {
      dj: 'DJ',
      live: 'Live',
      performance: 'Performance',
      workshop: 'Workshop',
      interaktiv: 'Interaktiv'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  return (
    <div className="festival-grid-container relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="spider-web" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M50 0 L50 100 M0 50 L100 50 M15 15 L85 85 M85 15 L15 85" 
                    stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
              <circle cx="50" cy="50" r="2" fill="currentColor" opacity="0.4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#spider-web)"/>
        </svg>
      </div>

      <div className="festival-grid relative overflow-hidden rounded-lg" style={{ backgroundColor: '#3100a2' }}>
        <div className="grid-container overflow-auto max-h-[80vh]">
          <div className="festival-grid-main grid grid-cols-[100px_repeat(3,minmax(200px,1fr))] gap-0"
               style={{ gridTemplateRows: `60px repeat(${timeSlots.length}, 80px)` }}>
            
            {/* Header - Time and Venue labels */}
            <div className="sticky top-0 z-30 border-b-2 border-black 
                           flex items-center justify-center font-bold text-white px-2"
                 style={{ backgroundColor: '#4500e2' }}>
              Zeit
            </div>
            {venues.map((venue, index) => (
              <div key={venue}
                   className="sticky top-0 z-30 border-b-2 border-black border-l-2 
                             flex items-center justify-center font-bold text-white px-4 text-center"
                   style={{ 
                     backgroundColor: index === 0 ? 'hsl(195 90% 70%)' : 
                                      index === 1 ? 'hsl(250 80% 60%)' : 
                                      'hsl(280 70% 50%)' 
                   }}>
                {venueLabels[venue as keyof typeof venueLabels]}
              </div>
            ))}

            {/* Time slots and grid cells */}
            {timeSlots.map((slot, index) => {
              const isFirstSlotOfDay = (slot.day === 'Freitag' && slot.hour === 19) || 
                                      (slot.day === 'Samstag' && slot.hour === 0) || 
                                      (slot.day === 'Sonntag' && slot.hour === 0);
              
              return (
                <React.Fragment key={`${slot.day}-${slot.hour}`}>
                  {/* Time label */}
                  <div className="sticky left-0 z-20 border-b border-gray-600 
                                 flex flex-col items-center justify-center text-white text-sm px-2"
                       style={{ backgroundColor: '#4500e2' }}>
                    {isFirstSlotOfDay && (
                      <div className="font-bold text-xs mb-1">{slot.day}</div>
                    )}
                    <div className="font-medium">{slot.label}</div>
                  </div>
                  
                  {/* Venue cells */}
                  {venues.map((venue, venueIndex) => (
                    <div key={`${slot.day}-${slot.hour}-${venue}`}
                         className="relative border-b border-gray-600 border-l"
                         style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      {/* Empty cells - events are positioned on top */}
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
            
            {/* Event blocks - positioned within the grid */}
            {gridEvents.map(event => {
              // Calculate width and position for overlapping events
              const columnWidth = event.totalConflicts > 1 ? (100 / event.totalConflicts) : 100;
              const leftOffset = event.conflictIndex * columnWidth;
              
              // Calculate precise positioning
              const topOffset = (event.startMinuteOffset / 60) * 80; // 80px per hour
              
              // Calculate height based on duration
              const hoursDuration = event.duration / 60;
              const pixelHeight = hoursDuration * 80 - topOffset;
              
              return (
                <div
                  key={event.id}
                  className={`absolute z-20 ${getEventTypeColor(event.type)} 
                             rounded-md border-2 border-white/30 shadow-lg cursor-pointer 
                             transition-all duration-200 hover:scale-[1.02] hover:shadow-xl 
                             hover:border-white/50 hover:z-30 overflow-hidden`}
                  style={{
                    gridColumn: event.gridColumn,
                    gridRow: `${event.gridRowStart} / ${event.gridRowEnd}`,
                    width: `calc(${columnWidth}% - 8px)`,
                    left: `calc(${leftOffset}% + 4px)`,
                    marginTop: `${topOffset + 4}px`,
                    height: `calc(100% - ${topOffset + 8}px)`
                  }}
                  onClick={() => onEventClick(event)}
                >
                  <div className="p-2 h-full flex flex-col">
                    <div className="text-white">
                      <div className={`font-semibold leading-tight mb-1 ${
                        event.title.length > 25 ? 'text-xs' : 'text-sm'
                      }`}>
                        {event.title}
                      </div>
                      {pixelHeight > 50 && (
                        <>
                          <div className="text-xs text-white/90 font-medium">
                            {getEventTypeLabel(event.type)}
                          </div>
                          {pixelHeight > 70 && (
                            <div className="text-xs text-white/80 mt-auto">
                              {event.time}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <style>{`
        .festival-grid-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .festival-grid-main {
          position: relative;
        }
        .grid-container::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .grid-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 5px;
        }
        .grid-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 5px;
        }
        .grid-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        .grid-container::-webkit-scrollbar-corner {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default FestivalGrid;