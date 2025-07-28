import { Search, Filter, Calendar, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewToggle } from "./ViewToggle";

interface FestivalHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDay: string;
  onDayChange: (day: string) => void;
  selectedVenues: string[];
  onVenueToggle: (venue: string) => void;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

const days = ["Alle", "Freitag", "Samstag", "Sonntag"];
const venues = [
  { id: "draussen", label: "Draußen", color: "venue-draussen" },
  { id: "oben", label: "Oben", color: "venue-oben" },
  { id: "unten", label: "Unten", color: "venue-unten" }
];

export const FestivalHeader = ({
  searchQuery,
  onSearchChange,
  selectedDay,
  onDayChange,
  selectedVenues,
  onVenueToggle,
  view,
  onViewChange
}: FestivalHeaderProps) => {
  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Kollektiv Spinnen
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover amazing performances across all venues
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search artists, events..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {/* Filters and View Toggle */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Day Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-2">
                  {days.map((day) => (
                    <Button
                      key={day}
                      variant={selectedDay === day ? "default" : "outline"}
                      size="sm"
                      onClick={() => onDayChange(day)}
                      className="transition-smooth"
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Venue Filter */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-2">
                  {venues.map((venue) => (
                    <Badge
                      key={venue.id}
                      variant={selectedVenues.includes(venue.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-smooth ${
                        selectedVenues.includes(venue.id) 
                          ? `bg-${venue.color} hover:bg-${venue.color}/80` 
                          : ""
                      }`}
                      onClick={() => onVenueToggle(venue.id)}
                    >
                      {venue.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* View Toggle */}
            <ViewToggle view={view} onViewChange={onViewChange} />
          </div>
        </div>
      </div>
    </div>
  );
};