import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Event } from '@/components/EventCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  unten: '2000er'
};

const FestivalGrid: React.FC<FestivalGridProps> = ({ events, onEventClick }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Zoom state with smooth interpolation
  const [displayZoom, setDisplayZoom] = useState(1);
  const targetZoomRef = useRef(1);
  const animationRef = useRef<number>();
  
  const [isPinching, setIsPinching] = useState(false);
  const lastDistanceRef = useRef<number>(0);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollViewportRef = useRef<HTMLElement | null>(null);
  
  // Set viewport ref when container is ready
  useEffect(() => {
    if (gridContainerRef.current) {
      scrollViewportRef.current = gridContainerRef.current;
    }
  }, []);
  
  // Visible time range indicator
  const [visibleTimeRange, setVisibleTimeRange] = useState<{ start: string; end: string } | null>(null);
  
  // Mobile gesture hint
  const [showGestureHint, setShowGestureHint] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('festival-grid-gesture-hint-dismissed');
    }
    return false;
  });

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

  // Get event type color matching the list view styling
  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case 'dj':
        return 'rgba(233,30,99,0.9)'; // Hot pink
      case 'live':
        return 'rgba(156,39,176,0.9)'; // Purple
      case 'performance':
        return 'rgba(103,58,183,0.9)'; // Deep purple
      case 'workshop':
        return 'rgba(33,150,243,0.9)'; // Light blue
      case 'interaktiv':
        return 'rgba(0,188,212,0.9)'; // Cyan
      default:
        return 'rgba(103,58,183,0.9)';
    }
  };

  // Helper function to calculate responsive text size based on card dimensions and title length
  const getTextSizeClass = (duration: number, titleLength: number, heightInPixels: number): string => {
    // Determine text size based on height (more important factor)
    let heightFactor: 'xs' | 'sm' | 'base' | 'lg';
    if (heightInPixels < 30) {
      heightFactor = 'xs';
    } else if (heightInPixels < 50) {
      heightFactor = 'xs';
    } else if (heightInPixels < 70) {
      heightFactor = 'sm';
    } else if (heightInPixels < 100) {
      heightFactor = 'base';
    } else {
      heightFactor = 'lg';
    }
    
    // Adjust based on title length
    let lengthFactor: 'xs' | 'sm' | 'base' | 'lg';
    if (titleLength > 40) {
      lengthFactor = 'xs';
    } else if (titleLength > 25) {
      lengthFactor = 'sm';
    } else if (titleLength > 15) {
      lengthFactor = 'base';
    } else {
      lengthFactor = 'lg';
    }
    
    // Return the smaller of the two to ensure text fits
    const sizes: ('xs' | 'sm' | 'base' | 'lg')[] = ['xs', 'sm', 'base', 'lg'];
    const heightIndex = sizes.indexOf(heightFactor);
    const lengthIndex = sizes.indexOf(lengthFactor);
    const finalSize = sizes[Math.min(heightIndex, lengthIndex)];
    
    return `text-${finalSize}`;
  };

  // Helper function to determine max lines based on card height
  const getMaxLines = (heightInPixels: number): number => {
    if (heightInPixels < 40) return 1;
    if (heightInPixels < 70) return 2;
    if (heightInPixels < 100) return 3;
    return 4;
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

  // Smooth zoom interpolation
  useEffect(() => {
    const animate = () => {
      setDisplayZoom(prev => {
        const diff = targetZoomRef.current - prev;
        if (Math.abs(diff) < 0.01) {
          return targetZoomRef.current;
        }
        return prev + diff * 0.15; // Smooth interpolation factor
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Zoom-to-point handler
  const handleZoom = useCallback((newZoom: number, centerX?: number, centerY?: number) => {
    const container = scrollViewportRef.current || gridContainerRef.current;
    if (!container) {
      targetZoomRef.current = Math.min(Math.max(newZoom, 0.5), 3);
      return;
    }

    // If no center point provided, use container center
    const rect = container.getBoundingClientRect();
    const defaultCenterX = centerX ?? rect.width / 2;
    const defaultCenterY = centerY ?? rect.height / 2;

    // Calculate scroll position to keep center point stable
    const scrollCenterX = container.scrollLeft + defaultCenterX;
    const scrollCenterY = container.scrollTop + defaultCenterY;

    const currentZoom = displayZoom;
    const zoomRatio = newZoom / currentZoom;

    // Update zoom level
    targetZoomRef.current = Math.min(Math.max(newZoom, 0.5), 3);

    // Adjust scroll position after zoom to keep the same content point centered
    requestAnimationFrame(() => {
      if (container) {
        const newScrollLeft = scrollCenterX * zoomRatio - defaultCenterX;
        const newScrollTop = scrollCenterY * zoomRatio - defaultCenterY;
        container.scrollLeft = Math.max(0, newScrollLeft);
        container.scrollTop = Math.max(0, newScrollTop);
      }
    });
  }, [displayZoom]);

  // Scroll to specific time slot
  const scrollToTime = useCallback((targetSlotIndex: number, smooth = true) => {
    const container = scrollViewportRef.current || gridContainerRef.current;
    if (!container) {
      console.warn('Scroll container not found');
      return;
    }

    const baseRowHeight = 70;
    const baseHeaderHeight = 60;
    const rowHeight = baseRowHeight * displayZoom;
    const headerHeight = baseHeaderHeight * displayZoom;
    const targetScrollTop = headerHeight + (targetSlotIndex * rowHeight) - (container.clientHeight / 3);

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, [displayZoom]);

  // Scroll to current time
  const scrollToNow = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleDateString('de-DE', { weekday: 'long' });
    const slotIndex = getSlotIndex(currentHour, currentDay);
    if (slotIndex >= 0) {
      scrollToTime(slotIndex);
    }
  }, [scrollToTime]);

  // Scroll to specific day
  const scrollToDay = useCallback((day: string) => {
    let slotIndex = 0;
    if (day === 'Freitag') {
      slotIndex = 0; // First slot of Friday
    } else if (day === 'Samstag') {
      slotIndex = 5; // First slot of Saturday (after 5 Friday slots)
    } else if (day === 'Sonntag') {
      slotIndex = 29; // First slot of Sunday (after 5 + 24 slots)
    }
    scrollToTime(slotIndex);
  }, [scrollToTime]);

  // Track visible time range
  const handleScroll = useCallback(() => {
    const container = scrollViewportRef.current || gridContainerRef.current;
    if (!container) return;

    const baseRowHeight = 70;
    const baseHeaderHeight = 60;
    const rowHeight = baseRowHeight * displayZoom;
    const headerHeight = baseHeaderHeight * displayZoom;
    const scrollTop = container.scrollTop;

    const startSlot = Math.floor((scrollTop - headerHeight) / rowHeight);
    const visibleSlots = Math.ceil(container.clientHeight / rowHeight);
    const endSlot = Math.min(startSlot + visibleSlots, timeSlots.length - 1);

    const startTime = timeSlots[Math.max(0, startSlot)];
    const endTime = timeSlots[Math.max(0, endSlot)];

    if (startTime && endTime) {
      setVisibleTimeRange({
        start: `${translateDay(startTime.day)} ${startTime.label}`,
        end: `${translateDay(endTime.day)} ${endTime.label}`
      });
    }
  }, [displayZoom, timeSlots, translateDay]);


  // Handle pinch-to-zoom on touch devices with zoom-to-point
  useEffect(() => {
    const container = scrollViewportRef.current || gridContainerRef.current;
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
        
        // Calculate pinch center
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        const rect = container.getBoundingClientRect();
        const relativeCenterX = centerX - rect.left;
        const relativeCenterY = centerY - rect.top;
        
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        if (lastDistanceRef.current > 0) {
          const scale = distance / lastDistanceRef.current;
          const newZoom = Math.min(Math.max(displayZoom * scale, 0.5), 3);
          handleZoom(newZoom, relativeCenterX, relativeCenterY);
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
  }, [isPinching, displayZoom, handleZoom]);

  // Mouse wheel zoom for desktop (Ctrl/Cmd + scroll)
  useEffect(() => {
    const container = scrollViewportRef.current || gridContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const centerX = e.clientX - rect.left;
        const centerY = e.clientY - rect.top;
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.min(Math.max(displayZoom + delta, 0.5), 3);
        
        handleZoom(newZoom, centerX, centerY);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [displayZoom, handleZoom]);

  // Track scroll position for time indicator
  useEffect(() => {
    const container = scrollViewportRef.current || gridContainerRef.current;
    if (!container) {
      // Retry after a delay if container not ready
      const timeout = setTimeout(() => {
        const retryContainer = scrollViewportRef.current || gridContainerRef.current;
        if (retryContainer) {
          retryContainer.addEventListener('scroll', handleScroll, { passive: true });
          handleScroll();
        }
      }, 200);
      return () => clearTimeout(timeout);
    }

    container.addEventListener('scroll', handleScroll, { passive: true });
    // Initial call after a brief delay to ensure container is ready
    const timeout = setTimeout(() => handleScroll(), 100);

    return () => {
      clearTimeout(timeout);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

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

      <div className="festival-grid relative overflow-hidden rounded-lg w-full max-w-[1400px] mx-auto flex flex-col items-center" style={{ backgroundColor: '#0B0E1F' }}>
        {/* Zoom controls */}
        <div className="absolute top-2 right-2 z-40 flex gap-2">
          <button 
            onClick={() => handleZoom(Math.max(0.5, displayZoom - 0.25))}
            className="bg-gray-800/60 hover:bg-gray-700/80 text-white rounded px-3 py-1 text-sm font-medium transition-colors backdrop-blur-sm flex items-center gap-1"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
            <span className="hidden md:inline">-</span>
          </button>
          <span className="bg-gray-800/60 text-white rounded px-3 py-1 text-sm backdrop-blur-sm">
            {Math.round(displayZoom * 100)}%
          </span>
          <button 
            onClick={() => handleZoom(Math.min(3, displayZoom + 0.25))}
            className="bg-gray-800/60 hover:bg-gray-700/80 text-white rounded px-3 py-1 text-sm font-medium transition-colors backdrop-blur-sm flex items-center gap-1"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
            <span className="hidden md:inline">+</span>
          </button>
          {displayZoom !== 1 && (
            <button 
              onClick={() => handleZoom(1)}
              className="bg-gray-800/60 hover:bg-gray-700/80 text-white rounded px-2 py-1 text-sm font-medium transition-colors ml-1 backdrop-blur-sm flex items-center gap-1"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Quick navigation buttons */}
        <div className="absolute bottom-2 left-2 z-40 flex gap-1 flex-wrap">
          <button 
            onClick={() => scrollToDay('Freitag')}
            className="bg-gray-800/60 hover:bg-gray-700/80 text-white rounded px-2 py-1 text-xs font-medium transition-colors backdrop-blur-sm"
            title="Jump to Friday"
          >
            FR
          </button>
          <button 
            onClick={() => scrollToDay('Samstag')}
            className="bg-gray-800/60 hover:bg-gray-700/80 text-white rounded px-2 py-1 text-xs font-medium transition-colors backdrop-blur-sm"
            title="Jump to Saturday"
          >
            SA
          </button>
          <button 
            onClick={() => scrollToDay('Sonntag')}
            className="bg-gray-800/60 hover:bg-gray-700/80 text-white rounded px-2 py-1 text-xs font-medium transition-colors backdrop-blur-sm"
            title="Jump to Sunday"
          >
            SO
          </button>
          <button 
            onClick={scrollToNow}
            className="bg-gray-800/60 hover:bg-gray-700/80 text-white rounded px-2 py-1 text-xs font-medium transition-colors backdrop-blur-sm flex items-center gap-1"
            title="Jump to current time"
          >
            <Clock className="w-3 h-3" />
            <span className="hidden sm:inline">Now</span>
          </button>
        </div>

        {/* Time position indicator */}
        {visibleTimeRange && (
          <div className="absolute top-12 left-2 z-40 bg-gray-800/80 text-white rounded px-3 py-1.5 text-xs backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>{visibleTimeRange.start} - {visibleTimeRange.end}</span>
            </div>
          </div>
        )}
        
        <div 
          className="max-h-[70vh] w-full relative overflow-auto flex justify-center"
          ref={(node) => {
            if (node) {
              gridContainerRef.current = node as any;
              // Set viewport ref directly to this div for scrolling
              scrollViewportRef.current = node;
            }
          }}
          style={{ touchAction: 'pan-x pan-y' }}
        >
          <div className="grid-container mx-auto" style={{ touchAction: 'pan-x pan-y' }}>
            {/* Calculate grid dimensions based on zoom */}
            {(() => {
              const baseRowHeight = 70;
              const baseHeaderHeight = 60;
              const baseDayColWidth = 100; // Increased from 80px
              const baseTimeColWidth = 80; // Increased from 60px
              const baseVenueColMinWidth = 300; // Increased from 200px
              
              const scaledRowHeight = baseRowHeight * displayZoom;
              const scaledHeaderHeight = baseHeaderHeight * displayZoom;
              const scaledDayColWidth = baseDayColWidth * displayZoom;
              const scaledTimeColWidth = baseTimeColWidth * displayZoom;
              const scaledVenueColMinWidth = baseVenueColMinWidth * displayZoom;
              
              // Calculate total grid dimensions for proper scrolling
              const totalGridHeight = scaledHeaderHeight + (timeSlots.length * scaledRowHeight);
              // Estimate total width (day col + time col + 3 venue cols with min width)
              const estimatedTotalWidth = scaledDayColWidth + scaledTimeColWidth + (3 * scaledVenueColMinWidth);
              
              return (
                <div className="festival-grid-main grid gap-0"
                     style={{ 
                       gridTemplateColumns: `${scaledDayColWidth}px ${scaledTimeColWidth}px repeat(3, minmax(${scaledVenueColMinWidth}px, 1fr))`,
                       gridTemplateRows: `${scaledHeaderHeight}px repeat(${timeSlots.length}, ${scaledRowHeight}px)`,
                       overflow: 'visible',
                       width: `${Math.max(estimatedTotalWidth, 800)}px`,
                       minHeight: `${totalGridHeight}px`,
                       height: `${totalGridHeight}px`
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
                                      index === 2 ? '#6B1F49' : // Dark pink/magenta for 2000er
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
                          // Scale pixelsPerMinute with zoom to match scaled grid row height
                          const durationInMinutes = event.duration;
                          const pixelsPerMinute = (70 * displayZoom) / 60; // Scales with zoom: 70px * zoom per hour
                          const heightInPixels = durationInMinutes * pixelsPerMinute;
                          
                          // Calculate responsive text sizing
                          const textSizeClass = getTextSizeClass(event.duration, event.title.length, heightInPixels);
                          const maxLines = getMaxLines(heightInPixels);
                          const showTime = heightInPixels >= 50; // Show time for events >= 50px tall
                          const showTypeLabel = heightInPixels >= 80; // Show type label for events >= 80px tall
                          
                          const eventColor = getEventTypeColor(event.type);
                          const backgroundColor = eventColor.replace('0.9', '0.2');
                          const borderColor = eventColor;
                          
                          return (
                            <div
                              key={event.id}
                              className="absolute z-20 rounded-lg cursor-pointer 
                                         transition-all duration-200 hover:scale-[1.02] hover:z-30 
                                         backdrop-blur-sm border-2 overflow-hidden"
                              style={{
                                width: `${widthPercent}%`,
                                left: `${leftPercent}%`,
                                top: `${topOffset}%`,
                                height: `${heightInPixels}px`,
                                backgroundColor: backgroundColor,
                                borderColor: borderColor,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                              }}
                              onClick={() => onEventClick(event)}
                            >
                              {/* Type indicator bar at top */}
                              <div 
                                className="absolute top-0 left-0 right-0 h-1"
                                style={{ backgroundColor: borderColor }}
                              />
                              
                              <div className="h-full flex flex-col items-center justify-center text-center p-2 relative">
                                {/* Type label badge for larger cards */}
                                {showTypeLabel && (
                                  <div 
                                    className="absolute top-1 right-1 text-[10px] font-medium 
                                               px-1.5 py-0.5 rounded bg-black/30 text-white/90 backdrop-blur-sm"
                                  >
                                    {getEventTypeLabel(event.type)}
                                  </div>
                                )}
                                
                                <div className="text-white w-full flex-1 flex flex-col justify-center">
                                  <div 
                                    className={`font-semibold leading-tight ${textSizeClass} ${
                                      maxLines === 1 ? 'line-clamp-1' : 
                                      maxLines === 2 ? 'line-clamp-2' : 
                                      maxLines === 3 ? 'line-clamp-3' : 'line-clamp-4'
                                    }`}
                                    style={{
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word'
                                    }}
                                  >
                                    {event.title}
                                  </div>
                                  {showTime && (
                                    <div className={`text-white/80 mt-1 ${
                                      heightInPixels < 70 ? 'text-[10px]' : 'text-xs'
                                    }`}>
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
              );
            })()}
          </div>
        </div>
      </div>

      {/* Mobile gesture hint overlay */}
      {isMobile && showGestureHint && (
        <div 
          className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center animate-in fade-in"
          onClick={() => {
            setShowGestureHint(false);
            localStorage.setItem('festival-grid-gesture-hint-dismissed', 'true');
          }}
        >
          <div className="text-white text-center p-6 bg-gray-900/90 rounded-lg backdrop-blur-sm max-w-xs mx-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-white/30 rounded-full flex items-center justify-center animate-pulse">
                  <ZoomIn className="w-8 h-8" />
                </div>
              </div>
            </div>
            <p className="font-semibold mb-2">Pinch to zoom</p>
            <p className="text-sm text-gray-400 mb-4">Use two fingers to zoom in and out</p>
            <p className="text-xs text-gray-500">Tap anywhere to dismiss</p>
          </div>
        </div>
      )}
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quantico:wght@400;700&display=swap');
        
        .festival-grid-container {
          font-family: 'Quantico', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: white;
        }
        .festival-grid-main {
          position: relative;
        }
        .festival-grid-container .grid-container::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .festival-grid-container .grid-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.4);
          border-radius: 5px;
        }
        .festival-grid-container .grid-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 5px;
        }
        .festival-grid-container .grid-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .festival-grid-container .grid-container::-webkit-scrollbar-corner {
          background: rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
};

export default FestivalGrid;