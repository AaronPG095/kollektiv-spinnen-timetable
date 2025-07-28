import { useState } from "react";
import { FestivalHeader } from "@/components/FestivalHeader";
import { TimetableGrid } from "@/components/TimetableGrid";
import { events } from "@/data/events";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState("Alle");
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);

  const handleVenueToggle = (venue: string) => {
    setSelectedVenues(prev => 
      prev.includes(venue) 
        ? prev.filter(v => v !== venue)
        : [...prev, venue]
    );
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
      />
      
      <main className="container mx-auto px-4 py-8">
        <TimetableGrid
          events={events}
          selectedDay={selectedDay}
          selectedVenues={selectedVenues}
          searchQuery={searchQuery}
        />
      </main>
      
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
