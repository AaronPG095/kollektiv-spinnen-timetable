-- Insert existing events data into the database
INSERT INTO public.events (title, time, venue, day, type, description, links) VALUES 
-- Friday Events
('Welcome Dinner (HoodCuisine)', '19:00 - 20:00', 'oben', 'Friday', 'performance', 'welcomeDinnerDesc', '{}'),
('Washkar.sound', '20:00 - 21:00', 'draussen', 'Friday', 'live', 'World Music / Healing Sounds', '{"instagram": "https://www.instagram.com/waskhar_sound?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", "bandcamp": "https://waskhar.bandcamp.com/"}'),
('Sound Journey', '22:00 - 22:30', 'oben', 'Friday', 'live', 'soundJourneyDesc', '{}'),
('Karaoke', '21:00 - 00:00', 'unten', 'Friday', 'interaktiv', 'karaokeDesc', '{}'),
('Fireshow', '22:30 - 23:00', 'draussen', 'Friday', 'performance', 'fireshowDesc', '{}'),
('Doku / Gespräch - Machland', '23:00 - 01:00', 'oben', 'Friday', 'workshop', 'docuMachlandDesc', '{"youtube": "https://www.youtube.com/watch?v=qH-R6CL3gfQ&ab_channel=Machland"}'),

-- Saturday Events
('Julian Falk', '00:00 - 02:00', 'unten', 'Saturday', 'dj', 'Abenteuer House', '{"soundcloud": "https://on.soundcloud.com/ZQUMQ8m7VdJ0bsnC0k"}'),
('André?', '02:00 - 04:00', 'unten', 'Saturday', 'dj', 'Techno', '{}'),
('Somatic Vinyasa Yoga Flow', '11:00 - 14:00', 'draussen', 'Saturday', 'workshop', 'yogaFlowDesc', '{}'),
('ANTONI', '13:00 - 13:30', 'draussen', 'Saturday', 'live', 'Indie-Folk', '{"instagram": "https://www.instagram.com/antonimusic_/", "spotify": "https://open.spotify.com/intl-de/artist/7jP2bIZ5G2DD3JTgpulrWr?si=EWOS2L2UQWCGxSwvm7WpUQ"}'),
('Ricky Shark', '14:45 - 15:30', 'draussen', 'Saturday', 'live', 'Euro Dance, Trance and Electronica', '{"instagram": "https://www.instagram.com/ricky.shark?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", "spotify": "https://open.spotify.com/intl-de/artist/0lJ7FM4kDzVebs65cb1KCH?si=3QxBpmJ6TSmfmwt7YRglTg"}'),
('Aerobic Dance Therapy', '15:40 - 16:00', 'draussen', 'Saturday', 'performance', 'aerobicTherapyDesc', '{}'),
('Chloe Bechamel', '16:00 - 18:00', 'draussen', 'Saturday', 'dj', 'Dark Disco, Downtempo', '{"soundcloud": "https://on.soundcloud.com/Gp2RXHCpHwEarhUWRR"}'),
('Ænigma', '18:00 - 20:00', 'draussen', 'Saturday', 'dj', 'Ambient / Downbeat / Experimental Chill', '{"soundcloud": "https://on.soundcloud.com/tYerOrnMMsCMjKfGvs"}'),
('Queen Justmean / VLTN', '20:00 - 20:30', 'draussen', 'Saturday', 'performance', 'Stunning drag & voguing performance', '{}'),
('LottaLove', '20:30 - 22:15', 'oben', 'Saturday', 'dj', 'Downtempo', '{"soundcloud": "https://on.soundcloud.com/kxcwNtV4Botm5okM8i"}'),
('Tamara Tischtennisball', '21:30 - 23:00', 'unten', 'Saturday', 'dj', 'House / Hard House', '{"soundcloud": "https://on.soundcloud.com/ujwZAcupIOMo96xsIf"}'),
('isl&', '22:15 - 00:00', 'oben', 'Saturday', 'dj', 'Melodic Techno / Techy House', '{"soundcloud": "https://soundcloud.com/isl-and?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"}'),
('1 Boy No Club', '23:00 - 01:00', 'unten', 'Saturday', 'dj', 'Power House', '{"soundcloud": "https://on.soundcloud.com/n4ZhXyi8U4jys8qPRa"}'),

-- Sunday Events  
('Takt & Taumel', '00:00 - 02:00', 'oben', 'Sunday', 'dj', 'Dirty Midtempo / Bouncetempo', '{"soundcloud": "https://on.soundcloud.com/V2mPyzr9jdtktheCa2"}'),
('Felix Blume', '01:00 - 03:00', 'unten', 'Sunday', 'dj', 'Trance / Hard-Groove', '{"soundcloud": "https://on.soundcloud.com/qyStxld3tjBoHduMUY"}'),
('ra.ul', '02:00 - 04:00', 'oben', 'Sunday', 'dj', 'House / Tech House', '{"soundcloud": "https://soundcloud.com/raulpr?ref=clipboard&p=a&c=1&si=cabc0c60d02b4caab8396ac2ff652d8b&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"}'),
('ondüle', '03:00 - 05:00', 'unten', 'Sunday', 'dj', 'Trance', '{"soundcloud": "https://on.soundcloud.com/fpvK4frm5RJRuVzDg1"}'),
('Kaddi Kippenberger', '04:00 - 06:00', 'oben', 'Sunday', 'dj', 'Indie Dance / House', '{"soundcloud": "https://on.soundcloud.com/ytzaDkm49UjIAkAAPR"}'),
('Draco Dark', '05:00 - 07:00', 'unten', 'Sunday', 'dj', 'Melodic / Psy-Techno', '{"soundcloud": "https://on.soundcloud.com/Y8ucqTuuxoEZCyGYe6"}'),
('Ideal Standard', '06:00 - 08:00', 'oben', 'Sunday', 'dj', 'House / Tech House', '{"soundcloud": "https://soundcloud.com/user-997519530?ref=clipboard&p=i&c=0&si=6516D87EF628413E8C1F20E3343590DF&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"}'),
('Melaune', '08:00 - 10:00', 'oben', 'Sunday', 'dj', 'Dark Disco / Indie Dance', '{"soundcloud": "https://on.soundcloud.com/84BYyCOjWMA8tsOiY9"}'),
('Briefe öffnen mit Momo und Timo', '10:00 - 12:00', 'draussen', 'Sunday', 'performance', 'letterOpeningDesc', '{}'),
('Nepomuk', '10:00 - 12:00', 'oben', 'Sunday', 'dj', 'House', '{"soundcloud": "https://on.soundcloud.com/hnLI95A5SH9l2S4tfO"}'),
('Confeffing', '11:00 - 13:00', 'unten', 'Sunday', 'dj', 'Indie Dance / Disco House', '{"soundcloud": "https://on.soundcloud.com/M16nlKgKa2jXL1ZlRP"}'),
('Regentag', '13:00 - 14:30', 'draussen', 'Sunday', 'dj', 'Downtempo', '{"soundcloud": "https://soundcloud.com/regentag_music/freihgefuhl-festival-25"}'),
('Firlefanz & Schabernack', '14:30 - 16:30', 'draussen', 'Sunday', 'dj', 'House / Tech House', '{"soundcloud": "https://on.soundcloud.com/eXrPRoebAG23g0BCkj"}'),
('Sekt Kegeln', '14:30 - 16:30', 'draussen', 'Sunday', 'interaktiv', 'bowling', '{}'),
('Moosen?', '16:30 - 18:00', 'draussen', 'Sunday', 'dj', 'Downtempo', '{"soundcloud": "https://on.soundcloud.com/TDf0wBLLNw9TAO7JYt"}'),
('Nümphe?', '18:00 - 19:00', 'draussen', 'Sunday', 'dj', 'Dirty Downtempo / Midtempo', '{}'),
('AYU', '19:00 - 20:00', 'draussen', 'Sunday', 'live', 'soundJourneyLiveDesc', '{"instagram": "https://www.instagram.com/ayu.echoes/", "youtube": "https://www.youtube.com/watch?v=1zHfMboqteY&t=303s"}');