import { Event } from "@/components/EventCard";

export const events: Event[] = [
  // Friday Events
  {
    id: "f1",
    title: "Welcome Dinner (HoodCuisine)",
    time: "19:00 - 20:00",
    venue: "oben",
    day: "Freitag",
    type: "performance",
    description: "Start your festival experience with delicious street food and community vibes"
  },
  {
    id: "f2",
    title: "Washkar Sound",
    time: "20:00 - 21:00",
    venue: "draussen",
    day: "Freitag",
    type: "live",
    description: "Powerful live performance featuring traditional and modern fusion sounds",
    links: {
      instagram: "https://www.instagram.com/waskhar_sound?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      bandcamp: "https://waskhar.bandcamp.com/"
    }
  },
  {
    id: "f3",
    title: "Fireshow",
    time: "22:30 - 00:00",
    venue: "draussen",
    day: "Freitag",
    type: "performance",
    description: "Spectacular fire performance lighting up the night"
  },
  {
    id: "f4",
    title: "Sound Journey",
    time: "22:00 - 22:30",
    venue: "oben",
    day: "Freitag",
    type: "live",
    description: "Immersive sound journey and conversation starting at 23:00"
  },
  {
    id: "f5",
    title: "Karaoke",
    time: "21:00 - 00:00",
    venue: "unten",
    day: "Freitag",
    type: "interaktiv",
    description: "Sing your heart out with friends in our cozy karaoke lounge"
  },
  {
    id: "f6",
    title: "Doku / Gespräch - Machland",
    time: "23:00 - 01:00",
    venue: "oben",
    day: "Freitag",
    type: "workshop",
    description: "Documentary screening and discussion about the four dimensions of sustainability",
    links: {
      youtube: "https://www.youtube.com/watch?v=qH-R6CL3gfQ&ab_channel=Machland"
    }
  },

  // Saturday Events
  {
    id: "s1",
    title: "Julian Falk",
    time: "00:00 - 02:00",
    venue: "unten",
    day: "Samstag",
    type: "dj",
    description: "Abenteuer House",
    links: {
      soundcloud: "https://on.soundcloud.com/ZQUMQ8m7VdJ0bsnC0k"
    }
  },
  {
    id: "s2",
    title: "André?",
    time: "02:00 - 04:00",
    venue: "unten",
    day: "Samstag",
    type: "dj",
    description: "Underground electronic sounds and experimental beats"
  },
  {
    id: "s3",
    title: "Somatic Vinyasa Yoga Flow",
    time: "11:00 - 14:00",
    venue: "draussen",
    day: "Samstag",
    type: "workshop",
    description: "Mind-body connection through flowing yoga movements (11:30-12:00)"
  },
  {
    id: "s4",
    title: "ANTONI",
    time: "13:00 - 14:30",
    venue: "draussen",
    day: "Samstag",
    type: "live",
    description: "Indie-Folk",
    links: {
      instagram: "https://www.instagram.com/antonimusic_/",
      spotify: "https://open.spotify.com/intl-de/artist/7jP2bIZ5G2DD3JTgpulrWr?si=EWOS2L2UQWCGxSwvm7WpUQ"
    }
  },
  {
    id: "s5",
    title: "Teeya Lamee",
    time: "13:00 - 14:30",
    venue: "draussen",
    day: "Samstag",
    type: "live",
    description: "Soulful vocals and contemporary melodies",
    links: {
      instagram: "https://www.instagram.com/teeya.lamee?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      spotify: "https://open.spotify.com/artist/0eDr9FGxuaqEVJk76OQUvT?si=RRqRTTYHRvKR0iQ9G_n4Cg"
    }
  },
  {
    id: "s6",
    title: "Ricky Shark",
    time: "14:45 - 15:30",
    venue: "draussen",
    day: "Samstag",
    type: "live",
    description: "Euro Dance, Trance and Electronica",
    links: {
      instagram: "https://www.instagram.com/ricky.shark?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      spotify: "https://open.spotify.com/intl-de/artist/0lJ7FM4kDzVebs65cb1KCH?si=3QxBpmJ6TSmfmwt7YRglTg"
    }
  },
  {
    id: "s7",
    title: "Aerobic Dance Therapy",
    time: "15:40 - 16:00",
    venue: "draussen",
    day: "Samstag",
    type: "performance",
    description: "Movement therapy combining dance and wellness"
  },
  {
    id: "s8",
    title: "Chloe Bechamel",
    time: "16:00 - 18:00",
    venue: "draussen",
    day: "Samstag",
    type: "dj",
    description: "Dark Disco, Downtempo",
    links: {
      soundcloud: "https://on.soundcloud.com/Gp2RXHCpHwEarhUWRR"
    }
  },
  {
    id: "s9",
    title: "Ænigma",
    time: "18:00 - 20:00",
    venue: "draussen",
    day: "Samstag",
    type: "dj",
    description: "Ambient / Downbeat / Experimental Chill",
    links: {
      soundcloud: "https://on.soundcloud.com/tYerOrnMMsCMjKfGvs"
    }
  },
  {
    id: "s10",
    title: "Queen Justmean / VLTN",
    time: "20:00 - 20:30",
    venue: "draussen",
    day: "Samstag",
    type: "performance",
    description: "Stunning drag performance followed by outdoor festivities"
  },
  {
    id: "s11",
    title: "LottaLove",
    time: "20:30 - 22:15",
    venue: "oben",
    day: "Samstag",
    type: "dj",
    description: "Downtempo",
    links: {
      soundcloud: "https://on.soundcloud.com/kxcwNtV4Botm5okM8i"
    }
  },
  {
    id: "s12",
    title: "Tamara Tischtennisball",
    time: "21:30 - 23:00",
    venue: "unten",
    day: "Samstag",
    type: "dj",
    description: "House / Hard House",
    links: {
      soundcloud: "https://on.soundcloud.com/ujwZAcupIOMo96xsIf"
    }
  },
  {
    id: "s13",
    title: "isl&",
    time: "22:15 - 00:00",
    venue: "oben",
    day: "Samstag",
    type: "dj",
    description: "Melodic Techno / Techy House",
    links: {
      soundcloud: "https://soundcloud.com/isl-and?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"
    }
  },
  {
    id: "s14",
    title: "1 Boy No Club",
    time: "23:00 - 01:00",
    venue: "unten",
    day: "Samstag",
    type: "dj",
    description: "Power House",
    links: {
      soundcloud: "https://on.soundcloud.com/n4ZhXyi8U4jys8qPRa"
    }
  },

  // Sunday Events
  {
    id: "su1",
    title: "Takt & Taumel",
    time: "00:00 - 02:00",
    venue: "oben",
    day: "Sonntag",
    type: "dj",
    description: "Dirty Midtempo / Bouncetempo",
    links: {
      soundcloud: "https://on.soundcloud.com/V2mPyzr9jdtktheCa2"
    }
  },
  {
    id: "su2",
    title: "Felix Blume",
    time: "00:00 - 02:00",
    venue: "unten",
    day: "Sonntag",
    type: "dj",
    description: "Trance / Hard-Groove",
    links: {
      soundcloud: "https://on.soundcloud.com/qyStxld3tjBoHduMUY"
    }
  },
  {
    id: "su3",
    title: "ra.ul",
    time: "02:00 - 04:00",
    venue: "oben",
    day: "Sonntag",
    type: "dj",
    description: "House / Tech House",
    links: {
      soundcloud: "https://soundcloud.com/raulpr?ref=clipboard&p=a&c=1&si=cabc0c60d02b4caab8396ac2ff652d8b&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"
    }
  },
  {
    id: "su4",
    title: "ondule",
    time: "02:00 - 04:00",
    venue: "unten",
    day: "Sonntag",
    type: "dj",
    description: "Trance",
    links: {
      soundcloud: "https://on.soundcloud.com/fpvK4frm5RJRuVzDg1"
    }
  },
  {
    id: "su5",
    title: "Kaddi Kippenberger",
    time: "04:00 - 06:00",
    venue: "oben",
    day: "Sonntag",
    type: "dj",
    description: "Indie Dance / House",
    links: {
      soundcloud: "https://on.soundcloud.com/ytzaDkm49UjIAkAAPR"
    }
  },
  {
    id: "su6",
    title: "Draco Dark",
    time: "04:00 - 06:00",
    venue: "unten",
    day: "Sonntag",
    type: "dj",
    description: "Melodic / Psy-Techno",
    links: {
      soundcloud: "https://on.soundcloud.com/Y8ucqTuuxoEZCyGYe6"
    }
  },
  {
    id: "su7",
    title: "Ideal Standard",
    time: "06:00 - 08:00",
    venue: "oben",
    day: "Sonntag",
    type: "dj",
    description: "House/techhouse",
    links: {
      soundcloud: "https://soundcloud.com/user-997519530?ref=clipboard&p=i&c=0&si=6516D87EF628413E8C1F20E3343590DF&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"
    }
  },
  {
    id: "su8",
    title: "Melaune",
    time: "08:00 - 10:00",
    venue: "oben",
    day: "Sonntag",
    type: "dj",
    description: "Dark Disco / Indie Dance",
    links: {
      soundcloud: "https://on.soundcloud.com/84BYyCOjWMA8tsOiY9"
    }
  },
  {
    id: "su9",
    title: "Briefe öffnen mit Momo und Timo",
    time: "10:00 - 12:00",
    venue: "draussen",
    day: "Sonntag",
    type: "performance",
    description: "Interactive letter-opening performance art"
  },
  {
    id: "su10",
    title: "Nepomuk",
    time: "10:00 - 12:00",
    venue: "oben",
    day: "Sonntag",
    type: "dj",
    description: "House",
    links: {
      soundcloud: "https://on.soundcloud.com/hnLI95A5SH9l2S4tfO"
    }
  },
  {
    id: "su11",
    title: "Confeffing",
    time: "11:00 - 13:00",
    venue: "oben",
    day: "Sonntag",
    type: "dj",
    description: "Indie Dance / Disco House",
    links: {
      soundcloud: "https://on.soundcloud.com/M16nlKgKa2jXL1ZlRP"
    }
  },
  {
    id: "su12",
    title: "Regentag",
    time: "13:00 - 14:30",
    venue: "draussen",
    day: "Sonntag",
    type: "dj",
    description: "Downtempo",
    links: {
      soundcloud: "https://soundcloud.com/regentag_music/freihgefuhl-festival-25"
    }
  },
  {
    id: "su13",
    title: "Firlefanz & Schabernack",
    time: "14:30 - 16:30",
    venue: "draussen",
    day: "Sonntag",
    type: "performance",
    description: "House / Tech House",
    links: {
      soundcloud: "https://on.soundcloud.com/eXrPRoebAG23g0BCkj"
    }
  },
  {
    id: "su13b",
    title: "Sekt Kegeln",
    time: "14:30 - 16:30",
    venue: "draussen",
    day: "Sonntag",
    type: "interaktiv",
    description: "Interactive bowling with sparkling wine - fun and games for everyone"
  },
  {
    id: "su14",
    title: "Moosen?",
    time: "16:30 - 18:00",
    venue: "draussen",
    day: "Sonntag",
    type: "dj",
    description: "Downtempo",
    links: {
      soundcloud: "https://on.soundcloud.com/TDf0wBLLNw9TAO7JYt"
    }
  },
  {
    id: "su15",
    title: "Nümphe?",
    time: "18:00 - 19:00",
    venue: "draussen",
    day: "Sonntag",
    type: "dj",
    description: "Mystical electronic sounds and ethereal beats"
  },
  {
    id: "su16",
    title: "AYU",
    time: "19:00 - 20:00",
    venue: "draussen",
    day: "Sonntag",
    type: "live",
    description: "Live-Looping Soundjourney",
    links: {
      instagram: "https://www.instagram.com/ayu.echoes/",
      youtube: "https://www.youtube.com/watch?v=1zHfMboqteY&t=303s"
    }
  }
];