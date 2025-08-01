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
  minuteOffset: number;
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

  // Check if two events actually overlap in time
  const eventsOverlap = (event1: GridEvent, event2: GridEvent): boolean => {
    // Events overlap if one starts before the other ends (with some buffer)
    const buffer = 15; // 15 minute buffer between events
    return (event1.startMinutes < event2.endMinutes - buffer) && 
           (event2.startMinutes < event1.endMinutes - buffer);
  };

  // Process events for grid positioning with improved conflict detection
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
      
      // If event ends with minutes > 0, it extends into the next hour
      if (endMin > 0) {
        endSlotIndex++;
      }
      
      // Ensure valid slot indices
      if (startSlotIndex === -1 || endSlotIndex === -1) {
        console.warn(`Invalid time for event ${event.title}: ${event.time} on ${event.day}`);
        return null;
      }
      
      // Calculate total minutes for overlap detection
      const startTotalMinutes = startSlotIndex * 60 + startMin;
      const endTotalMinutes = endSlotIndex * 60 + endMin;
      
      // Determine correct venue column with fallback
      const venueIndex = venues.indexOf(event.venue as any);
      if (venueIndex === -1) {
        console.warn(`Unknown venue "${event.venue}" for event "${event.title}". Available venues:`, venues);
        return null;
      }
      
      const gridEvent: GridEvent = {
        ...event,
        startMinutes: startTotalMinutes,
        endMinutes: endTotalMinutes,
        duration: endTotalMinutes - startTotalMinutes,
        gridRowStart: startSlotIndex + 2, // +2 for header row (1-indexed + 1 for header)
        gridRowEnd: endSlotIndex + 2,
        gridColumn: venueIndex + 3, // +3 for day and time columns
        lane: 0,
        totalLanes: 1,
        minuteOffset: startMin
      };
      
      return gridEvent;
    }).filter(Boolean) as GridEvent[];

    // Second pass: group by venue
    processedEvents.forEach(event => {
      const venue = event.venue as keyof typeof eventsByVenue;
      if (venue in eventsByVenue) {
        eventsByVenue[venue].push(event);
      }
    });

    // Third pass: detect actual overlaps and assign lanes
    Object.keys(eventsByVenue).forEach(venue => {
      const venueEvents = eventsByVenue[venue as keyof typeof eventsByVenue];
      
      if (venueEvents.length <= 1) {
        // Single event or no events - takes full width
        venueEvents.forEach(event => {
          event.lane = 0;
          event.totalLanes = 1;
        });
        return;
      }

      // Sort by start time for processing
      venueEvents.sort((a, b) => a.startMinutes - b.startMinutes);
      
      // Build overlap groups
      const overlapGroups: GridEvent[][] = [];
      
      venueEvents.forEach(currentEvent => {
        // Find which group this event belongs to (if any)
        let foundGroup = false;
        
        for (const group of overlapGroups) {
          // Check if current event overlaps with any event in this group
          const overlapsWithGroup = group.some(groupEvent => 
            eventsOverlap(currentEvent, groupEvent)
          );
          
          if (overlapsWithGroup) {
            group.push(currentEvent);
            foundGroup = true;
            break;
          }
        }
        
        // If no overlapping group found, create a new one
        if (!foundGroup) {
          overlapGroups.push([currentEvent]);
        }
      });

      // Assign lanes within each overlap group
      overlapGroups.forEach(group => {
        if (group.length === 1) {
          // Single event in group - takes full width
          group[0].lane = 0;
          group[0].totalLanes = 1;
        } else {
          // Multiple overlapping events - assign lanes
          group.sort((a, b) => a.startMinutes - b.startMinutes);
          
          const lanes: GridEvent[][] = [];
          
          group.forEach(event => {
            // Find first available lane
            let assignedLane = -1;
            
            for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
              const lane = lanes[laneIndex];
              const lastEventInLane = lane[lane.length - 1];
              
              // Check if this event can fit in this lane
              if (!eventsOverlap(event, lastEventInLane)) {
                lane.push(event);
                assignedLane = laneIndex;
                break;
              }
            }
            
            // If no available lane, create new one
            if (assignedLane === -1) {
              lanes.push([event]);
              assignedLane = lanes.length - 1;
            }
            
            event.lane = assignedLane;
            event.totalLanes = lanes.length;
          });
          
          // Ensure all events in group have same totalLanes
          const maxLanes = Math.max(...group.map(e => e.totalLanes));
          group.forEach(event => {
            event.totalLanes = maxLanes;
          });
        }
      });
    });

    return processedEvents;
  }, [events]);

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

  // Group events by their grid cell for easier rendering
  const eventsByCell = useMemo(() => {
    const cellMap = new Map<string, GridEvent[]>();
    
    gridEvents.forEach(event => {
      // Create a key for each starting cell
      const cellKey = `${event.gridColumn}-${event.gridRowStart}`;
      if (!cellMap.has(cellKey)) {
        cellMap.set(cellKey, []);
      }
      cellMap.get(cellKey)!.push(event);
    });
    
    return cellMap;
  }, [gridEvents]);

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
          <div className="festival-grid-main grid gap-0"
               style={{ 
                 gridTemplateColumns: '80px 60px repeat(3, 1fr)',
                 gridTemplateRows: `60px repeat(${timeSlots.length}, 80px)` 
               }}>
            
            {/* Header - Day, Time and Venue labels */}
            <div className="sticky top-0 z-30 border-b-2 border-black border-r-2 
                           flex items-center justify-center font-bold text-white px-2"
                 style={{ backgroundColor: '#4500e2' }}>
              Tag
            </div>
            <div className="sticky top-0 z-30 border-b-2 border-black border-r-2
                           flex items-center justify-center font-bold text-white px-2"
                 style={{ backgroundColor: '#4500e2' }}>
              Zeit
            </div>
            {venues.map((venue, index) => (
              <div key={venue}
                   className="sticky top-0 z-30 border-b-2 border-black border-r-2 
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
              
              // Calculate how many slots this day spans
              let daySpan = 1;
              if (isFirstSlotOfDay) {
                if (slot.day === 'Freitag') {
                  daySpan = 5; // 19:00-23:59 (5 hours)
                } else if (slot.day === 'Samstag') {
                  daySpan = 24; // 00:00-23:59 (24 hours)
                } else if (slot.day === 'Sonntag') {
                  daySpan = 21; // 00:00-20:00 (21 hours)
                }
              }
              
              return (
                <React.Fragment key={`${slot.day}-${slot.hour}`}>
                  {/* Day label (only for first slot of each day) */}
                  {isFirstSlotOfDay ? (
                    <div className="sticky left-0 z-20 border-b border-gray-600 border-r-2
                                   flex items-center justify-center text-white font-bold text-lg px-2"
                         style={{ 
                           backgroundColor: '#4500e2',
                           gridRowEnd: `span ${daySpan}`,
                           writingMode: 'vertical-rl',
                           textOrientation: 'mixed'
                         }}>
                      {slot.day.toUpperCase()}
                    </div>
                  ) : (
                    <div style={{ display: 'none' }}></div>
                  )}
                  
                  {/* Time label */}
                  <div className="sticky left-0 z-20 border-b border-gray-600 border-r-2
                                 flex items-center justify-center text-white text-sm px-2"
                       style={{ backgroundColor: '#4500e2' }}>
                    <div className="font-medium">{slot.label}</div>
                  </div>
                  
                  {/* Venue cells */}
                  {venues.map((venue, venueIndex) => {
                    const cellKey = `${venueIndex + 3}-${index + 2}`;
                    const cellEvents = eventsByCell.get(cellKey) || [];
                    
                    return (
                      <div key={`${slot.day}-${slot.hour}-${venue}`}
                           className="relative border-b border-gray-600 border-r"
                           style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                        {/* Render events that start in this cell */}
                        {cellEvents.map(event => {
                          const widthPercent = event.totalLanes > 1 ? (100 / event.totalLanes) : 100;
                          const leftPercent = event.totalLanes > 1 ? (event.lane * widthPercent) : 0;
                          const topOffset = (event.minuteOffset / 60) * 100; // percentage of cell height
                          const heightInCells = event.gridRowEnd - event.gridRowStart;
                          const heightPercent = ((heightInCells * 80 - (event.minuteOffset / 60) * 80) / 80) * 100;
                          
                          return (
                            <div
                              key={event.id}
                              className={`absolute z-10 ${getEventTypeColor(event.type)} 
                                         rounded-md border-2 border-white/30 shadow-lg cursor-pointer 
                                         transition-all duration-200 hover:scale-[1.02] hover:shadow-xl 
                                         hover:border-white/50 hover:z-30 overflow-hidden`}
                              style={{
                                width: `${widthPercent}%`,
                                left: `${leftPercent}%`,
                                top: `${topOffset}%`,
                                height: `${heightPercent}%`,
                                minHeight: `${(heightInCells - 1) * 80 + (80 - (event.minuteOffset / 60) * 80)}px`
                              }}
                              onClick={() => onEventClick(event)}
                            >
                              <div className="h-full flex items-center justify-center text-center p-2">
                                <div className="text-white">
                                  <div className={`font-semibold leading-tight ${
                                    event.title.length > 25 ? 'text-sm' : 'text-base'
                                  }`}>
                                    {event.title}
                                  </div>
                                  {event.duration >= 60 && (
                                    <div className="text-sm text-white/80 mt-1">
                                      {event.time}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
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