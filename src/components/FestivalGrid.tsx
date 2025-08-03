import React, { useMemo, useState, useRef, useEffect } from 'react';
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const lastDistanceRef = useRef<number>(0);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to translate day names
  const translateDay = (day: string): string => {
    const dayKey = day.toLowerCase();
    return t(dayKey) || day;
  };

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
      const startParts = startTimeStr.trim().split(':');
      const endParts = endTimeStr.trim().split(':');
      
      const startHour = parseInt(startParts[0], 10);
      const startMin = startParts[1] ? parseInt(startParts[1], 10) : 0;
      const endHour = parseInt(endParts[0], 10);
      const endMin = endParts[1] ? parseInt(endParts[1], 10) : 0;
      
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
      
      // Calculate total minutes for overlap detection
      const startTotalMinutes = startSlotIndex * 60 + startMin;
      const endTotalMinutes = endSlotIndex * 60 + endMin;
      
      // Calculate actual duration in minutes - simplified and corrected
      let durationMinutes = 0;
      
      // If event is within the same day
      if (endHour >= startHour || (endHour < startHour && event.day !== 'Freitag' && event.day !== 'Samstag')) {
        // Simple case: end hour is after start hour
        durationMinutes = (endHour - startHour) * 60 + endMin - startMin;
      } else {
        // Cross-day event
        durationMinutes = (24 - startHour + endHour) * 60 - startMin + endMin;
      }
      
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
        duration: durationMinutes,
        gridRowStart: startSlotIndex + 2, // +2 for header row (1-indexed + 1 for header)
        gridRowEnd: endSlotIndex + 2 + (endMin > 0 ? 1 : 0), // Extend to next row if minutes > 0
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
        return 'bg-[rgba(233,30,99,0.9)]'; // Hot pink
      case 'live':
        return 'bg-[rgba(156,39,176,0.9)]'; // Purple
      case 'performance':
        return 'bg-[rgba(103,58,183,0.9)]'; // Deep purple
      case 'workshop':
        return 'bg-[rgba(33,150,243,0.9)]'; // Light blue
      case 'interaktiv':
        return 'bg-[rgba(0,188,212,0.9)]'; // Cyan
      default:
        return 'bg-[rgba(103,58,183,0.9)]';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'dj': 'DJ',
      'live': 'Live-Konzert',
      'performance': 'Performance',
      'workshop': 'Workshop',
      'interaktiv': 'Interaktiv'
    };
    return typeLabels[type] || type.toUpperCase();
  };

  // Handle pinch-to-zoom on touch devices
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        setIsPinching(true);
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        lastDistanceRef.current = distance;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        if (lastDistanceRef.current > 0) {
          const scale = distance / lastDistanceRef.current;
          setZoomLevel(prevZoom => {
            const newZoom = prevZoom * scale;
            return Math.min(Math.max(newZoom, 0.5), 3); // Limit zoom between 0.5x and 3x
          });
        }
        
        lastDistanceRef.current = distance;
      }
    };

    const handleTouchEnd = () => {
      setIsPinching(false);
      lastDistanceRef.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPinching]);

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

      <div className="festival-grid relative overflow-hidden rounded-lg max-w-[1200px] mx-auto" style={{ backgroundColor: '#0B0E1F' }}>
        {/* Zoom controls for desktop only */}
        <div className="absolute top-2 right-2 z-40 hidden md:flex gap-2">
          <button 
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
            className="bg-gray-800/60 hover:bg-gray-700/80 text-white rounded px-3 py-1 text-sm font-medium transition-colors backdrop-blur-sm"
            aria-label="Zoom out"
          >
            -
          </button>
          <span className="bg-gray-800/60 text-white rounded px-3 py-1 text-sm backdrop-blur-sm">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button 
            onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
            className="bg-gray-800/60 hover:bg-gray-700/80 text-white rounded px-3 py-1 text-sm font-medium transition-colors backdrop-blur-sm"
            aria-label="Zoom in"
          >
            +
          </button>
          {zoomLevel !== 1 && (
            <button 
              onClick={() => setZoomLevel(1)}
              className="bg-gray-800/60 hover:bg-gray-700/80 text-white rounded px-2 py-1 text-sm font-medium transition-colors ml-1 backdrop-blur-sm"
              aria-label="Reset zoom"
            >
              Reset
            </button>
          )}
        </div>
        
        <div ref={gridContainerRef} className="grid-container overflow-auto max-h-[70vh]" style={{ touchAction: 'pan-x pan-y' }}>
          <div style={{ width: `${100 * zoomLevel}%`, minWidth: '100%' }}>
          <div className="festival-grid-main grid gap-0"
               style={{ 
                 gridTemplateColumns: '80px 60px repeat(3, minmax(200px, 1fr))',
                 gridTemplateRows: `60px repeat(${timeSlots.length}, 70px)`,
                 overflow: 'visible',
                 transform: `scale(${zoomLevel})`,
                 transformOrigin: 'top left',
                 transition: isPinching ? 'none' : 'transform 0.2s ease'
               }}>
            
            {/* Header - Day, Time and Venue labels */}
            <div className="sticky top-0 z-30 border-b-2 border-gray-700 border-r-2 
                           flex items-center justify-center font-bold text-cyan-300 px-2 uppercase tracking-wider"
                 style={{ backgroundColor: '#0F1729' }}>
              {t('day')}
            </div>
            <div className="sticky top-0 z-30 border-b-2 border-gray-700 border-r-2
                           flex items-center justify-center font-bold text-cyan-300 px-2 uppercase tracking-wider"
                 style={{ backgroundColor: '#0F1729' }}>
              {t('time')}
            </div>
            {venues.map((venue, index) => (
              <div key={venue}
                   className="sticky top-0 z-30 border-b-2 border-gray-700 border-r-2 
                             flex items-center justify-center font-bold text-white px-4 text-center tracking-wider uppercase"
                   style={{ 
                     backgroundColor: index === 0 ? '#1B5E7C' : // Teal/dark cyan for Neue Ufer 
                                      index === 1 ? '#2E1A47' : // Dark purple for Salon
                                      index === 2 ? '#6B1F49' : // Dark pink/magenta for Flora
                                      '#2E1A47'
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
                    <div className="sticky left-0 z-20 border-b border-gray-800 border-r-2
                                   flex items-center justify-center text-cyan-300 font-bold text-lg px-2 tracking-wider"
                         style={{ 
                           backgroundColor: '#1A2238',
                           gridRowEnd: `span ${daySpan}`,
                           writingMode: 'vertical-rl',
                           textOrientation: 'mixed'
                         }}>
                      {translateDay(slot.day).toUpperCase()}
                    </div>
                  ) : (
                    <div style={{ display: 'none' }}></div>
                  )}
                  
                  {/* Time label */}
                  {/* Add a stronger border between days */}
                  {(() => {
                    const isLastSlotOfDay = (slot.day === 'Freitag' && slot.hour === 23) || 
                                           (slot.day === 'Samstag' && slot.hour === 23);
                    
                    return (
                      <div className={`sticky left-0 z-20 border-b border-gray-800 border-r-2
                                     flex items-center justify-center text-gray-400 text-sm px-2 ${
                                     isLastSlotOfDay ? 'border-b-2 border-b-gray-600' : ''
                                   }`}
                           style={{ 
                             backgroundColor: '#1A2238'
                           }}>
                        <div className="font-medium">{slot.label}</div>
                      </div>
                    );
                  })()}
                  
                  {/* Venue cells */}
                  {venues.map((venue, venueIndex) => {
                    const cellKey = `${venueIndex + 3}-${index + 2}`;
                    const cellEvents = eventsByCell.get(cellKey) || [];
                    
                    // Add a stronger border between days
                    const isLastSlotOfDay = (slot.day === 'Freitag' && slot.hour === 23) || 
                                           (slot.day === 'Samstag' && slot.hour === 23);
                    
                    return (
                       <div key={`${slot.day}-${slot.hour}-${venue}`}
                            className={`relative border-b border-gray-800 border-r border-gray-800 bg-background/10 ${
                              isLastSlotOfDay ? 'border-b-2 border-b-gray-600' : ''
                            }`}
                            style={{ 
                              overflow: 'visible'
                            }}>
                        {/* Render events that start in this cell */}
                        {cellEvents.map(event => {
                          const widthPercent = event.totalLanes > 1 ? (100 / event.totalLanes) : 100;
                          const leftPercent = event.totalLanes > 1 ? (event.lane * widthPercent) : 0;
                          const topOffset = (event.minuteOffset / 60) * 100; // percentage of cell height
                          
                          // Calculate actual height based on duration in minutes
                          const durationInMinutes = event.duration;
                          const pixelsPerMinute = 70 / 60; // 70px per hour = 1.167px per minute
                          const heightInPixels = durationInMinutes * pixelsPerMinute;
                          
                          return (
                            <div
                              key={event.id}
                              className={`absolute z-20 ${getEventTypeColor(event.type)} 
                                         rounded-md border-2 border-white/30 shadow-lg cursor-pointer 
                                         transition-all duration-200 hover:scale-[1.02] hover:shadow-xl 
                                         hover:border-white/50 hover:z-30 overflow-hidden`}
                              style={{
                                width: `${widthPercent}%`,
                                left: `${leftPercent}%`,
                                top: `${topOffset}%`,
                                height: `${heightInPixels}px`
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
      </div>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quantico:wght@400;700&display=swap');
        
        .festival-grid-container {
          font-family: 'Quantico', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: white;
        }
        .festival-grid-main {
          position: relative;
        }
        .grid-container::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .grid-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.4);
          border-radius: 5px;
        }
        .grid-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 5px;
        }
        .grid-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .grid-container::-webkit-scrollbar-corner {
          background: rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
};

export default FestivalGrid;