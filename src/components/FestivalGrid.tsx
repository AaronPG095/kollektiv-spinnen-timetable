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
    const days = ['Freitag', 'Samstag', 'Sonntag'];
    
    // Friday 19:00-23:59
    for (let hour = 19; hour < 24; hour++) {
      slots.push({
        day: 'Freitag',
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        absoluteHour: hour - 19 // 0-based from Friday 19:00
      });
    }
    
    // Saturday 00:00-23:59
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        day: 'Samstag',
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        absoluteHour: hour + 5 // Continue from Friday
      });
    }
    
    // Sunday 00:00-20:00
    for (let hour = 0; hour <= 20; hour++) {
      slots.push({
        day: 'Sonntag',
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        absoluteHour: hour + 29 // Continue from Saturday
      });
    }
    
    return slots;
  }, []);

  // Convert time string and day to absolute minutes from festival start
  const timeToAbsoluteMinutes = (timeStr: string, day: string) => {
    if (!timeStr) return 0;
    const [hours, minutes = 0] = timeStr.split(':').map(Number);
    
    let dayOffset = 0;
    if (day === 'Samstag') {
      dayOffset = 5 * 60; // 5 hours from Friday 19:00 to Saturday 00:00
    } else if (day === 'Sonntag') {
      dayOffset = 29 * 60; // 29 hours from Friday 19:00 to Sunday 00:00
    }
    
    // For Friday, subtract 19 hours to make 19:00 = 0
    const adjustedHours = day === 'Freitag' ? hours - 19 : hours;
    
    return dayOffset + (adjustedHours * 60) + minutes;
  };

  // Process events for grid positioning with conflict detection
  const gridEvents = useMemo(() => {
    // Group events by venue
    const eventsByVenue: Record<string, GridEvent[]> = {
      draussen: [],
      oben: [],
      unten: []
    };

    // First pass: calculate basic positioning
    const processedEvents = events.map(event => {
      const [startTimeStr, endTimeStr] = (event.time || '19:00 - 20:00').split(' - ');
      const startMinutes = timeToAbsoluteMinutes(startTimeStr, event.day);
      const endMinutes = timeToAbsoluteMinutes(endTimeStr, event.day);
      
      // Handle cross-day events
      let adjustedEndMinutes = endMinutes;
      if (endMinutes < startMinutes) {
        // Event crosses midnight
        if (event.day === 'Freitag') {
          adjustedEndMinutes = timeToAbsoluteMinutes(endTimeStr, 'Samstag');
        } else if (event.day === 'Samstag') {
          adjustedEndMinutes = timeToAbsoluteMinutes(endTimeStr, 'Sonntag');
        }
      }
      
      const duration = adjustedEndMinutes - startMinutes;
      
      // Find grid row positions
      const startSlotIndex = timeSlots.findIndex(slot => {
        const slotMinutes = slot.absoluteHour * 60;
        return slotMinutes <= startMinutes && slotMinutes + 60 > startMinutes;
      });
      
      const endSlotIndex = timeSlots.findIndex(slot => {
        const slotMinutes = slot.absoluteHour * 60;
        return slotMinutes < adjustedEndMinutes && slotMinutes + 60 >= adjustedEndMinutes;
      });
      
      // Calculate minute offset within the start hour
      const startSlotMinutes = timeSlots[startSlotIndex]?.absoluteHour * 60 || 0;
      const minuteOffset = startMinutes - startSlotMinutes;
      
      const gridEvent: GridEvent = {
        ...event,
        startMinutes,
        endMinutes: adjustedEndMinutes,
        duration,
        gridRowStart: startSlotIndex + 2, // +2 for header
        gridRowEnd: Math.max(startSlotIndex + 2, endSlotIndex + 3), // +3 to include the end slot
        gridColumn: venues.indexOf(event.venue as any) + 2, // +2 for time column
        conflictIndex: 0,
        totalConflicts: 1,
        minuteOffset
      };
      
      return gridEvent;
    });

    // Second pass: detect conflicts and assign lanes
    processedEvents.forEach(event => {
      eventsByVenue[event.venue as keyof typeof eventsByVenue].push(event);
    });

    // For each venue, detect overlapping events
    Object.keys(eventsByVenue).forEach(venue => {
      const venueEvents = eventsByVenue[venue as keyof typeof eventsByVenue];
      
      // Sort by start time
      venueEvents.sort((a, b) => a.startMinutes - b.startMinutes);
      
      // Assign conflict lanes
      venueEvents.forEach((event, i) => {
        const overlappingEvents = venueEvents.filter((other, j) => {
          if (i === j) return false;
          // Check if events overlap
          return (
            (other.startMinutes < event.endMinutes && other.endMinutes > event.startMinutes)
          );
        });
        
        // Find available lane
        const usedLanes = overlappingEvents
          .filter(other => other.startMinutes < event.startMinutes)
          .map(other => other.conflictIndex);
        
        let lane = 0;
        while (usedLanes.includes(lane)) {
          lane++;
        }
        
        event.conflictIndex = lane;
        event.totalConflicts = Math.max(
          lane + 1,
          ...overlappingEvents.map(e => e.conflictIndex + 1),
          event.totalConflicts
        );
        
        // Update total conflicts for all overlapping events
        overlappingEvents.forEach(other => {
          other.totalConflicts = Math.max(other.totalConflicts, event.totalConflicts);
        });
      });
    });

    return processedEvents;
  }, [events, timeSlots]);

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
          <div className="grid grid-cols-[100px_repeat(3,minmax(200px,1fr))] gap-0"
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
                      {/* Events are rendered separately */}
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
            
            {/* Event blocks - rendered on top of grid */}
            {gridEvents.map(event => {
              const widthPercent = event.totalConflicts > 1 ? (100 / event.totalConflicts) : 100;
              const leftPercent = event.conflictIndex * widthPercent;
              const topOffset = (event.minuteOffset / 60) * 80; // 80px per hour
              
              return (
                <div
                  key={event.id}
                  className={`absolute z-20 ${getEventTypeColor(event.type)} 
                             rounded-md border-2 border-white/30 shadow-lg cursor-pointer 
                             transition-all duration-200 hover:scale-[1.02] hover:shadow-xl 
                             hover:border-white/50 hover:z-30 overflow-hidden`}
                  style={{
                    gridColumn: event.gridColumn,
                    gridRowStart: event.gridRowStart,
                    gridRowEnd: event.gridRowEnd,
                    width: `calc(${widthPercent}% - 6px)`,
                    left: `calc(${leftPercent}% + 3px)`,
                    top: `${topOffset}px`,
                    marginTop: '3px',
                    marginBottom: '3px'
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
                      {event.duration > 45 && (
                        <>
                          <div className="text-xs text-white/90 font-medium">
                            {getEventTypeLabel(event.type)}
                          </div>
                          <div className="text-xs text-white/80 mt-auto">
                            {event.time}
                          </div>
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