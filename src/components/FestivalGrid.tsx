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
    const dayOffset = day === 'Freitag' ? 0 : day === 'Samstag' ? 24 : 48;
    const adjustedHours = day === 'Freitag' && hours < 19 ? hours + 24 : hours;
    return (adjustedHours + dayOffset) * 60 + minutes;
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
      const endMinutes = timeToMinutes(event.endTime || event.time?.split(' - ')[1] || (startMinutes + 60).toString(), event.day);
      const duration = Math.max(60, endMinutes - startMinutes); // Minimum 1 hour
      
      // Calculate grid position
      const startSlotIndex = timeSlots.findIndex(slot => {
        const slotMinutes = timeToMinutes(slot.time, slot.day);
        return slotMinutes <= startMinutes && slotMinutes + 60 > startMinutes;
      });
      
      const gridRow = startSlotIndex + 2; // +2 for header rows
      const gridColumn = venues.indexOf(event.venue as any) + 2; // +2 for time column
      const gridColumnSpan = Math.ceil(duration / 60);

      const gridEvent: GridEvent = {
        ...event,
        startMinutes,
        endMinutes,
        duration,
        gridRow,
        gridColumn,
        gridColumnSpan
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

      <div className="festival-grid relative bg-gradient-to-br from-purple-900/80 via-purple-800/70 to-indigo-900/80 
                      backdrop-blur-sm border border-border/30 rounded-lg overflow-hidden">
        <div className="grid-container overflow-x-auto">
          <div className="grid grid-cols-[120px_repeat(3,1fr)] gap-0 min-w-[600px]"
               style={{ gridTemplateRows: `60px 40px repeat(${timeSlots.length}, 60px)` }}>
            
            {/* Header - Day labels */}
            <div className="sticky top-0 z-30 bg-purple-900/90 backdrop-blur-sm border-b border-border/30 
                           flex items-center justify-center font-bold text-white px-4">
              Zeit
            </div>
            {venues.map(venue => (
              <div key={venue} 
                   className="sticky top-0 z-30 bg-purple-900/90 backdrop-blur-sm border-b border-border/30 
                             flex items-center justify-center font-bold text-white px-4 text-center">
                {venueLabels[venue]}
              </div>
            ))}

            {/* Sub-header - Venue type indicators */}
            <div className="sticky top-[60px] z-20 bg-purple-800/80 backdrop-blur-sm border-b border-border/30 
                           flex items-center justify-center text-xs text-white/70 px-4">
              Uhrzeit
            </div>
            {venues.map(venue => (
              <div key={`${venue}-sub`} 
                   className="sticky top-[60px] z-20 bg-purple-800/80 backdrop-blur-sm border-b border-border/30 
                             flex items-center justify-center text-xs text-white/70 px-4 text-center">
                {venue === 'draussen' ? 'Outdoor' : venue === 'oben' ? 'Upstairs' : 'Downstairs'}
              </div>
            ))}

            {/* Time slots and grid cells */}
            {timeSlots.map((slot, index) => (
              <React.Fragment key={`${slot.day}-${slot.hour}`}>
                {/* Time label */}
                <div className="sticky left-0 z-10 bg-purple-800/80 backdrop-blur-sm border-r border-border/30 
                               flex flex-col items-center justify-center text-white text-sm px-2 py-1">
                  <div className="font-medium">{slot.label}</div>
                  <div className="text-xs text-white/60">{slot.day.slice(0, 2)}</div>
                </div>
                
                {/* Venue cells */}
                {venues.map(venue => (
                  <div key={`${slot.day}-${slot.hour}-${venue}`}
                       className="relative border-r border-b border-border/20 min-h-[60px] bg-black/10">
                  </div>
                ))}
              </React.Fragment>
            ))}

            {/* Event blocks */}
            {gridEvents.map(event => (
              <div
                key={event.id}
                className={`absolute z-20 ${getEventTypeColor(event.type)} 
                           rounded-lg border border-white/20 shadow-lg cursor-pointer 
                           transition-all duration-200 hover:scale-105 hover:shadow-xl 
                           hover:border-white/40 p-2 m-1`}
                style={{
                  gridRow: `${event.gridRow} / span ${Math.max(1, Math.ceil(event.duration / 60))}`,
                  gridColumn: event.gridColumn,
                  minHeight: `${Math.max(56, (event.duration / 60) * 60 - 8)}px`
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