import { useState } from "react";
import { FestivalHeader } from "@/components/FestivalHeader";
import { TimetableGrid } from "@/components/TimetableGrid";
import { GridTimetable } from "@/components/GridTimetable";
import { events } from "@/data/events";
import { Event } from "@/components/EventCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, MapPin } from "lucide-react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState("Alle");
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "list">("list");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleVenueToggle = (venue: string) => {
    setSelectedVenues(prev => 
      prev.includes(venue) 
        ? prev.filter(v => v !== venue)
        : [...prev, venue]
    );
  };

  const venueConfig = {
    draussen: { label: "Draußen", color: "venue-draussen" },
    oben: { label: "Oben", color: "venue-oben" },
    unten: { label: "Unten", color: "venue-unten" }
  };

  return (
    <div className="min-h-screen bg-background">
      <FestivalHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDay={selectedDay}
        onDayChange={setSelectedDay}
        selectedVenues={selectedVenues}
        onVenueToggle={handleVenueToggle}
        view={view}
        onViewChange={setView}
      />
      
      <main className="container mx-auto px-4 py-8">
        {view === "list" ? (
          <TimetableGrid
            events={events}
            selectedDay={selectedDay}
            selectedVenues={selectedVenues}
            searchQuery={searchQuery}
          />
        ) : (
          <GridTimetable
            events={events}
            selectedDay={selectedDay}
            selectedVenues={selectedVenues}
            searchQuery={searchQuery}
            onEventClick={setSelectedEvent}
          />
        )}
      </main>

      {/* Event Detail Modal for Grid View */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="bg-card border-border">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedEvent.time}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {selectedEvent.day}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`flex items-center gap-1 bg-${venueConfig[selectedEvent.venue].color}/10 border-${venueConfig[selectedEvent.venue].color}/20`}
                  >
                    <MapPin className="h-3 w-3" />
                    {venueConfig[selectedEvent.venue].label}
                  </Badge>
                </div>
                {selectedEvent.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedEvent.description}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-festival-light/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-festival-medium/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-1/2 w-80 h-80 bg-festival-deep/20 rounded-full blur-3xl animate-pulse delay-2000" />
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      </div>
    </div>
  );
};

export default Index;