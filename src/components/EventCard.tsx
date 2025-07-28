import { Clock, MapPin, Music, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Event {
  id: string;
  title: string;
  time: string;
  venue: "draussen" | "oben" | "unten";
  day: "Freitag" | "Samstag" | "Sonntag";
  type: "performance" | "dj" | "workshop" | "live" | "interaktiv";
  description?: string;
  links?: {
    youtube?: string;
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
    bandcamp?: string;
  };
}

interface EventCardProps {
  event: Event;
  onClick: (event: Event) => void;
}

const venueConfig = {
  draussen: { 
    label: "Draußen", 
    color: "venue-draussen",
    icon: Music
  },
  oben: { 
    label: "Oben", 
    color: "venue-oben",
    icon: Users
  },
  unten: { 
    label: "Unten", 
    color: "venue-unten",
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

export const EventCard = ({ event, onClick }: EventCardProps) => {
  const venue = venueConfig[event.venue];
  const type = typeConfig[event.type];
  const VenueIcon = venue.icon;

  return (
    <Card 
      className="p-4 cursor-pointer transition-smooth hover:shadow-glow hover:scale-105 backdrop-blur-sm border-2"
      style={{
        backgroundColor: `hsl(var(--${type.color}) / 0.1)`,
        borderColor: `hsl(var(--${type.color}) / 0.4)`
      }}
      onClick={() => onClick(event)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-tight flex-1">
            {event.title}
          </h3>
          <div 
            className="px-2 py-1 rounded text-xs font-medium border"
            style={{
              backgroundColor: `hsl(var(--${type.color}) / 0.2)`,
              color: `hsl(var(--${type.color}))`,
              borderColor: `hsl(var(--${type.color}) / 0.3)`
            }}
          >
            {type.label}
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{event.time}</span>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2">
          <VenueIcon className="h-3 w-3" />
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{
              backgroundColor: `hsl(var(--venue-${event.venue}) / 0.1)`,
              borderColor: `hsl(var(--venue-${event.venue}) / 0.2)`,
              color: `hsl(var(--venue-${event.venue}))`
            }}
          >
            {venue.label}
          </Badge>
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
};