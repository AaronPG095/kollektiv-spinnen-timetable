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
    
    // Days (for translation)
    freitag: 'Freitag',
    samstag: 'Samstag',
    sonntag: 'Sonntag',
    filterVenues: 'Venues filtern',
    filterEventTypes: 'Event-Typen filtern',
    gridView: 'Raster',
    listView: 'Liste',
    
    // Venues
    draussen: 'Neue Ufer',
    oben: 'Salon',
    unten: 'Flora',
    
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
    close: 'Schließen',
    
    // Event descriptions (translatable)
    welcomeDinnerDesc: 'Beginne dein Festival-Erlebnis mit köstlichem Streetfood und Community-Vibes',
    fireshowDesc: 'Spektakuläre Feuershow, die die Nacht erleuchtet',
    soundJourneyDesc: 'Immersive Klanglandschaft und Gespräch ab 23:00',
    karaokeDesc: 'Sing dich aus voller Kehle mit Freunden in unserer gemütlichen Karaoke-Lounge',
    docuMachlandDesc: 'Dokumentarfilm-Screening und Diskussion über die vier Dimensionen der Nachhaltigkeit',
    yogaFlowDesc: 'Körper-Geist-Verbindung durch fließende Yoga-Bewegungen',
    aerobicTherapyDesc: 'Bewegungstherapie, die Tanz und Wellness kombiniert',
    letterOpeningDesc: 'Interaktive Brieföffnungs-Performance-Kunst',
    soundJourneyLiveDesc: 'Live-Looping Klanglandschaft',
    bowling: 'Interaktives Bowling mit Sekt - Spaß und Spiele für alle'
  },
  en: {
    // Header
    search: 'Search events...',
    allDays: 'All Days',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    
    // Days (for translation)
    freitag: 'Friday',
    samstag: 'Saturday',
    sonntag: 'Sunday',
    filterVenues: 'Filter venues',
    filterEventTypes: 'Filter event types',
    gridView: 'Grid',
    listView: 'List',
    
    // Venues
    draussen: 'Neue Ufer',
    oben: 'Salon',
    unten: 'Flora',
    
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
    close: 'Close',
    
    // Event descriptions (translatable)
    welcomeDinnerDesc: 'Start your festival experience with delicious street food and community vibes',
    fireshowDesc: 'Spectacular fire performance lighting up the night',
    soundJourneyDesc: 'Immersive sound journey and conversation starting at 23:00',
    karaokeDesc: 'Sing your heart out with friends in our cozy karaoke lounge',
    docuMachlandDesc: 'Documentary screening and discussion about the four dimensions of sustainability',
    yogaFlowDesc: 'Mind-body connection through flowing yoga movements',
    aerobicTherapyDesc: 'Movement therapy combining dance and wellness',
    letterOpeningDesc: 'Interactive letter-opening performance art',
    soundJourneyLiveDesc: 'Live-Looping Soundjourney',
    bowling: 'Interactive bowling with sparkling wine - fun and games for everyone'
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