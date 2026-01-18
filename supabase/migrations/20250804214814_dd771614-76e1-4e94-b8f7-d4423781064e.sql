-- Insert English FAQ data
INSERT INTO public.faqs (question, answer, category, subcategory, order_index, language, is_visible) VALUES

-- Category A
('Where can I find the complete awareness concept?', 'The final awareness concept will be linked separately. Here are a few overview questions:', 'A', 'Awareness', 1, 'en', true),
('Is there awareness at the festival?', 'Yes, a mixed concept of collective awareness (during the day) and traditional awareness (at night) with at least 2 awareness personnel', 'A', 'Awareness', 2, 'en', true),
('Where can I find support?', 'Awareness room on the 1st floor and 24/7 through awareness personnel (purple vests), via the bar or the organization center', 'A', 'Awareness', 3, 'en', true),
('What is collective awareness?', 'All participants are responsible for a safe, discrimination-free space - look out for each other and behave empathetically and in solidarity. More info in our awareness concept (link to follow)', 'A', 'Awareness', 4, 'en', true),

('What areas are there?', 'Three floors: Salon (first floor next to the canteen and bar area), Flora (the rave jungle in the basement) and Neue Ufer (outdoor floor), plus many chill areas inside and outside, extra rooms for karaoke (ground floor), the Sound Journey (large hall on 3rd floor) and cinema (next to the Salon), plus sleeping rooms on 2nd floor as well as outside the private river access and camping area', 'A', 'Areas', 5, 'en', true),

('How do I get to the festival?', 'By S-Bahn from Leipzig to Leisnig (approx. 50 minutes, at least every 2 hours), then 10-minute walk from Leisnig station to the location', 'A', 'Arrival & Transport', 6, 'en', true),
('When don''t trains run?', 'Latest departure from Leipzig at 22:06, then again from 06:00; Return: latest return journey 21:02, then again from 07:00', 'A', 'Arrival & Transport', 7, 'en', true),
('Are there parking options?', 'Parking on the grounds is possible (limited, but probably sufficient). Please inform us beforehand to be sure!', 'A', 'Arrival & Transport', 8, 'en', true),

-- Category B
('Is there a bouncy castle?', 'Yes, there''s even a bouncy castle!', 'B', 'Bouncy Castle', 9, 'en', true),

-- Category C
('Where can I sleep?', 'Sleeping rooms on the 2nd floor of the building for up to 80 people (rather for weekend guests) or quiet tent meadow for noise-sensitive guests', 'C', 'Camping & Accommodation', 10, 'en', true),
('Is it loud at night?', 'Friday will be rather quiet & you can sleep well in the house, Saturday to Sunday will be louder (tent or earplugs recommended)', 'C', 'Camping & Accommodation', 11, 'en', true),

('Are there relaxation opportunities?', 'Yes, many cozy chill areas in the building and outside, for example by the river', 'C', 'Chill Areas', 12, 'en', true),

('Is there cultural programming?', 'Yes, on Friday among other things a documentary film runs', 'C', 'Cinema', 13, 'en', true),

('How should I consume?', 'Consume responsibly: Open consumption of illegal substances is not permitted. Please be considerate of others and behave responsibly. Even if drinks cost nothing, this is a community and comfort offering and not an invitation to flat-rate drinking. With excessive consumption, we reserve the right to prohibit further alcohol consumption.', 'C', '(Responsible) Consumption', 14, 'en', true),

('What live music is there?', 'Opening live concert (Friday), 3 live concerts on Saturday, closing live concert on Sunday', 'C', 'Concerts', 15, 'en', true),

('What does the festival cost?', 'We are non-profit, so there''s no ticket price. To finance our birthday, we must ask for a donation as a cost contribution: 1 day/night €25-50, whole weekend €50-100', 'C', 'Contribution & Payment', 16, 'en', true),
('How do I pay?', 'Via PayPal donation with desired day in the subject line', 'C', 'Contribution & Payment', 17, 'en', true),

('Do I need to bring a cup?', 'Yes, this helps us! Also definitely remember plates and cutlery for yourself (see below).', 'C', 'Cups', 18, 'en', true),

-- Category D
('Is it really donation-based?', 'Yes, we give a range as a donation recommendation to enable participation for everyone according to their financial possibilities (but: we make no profit)', 'D', 'Donations', 19, 'en', true),

('What do drinks cost?', 'Depending on donation income, we want to offer at least all simple non-alcoholic drinks (like water, tea, coffee) for free; we want to offer alcoholic and special non-alcoholic drinks (like non-alcoholic wheat beer) for free, but depending on donation income we may have to charge a small cost contribution - we''ll inform about this shortly before the festival begins.', 'D', 'Drinks', 20, 'en', true),

-- Category F
('What''s included in catering?', 'Two meals per day (breakfast and warm dinner) are included in the solidarity contribution', 'F', 'Food', 21, 'en', true),
('When does it start?', 'Friday, 07.08.2026, at 18:00 with a Welcome Dinner 🍽️ (Breakfasts follow around 09-12 every morning, Saturday Dinner at 18:00)', 'F', 'Food', 22, 'en', true),

('What''s happening on Friday?', 'Welcome Dinner from 18:00, opening live concert, relaxed pre-raving until 04:00, before that fire show, karaoke, cinema, Sound Journey', 'F', 'Friday Program', 23, 'en', true);

-- Insert more English FAQ entries
INSERT INTO public.faqs (question, answer, category, subcategory, order_index, language, is_visible) VALUES

-- Category H
('Why do you need my help?', 'Like at any birthday party, the birthday children can''t take care of everything alone - everyone pitches in a bit. We''re not offering you just any birthday, but a community festival with unique program and offerings. This can only work so well and at such a low price if everyone helps - namely about 1 time per 24h festival for 1 to 2 hours (really not much for a whole weekend)', 'H', 'Helping & Participation', 24, 'en', true),
('What tasks are there?', 'At the bar, as a substitute or awareness, cooking, setup/teardown etc. - we need you! You''ll find the tasks with descriptions in the helper group (link)', 'H', 'Helping & Participation', 25, 'en', true),
('How do I sign up for shifts?', 'When arriving (check-in), when you pick up your wristband at the organization center. Except: setup/teardown and awareness: please register beforehand (with the contacts in the info channel)', 'H', 'Helping & Participation', 26, 'en', true),
('How much should I help?', 'We recommend: Friday to Saturday: one (presumably) 1-1.5h shift, Saturday to Sunday evening: one maximum 2h shift (depending on task)', 'H', 'Helping & Participation', 27, 'en', true),
('Does my program contribution count as a shift?', 'Yes, dear artists: Your program contribution counts as a shift', 'H', 'Helping & Participation', 28, 'en', true),
('Where can I learn more?', 'More info is available in our helpers group', 'H', 'Helping & Participation', 29, 'en', true),
('What do I get for it?', 'Three stages, an amazing program, food and also all drinks basically free or very likely gratis - as we said, we make no profit, but celebrate birthday with you and invite you to help us shape the festival <3', 'H', 'Helping & Participation', 30, 'en', true),

-- Category I
('What''s all included?', 'Accommodation, cultural and music program, two meals daily, and at least the simple non-alcoholic drinks', 'I', 'Inclusive', 31, 'en', true),

-- Category L
('Where does the festival take place?', 'In a unique former GDR spinning mill central in Leisnig - less than 10 min. walk from the train station - location follows on Friday', 'L', 'Location', 32, 'en', true),
('Where am I not allowed to go?', 'Never go to the warehouses or other factory buildings - otherwise we unfortunately have to remove you from the grounds and the party is over, because you endanger our festival. Stay exclusively in and around our house as well as on the campsite.', 'L', 'Location', 33, 'en', true),

('How loud will it be?', 'Friday relaxed until 04:00, Saturday 24h rave, Sunday cozy afternoon rave (think about hearing protection or ask at the bar for earplugs)', 'L', 'Loudness', 34, 'en', true),

-- Category M
('What food is there?', 'Breakfast (vegan/vegetarian) and warm dinner (vegan) daily included in the solidarity contribution - please bring your own snacks for in between', 'M', 'Meals', 35, 'en', true),
('When exactly is there food?', 'We make breakfast more spontaneously, probably between about 09 and 12 o''clock; dinner is planned for 18 to 20 o''clock 😇', 'M', 'Meals', 36, 'en', true),
('Do I need to bring cutlery and plates?', 'Yes, please bring your own dishes and also a cup.', 'M', 'Meals', 37, 'en', true),

-- Category N
('Where can I sleep quietly?', 'On the quiet tent meadow for noise-sensitive guests it''s always quiet, and on Fridays also on the 2nd floor - there you hear the Salon floor on Saturday night from the floor below, which is why we recommend the tent meadow for noise-sensitive sleepers', 'N', 'Night Rest', 38, 'en', true),

-- Category O
('What and where is the Orga-Zentrale?', 'On the 1st floor you come directly from the stairwell into our organization center, the old boss office, where you get your wristband, sign up for shifts and can ask questions in general', 'O', 'Orga-Zentrale', 39, 'en', true),

('When is admission?', 'The opening hours of the organization center for admission are: Friday 16-22, Saturday 10-22 (at night by arrangement), Sunday 10-16 (music until 20:00)', 'O', 'Opening Hours', 40, 'en', true),
('What if I come later or earlier than admission times?', 'Then please contact Nico, Aaron or Momo (if necessary at the bar)!', 'O', 'Opening Hours', 41, 'en', true),

-- Category P
('What kind of event is this?', 'A private event and birthday party of Aaron, Nico and Momo', 'P', 'Private Event', 42, 'en', true),
('Who may participate?', 'Only persons who are invited with our permission and pay their cost contribution in advance or by arrangement (everyone receives a wristband). Uninvited persons will be removed from the grounds (if necessary with police help).', 'P', 'Private Event', 43, 'en', true),

('What shows are there?', 'Fire show, drag/voguing performance, letter opening with Momo & Timo', 'P', 'Performances', 44, 'en', true),

('How does payment work?', 'PayPal donation with the desired day in the subject line (link see event group)', 'P', 'PayPal', 45, 'en', true),

-- Category R
('How do I register?', 'Pay your contribution via PayPal and write the desired weekday in the subject line', 'R', 'Registration', 46, 'en', true),

('Can I go swimming?', 'Yes, there''s private river access (caution slippery - access at your own risk)', 'R', 'River Access', 47, 'en', true),

('What rules apply?', 'No discriminatory statements/materials/behaviors, no open drug consumption, only more responsible consumption (no uninhibited drinking), no photography, zero tolerance for GHB', 'R', 'Rules', 48, 'en', true),

-- Category S
('How long are the shifts approximately?', 'Friday to Saturday: 1-1.5h shift, Saturday to Sunday evening: 1.5 - 2h shift (30 min. if you disinfect the toilets - someone has to do it too)', 'S', 'Shifts', 49, 'en', true),
('What happens if I don''t help?', 'The festival can only work if as many as possible participate - we''re counting on you!', 'S', 'Shifts', 50, 'en', true),

('Can I shower on site?', 'Yes, warm showers inside and cold outdoor showers available', 'S', 'Showers', 51, 'en', true),

-- Category T
('Can I come for just one day?', 'Yes, 1 day incl. night for €25-50 donation; Sundays €15-25', 'T', 'Day Ticket', 52, 'en', true),

('Is there a timetable?', 'Yes, we publish an online version (web app) shortly before the event, which also contains updates - plus there are postings on the grounds!', 'T', 'Timetable', 53, 'en', true),

-- Category U
('What sleeping options are there?', 'Sleeping rooms in the building (up to 80 people) or campsite', 'U', 'Accommodation', 54, 'en', true),

-- Category V
('What should I note about food?', 'Two vegan meals daily included, please communicate special dietary requirements in advance', 'V', 'Catering', 55, 'en', true),

-- Category W
('What workshops are there?', 'Yoga (Somatic Vinyasa Flow), Aerobics Session (Aerobic Dance Therapy), Sound Journey (meditative sound journey), Champagne Bowling', 'W', 'Workshops', 56, 'en', true),
('What is there besides music?', 'Besides the workshops just mentioned, there''s also karaoke, fire show, cinema, letter opening with Momo & Timo, a drag & voguing performance', 'W', 'Workshops', 57, 'en', true),

-- Category Z
('Can I camp?', 'Yes, quiet tent meadow for noise-sensitive guests has enough space for everyone', 'Z', 'Tent Meadow', 58, 'en', true);