import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'de' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  de: {
    // Header
    search: 'Nach Events suchen...',
    allDays: 'Alle Tage',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag',
    filterVenues: 'Venues filtern',
    filterEventTypes: 'Event-Typen filtern',
    gridView: 'Raster',
    listView: 'Liste',
    
    // Venues
    draussen: 'DRAUSSEN',
    oben: 'OBEN',
    unten: 'UNTEN',
    
    // Event Types
    performance: 'Performance',
    dj: 'DJ',
    workshop: 'Workshop',
    live: 'Live-Konzert',
    interaktiv: 'Interaktiv',
    
    // Grid
    venue: 'VENUE',
    time: 'ZEIT',
    
    // Event Details
    eventDetails: 'Event Details',
    day: 'Tag',
    venue_label: 'Venue',
    description: 'Beschreibung',
    links: 'Links',
    
    // Empty States
    noEvents: 'Keine Events gefunden',
    noEventsDesc: 'Versuche deine Filter oder Suchbegriffe anzupassen',
    
    // Common
    close: 'Schließen'
  },
  en: {
    // Header
    search: 'Search events...',
    allDays: 'All Days',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    filterVenues: 'Filter venues',
    filterEventTypes: 'Filter event types',
    gridView: 'Grid',
    listView: 'List',
    
    // Venues
    draussen: 'OUTSIDE',
    oben: 'UPSTAIRS',
    unten: 'DOWNSTAIRS',
    
    // Event Types
    performance: 'Performance',
    dj: 'DJ',
    workshop: 'Workshop',
    live: 'Live Concert',
    interaktiv: 'Interactive',
    
    // Grid
    venue: 'VENUE',
    time: 'TIME',
    
    // Event Details
    eventDetails: 'Event Details',
    day: 'Day',
    venue_label: 'Venue',
    description: 'Description',
    links: 'Links',
    
    // Empty States
    noEvents: 'No events found',
    noEventsDesc: 'Try adjusting your filters or search query',
    
    // Common
    close: 'Close'
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('de');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['de']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};