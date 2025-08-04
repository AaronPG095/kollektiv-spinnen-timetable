-- Insert sample German FAQ data
INSERT INTO public.faqs (question, answer, category, subcategory, order_index, language, is_visible) VALUES

-- Category A
('Wo finde ich das vollständige Awareness-Konzept?', 'Das finale Awareness-Konzept wird separat verlinkt, hier ein paar Überblicksfragen:', 'A', 'Awareness', 1, 'de', true),
('Gibt es Awareness auf dem Festival?', 'Ja, Mischkonzept aus kollektiver Awareness (tagsüber) und klassischer Awareness (nachts) mit mindestens 2 Awareness-Personen', 'A', 'Awareness', 2, 'de', true),
('Wo finde ich Support?', 'Awareness-Raum im 1. OG sowie rund um die Uhr durch Awareness-Personen (lila Westen), über die Bar oder die Orga-Zentrale', 'A', 'Awareness', 3, 'de', true),
('Was ist kollektive Awareness?', 'Alle Teilnehmenden sind verantwortlich für einen sicheren, diskriminierungsfreien Raum - gebt aufeinander acht und verhaltet euch empathisch und solidarisch. mehr Infos dazu in unserem Awareness-Konzept (Link folgt)', 'A', 'Awareness', 4, 'de', true),

('Wie erreiche ich das Festival?', 'Mit der S-Bahn von Leipzig nach Leisnig (ca. 50 Minuten, mindestens alle 2 Stunden), dann 10 Minuten Fußweg vom Bahnhof Leisnig zur Location', 'A', 'Anreise & Anfahrt', 5, 'de', true),
('Wann fährt der Zug nicht?', 'Späteste Abfahrt von Leipzig um 22:06, dann wieder ab 06 Uhr; Rückfahrt: späteste Rückfahrt 21:02 Uhr, dann wieder ab 07 Uhr', 'A', 'Anreise & Anfahrt', 6, 'de', true),
('Gibt es Parkmöglichkeiten?', 'Parken auf dem Gelände ist (begrenzt, aber vermutlich ausreichend) möglich. Bitte informiert uns vorher, um sicherzugehen!', 'A', 'Anreise & Anfahrt', 7, 'de', true),

('Wie melde ich mich an?', 'Zahlt euren Unkostenbeitrag per PayPal und schreibt den gewünschten Wochentag in den Betreff', 'A', 'Anmeldung', 8, 'de', true),

-- Category B
('Muss ich einen Becher mitbringen?', 'Ja, damit hilfst du uns! Denke unbedingt auch an Teller und Besteck für dich (siehe unten).', 'B', 'Becher', 9, 'de', true),

('Was kostet das Festival?', 'Wir sind non-profit, es gibt daher keinen Ticketpreis. Um unseren Geburtstag zu finanzieren, müssen wir aber eine Spende als Unkostenbeitrag verlangen, dieser beträgt: 1 Tag/Nacht 25€-50€, ganzes Wochenende 50€-100€', 'B', 'Beitrag & Bezahlung', 10, 'de', true),
('Wie zahle ich?', 'Per PayPal-Spende mit gewünschtem Tag im Betreff', 'B', 'Beitrag & Bezahlung', 11, 'de', true),

('Welche Bereiche gibt es?', 'Drei Floors: Salon (erster Stock neben dem Kantinen- und Barbereich), Flora (der Rave-Jungle im Untergeschoss) und Neue Ufer (Draußen-Floor), dazu viele Chill-Areas innen und außen, Extra-Räume ua. für Karaoke (im Erdgeschoss), die Sound Journey (großer Saal im 3. OG) und Kino (neben dem Salon), dazu noch die Schlafräume im 2. OG sowie draußen der private Flusszugang sowie der Camping-Platz', 'B', 'Bereiche', 12, 'de', true),

-- Category C
('Wo kann ich schlafen?', 'Schlafräume im 2. OG des Gebäudes für bis zu 80 Personen (eher für Wochenendgäste) oder ruhige Zeltwiese für lärmempfindliche Gäste', 'C', 'Camping & Übernachtung', 13, 'de', true),
('Ist es nachts laut?', 'Freitag wird es eher leise & man kann gut im Haus schlafen, Samstag auf Sonntag wird es lauter (Zelt oder Oropax empfohlen)', 'C', 'Camping & Übernachtung', 14, 'de', true),

('Gibt es Entspannungsmöglichkeiten?', 'Ja, viele gemütliche Chill-Areas im Gebäude und außerhalb, zum Beispiel am Fluss', 'C', 'Chill-Areas', 15, 'de', true),

-- Category D
('Kann ich vor Ort duschen?', 'Ja, warme Duschen innen und kalte Außenduschen verfügbar', 'D', 'Duschen', 16, 'de', true),

-- Category E
('Was ist bei der Verpflegung enthalten?', 'Zwei Mahlzeiten pro Tag (Frühstück und warmes Abendessen) sind im Soli-Beitrag enthalten', 'E', 'Essen', 17, 'de', true),
('Wann geht es los?', 'Freitag, 08.08.25, um 18:00 Uhr mit einem Welcome Dinner 🍽️', 'E', 'Eröffnung', 18, 'de', true);

-- Insert more FAQ entries
INSERT INTO public.faqs (question, answer, category, subcategory, order_index, language, is_visible) VALUES

-- Category F
('Kann ich schwimmen gehen?', 'Ja, es gibt einen privaten Flusszugang (Achtung rutschig – Zutritt auf eigene Gefahr)', 'F', 'Flusszugang', 19, 'de', true),
('Was läuft am Freitag?', 'Welcome Dinner ab 18:00, Eröffnungs-Live-Konzert, entspanntes vor-raven bis 04:00, davor Feuershow, Karaoke, Kino, Sound Journey', 'F', 'Freitags-Programm', 20, 'de', true),

-- Category G
('Was kosten Getränke?', 'Je nach Spendenaufkommen wollen wir mindestens alle einfachen alkoholfreien Getränke (wie Wasser, Tee, Kaffee); alkoholische und besondere alkoholfreie Getränke (wie alkoholfreies Weizen) wollen wir zwar kostenfrei anbieten, je nach Spendenaufkommen müssen wir dafür aber einen geringen Unkostenbeitrag verlangen – darüber informieren wir kurz vor dem Festival-Beginn.', 'G', 'Getränke', 21, 'de', true),
('Wo findet das Festival statt?', 'In einer einzigartigen ehemaligen DDR-Spinnereizentrale in Leisnig – keine 10 min. zu Fuß vom Bahnhof – Standort folgt am Freitag', 'G', 'Gelände', 22, 'de', true),
('Wo darf ich nicht hin?', 'Gehe auf keinen Fall zu den Lagerhallen oder anderen Fabrikgebäuden - sonst müssen wir dich leider des Geländes verweisen und die Party ist vorbei, weil du damit unser Festival gefährdest. Halte dich ausschließlich in und um unser Haus herum sowie auf dem Zeltplatz auf.', 'G', 'Gelände', 23, 'de', true),

-- Category H
('Warum braucht ihr meine Hilfe?', 'Wie bei jedem Geburtstag können die Geburtstagskinder nicht allein für alles sorgen – alle packen etwas mit an. Wir bieten euch nicht irgendeinen Geburtstag, sondern ein Community-Festival mit einzigatigem Progarmm und Angebot. Das kann aber nur dann so gut und zu einem so günstigen Preis funktionieren kann, wenn alle mithelfen – nämlich ca. 1 Mal pro 24h Festival für 1 bis 2 Stunden (also echt nicht viel für ein ganzes Wochenende)', 'H', 'Helfen & Mitarbeit', 24, 'de', true),
('Welche Aufgaben gibt es?', 'An der Bar, als Springer oder Awareness, beim Kochen, Auf-/Abbau usw. - wir brauchen dich! Die Aufgaben samt Beschreibung findest du in der Helfer*innengruppe (Link)', 'H', 'Helfen & Mitarbeit', 25, 'de', true),
('Wie trage ich mich für Schichten ein?', 'Beim Ankommen (Check-in), wenn du dir in der Orga-Zentrale dein Bändchen abholst. außer: Aufbau/Abbau und Awareness: hier bitte vorher melden (bei den Kontakten im Info-Channel)', 'H', 'Helfen & Mitarbeit', 26, 'de', true),
('Wie viel soll ich helfen?', 'Wir empfehlen: Freitag auf Samstag: eine (voraussichtlich) 1-1,5h-Schicht, Samstag bis Sonntag Abend: eine maximal 2h-Schicht (je nach Aufgabe)', 'H', 'Helfen & Mitarbeit', 27, 'de', true),
('Zählt mein Programmbeitrag als Schicht?', 'Ja, liebe Artists: Euer Programmbeitrag zählt als Schicht', 'H', 'Helfen & Mitarbeit', 28, 'de', true),
('Wo erfahre ich mehr?', 'Mehr Infos gibt es in unserer Helfer*innen Gruppe', 'H', 'Helfen & Mitarbeit', 29, 'de', true),
('Was bekomme ich dafür?', 'Drei Stages, ein krasses Programm, Essen und auch alle Getränke quasi umsonst oder sehr wahrscheinlich gratis – wir machen wie gesagt keinen Profit, sondern feiern mit Euch Geburtstag und laden Euch ein, mit uns das Festival zu gestalten <3', 'H', 'Helfen & Mitarbeit', 30, 'de', true),
('Gibt es eine Hüpfburg?', 'Ja, es gibt sogar eine Hüpfburg!', 'H', 'Hüpfburg', 31, 'de', true),

-- Category I
('Was ist alles enthalten?', 'Übernachtung, Kultur- und Musikprogramm, zwei Mahlzeiten täglich, und mindestens die einfachen alkoholfreien Getränke', 'I', 'Inklusive', 32, 'de', true),

-- Category K
('Gibt es Kino-Programm?', 'Ja, am Freitag zeigt unser Kino im 1. OG neben dem Salon mehrere Dokumentarfilme (sei gespannt!)', 'K', 'Kino', 33, 'de', true),
('Wie soll ich konsumieren?', 'Konsumiert verantwortungsvoll: Offener Konsum illegaler Substanzen ist nicht gestattet. Bitte nehmt Rücksicht auf andere und verhaltet Euch verantwortungsvoll. Auch wenn die Getränke nichts kosten, ist das ein Community- und Komfort-Angebot und keine Einladung zum Flatrate-Saufen. Bei übermäßigem Konsum behalten wir uns vor, weiteren Alkoholkonsum zu untersagen.', 'K', '(Verantwortungsvoller) Konsum', 34, 'de', true),
('Welche Live-Musik gibt es?', 'Eröffnungs-Live-Konzert (Freitag), 3 Live-Konzerte am Samstag, Abschluss-Live-Konzert am Sonntag', 'K', 'Konzerte', 35, 'de', true);

-- Insert final FAQ entries
INSERT INTO public.faqs (question, answer, category, subcategory, order_index, language, is_visible) VALUES

-- Category L
('Wie laut wird es?', 'Freitag entspannt bis 04:00, Samstag 24h Rave, Sonntag gemütlicher Afternoon-Rave (denkt an Gehörsschutz oder fragt an der Bar nach Ohrstöpseln)', 'L', 'Lautstärke', 36, 'de', true),

-- Category M
('Was gibt es zu Essen?', 'Frühstück (vegan/vegetarisch) und warmes Abendessen (vegan) täglich im Soli-Beitrag enthalten - Snacks für Zwischendurch bitte selbst mitbringen', 'M', 'Mahlzeiten', 37, 'de', true),
('Wann genau gibt es Essen?', 'Frühstück machen wir spontaner, vermutlich zwischen ca. 09 und 12 Uhr; Abendessen ist 18 bis 20 Uhr geplant 😇', 'M', 'Mahlzeiten', 38, 'de', true),
('Muss ich Besteck und Teller mitbringen?', 'Ja, bitte bringt euer eigenes Geschirr und auch einen Becher mit.', 'M', 'Mahlzeiten', 39, 'de', true),
('Wo kann ich ruhig schlafen?', 'Auf der ruhigen Zeltwiese für lärmempfindliche Gäste immer ruhig wird es Freitags auch im 2. OG - dort hört man Samstag Nacht jedoch den Salon-Floor im Stockwerk drunter, weshalb wir lärmempfindlichen Schläfer:innen die Zeltwiese empfehlen', 'M', 'Nachtruhe', 40, 'de', true),

-- Category O
('Was und wo ist die Orga-Zentrale?', 'Im 1. OG kommst du direkt vom Treppenhaus in unsere Orga-Zentrale, das alte Chef-Büro, wo du dein Bändchen bekommst, dich für Schichten einträgst und allgemein Fragen stellen kannst', 'O', 'Orga-Zentrale', 41, 'de', true),
('Wann ist Einlass?', 'Die Öffnungszeiten der Orga-Zentrale für den Einlass sind: Freitag 16-22 Uhr, Samstag 10-22 Uhr (nachts nach Absprache), Sonntag 10-16 Uhr (Musik bis 20:00 Uhr)', 'O', 'Öffnungszeiten', 42, 'de', true),
('Was ist, wenn ich später oder früher als zu den Einlass-Zeiten komme?', 'Melde dich dann bitte bei Nico, Aaron oder Momo (notfalls bei der Bar)!', 'O', 'Öffnungszeiten', 43, 'de', true),

-- Category P
('Was für eine Art Event ist das?', 'Dies ist eine Privatveranstaltung, und zwar die Geburtstagsfeier von Aaron, Nico und Momo', 'P', 'Privatveranstaltung', 44, 'de', true),
('Wer darf teilnehmen?', 'Nur Personen, die mit unserer Erlaubnis eingeladen sind und im Vorhinein ihren Unkostenbeitrag leisten (alle erhalten ein Bändchen). Ungeladene Personen, die nicht auf unserer Gästeliste aufgeführt sind, werden des Geländes verwiesen (notfalls mithilfe der Polizei). Wir behalten uns außerdem das Hausrecht nach eigenem Ermessen vor, sollten zum Beispiel die Regeln unserer Veranstaltung verletzt werden oder diskriminierendes oder verletzendes Verhalten auftreten.', 'P', 'Privatveranstaltung', 45, 'de', true),
('Welche Shows gibt es?', 'Feuershow, Drag/Voguing Performance, Briefe Öffnen mit Momo & Timo', 'P', 'Performances', 46, 'de', true),
('Wie funktioniert die Zahlung?', 'PayPal-Spende mit dem gewünschten Tag im Betreff (Link siehe Veranstaltungs-Gruppe)', 'P', 'PayPal', 47, 'de', true),

-- Category R
('Welche Regeln gelten?', 'Keine diskriminierenden Äußerungen/ Materialien/ Verhaltensweisen, kein offener Drogenkonsum, nur verantwortungsvollere Konsum (kein hemmungsloses Betrinken), kein Fotografieren, null Toleranz bei GHB', 'R', 'Regeln', 48, 'de', true),

-- Category S
('Wie lange sind die Schichten ca.?', 'Freitag auf Samstag: 1-1,5h-Schicht, Samstag bis Sonntag Abend: 1,5 – 2h-Schicht (30 min., wenn du die Toiletten desinifizierst – muss ja auch jemand erledigen)', 'S', 'Schichten', 49, 'de', true),
('Was passiert, wenn ich nicht helfe?', 'Das Festival kann nur funktionieren, wenn möglichst alle mitmachen - wir zählen auf dich!', 'S', 'Schichten', 50, 'de', true),
('Ist es wirklich spendenbasiert?', 'Ja, wir geben als Spendenempfehlung einen Spielraum an, um je nach finanziellen Möglichkeiten allen die Teilnahme zu ermöglichen (aber: wir machen keinen Gewinn)', 'S', 'Spenden', 51, 'de', true),

-- Category T
('Kann ich nur einen Tag kommen?', 'Ja, 1 Tag inkl. Nacht für 25€-50€ Spende; Sonntags 15€-25€', 'T', 'Tagestickets', 52, 'de', true),
('Gibt es einen Timetable?', 'Ja, wir veröffentlichen eine Online-Version (Web-App) kurz vor der Veranstaltung, die auch Aktualisierungen enthält. Zusätzlich gibt es mehrere Aushänge am Gelände!', 'T', 'Timetable', 53, 'de', true),

-- Category U
('Welche Schlafmöglichkeiten gibt es?', 'Schlafräume im Gebäude (bis 80 Personen) oder Zeltplatz', 'U', 'Übernachtung', 54, 'de', true),

-- Category V
('Was ist beim Essen zu beachten?', 'Zwei vegane Mahlzeiten täglich enthalten, spezielle Ernährungsanliegen bitte vorab mitteilen', 'V', 'Verpflegung', 55, 'de', true),

-- Category W
('Welche Workshops gibt es?', 'Yoga (Somatic Vinyasa Flow), Aerobic Session (Aerobic Dance Therapy), Sound Journey (meditative Klangreise), Sekt-Kegeln', 'W', 'Workshops', 56, 'de', true),
('Was gibt es außer Musik?', 'Außer den eben genannten Workshops gibt es noch Karaoke, Feuershow, Kino, Briefe öffnen mit Momo & Timo, eine Drag- & Voguing-Performance', 'W', 'Workshops', 57, 'de', true),

-- Category Z
('Kann ich zelten?', 'Ja, ruhige Zeltwiese für lärmempfindliche Gäste gibt genug Platz für alle', 'Z', 'Zeltwiese', 58, 'de', true);