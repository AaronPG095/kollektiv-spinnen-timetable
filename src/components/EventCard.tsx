import { Clock, MapPin, Music, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Event {
  id: string;
  title: string;
  time: string;
  venue: "draussen" | "oben" | "unten";
  day: "Freitag" | "Samstag" | "Sonntag";
  type: "performance" | "dj" | "workshop" | "live";
  description?: string;
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
  performance: { label: "Performance", variant: "secondary" as const },
  dj: { label: "DJ", variant: "outline" as const },
  workshop: { label: "Workshop", variant: "default" as const },
  live: { label: "Live", variant: "destructive" as const }
};

export const EventCard = ({ event, onClick }: EventCardProps) => {
  const venue = venueConfig[event.venue];
  const type = typeConfig[event.type];
  const VenueIcon = venue.icon;

  return (
    <Card 
      className="p-4 cursor-pointer transition-smooth hover:shadow-glow hover:scale-105 bg-card/50 backdrop-blur-sm border-border/50"
      onClick={() => onClick(event)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-tight flex-1">
            {event.title}
          </h3>
          <Badge variant={type.variant} className="text-xs">
            {type.label}
          </Badge>
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
            className={`text-xs bg-${venue.color}/10 border-${venue.color}/20 text-${venue.color}`}
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