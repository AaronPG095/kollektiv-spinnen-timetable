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
  gridRow: number;
  gridColumn: number;
  gridColumnSpan: number;
  offsetPercent?: number;
  heightPercent?: number;
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
    
    for (const day of days) {
      const startHour = day === 'Freitag' ? 19 : 0;
      const endHour = day === 'Sonntag' ? 20 : 24;
      
      for (let hour = startHour; hour < endHour; hour++) {
        slots.push({
          day,
          hour,
          time: `${hour.toString().padStart(2, '0')}:00`,
          label: `${hour.toString().padStart(2, '0')}:00`
        });
      }
    }
    return slots;
  }, []);

  // Convert time string to minutes since start
  const timeToMinutes = (timeStr: string, day: string) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    
    // Add day offsets
    if (day === 'Samstag') {
      totalMinutes += 24 * 60; // Saturday starts 24 hours after Friday start
    } else if (day === 'Sonntag') {
      totalMinutes += 48 * 60; // Sunday starts 48 hours after Friday start
    }
    
    // Adjust for Friday starting at 19:00
    if (day === 'Freitag') {
      totalMinutes -= 19 * 60; // Subtract 19 hours to make 19:00 = 0 minutes
    } else {
      totalMinutes -= 19 * 60; // All times relative to Friday 19:00
    }
    
    return totalMinutes;
  };

  // Process events for grid positioning
  const gridEvents = useMemo(() => {
    const processedEvents: GridEvent[] = [];
    
    // Group events by venue to handle overlaps
    const eventsByVenue = venues.reduce((acc, venue) => {
      acc[venue] = [];
      return acc;
    }, {} as Record<string, GridEvent[]>);

    events.forEach(event => {
      const startMinutes = timeToMinutes(event.startTime || event.time?.split(' - ')[0] || '19:00', event.day);
      const endTime = event.endTime || event.time?.split(' - ')[1] || `${Math.floor((startMinutes + 60) / 60)}:${(startMinutes + 60) % 60}`;
      const endMinutes = timeToMinutes(endTime, event.day);
      const duration = endMinutes - startMinutes;
      
      // Calculate grid position - find the hour slot this event starts in
      const startSlotIndex = timeSlots.findIndex(slot => {
        const slotMinutes = timeToMinutes(slot.time, slot.day);
        return slotMinutes <= startMinutes && slotMinutes + 60 > startMinutes;
      });
      
      const gridRow = startSlotIndex + 2; // +2 for header row (removed sub-header)
      const gridColumn = venues.indexOf(event.venue as any) + 2; // +2 for time column
      
      // Calculate exact position within the hour cell
      const slotStartMinutes = timeToMinutes(timeSlots[startSlotIndex]?.time || '19:00', timeSlots[startSlotIndex]?.day || 'Freitag');
      const offsetWithinHour = startMinutes - slotStartMinutes; // Minutes from start of hour
      const offsetPercent = (offsetWithinHour / 60) * 100; // Percentage from top of hour cell
      const heightPercent = Math.min((duration / 60) * 100, 100); // Height as percentage, max 100%

      const gridEvent: GridEvent = {
        ...event,
        startMinutes,
        endMinutes,
        duration,
        gridRow,
        gridColumn,
        gridColumnSpan: 1, // Always span 1 column
        offsetPercent,
        heightPercent
      };

      eventsByVenue[event.venue as keyof typeof eventsByVenue].push(gridEvent);
      processedEvents.push(gridEvent);
    });

    return processedEvents;
  }, [events, timeSlots]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'dj':
        return 'bg-[#4A90E2]';
      case 'live':
      case 'performance':
      case 'workshop':
      case 'interaktiv':
        return 'bg-[#B8860B]';
      default:
        return 'bg-[#4A90E2]';
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
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="spider-web" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M50 0 L50 100 M0 50 L100 50 M15 15 L85 85 M85 15 L15 85" 
                    stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3"/>
              <circle cx="50" cy="50" r="2" fill="hsl(var(--primary))" opacity="0.4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#spider-web)"/>
        </svg>
      </div>

      <div className="festival-grid relative" style={{ backgroundColor: '#3100a2' }}>
        <div className="grid-container overflow-x-auto">
          <div className="grid grid-cols-[120px_repeat(3,1fr)] gap-0 min-w-[600px]"
               style={{ gridTemplateRows: `60px repeat(${timeSlots.length}, 60px)` }}>
            
            {/* Header - Time and Venue labels */}
            <div className="sticky top-0 z-30 border-b-2 border-black 
                           flex items-center justify-center font-bold text-white px-4"
                 style={{ backgroundColor: '#4500e2' }}>
              Zeit
            </div>
            <div className="sticky top-0 z-30 border-b-2 border-black border-l-2 
                           flex items-center justify-center font-bold text-white px-4 text-center"
                 style={{ backgroundColor: 'hsl(195 90% 70%)' }}>
              {venueLabels.draussen}
            </div>
            <div className="sticky top-0 z-30 border-b-2 border-black border-l-2 
                           flex items-center justify-center font-bold text-white px-4 text-center"
                 style={{ backgroundColor: 'hsl(250 80% 60%)' }}>
              {venueLabels.oben}
            </div>
            <div className="sticky top-0 z-30 border-b-2 border-black border-l-2 
                           flex items-center justify-center font-bold text-white px-4 text-center"
                 style={{ backgroundColor: 'hsl(280 70% 50%)' }}>
              {venueLabels.unten}
            </div>

            {/* Time slots and grid cells */}
            {timeSlots.map((slot, index) => {
              const isFirstSlotOfDay = (slot.day === 'Freitag' && slot.hour === 19) || 
                                      (slot.day === 'Samstag' && slot.hour === 0) || 
                                      (slot.day === 'Sonntag' && slot.hour === 0);
              const dayLabel = slot.day === 'Freitag' ? 'Freitag' : 
                              slot.day === 'Samstag' ? 'Samstag' : 'Sonntag';
              
              return (
                <React.Fragment key={`${slot.day}-${slot.hour}`}>
                  {/* Time label with day label for first slot of each day */}
                  <div className="sticky left-0 z-10 border-b-2 border-black 
                                 flex flex-col items-center justify-center text-white text-sm px-2 py-1"
                       style={{ backgroundColor: '#4500e2' }}>
                    {isFirstSlotOfDay ? (
                      <div className="font-bold text-xs">{dayLabel}</div>
                    ) : (
                      <div className="font-medium">{slot.label}</div>
                    )}
                  </div>
                  
                  {/* Venue cells */}
                  {venues.map((venue, venueIndex) => (
                    <div key={`${slot.day}-${slot.hour}-${venue}`}
                         className={`relative border-b-2 border-black min-h-[60px] ${
                           venueIndex > 0 ? 'border-l-2' : ''
                         }`}
                         style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                    </div>
                  ))}
                </React.Fragment>
              );
            })}

            {/* Event blocks */}
            {gridEvents.map(event => (
              <div
                key={event.id}
                className={`absolute z-20 ${getEventTypeColor(event.type)} 
                           rounded-lg border border-white/20 shadow-lg cursor-pointer 
                           transition-all duration-200 hover:scale-105 hover:shadow-xl 
                           hover:border-white/40 p-2 m-1`}
                style={{
                  gridRow: event.gridRow,
                  gridColumn: event.gridColumn,
                  top: `${(event.offsetPercent || 0)}%`,
                  height: `${Math.max(20, event.heightPercent || 100)}%`,
                  left: '2px',
                  right: '2px'
                }}
                onClick={() => onEventClick(event)}
              >
                <div className="text-white">
                  <div className={`font-semibold leading-tight mb-1 ${
                    event.title.length > 20 ? 'text-xs' : 
                    event.title.length > 15 ? 'text-sm' : 'text-sm'
                  }`}>
                    {event.title}
                  </div>
                  <div className="text-xs text-white/80 mb-1">
                    {getEventTypeLabel(event.type)}
                  </div>
                  <div className="text-xs text-white/70">
                    {event.startTime || event.time?.split(' - ')[0]} - {event.endTime || event.time?.split(' - ')[1]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        .festival-grid-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .grid-container {
          max-height: 80vh;
        }
        .grid-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .grid-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .grid-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .grid-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default FestivalGrid;