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
    days: 'Tage',
    venues: 'Venues',
    events: 'Events',
    clearFilters: 'Filter zurücksetzen',
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
    bowling: 'Interaktives Bowling mit Sekt - Spaß und Spiele für alle',
    
    // FAQ
    faq: 'FAQ',
    frequentlyAskedQuestions: 'Häufig gestellte Fragen',
    back: 'Zurück',
    
    // Navigation
    timetable: 'Timetable',
    tickets: 'Tickets',
    
    // Tickets
    standardTickets: 'Standard Tickets',
    standardTicketsDesc: 'Aufgrund der inhärenten Non-Profit / Community-basierten Natur von Kollektiv Spinnen beinhalten alle "Standard"-Tickets bei uns die Übernahme einer 2-Stunden-Schicht. Du kannst deine bevorzugte Option im nächsten Schritt auswählen.',
    earlyBird: 'Early Bird',
    normal: 'Normal',
    reducedTickets: 'Reduzierte Tickets',
    reducedTicketsDesc: 'Diese Tickets erhalten einen Preisnachlass aufgrund der Intensität / zusätzlichen Verantwortung der zugehörigen Positionen im Vergleich zu Standard-Tickets. Bitte beachte: Einige dieser Positionen sind ausschließlich für Personen mit vorheriger Erfahrung / Expertise verfügbar.',
    chooseThisTicket: 'Wähle dieses Ticket',
    roleDescriptions: 'Rollenbeschreibungen',
    bar: 'Bar',
    kuechenhilfe: 'Küchenhilfe',
    springerRunner: 'Springer-Runner',
    springerToilet: 'Springer-Toilet',
    abbau: 'Abbau',
    aufbau: 'Aufbau',
    awareness: 'Awareness',
    schichtleitung: 'Schichtleitung',
    techHelfer: 'Tech Helfer',
    selectRole: 'Rolle auswählen...',
    roleDescriptionsDesc: 'Detaillierte Rollenbeschreibungen werden hier verfügbar sein.'
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
    days: 'Days',
    venues: 'Venues',
    events: 'Events',
    clearFilters: 'Clear Filters',
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
    bowling: 'Interactive bowling with sparkling wine - fun and games for everyone',
    
    // FAQ
    faq: 'FAQ',
    frequentlyAskedQuestions: 'Frequently Asked Questions',
    back: 'Back',
    
    // Navigation
    timetable: 'Timetable',
    tickets: 'Tickets',
    
    // Tickets
    standardTickets: 'Standard Tickets',
    standardTicketsDesc: 'Due to the inherent non-profit / community based nature of Kollektiv Spinnen, all \'standard\' tickets with us include taking over one 2hr shift, you can select your preferred option in the next step.',
    earlyBird: 'Early Bird',
    normal: 'Normal',
    reducedTickets: 'Reduced Tickets',
    reducedTicketsDesc: 'These tickets receive a price discount due to the intensity / additional responsibility of the related positions when compared to Standard Tickets. Please note: Some of these positions are exclusively available to individuals with prior experience / expertise.',
    chooseThisTicket: 'Choose This Ticket',
    roleDescriptions: 'Role Descriptions',
    bar: 'Bar',
    kuechenhilfe: 'Kitchen Helper',
    springerRunner: 'Springer-Runner',
    springerToilet: 'Springer-Toilet',
    abbau: 'Breakdown',
    aufbau: 'Setup',
    awareness: 'Awareness',
    schichtleitung: 'Shift Management',
    techHelfer: 'Tech Helper',
    selectRole: 'Select a role...',
    roleDescriptionsDesc: 'Detailed role descriptions will be available here.'
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('de');

  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations['de']];
    return translation || key;
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