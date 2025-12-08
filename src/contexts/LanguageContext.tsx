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
    standardTicketsDesc: 'Standard-Tickets beinhalten eine generell sehr entspannte 2-Stunden-Schicht in den unten aufgeführten Rollen. Du kannst deine bevorzugte Option im nächsten Schritt auswählen.',
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
    abbau: 'Festival-Abbau',
    aufbau: 'Festival-Aufbau',
    awareness: 'Awareness',
    schichtleitung: 'Schichtleitung',
    techHelfer: 'Tech Helfer',
    selectRole: 'Rolle auswählen...',
    roleDescriptionsDesc: 'Detaillierte Rollenbeschreibungen werden hier verfügbar sein.',
    onlyWithExperience: 'Nur mit Erfahrung / Organisatoren-Zustimmung',
    clearSelection: 'Auswahl entfernen',
    ticketTypesExplanation: 'Ticket System Übersicht',
    ticketTypesExplanationDesc: 'Hier findest du eine Übersicht über die verschiedenen Ticket-Typen, die für das Kollektiv Spinnen Festival verfügbar sind.',
    ticketTypesNote: 'Hinweis: Aufgrund der inhärenten Non-Profit / Community-basierten Natur von Kollektiv Spinnen beinhalten alle Tickets für unser Festival die Übernahme einer Schicht in einer der verschiedenen Rollen, die benötigt werden, um all dies möglich zu machen. Die Länge der Schichten variiert zwischen Standard-Tickets & Reduzierten Tickets.',
    earlyBirdNormalTitle: 'Early Bird / Normal',
    earlyBirdNormalDesc: 'Beide Ticket-Typen sind als Early Bird oder Normal erhältlich, abhängig davon, wann du dein Ticket kaufst / Verfügbarkeit (Es wird eine begrenzte Anzahl von Early-Bird-Tickets geben).',
    whatIsIncludedTitle: 'Was ist in meinem Ticket enthalten?',
    whatIsIncludedDesc: 'Alle Tickets beinhalten:',
    ticketIncludesAccess: 'Zugang zum Festival',
    ticketIncludesSleeping: 'Zugang zu Indoor-Schlafmöglichkeiten (abhängig von Ankunftszeit / Tag)',
    ticketIncludesDrinks: 'Alkoholfreie & alkoholische Getränke an der Bar',
    ticketIncludesMeals: '2 Mahlzeiten pro Tag in der Kantine',
    standardTicketType: 'Standard Tickets',
    standardTicketTypeDesc: 'Standard Tickets beinhalten die Übernahme einer 2-Stunden-Schicht während des Festivals. Du kannst zwischen Early Bird und Normal Optionen wählen, abhängig von der Verfügbarkeit.',
    reducedTicketType: 'Reduzierte Tickets',
    reducedTicketTypeDesc: 'Reduzierte Tickets bieten einen Preisnachlass aufgrund der Intensität oder zusätzlichen Verantwortung der zugehörigen Positionen. Diese Tickets sind für spezielle Rollen wie Aufbau, Abbau, Tech Helfer, Awareness oder Schichtleitung verfügbar.',
    
    // FAQ Page
    searchFAQs: 'FAQs durchsuchen...',
    noFAQsAvailable: 'Keine FAQs verfügbar',
    checkBackLater: 'Schau später nochmal vorbei für häufig gestellte Fragen.',
    found: 'gefunden',
    result: 'Ergebnis',
    results: 'Ergebnisse',
    noResultsFound: 'Keine Ergebnisse gefunden',
    noFAQsMatchSearch: 'Keine FAQs entsprechen der Suche',
    clearSearch: 'Suche zurücksetzen',
    allgemein: 'Allgemein',
    
    // Ticket Checkout
    checkout: 'Checkout',
    ticketType: 'Ticket-Typ',
    selectedRole: 'Ausgewählte Rolle',
    nA: 'N/A',
    checkoutPlaceholder: 'Dies ist eine Platzhalter-Checkout-Seite. Die vollständige Checkout-Funktionalität wird hier implementiert.',
    
    // Footer
    sitemap: 'Sitemap',
    sitemapShort: 'Map',
    backToTop: 'Nach oben',
    backToTopShort: 'Oben',
    
    // Header
    admin: 'Admin',
    login: 'Anmelden',
    
    // Auth
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    welcomeBack: 'Willkommen zurück bei Kollektiv Spinnen',
    createAccount: 'Erstelle dein Konto',
    email: 'E-Mail',
    password: 'Passwort',
    dontHaveAccount: 'Noch kein Konto? Registrieren',
    alreadyHaveAccount: 'Bereits ein Konto? Anmelden',
    backToFestival: 'Zurück zum Festival',
    authenticationError: 'Authentifizierungsfehler',
    welcomeBackToast: 'Willkommen zurück!',
    signedInSuccessfully: 'Du hast dich erfolgreich angemeldet.',
    accountCreated: 'Konto erstellt!',
    checkEmailVerify: 'Bitte überprüfe deine E-Mail, um dein Konto zu verifizieren.',
    error: 'Fehler',
    unexpectedError: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.',
    accessDenied: 'Zugriff verweigert',
    noAdminPermissions: 'Du hast keine Administratorrechte.'
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
    standardTicketsDesc: 'Standard tickets include one generally very relaxed 2hr shift in the roles listed below, you can select your preferred option in the next step.',
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
    abbau: 'Festival-Breakdown',
    aufbau: 'Festival-Setup',
    awareness: 'Awareness',
    schichtleitung: 'Shift Management',
    techHelfer: 'Tech Helper',
    selectRole: 'Select a role...',
    roleDescriptionsDesc: 'Detailed role descriptions will be available here.',
    onlyWithExperience: 'Only with experience / organiser consent',
    clearSelection: 'Clear selection',
    ticketTypesExplanation: 'Ticket System Overview',
    ticketTypesExplanationDesc: 'Here you can find an overview of the different ticket types available for the Kollektiv Spinnen Festival.',
    ticketTypesNote: 'Note: Due to the inherent non-profit / community based nature of Kollektiv Spinnen, all tickets for our festival include taking over a shift in one of the various roles needed to make all of this happen. Lengths of shifts vary between Standard Tickets & Reduced Tickets.',
    earlyBirdNormalTitle: 'Early Bird / Normal',
    earlyBirdNormalDesc: 'Both ticket types are available in Early Bird or Normal varieties depending on when you purchase your ticket / availability (There will be a limited amount of Early-Bird Tickets available).',
    whatIsIncludedTitle: 'What is included in my Ticket?',
    whatIsIncludedDesc: 'All tickets include:',
    ticketIncludesAccess: 'Access to the festival',
    ticketIncludesSleeping: 'Access to indoor sleeping options (depending on arrival time / day)',
    ticketIncludesDrinks: 'Non-Alcoholic & Alcoholic Drinks available at the Bar',
    ticketIncludesMeals: '2 Meals per Day available in the Kantine',
    standardTicketType: 'Standard Tickets',
    standardTicketTypeDesc: 'Standard Tickets include taking over one 2-hour shift during the festival. You can choose between Early Bird and Normal options depending on availability.',
    reducedTicketType: 'Reduced Tickets',
    reducedTicketTypeDesc: 'Reduced Tickets offer a price discount due to the intensity or additional responsibility of the related positions. These tickets are available for special roles such as Setup, Breakdown, Tech Helper, Awareness, or Shift Management.',
    
    // FAQ Page
    searchFAQs: 'Search FAQs...',
    noFAQsAvailable: 'No FAQs Available',
    checkBackLater: 'Check back later for frequently asked questions.',
    found: 'found',
    result: 'result',
    results: 'results',
    noResultsFound: 'No results found',
    noFAQsMatchSearch: 'No FAQs match your search for',
    clearSearch: 'Clear search',
    allgemein: 'General',
    
    // Ticket Checkout
    checkout: 'Checkout',
    ticketType: 'Ticket type',
    selectedRole: 'Selected role',
    nA: 'N/A',
    checkoutPlaceholder: 'This is a placeholder checkout page. The full checkout functionality will be implemented here.',
    
    // Footer
    sitemap: 'Sitemap',
    sitemapShort: 'Map',
    backToTop: 'Back to Top',
    backToTopShort: 'Top',
    
    // Header
    admin: 'Admin',
    login: 'Login',
    
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    welcomeBack: 'Welcome back to Kollektiv Spinnen',
    createAccount: 'Create your account',
    email: 'Email',
    password: 'Password',
    dontHaveAccount: 'Don\'t have an account? Sign up',
    alreadyHaveAccount: 'Already have an account? Sign in',
    backToFestival: 'Back to Festival',
    authenticationError: 'Authentication Error',
    welcomeBackToast: 'Welcome back!',
    signedInSuccessfully: 'You have successfully signed in.',
    accountCreated: 'Account created!',
    checkEmailVerify: 'Please check your email to verify your account.',
    error: 'Error',
    unexpectedError: 'An unexpected error occurred. Please try again.',
    accessDenied: 'Access Denied',
    noAdminPermissions: 'You don\'t have admin permissions.'
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