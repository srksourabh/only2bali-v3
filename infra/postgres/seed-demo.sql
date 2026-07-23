--
-- Only2Bali marketplace demo data
--
-- Verified providers with photos and compliance evidence, listings, traveller
-- accounts, trip requests on the provider board, offers, enquiries, provider
-- applications, bookings in three states, and one review.
--
-- Generated from lib/db/seed-marketplace.ts against a database already loaded
-- with seed.sql, so the catalogue ids referenced here match that file exactly.
-- Regenerate both together or not at all.
--
-- Everything in here is fake and says so: accounts are @demo.only2bali.com,
-- provider slugs start `demo-`, booking references start `O2B-DEMO-`. That is
-- what makes it removable in one statement before real traffic arrives.
--
--     psql "$DATABASE_URL" -f seed-demo.sql
--
-- Wrapped in a transaction: a partial load would leave dangling references.
--

BEGIN;


\restrict LHRrVdELI7kbQWEAggjXl9Rdwtugat3OXiUkxgTH1mvcr9BvNRhlKomNeWi89gA

COPY public.account (id, email, mobile, role, status, email_verified_at, mobile_verified_at, last_login_at, created_at, updated_at) FROM stdin;
a16cc946-7001-418b-9ff7-096d774bb66f	demo-sattvik-by-nature@demo.only2bali.com	+6281300000000	vendor	active	2026-03-25 12:27:45.204+00	2026-03-25 12:27:45.204+00	2026-07-21 12:27:45.204+00	2026-07-23 12:27:45.225001+00	2026-07-23 12:27:45.225001+00
c58abf1b-74b2-42a8-96fc-ebfef301df15	demo-taru-villas-ubud@demo.only2bali.com	+6281300000001	vendor	active	2026-03-25 12:27:45.274+00	2026-03-25 12:27:45.274+00	2026-07-21 12:27:45.274+00	2026-07-23 12:27:45.292956+00	2026-07-23 12:27:45.292956+00
592f1563-c52c-467a-9d02-72534b2b1511	demo-bali-veg-transport@demo.only2bali.com	+6281300000002	vendor	active	2026-03-25 12:27:45.305+00	2026-03-25 12:27:45.305+00	2026-07-21 12:27:45.305+00	2026-07-23 12:27:45.323863+00	2026-07-23 12:27:45.323863+00
305d29de-1f60-4600-be98-398e7b254fd3	demo-jain-cook-collective@demo.only2bali.com	+6281300000003	vendor	active	2026-03-25 12:27:45.339+00	2026-03-25 12:27:45.339+00	2026-07-21 12:27:45.339+00	2026-07-23 12:27:45.357864+00	2026-07-23 12:27:45.357864+00
e8234109-e0fa-422b-bcb7-6ca0520a6308	meera.shah@demo.only2bali.com	+919820000101	traveller	active	2026-06-13 12:27:45.371+00	2026-06-13 12:27:45.371+00	2026-07-22 12:27:45.371+00	2026-07-23 12:27:45.389273+00	2026-07-23 12:27:45.389273+00
897d450a-7854-4f3d-8ceb-866d1c7f9436	rohit.agarwal@demo.only2bali.com	+919820000102	traveller	active	2026-06-13 12:27:45.379+00	2026-06-13 12:27:45.379+00	2026-07-22 12:27:45.379+00	2026-07-23 12:27:45.397729+00	2026-07-23 12:27:45.397729+00
34dfb67e-5493-4945-b15c-6f653a608faa	anita.rao@demo.only2bali.com	+919820000103	traveller	active	2026-06-13 12:27:45.385+00	2026-06-13 12:27:45.385+00	2026-07-22 12:27:45.385+00	2026-07-23 12:27:45.404467+00	2026-07-23 12:27:45.404467+00
\.

\unrestrict LHRrVdELI7kbQWEAggjXl9Rdwtugat3OXiUkxgTH1mvcr9BvNRhlKomNeWi89gA


\restrict eOa7aJZjT8mGeJGUVhaVPoqMNSwKNY1VPvGIxbKbfiJpAs6lxKbb4mMvL9eKyzn

COPY public.traveller (id, account_id, full_name, home_city, default_protocol, preferred_language, whatsapp_optin, created_at, updated_at) FROM stdin;
4089b642-3910-40bb-b4cd-87c2173870bd	e8234109-e0fa-422b-bcb7-6ca0520a6308	Meera Shah	Mumbai	jain	gu	t	2026-07-23 12:27:45.393092+00	2026-07-23 12:27:45.393092+00
d9291f9f-a906-4a4b-8134-1a87d0d7b45b	897d450a-7854-4f3d-8ceb-866d1c7f9436	Rohit Agarwal	Delhi	vegetarian	hi	t	2026-07-23 12:27:45.400797+00	2026-07-23 12:27:45.400797+00
7d0b991e-c19c-4b71-8bbd-655d33c958d8	34dfb67e-5493-4945-b15c-6f653a608faa	Anita Rao	Bengaluru	vegan	en	t	2026-07-23 12:27:45.407321+00	2026-07-23 12:27:45.407321+00
\.

\unrestrict eOa7aJZjT8mGeJGUVhaVPoqMNSwKNY1VPvGIxbKbfiJpAs6lxKbb4mMvL9eKyzn


\restrict KrrAiBnji69JvPq5kieixOfPVqnrOovGxx3big0edzIK6ceueMEZ5AalImrbDLG

COPY public.vendor (id, account_id, slug, business_name, legal_name, vendor_type, base_area, description, logo, cover_image, whatsapp, phone, email, website, languages, verification_status, verified_at, verified_by, rejection_reason, commission_rate, rating_avg, rating_count, response_time_minutes, onboarding_step, created_at, updated_at) FROM stdin;
25d45f84-5841-4b42-bcf9-626937fca134	a16cc946-7001-418b-9ff7-096d774bb66f	demo-sattvik-by-nature	Sattvik By Nature	PT Sattvik Nusantara	restaurant	Ubud	Pure vegetarian kitchen in central Ubud. No onion or garlic on request, separate Jain preparation line, and a cook who has run Jain menus for Indian groups since 2019.	/Asset/logo.png	/Asset/culinary.png	+6281900000000	\N	demo-sattvik-by-nature@demo.only2bali.com	\N	{English,Hindi,Gujarati,Indonesian}	verified	2026-04-14 12:27:45.212+00	\N	\N	0.1200	4.80	64	25	5	2026-07-23 12:27:45.23052+00	2026-07-23 12:27:45.23052+00
c0e8a225-07ae-48c2-85f9-42c060151125	c58abf1b-74b2-42a8-96fc-ebfef301df15	demo-taru-villas-ubud	Taru Villas Ubud	PT Taru Hospitality	accommodation	Ubud	Six private villas above the Petanu valley. Each villa has its own kitchen, which is what makes a Jain protocol workable for a whole week rather than a single meal.	/Asset/logo.png	/Asset/D-card-img2.png	+6281900000000	\N	demo-taru-villas-ubud@demo.only2bali.com	\N	{English,Indonesian,Hindi}	verified	2026-04-14 12:27:45.278+00	\N	\N	0.1500	4.60	41	90	5	2026-07-23 12:27:45.296421+00	2026-07-23 12:27:45.296421+00
f1783702-0b2c-4282-9b77-b4c6d0e0a7b7	592f1563-c52c-467a-9d02-72534b2b1511	demo-bali-veg-transport	Wayan Group Transport	CV Wayan Trans Bali	transport	Denpasar	Fleet of eight vehicles with Hindi and Gujarati-speaking drivers. Routes planned around verified restaurants rather than around distance.	/Asset/logo.png	/Asset/beaches.png	+6281900000000	\N	demo-bali-veg-transport@demo.only2bali.com	\N	{English,Hindi,Gujarati,Indonesian}	verified	2026-04-14 12:27:45.309+00	\N	\N	0.1000	4.70	112	15	5	2026-07-23 12:27:45.327452+00	2026-07-23 12:27:45.327452+00
b0fb410d-d579-4a58-8ffd-2787c7a96613	305d29de-1f60-4600-be98-398e7b254fd3	demo-jain-cook-collective	Jain Cook Collective	PT Rasoi Bali	cook	Ubud	Cooks who travel with the group and work in the villa kitchen. This is the option groups take when no restaurant can be trusted for seven straight days.	/Asset/logo.png	/Asset/culinary.png	+6281900000000	\N	demo-jain-cook-collective@demo.only2bali.com	\N	{Hindi,Gujarati,Marwari,English}	verified	2026-04-14 12:27:45.343+00	\N	\N	0.1800	4.90	28	45	5	2026-07-23 12:27:45.36173+00	2026-07-23 12:27:45.36173+00
\.

\unrestrict KrrAiBnji69JvPq5kieixOfPVqnrOovGxx3big0edzIK6ceueMEZ5AalImrbDLG


\restrict TYipeb7gJAbEIs5OpIPeim2MaaAtYYMOZfrRYmxd7k6ABjmYfZvemWZtZ3xXOVa

COPY public.vendor_highlight (id, vendor_id, text, icon, sort_order, approved) FROM stdin;
7c6033ca-8f22-4537-94fb-dad93bd307dd	25d45f84-5841-4b42-bcf9-626937fca134	100% vegetarian kitchen — no meat has ever been prepared on the premises	\N	0	t
a2f0a8c6-dc0a-49d3-ac00-5d13d0bc3123	25d45f84-5841-4b42-bcf9-626937fca134	Jain menu without onion, garlic or root vegetables, cooked on a separate line	\N	1	t
546fb54d-0a42-4e16-bb50-73f0dce90ac3	25d45f84-5841-4b42-bcf9-626937fca134	Kitchen inspected by Only2Bali in person, not self-declared	\N	2	t
4c36b493-2615-44a8-9e63-cc7b2c22b15b	c0e8a225-07ae-48c2-85f9-42c060151125	Private kitchen in every villa — your own cook can work in it	\N	0	t
ffb307fa-22cd-48ac-954d-316e668b1a71	c0e8a225-07ae-48c2-85f9-42c060151125	Kitchen deep-cleaned and photographed before each Jain group arrives	\N	1	t
4dd24677-9f71-41f3-9591-99fa9bd876c5	c0e8a225-07ae-48c2-85f9-42c060151125	Walking distance to two verified vegetarian restaurants	\N	2	t
7d3dbe00-7ef2-4336-93d2-feb0222aba33	f1783702-0b2c-4282-9b77-b4c6d0e0a7b7	Drivers speak Hindi or Gujarati, not only English	\N	0	t
38445585-267d-44a3-a495-419c7246cd65	f1783702-0b2c-4282-9b77-b4c6d0e0a7b7	Meal stops routed through verified kitchens, never the nearest warung	\N	1	t
ea094333-5e42-4b38-a373-141f13170bb8	f1783702-0b2c-4282-9b77-b4c6d0e0a7b7	All vehicles under four years old, seat belts in every row	\N	2	t
cc16f73c-b5b9-4f81-b874-fb6c93e9a08c	b0fb410d-d579-4a58-8ffd-2787c7a96613	Cook travels with the group for the whole trip, not per meal	\N	0	t
fa4397a2-8a9a-4c38-888b-ef4bfd2ffbb1	b0fb410d-d579-4a58-8ffd-2787c7a96613	Brings their own spice kit from India — no local substitution	\N	1	t
204b4b90-fce3-4737-8266-916726073f68	b0fb410d-d579-4a58-8ffd-2787c7a96613	Every cook has run at least five Jain group trips	\N	2	t
\.

\unrestrict TYipeb7gJAbEIs5OpIPeim2MaaAtYYMOZfrRYmxd7k6ABjmYfZvemWZtZ3xXOVa


\restrict GJyvk1WRtHfCNDJhXcLRpdjCEGCcC0z9nWI3geceA46hVvS13ibeD65CWB6L4qd

COPY public.vendor_document (id, vendor_id, kind, file_url, status, reviewed_by, reviewed_at, created_at) FROM stdin;
92388b8a-f4d1-4910-94c9-6ac29941dc3e	25d45f84-5841-4b42-bcf9-626937fca134	business_licence	/demo/licence.pdf	approved	\N	2026-04-14 12:27:45.225+00	2026-07-23 12:27:45.243634+00
fd55e1d5-b812-42a1-9ae3-10b6016057d8	25d45f84-5841-4b42-bcf9-626937fca134	kitchen_certificate	/demo/kitchen.pdf	approved	\N	2026-04-14 12:27:45.225+00	2026-07-23 12:27:45.243634+00
33a68755-cce4-4c6a-afb8-0f341bd720e7	c0e8a225-07ae-48c2-85f9-42c060151125	business_licence	/demo/licence.pdf	approved	\N	2026-04-14 12:27:45.285+00	2026-07-23 12:27:45.303364+00
8437f16a-ca08-42ce-9c18-3d3ec8bde1ad	c0e8a225-07ae-48c2-85f9-42c060151125	kitchen_certificate	/demo/kitchen.pdf	approved	\N	2026-04-14 12:27:45.285+00	2026-07-23 12:27:45.303364+00
c10f42fb-0a5c-4e11-ad81-9fb710ef20c4	f1783702-0b2c-4282-9b77-b4c6d0e0a7b7	business_licence	/demo/licence.pdf	approved	\N	2026-04-14 12:27:45.317+00	2026-07-23 12:27:45.335125+00
2bed66e7-5438-4298-8328-014466fba1d1	f1783702-0b2c-4282-9b77-b4c6d0e0a7b7	kitchen_certificate	/demo/kitchen.pdf	approved	\N	2026-04-14 12:27:45.317+00	2026-07-23 12:27:45.335125+00
3cec4a6e-43c8-4576-8254-33bc990e4270	b0fb410d-d579-4a58-8ffd-2787c7a96613	business_licence	/demo/licence.pdf	approved	\N	2026-04-14 12:27:45.35+00	2026-07-23 12:27:45.36881+00
c4d7eff1-5ea1-46c1-bf97-0c0042444a35	b0fb410d-d579-4a58-8ffd-2787c7a96613	kitchen_certificate	/demo/kitchen.pdf	approved	\N	2026-04-14 12:27:45.35+00	2026-07-23 12:27:45.36881+00
\.

\unrestrict GJyvk1WRtHfCNDJhXcLRpdjCEGCcC0z9nWI3geceA46hVvS13ibeD65CWB6L4qd


\restrict sxvgwoWeRZBxPmwPKrDrTDpCVuGXKDm3OI72zZt0DhHWhXcIQjCbURbcU3rM4DX

COPY public.service_listing (id, vendor_id, title, service_type, description, area, capacity_min, capacity_max, tier, price_amount, price_currency, price_unit, images, status, active, created_at, updated_at) FROM stdin;
acc6367a-76c1-4474-88ba-4a74d88a10c6	25d45f84-5841-4b42-bcf9-626937fca134	Jain thali, group sitting	restaurant	Fixed Jain thali for groups of eight and above. No root vegetables. Separate prep line, separate utensils.	Ubud	8	40	comfort	140000	INR	per_person	{/Asset/culinary.png,/Asset/D-card-img2.png}	active	t	2026-07-23 12:27:45.248191+00	2026-07-23 12:27:45.248191+00
5607c10f-4a8e-4950-8e9d-4c7644f575ac	25d45f84-5841-4b42-bcf9-626937fca134	Cooking class — Balinese vegetarian	restaurant	Three-hour class, market walk included. Whole menu is vegetarian; Jain variant available.	Ubud	2	16	comfort	320000	INR	per_person	{/Asset/culinary.png}	active	t	2026-07-23 12:27:45.274098+00	2026-07-23 12:27:45.274098+00
802ed9f1-c2a9-41a3-a761-c53f1e5485e4	c0e8a225-07ae-48c2-85f9-42c060151125	Three-bedroom private villa with kitchen	accommodation	Sleeps six. Full kitchen, gas hob, dedicated utensils set kept sealed for veg-protocol groups.	Ubud	2	6	premium	1850000	INR	per_night	{/Asset/D-card-img2.png,/Asset/cultures.png}	active	t	2026-07-23 12:27:45.306545+00	2026-07-23 12:27:45.306545+00
f3924fac-f09a-42dd-b7e3-6d90ecccc78d	f1783702-0b2c-4282-9b77-b4c6d0e0a7b7	16-seater with driver, full day	transport	Twelve hours, fuel and parking included. Driver briefed on the group's protocol before the first pickup.	Island-wide	6	16	comfort	680000	INR	per_day	{/Asset/beaches.png}	active	t	2026-07-23 12:27:45.338502+00	2026-07-23 12:27:45.338502+00
2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	b0fb410d-d579-4a58-8ffd-2787c7a96613	Accompanying Jain cook, per trip	cook	One cook for the full itinerary. Cooks three meals a day in the group's own kitchen. Minimum ten travellers.	Island-wide	10	30	premium	6200000	INR	per_trip	{/Asset/culinary.png}	active	t	2026-07-23 12:27:45.372072+00	2026-07-23 12:27:45.372072+00
\.

\unrestrict sxvgwoWeRZBxPmwPKrDrTDpCVuGXKDm3OI72zZt0DhHWhXcIQjCbURbcU3rM4DX


\restrict wgHhbiIjQoYA354hrZwfVqS4MNb3S1QOqEEChzPZWSCgx3FhW8b9QRteXZjgZi2

COPY public.listing_circuit (listing_id, circuit_id) FROM stdin;
acc6367a-76c1-4474-88ba-4a74d88a10c6	e97024de-a517-4813-825d-92738d80c9dd
acc6367a-76c1-4474-88ba-4a74d88a10c6	4245c117-8ed6-412c-88c1-fb33e7dbac20
5607c10f-4a8e-4950-8e9d-4c7644f575ac	e97024de-a517-4813-825d-92738d80c9dd
802ed9f1-c2a9-41a3-a761-c53f1e5485e4	4245c117-8ed6-412c-88c1-fb33e7dbac20
802ed9f1-c2a9-41a3-a761-c53f1e5485e4	e5d67435-4463-4a3b-b660-1d3dd600f2c9
f3924fac-f09a-42dd-b7e3-6d90ecccc78d	4245c117-8ed6-412c-88c1-fb33e7dbac20
f3924fac-f09a-42dd-b7e3-6d90ecccc78d	d8e3dc25-597b-42f1-9ad2-e2f2e808aa30
f3924fac-f09a-42dd-b7e3-6d90ecccc78d	e97024de-a517-4813-825d-92738d80c9dd
f3924fac-f09a-42dd-b7e3-6d90ecccc78d	e5d67435-4463-4a3b-b660-1d3dd600f2c9
2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	4245c117-8ed6-412c-88c1-fb33e7dbac20
2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	e97024de-a517-4813-825d-92738d80c9dd
\.

\unrestrict wgHhbiIjQoYA354hrZwfVqS4MNb3S1QOqEEChzPZWSCgx3FhW8b9QRteXZjgZi2


\restrict wUjY2YCrrKeXe7cs4nPsl9nimU53bVLLNyferxGoGPPGlRy4ZLdoYhlpepdDJII

COPY public.listing_compliance (id, listing_id, protocol, guarantee_level, rating, kitchen_type, evidence_url, evidence_notes, verified_by, verified_at, expires_at, created_at) FROM stdin;
6a978f52-cf6c-4365-98d6-d1a2dbb35db8	acc6367a-76c1-4474-88ba-4a74d88a10c6	jain	certified	green	dedicated_veg	\N	Site visit 2026-05. Separate Jain line, no root vegetables stocked.	\N	2026-05-24 12:27:45.24+00	2027-05-24 12:27:45.24+00	2026-07-23 12:27:45.258356+00
d46e3862-8ce3-4b09-bbb1-feb3ca64c524	acc6367a-76c1-4474-88ba-4a74d88a10c6	vegetarian	certified	green	dedicated_veg	\N	Fully vegetarian premises.	\N	2026-05-24 12:27:45.24+00	2027-05-24 12:27:45.24+00	2026-07-23 12:27:45.258356+00
87a06d97-420c-4742-8834-a6bc1db19a64	acc6367a-76c1-4474-88ba-4a74d88a10c6	vegan	capable	amber	dedicated_veg	\N	Ghee used by default; vegan on 24 hours notice.	\N	2026-05-24 12:27:45.24+00	2027-05-24 12:27:45.24+00	2026-07-23 12:27:45.258356+00
df25e7c9-83a7-4903-822c-faef4d4c3620	5607c10f-4a8e-4950-8e9d-4c7644f575ac	vegetarian	certified	green	dedicated_veg	\N	Fully vegetarian premises.	\N	2026-05-24 12:27:45.262+00	2027-05-24 12:27:45.262+00	2026-07-23 12:27:45.280777+00
14ad052e-068e-4c80-a4c3-8c55f1cafe16	5607c10f-4a8e-4950-8e9d-4c7644f575ac	jain	capable	amber	dedicated_veg	\N	Jain variant on request, 24 hours notice.	\N	2026-05-24 12:27:45.262+00	2027-05-24 12:27:45.262+00	2026-07-23 12:27:45.280777+00
06affe9d-adc0-4a64-bd7f-e5b20647a031	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	jain	capable	green	dedicated_veg	\N	Sealed utensil set, gas hob, no shared equipment. Photographed 2026-06.	\N	2026-05-24 12:27:45.294+00	2027-05-24 12:27:45.294+00	2026-07-23 12:27:45.31299+00
2baaa2d6-fca6-4664-9087-a7a5275b1a16	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	vegetarian	capable	green	dedicated_veg	\N	Same kitchen, same sealed set.	\N	2026-05-24 12:27:45.294+00	2027-05-24 12:27:45.294+00	2026-07-23 12:27:45.31299+00
c3d094a6-a0a0-4f8d-a204-97e7f1175f8f	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	vegan	capable	green	dedicated_veg	\N	Self-catered, so entirely under the group's control.	\N	2026-05-24 12:27:45.294+00	2027-05-24 12:27:45.294+00	2026-07-23 12:27:45.31299+00
b38ab9bc-7ba0-4a2e-887c-76a93a2b2718	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	vegetarian	capable	green	\N	\N	No food served; meal stops are chosen from the verified list.	\N	2026-05-24 12:27:45.327+00	2027-05-24 12:27:45.327+00	2026-07-23 12:27:45.346006+00
abcd1867-9d9d-413e-8591-4738b3e76a8b	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	jain	capable	green	\N	\N	No food served; meal stops are chosen from the verified list.	\N	2026-05-24 12:27:45.327+00	2027-05-24 12:27:45.327+00	2026-07-23 12:27:45.346006+00
fad9fdf8-0470-4551-8fef-0be8a85441e2	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	vegan	capable	green	\N	\N	No food served; meal stops are chosen from the verified list.	\N	2026-05-24 12:27:45.327+00	2027-05-24 12:27:45.327+00	2026-07-23 12:27:45.346006+00
916aba17-5c27-469e-b851-4c47ba7b3644	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	jain	certified	green	dedicated_veg	\N	Cook prepares everything; no external kitchen involved.	\N	2026-05-24 12:27:45.36+00	2027-05-24 12:27:45.36+00	2026-07-23 12:27:45.378847+00
367f159b-5074-429f-98eb-a0f954f34dc3	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	vegetarian	certified	green	dedicated_veg	\N	Cook prepares everything.	\N	2026-05-24 12:27:45.36+00	2027-05-24 12:27:45.36+00	2026-07-23 12:27:45.378847+00
\.

\unrestrict wUjY2YCrrKeXe7cs4nPsl9nimU53bVLLNyferxGoGPPGlRy4ZLdoYhlpepdDJII


\restrict VRmTKf2u41e6PS1AbndKf1i9yUHPFglPbRr65LQxeCB5WolYTwkX4PWo3QnOmHp

COPY public.availability (id, listing_id, date, status, price_override_amount, hold_expires_at) FROM stdin;
57cd5af4-b860-4614-9a6f-63494bc9bb97	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-07-24	open	\N	\N
2540f171-39be-42f2-b320-abbe729e27de	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-07-25	open	\N	\N
64f46bb4-9382-44f2-b9a3-1eee505a763b	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-07-26	open	\N	\N
71ff87d0-3920-4587-8b70-fbb76fa8ccd7	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-07-27	open	\N	\N
042c781f-f9c8-4a2e-b8c2-6bf935be3b27	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-07-28	open	\N	\N
2ddb0b8a-abc7-4e9b-9b03-cc53f48d1328	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-07-29	open	\N	\N
5fe8f301-7bc3-480d-89ce-c0660cf88b0f	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-07-30	open	\N	\N
a963dc4d-8a12-40b3-b87f-f4cf0bc97cf6	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-07-31	open	\N	\N
a90722eb-ed1e-4e07-b8f0-a5e1062fa8c3	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-01	open	\N	\N
bbccd6cd-3640-4792-a603-8d02fea8ebd6	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-02	open	\N	\N
04ec4414-bfbf-461a-b447-ccfc6544c3c3	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-03	open	\N	\N
8b3f7e70-34cc-4f00-89b0-f9645a47304a	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-04	open	\N	\N
47fb73ce-b5fa-4e26-b54e-63a101ed146f	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-05	open	\N	\N
671ebb74-2ca6-49c6-86b4-d961aec4d6ef	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-06	open	\N	\N
a86445bd-edfa-45f6-945a-7289eca7fcb1	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-07	open	\N	\N
cee5d452-424c-4cfb-bb1e-b9225adbb494	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-08	open	\N	\N
f8e88c5a-ea0c-43d9-8b1e-817c95b74ff9	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-09	open	\N	\N
8d264702-a838-47ce-a0b9-cd830fff8f66	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-10	open	\N	\N
295620e3-9b40-45d7-ac71-c8e664985b8a	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-11	open	\N	\N
65e3b60b-9f22-47ed-96b4-4da2d718e355	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-12	open	\N	\N
4e01e540-5803-47ab-8780-ab01fc8b4bd5	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-13	blocked	\N	\N
9f860a00-1983-415c-9b1f-0b21d14417e9	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-14	blocked	\N	\N
3fdce0c8-5d67-4f0e-8eda-917f0a4edfb0	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-15	blocked	\N	\N
bfa7e3d5-e62a-47f2-a5c9-a71501d32dee	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-16	blocked	\N	\N
6226d989-8b61-4225-82c0-900544c06765	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-17	blocked	\N	\N
e0cd8065-cf88-48b8-bf28-6a68e7c6c9fd	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-18	blocked	\N	\N
65bcdc83-94ac-4398-909f-d3497738de48	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-19	blocked	\N	\N
666d6ecd-56f6-4739-8322-a59f8b401582	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-20	open	\N	\N
7b369d48-4510-43f8-85b6-8fd5615a0ee4	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-21	open	\N	\N
e318e78d-28cb-434d-8f4f-8de1d8a2e467	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-22	open	\N	\N
944a0146-fcac-4c3f-ba50-895983ffc6ac	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-23	open	\N	\N
d65887b3-8e9a-465b-919f-f0fc47f0f3ed	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-24	open	\N	\N
d228756f-3917-4473-bac0-c7032fe08e2a	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-25	open	\N	\N
9a5055fa-0977-42f0-8dd9-272a3837381a	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-26	open	\N	\N
b75f9d2c-0021-4bf5-8088-ef4d0ad6fff3	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-27	open	\N	\N
0d9f8bed-fbc7-437a-8220-357f41c5887d	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-28	open	\N	\N
c1cf5885-fca1-4d14-849b-eebdd0090f57	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-29	open	\N	\N
7613588f-0f03-4208-86df-9b7128331497	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-30	open	\N	\N
73e9f895-f141-442a-b792-2ea90f75fa10	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-08-31	open	\N	\N
d4021009-6116-41c4-aa5b-0cd098bc9792	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-01	open	\N	\N
fabb664e-ea32-4c4c-8166-dcd138373b6a	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-02	open	\N	\N
696f75c8-22ee-4b93-9162-89890b9ebb9c	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-03	open	\N	\N
4c04387c-c484-4cb0-838f-d362e054adf0	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-04	open	\N	\N
782094cc-64ab-43e2-a39a-d0a56be0459b	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-05	open	\N	\N
6b26241e-553a-40f7-a65f-c70906d6edf4	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-06	open	\N	\N
7a2e45ab-c77b-4f0d-af36-df9283f306e5	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-07	open	\N	\N
e593c81e-7eb3-482b-9264-86fdcb311c0d	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-08	open	\N	\N
ca13372f-2ecd-4050-813c-65c8d749922b	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-09	open	\N	\N
64436f62-44dc-42e5-a4d1-1b68503e94bb	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-10	open	\N	\N
b204c3a3-9939-4301-b282-f9d5fff04f03	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-11	open	\N	\N
707cdf11-79fb-48ac-92f0-3e141e665287	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-12	open	\N	\N
84656ede-f26f-4282-adae-d26e4bbe97a2	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-13	open	\N	\N
f9d2626d-a244-42d9-a3a2-c869b2d79111	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-14	open	\N	\N
b6d85a0a-c02f-43bf-bf2b-a7cc32f044a8	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-15	open	\N	\N
b275ffd5-f15c-4390-84a6-7ee319aa9055	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-16	open	\N	\N
bf2fd3f6-a79f-49b4-840c-545568795ca5	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-17	open	\N	\N
2b9dbb70-792e-47f7-b8c2-491d21f2606f	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-18	open	\N	\N
e0520135-5243-41ef-a237-d314f4faabe9	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-19	open	\N	\N
7a724967-4f03-4de2-aeb9-010c8c2fa665	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-20	open	\N	\N
ddd55b42-58c7-43e2-873b-c37ba468758d	acc6367a-76c1-4474-88ba-4a74d88a10c6	2026-09-21	open	\N	\N
c120f5f5-85a5-48b3-942e-8dbeb587d01e	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-07-24	open	\N	\N
17c23e64-7f68-4124-9c6a-3b3f1b9f37a9	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-07-25	open	\N	\N
214f4c15-42dd-4178-80af-d63a74d75f86	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-07-26	open	\N	\N
fda658c1-919c-4f1c-8ed9-8da711852be0	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-07-27	open	\N	\N
cb8dbd2c-f30b-4b6d-ac70-354dbb0aabe6	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-07-28	open	\N	\N
eb4ac276-bce9-49fd-80e5-4423e868f392	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-07-29	open	\N	\N
fc262980-a212-440a-91d1-e2b356a7736b	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-07-30	open	\N	\N
336bc770-c194-45f6-85ce-f31dabe6265f	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-07-31	open	\N	\N
2e04fb11-9a89-435a-a8c7-a6e42e649b83	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-01	open	\N	\N
ca05b554-7768-46b6-8a5a-cf61c662fdc9	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-02	open	\N	\N
bb342877-16f8-444e-bf12-1dd3cd20fd18	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-03	open	\N	\N
b069c00c-2c94-4484-aca8-4aa1188c5ff6	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-04	open	\N	\N
b83005c7-06d9-46d0-bd20-1f307fd424f4	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-05	open	\N	\N
ff6fd3b9-4648-497b-a799-8a046d70d045	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-06	open	\N	\N
221de928-cd97-4302-83b2-bb58442f2cf7	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-07	open	\N	\N
ba6cb88a-0184-49c3-9623-0a70cd5944e5	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-08	open	\N	\N
099a7385-7cf7-4dbb-a124-cf4fd7aa4a50	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-09	open	\N	\N
710e35d9-13e6-4949-9d83-88e315259e56	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-10	open	\N	\N
83b16e3d-1b35-422a-aa2d-afdeb893db36	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-11	open	\N	\N
4d2837b3-b8cb-4729-b22c-bdd35604b8e1	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-12	open	\N	\N
f1bc2b13-0a17-4030-9a9f-369a937aa820	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-13	blocked	\N	\N
c5f14d96-5795-4f2b-9a46-be832ae993ab	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-14	blocked	\N	\N
37c6b497-afc0-4879-98ba-1821c9926a12	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-15	blocked	\N	\N
13f1bf8a-0fe7-44e3-9224-8ae5f9d9b791	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-16	blocked	\N	\N
343c2155-bde7-4858-a5b0-805560245c07	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-17	blocked	\N	\N
82eae9a8-e97a-40b3-a711-620106cf45c5	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-18	blocked	\N	\N
9aab0da4-8558-4a69-9119-aaaf04b702fd	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-19	blocked	\N	\N
ea4dca71-4f59-4836-9d86-2f58a6829bd9	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-20	open	\N	\N
926c9a09-1591-4ec1-ba64-4c054d462d33	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-21	open	\N	\N
37eb614c-37e7-4abf-9139-e4ca974d4b6b	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-22	open	\N	\N
fa60e9ac-0066-4b6a-a83d-097c7a4c0713	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-23	open	\N	\N
7eea67fc-e424-4872-86f7-5c700ad0f533	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-24	open	\N	\N
bc93d959-dde0-449d-b807-a648a4683f8f	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-25	open	\N	\N
536024a9-8c84-4605-ba34-ca201c42f054	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-26	open	\N	\N
39acba71-ce50-482b-a4ff-e3fea515282d	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-27	open	\N	\N
39bd9c34-821e-4db2-a599-62ba6304bf34	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-28	open	\N	\N
895e1d67-e8d2-42ee-81d5-11b3cc8f69a1	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-29	open	\N	\N
6e62b3db-2401-473b-a2c6-0d1c8bd3802d	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-30	open	\N	\N
ef62ff24-d356-4438-9f5d-502f286e9405	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-08-31	open	\N	\N
1f091ce7-f6d8-4006-80d7-6dbc70c827c7	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-01	open	\N	\N
b21b6245-754a-410a-ba10-c721acde682f	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-02	open	\N	\N
25e6ac9e-9f2e-45fc-9b37-b1aef6091d09	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-03	open	\N	\N
363dbe7b-8c72-4cf1-af5a-5ed36916acd9	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-04	open	\N	\N
17ae19ba-cfbc-4484-be3d-1e0174186be7	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-05	open	\N	\N
5efb91ad-1593-4d1e-9ca5-7b77b39e4e46	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-06	open	\N	\N
c1593743-1f86-4ec3-8977-88a499fd139f	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-07	open	\N	\N
114751fc-9846-44bb-a12c-8b91487d4de8	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-08	open	\N	\N
c2e207c6-d5fb-456c-b2bd-aa7373b54b2d	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-09	open	\N	\N
a0d11db1-47e3-4fb8-92d4-cb6502b8a9e2	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-10	open	\N	\N
60640225-9bb1-4bb7-90d7-b4e5e599052a	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-11	open	\N	\N
96cf49f4-a64c-411c-b7d1-6f09da9edac4	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-12	open	\N	\N
b56e6efd-a592-4bcb-b896-324a676b2472	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-13	open	\N	\N
e48ffe01-bff9-4c66-91db-405f8cbe0f4f	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-14	open	\N	\N
b02abd5e-13d8-44f7-8b43-4741ce70937a	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-15	open	\N	\N
95321b9e-c530-4b03-b58a-add8bd5371a7	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-16	open	\N	\N
166f3821-b070-4469-8773-046e0c0b78a6	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-17	open	\N	\N
113c8547-290e-4595-9ee7-78c0ffad8463	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-18	open	\N	\N
efd2bbed-ad2d-4bbb-bd91-96d3f57b0e8f	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-19	open	\N	\N
e37a40bf-c59c-44fd-89d6-c3ae712c8942	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-20	open	\N	\N
acafed2e-a843-4e6a-ba66-efb333cd5c9d	5607c10f-4a8e-4950-8e9d-4c7644f575ac	2026-09-21	open	\N	\N
bf16b056-c5f0-4066-a56d-23ff9b3a8f4a	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-07-24	open	\N	\N
0b8cdf17-f021-4696-b3f6-f95cd9bde3c2	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-07-25	open	\N	\N
3333e2f3-e61a-4080-8a09-8116bfe545ab	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-07-26	open	\N	\N
1c35d1c8-9d48-41f6-a9de-0a3ed716c792	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-07-27	open	\N	\N
8e69565c-d93d-42cb-afa7-84a7bcc2402e	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-07-28	open	\N	\N
d694c275-a962-4766-893f-915ba52200a3	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-07-29	open	\N	\N
1cfb67b3-320e-4a0a-bf95-c783857ec617	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-07-30	open	\N	\N
3db3f393-cc71-45be-8269-bcb20a415120	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-07-31	open	\N	\N
287d44fd-2be0-4136-a422-b265c31ada23	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-01	open	\N	\N
71d10c0b-d800-4834-871e-973f1009ad6e	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-02	open	\N	\N
b7554015-eca9-472e-bacd-972302c4aaa7	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-03	open	\N	\N
735161f3-f40e-45a0-84fe-8dca7caa2183	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-04	open	\N	\N
8b3cc01e-5a08-4ded-a71b-1e74fe9f4a72	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-05	open	\N	\N
8cf9e8e7-975e-467d-8cba-44e1336ab25c	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-06	open	\N	\N
1141bea2-9346-4b8e-8691-5dfaea1457f4	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-07	open	\N	\N
b5fdc062-d582-49ba-97f9-72dcf0aa8e2e	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-08	open	\N	\N
9ee7bfc6-cd73-4279-978f-abff560cbd11	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-09	open	\N	\N
0bdb545f-15ad-444d-80d4-5aa227c45242	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-10	open	\N	\N
b96f6512-6e90-4d1c-92f0-5f64200e37ca	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-11	open	\N	\N
842317dc-1569-44e7-a3df-259867b79ddc	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-12	open	\N	\N
db38c1cd-fc3f-4c9a-bca7-a981ec87603e	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-13	blocked	\N	\N
76d5c04d-a36a-4356-9c90-745b754aee7c	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-14	blocked	\N	\N
3f4092f1-de83-45d6-ae56-c4e66a82dcce	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-15	blocked	\N	\N
a8130edd-ca1f-4f65-95ae-19e00572c796	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-16	blocked	\N	\N
d38948c0-9f58-4ff3-9dde-647fc68d44df	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-17	blocked	\N	\N
8649335b-907b-413b-b7f4-73824ecfd186	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-18	blocked	\N	\N
f212f3f8-d9c7-44e5-882d-5a17c98655f8	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-19	blocked	\N	\N
6411cdb4-5ddc-458c-b206-3e22c9c42fa5	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-20	open	\N	\N
fa969884-179f-499c-829d-c70e89ee8069	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-21	open	\N	\N
12c253e8-1405-4e6c-8401-296a53f26bd3	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-22	open	\N	\N
79cda50f-c8cc-4109-8572-164e08833a1b	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-23	open	\N	\N
5aee5c84-e9de-4b7f-8400-b19714723b08	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-24	open	\N	\N
94ee558a-3d13-425d-9031-0569e8302b86	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-25	open	\N	\N
9a3cfe57-f9a8-4a74-9a7b-b65cedb40db9	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-26	open	\N	\N
52f5ad90-17f3-4423-be72-2f7e6a69897f	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-27	open	\N	\N
a0e888a5-5591-413d-86d8-bdfa2cf2af6d	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-28	open	\N	\N
0532b2d4-6b37-4c48-8337-308a7c178672	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-29	open	\N	\N
9d593606-3bc9-4400-a0f8-a0e485de8899	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-30	open	\N	\N
1c04e6d3-07a7-4da4-88ed-0d8bb125c420	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-08-31	open	\N	\N
907ae78c-832b-448e-9575-e1f8b434b8b6	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-01	open	\N	\N
eec43a15-b0d7-4eda-a56f-b87254581e33	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-02	open	\N	\N
cad0d295-dd2c-46c1-acba-40c68d3ec672	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-03	open	\N	\N
4f257e93-67c1-42bd-b794-e2c0b8705a8f	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-04	open	\N	\N
6ddcf62f-eaba-4019-8b3d-7bdce557a9d4	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-05	open	\N	\N
0bc981ed-0359-4c5c-a8dc-c916b96b3f4a	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-06	open	\N	\N
ab928169-dd9e-4d99-904a-9d8eef04e5aa	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-07	open	\N	\N
887f29c6-759a-4df5-8ab7-580c85c2b0a0	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-08	open	\N	\N
8600b924-8023-432d-888b-3db484d06028	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-09	open	\N	\N
5a2f0f77-77a6-4065-b6e6-f1fdc55a8176	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-10	open	\N	\N
525c743c-aaad-4607-9953-6d2a46d130ae	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-11	open	\N	\N
bf453d15-56d9-4e68-b9dd-654e6caeb9a8	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-12	open	\N	\N
ec38b5c7-9f56-47e3-bfbd-37f8349646d4	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-13	open	\N	\N
b9a58ac6-a160-4315-b216-369b0ae03e4a	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-14	open	\N	\N
5e245ca4-7ed2-4348-9f99-8c97752b88d4	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-15	open	\N	\N
a4a3e485-7c47-4c8f-b94b-4e6882d001b0	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-16	open	\N	\N
10248439-efdd-4d3b-8f67-504aaf1e5293	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-17	open	\N	\N
f0bc92ec-9a7a-4ce0-bf9c-d03974bc9528	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-18	open	\N	\N
752fae96-3de6-4b0a-bbab-0b3b7b78719e	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-19	open	\N	\N
b49c03c2-ce44-409a-9841-1a0bf1d71c4b	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-20	open	\N	\N
5e627751-7447-4841-b4b8-a9c2b2af4ab1	802ed9f1-c2a9-41a3-a761-c53f1e5485e4	2026-09-21	open	\N	\N
bb7aab8a-3027-429f-aebf-66e37f59ebaa	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-07-24	open	\N	\N
db045a50-9d07-4291-845a-b5fbbc1b1d0e	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-07-25	open	\N	\N
dadbde6c-7881-487c-8f38-b8dab049c614	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-07-26	open	\N	\N
0d8b9bee-acef-487b-b97f-bf3ec5223df0	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-07-27	open	\N	\N
0888a72a-1e98-450d-a1e7-511c688531cc	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-07-28	open	\N	\N
593bd473-85f1-4aae-b8af-9aba6aad8d58	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-07-29	open	\N	\N
2b7acabf-5086-4fe2-a14d-12c9e5f18175	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-07-30	open	\N	\N
dfaeca6c-5cb6-47ca-8fbf-46a60432d23b	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-07-31	open	\N	\N
d572814d-7dc1-4421-928b-e261b1640356	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-01	open	\N	\N
5265ab95-72d1-47dd-a5d5-4b4bae97bc56	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-02	open	\N	\N
3f1e7812-fddc-4931-82f9-352fde1f22af	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-03	open	\N	\N
1e181bd2-0882-4494-b810-5dfd76f18288	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-04	open	\N	\N
a9f242ac-81ec-48c5-a120-944b10fcfa5d	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-05	open	\N	\N
8fe5118d-29de-4e59-a710-4abf3428ad32	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-06	open	\N	\N
11307812-69bc-4985-acc3-d916504c65d0	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-07	open	\N	\N
25ef7c37-7c64-4bb0-af39-0936b0468c28	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-08	open	\N	\N
a0f977ca-82e3-4ef7-b41a-11756227b840	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-09	open	\N	\N
2b7d3607-d6b2-4cc3-8791-818db37b918b	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-10	open	\N	\N
7041c053-8af8-4b6f-be3e-872d502e785c	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-11	open	\N	\N
3f193798-b7ce-45b1-9d52-5610e46e4b43	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-12	open	\N	\N
875b558b-1fa3-44e0-ab47-3e3d878abc0f	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-13	blocked	\N	\N
45bacbd9-4e2a-428f-8abc-33766bc0c5c0	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-14	blocked	\N	\N
ff23b4cd-9a9d-41bb-8c13-ad2544c3e93b	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-15	blocked	\N	\N
dd45c39b-5616-468a-9991-ba0feeefbf71	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-16	blocked	\N	\N
aed895ac-c1a7-4299-b859-f07cc7edd58e	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-17	blocked	\N	\N
5f9f89c2-1833-4f64-950e-f989ad0cb16b	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-18	blocked	\N	\N
d7ccd0d9-f1a3-4a09-9e13-79c0bcb6753e	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-19	blocked	\N	\N
3af9d539-e1ed-4c78-b947-42eb62072353	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-20	open	\N	\N
554b4468-65b0-45bc-8cc0-15f4e07231fc	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-21	open	\N	\N
bc63c499-7a48-4efd-abb2-b62648caa396	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-22	open	\N	\N
da03a507-e16c-46f6-b678-a95b018a7dfd	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-23	open	\N	\N
45cf7699-e1c5-459f-82fd-6217a8ed695f	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-24	open	\N	\N
8d3ddab0-d54d-4fa6-afec-63051d2ce293	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-25	open	\N	\N
e3b80b9e-1f72-4ea9-a01a-991a94728ac9	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-26	open	\N	\N
316c1e5c-c9a6-4d96-8caa-20de30b9cf9e	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-27	open	\N	\N
4b05b40a-7e36-4d87-98a3-59cd7a5992b3	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-28	open	\N	\N
43a6bcf4-9eee-4cee-a45b-00f3eb71c0ac	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-29	open	\N	\N
51b16bf1-9f8b-42c0-9c4f-e6fd472b9036	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-30	open	\N	\N
fb07ea8a-a052-4d26-9312-6c4c02ab4b14	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-08-31	open	\N	\N
fd3b232f-c837-4160-936f-7f61e2d3d501	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-01	open	\N	\N
2e3b1c5d-3cdd-429b-8f12-6764f63308ac	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-02	open	\N	\N
d52daeec-e236-4eed-886d-1db0bfe74218	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-03	open	\N	\N
727a6c9f-c4dc-43e1-9cbc-cf15e96b1d98	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-04	open	\N	\N
1aefd091-2f32-4351-acb0-69cf0c797976	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-05	open	\N	\N
15981ee1-90ff-442a-bf32-6abc14873787	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-06	open	\N	\N
9c16ba7e-5fe9-4543-840f-9d818b4b499b	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-07	open	\N	\N
1899ff12-4f74-44de-8a54-d61b33d785a5	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-08	open	\N	\N
a565a81b-0dea-42bc-9943-c9042fb5c89e	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-09	open	\N	\N
e3b988e1-0236-4469-8529-f0d5258e1f30	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-10	open	\N	\N
c8f27344-75d0-4e60-9a53-ce7f9b40d492	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-11	open	\N	\N
60ff94ae-5788-424f-8c8d-52988c7ea0d4	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-12	open	\N	\N
f65a1027-8435-4661-af41-f7767c242235	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-13	open	\N	\N
bbf05a8b-9860-49c6-a053-f5c572047c48	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-14	open	\N	\N
2464036e-dde6-453d-8ac1-b01f18cf111a	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-15	open	\N	\N
ad000186-c534-4a68-bda8-b872a53dee6a	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-16	open	\N	\N
1bb3ab41-b4f7-4225-8044-22c8e785ebc4	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-17	open	\N	\N
5ba90ca7-cbcd-4f18-a060-a0cead86ae99	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-18	open	\N	\N
29628ce0-efd0-43a4-8e2b-1116007aabbc	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-19	open	\N	\N
987c723e-a314-4e88-ba6b-fbd15d00c86e	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-20	open	\N	\N
03148a2b-7161-4ea6-8eb5-ee6071dfc9ab	f3924fac-f09a-42dd-b7e3-6d90ecccc78d	2026-09-21	open	\N	\N
be54bf53-650c-4103-a8e5-042f0a0dacb1	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-07-24	open	\N	\N
c441abe1-591a-42bf-be0b-9d3506fb9a1c	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-07-25	open	\N	\N
99b38229-35a2-4a87-abb1-562dfe362944	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-07-26	open	\N	\N
a29ad60b-8183-43bf-8453-a53ae38cbe1b	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-07-27	open	\N	\N
2aa47b43-31e1-4798-95e3-aff7c9313869	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-07-28	open	\N	\N
2f919da3-3d55-4d7e-95ea-06afa07dbff8	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-07-29	open	\N	\N
09661a0f-4b45-4dbc-a5c4-089a73ae046e	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-07-30	open	\N	\N
34fdce8f-f32a-4f2b-8a92-2c57b197ea42	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-07-31	open	\N	\N
c0451472-c55f-420b-8554-473babe487c4	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-01	open	\N	\N
4eb95548-cd79-4711-8594-03a7d381bc5c	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-02	open	\N	\N
ccb65255-a563-44c2-ad59-d63f1fc94dd0	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-03	open	\N	\N
55464e74-8554-46fc-b4e4-0de8efd4dadf	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-04	open	\N	\N
40a313ec-7c93-429d-8e91-e269087cd5b6	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-05	open	\N	\N
08828450-643f-40f1-bd20-696218d251c9	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-06	open	\N	\N
c27b20bd-804f-479c-a423-38f99918e1ea	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-07	open	\N	\N
3bc025ef-0226-4473-96a0-290b98ffab19	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-08	open	\N	\N
5b9a4a4d-b57b-40a4-9c59-426c93aa26b8	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-09	open	\N	\N
ca1a4342-af71-4c5e-8e96-89a5430ff0b3	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-10	open	\N	\N
7c07e343-0bc1-4659-b848-72775e99abf9	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-11	open	\N	\N
9f19493d-f06b-4732-813f-b08696803d83	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-12	open	\N	\N
391984c9-b34d-426f-b9fa-b334e6c2f517	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-13	blocked	\N	\N
77cca62b-01fb-458d-b237-a218d47d75ba	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-14	blocked	\N	\N
36c6211d-94a8-4006-9898-0a2a1ea984c2	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-15	blocked	\N	\N
a8728383-b7a0-4edf-948c-ffac49a6b5ca	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-16	blocked	\N	\N
1aee6f76-565b-41a2-bbed-c00a43579b49	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-17	blocked	\N	\N
e4658f38-ddb0-451f-b61f-a65f1401fe61	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-18	blocked	\N	\N
4f1d90c9-a89f-4a99-b1e5-6d9d969a36ac	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-19	blocked	\N	\N
dae95e29-e89f-4812-9e13-41b87a2649f5	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-20	open	\N	\N
35aeca2b-4b00-466e-b0df-0fa737ac59c0	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-21	open	\N	\N
a3df046c-441a-451e-8de7-3d2e819c47a2	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-22	open	\N	\N
c9a6e8b8-ce24-42e7-b093-131ee050999e	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-23	open	\N	\N
cf8b6cd7-225c-4b30-b749-e8baa03fe1a1	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-24	open	\N	\N
2e76375d-0684-4455-bb72-d6e2462dd337	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-25	open	\N	\N
a7aad17a-eac2-4c3f-a9c5-12d86ff183b5	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-26	open	\N	\N
c46eaba2-0cb6-4599-bb77-c44ab7d11b5d	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-27	open	\N	\N
33cd8bbb-0dff-43aa-98cd-0517497d6151	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-28	open	\N	\N
79eb0b69-e66b-4e46-9be0-eba4f5014dd2	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-29	open	\N	\N
2a62534f-2b42-4a36-9cb5-14774a48cb73	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-30	open	\N	\N
b55f3073-0f5c-4123-b135-efb6d32c85f5	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-08-31	open	\N	\N
273ed63e-3e74-40a3-b8e8-d9eb9ca42e0a	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-01	open	\N	\N
1120e1d1-8f39-4821-a43e-a30a08af1030	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-02	open	\N	\N
00afcf27-b65b-405c-8a2b-3b23740af576	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-03	open	\N	\N
58bd3e69-7fe9-48bf-9424-0cdacc2afdb8	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-04	open	\N	\N
5570fc99-dc04-49f9-a270-659f4425bc6d	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-05	open	\N	\N
6fdc090a-5f3e-4e36-a289-102ee938d6ee	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-06	open	\N	\N
e3c35522-432a-4b52-a48e-240774671fcc	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-07	open	\N	\N
6b927fa5-b52e-4348-8932-066e7e01be52	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-08	open	\N	\N
f3f03cc7-8a45-4b48-b81c-559b54c09333	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-09	open	\N	\N
ae0b568b-6f62-4d15-af32-3f5e76b83419	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-10	open	\N	\N
ceaeed09-959d-4a69-8070-4c717250974b	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-11	open	\N	\N
7595c9de-71f2-4c3c-954c-86896cfd2b8f	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-12	open	\N	\N
c38ccab8-e6a9-4c47-9616-5286d69d8faa	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-13	open	\N	\N
3a877e06-4f63-417a-863c-af9dcd09a147	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-14	open	\N	\N
7a0bb775-56bd-4327-aacf-bd7641a42395	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-15	open	\N	\N
ae6ea07b-20e1-4188-aa99-6a3c7fa01dbe	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-16	open	\N	\N
8998f965-4948-4f18-a3f4-2f9dcee1e29f	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-17	open	\N	\N
ed188a43-c054-4aa3-801a-8b3dda5fb9ee	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-18	open	\N	\N
121a2da3-bc2e-4edd-b547-b82ef6b990e5	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-19	open	\N	\N
2b3f485d-80e3-4a44-9a3c-ee1cad720b6a	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-20	open	\N	\N
25e0f52c-00f7-4f53-9402-0765a173eeb9	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	2026-09-21	open	\N	\N
\.

\unrestrict VRmTKf2u41e6PS1AbndKf1i9yUHPFglPbRr65LQxeCB5WolYTwkX4PWo3QnOmHp


\restrict CxFc5qWju3lmL3IxKkwvDta9HmpPDuGIcmtaNRY0F5bn17kW95btg6kF0lrCxzk

COPY public.vendor_application (id, business_name, business_type, base_area, cuisine, capabilities, languages, price_band, whatsapp, email, availability, notes, status, reviewed_by, reviewed_at, ip, user_agent, created_at) FROM stdin;
d86f8a90-8ed7-43af-be35-7a954d2ff31c	Demo Green Leaf Warung	Restaurant	Canggu	Indonesian vegetarian	{vegetarian,vegan}	{English,Indonesian}	₹600–1,200 per person	+6281900000201	greenleaf@demo.only2bali.com	Daily, 8am to 10pm	Separate fryer for vegan items.	pending	\N	\N	\N	\N	2026-07-23 12:27:45.440822+00
d0cb8c60-d341-4bbe-af74-fc980d9f110a	Demo Amrita Homestay	Homestay	Sanur	\N	{accommodation,"kitchen access"}	{English,Hindi}	₹4,000–6,500 per night	+6281900000202	amrita@demo.only2bali.com	Year round except Nyepi	Four rooms, shared kitchen.	in_review	\N	\N	\N	\N	2026-07-23 12:27:45.440822+00
fc9ddf5f-e8d6-41c2-a810-0d2e309f0af3	Demo Surya Tours	Tour agency	Denpasar	\N	{transport,guide,activities}	{English,Hindi,Tamil}	Quote on request	+6281900000203	surya@demo.only2bali.com	Daily	Applied twice; first application withdrawn.	rejected	\N	\N	\N	\N	2026-07-23 12:27:45.440822+00
\.

\unrestrict CxFc5qWju3lmL3IxKkwvDta9HmpPDuGIcmtaNRY0F5bn17kW95btg6kF0lrCxzk


\restrict lsZeDVmclqVGpXmHKHS41qjF1xLwEXCozfCNeDicBQE1WA1cvBCCgXaOd8G86yd

COPY public.trip_request (id, traveller_id, anon_token, circuit_id, status, protocol, tier, group_size, crew_type, rooms, children_ages, from_date, to_date, flexible_month, nights, departure_city, interests, kitchen_required, cook_required, preferred_language, notes, visibility, published_at, bids_close_at, closed_at, close_reason, budget_min_amount, budget_max_amount, budget_currency, budget_basis, special_requirements, requirement_tags, mobile_verified, created_at, updated_at) FROM stdin;
c989e5e4-5873-4a44-a2ed-57dfc19d82f2	7d0b991e-c19c-4b71-8bbd-655d33c958d8	\N	d8e3dc25-597b-42f1-9ad2-e2f2e808aa30	draft	vegan	economical	4	\N	2	\N	2026-10-06	2026-10-12	\N	6	Bengaluru	{trekking,snorkelling}	f	f	en	\N	private	\N	\N	\N	\N	4500000	7000000	INR	per_person	\N	\N	t	2026-07-23 12:27:45.410578+00	2026-07-23 12:27:45.410578+00
4c54d92b-b137-44bc-b0ea-ea7857ba36d2	4089b642-3910-40bb-b4cd-87c2173870bd	\N	4245c117-8ed6-412c-88c1-fb33e7dbac20	submitted	jain	premium	12	family	6	\N	2026-09-21	2026-09-27	\N	6	Mumbai	{temples,wellness}	t	t	gu	\N	open_to_verified	2026-07-17 12:27:45.397+00	2026-07-27 12:27:45.397+00	\N	\N	9000000	14000000	INR	per_person	No onion or garlic. Two travellers aged over 70 — no long walks before breakfast.	{jain-strict,senior-friendly,own-cook}	t	2026-07-23 12:27:45.415904+00	2026-07-23 12:27:45.415904+00
812dbf67-2f27-4ac8-8b48-143dca9ef38a	d9291f9f-a906-4a4b-8134-1a87d0d7b45b	\N	e97024de-a517-4813-825d-92738d80c9dd	booked	vegetarian	comfort	6	\N	3	\N	2026-08-22	2026-08-27	\N	5	Delhi	\N	f	f	hi	\N	private	\N	\N	\N	\N	\N	\N	INR	per_person	\N	\N	t	2026-07-23 12:27:45.419458+00	2026-07-23 12:27:45.419458+00
\.

\unrestrict lsZeDVmclqVGpXmHKHS41qjF1xLwEXCozfCNeDicBQE1WA1cvBCCgXaOd8G86yd


\restrict EFqSYB1y7fcLp13HVgHuKL1YMdvdw5jUa1y4kfT1ErK7ujtjFcyt9vhSLz4xekJ

COPY public.lead (id, trip_request_id, account_id, source, name, email, mobile, whatsapp_optin, message, status, created_at, departure_city, group_size, protocol, travel_month, ip, user_agent) FROM stdin;
8229ac35-ad0f-4d34-924d-fa490a64452c	4c54d92b-b137-44bc-b0ea-ea7857ba36d2	e8234109-e0fa-422b-bcb7-6ca0520a6308	planner	Meera Shah	meera.shah@demo.only2bali.com	+919820000101	t	Family group, two seniors. Need a Jain kitchen for the whole week.	quoted	2026-07-23 12:27:45.434976+00	Mumbai	12	jain	October	\N	\N
30cdae86-7e78-4b46-9ff9-55c1a562c762	812dbf67-2f27-4ac8-8b48-143dca9ef38a	897d450a-7854-4f3d-8ceb-866d1c7f9436	package_page	Rohit Agarwal	rohit.agarwal@demo.only2bali.com	+919820000102	t	Interested in Bali Veg Explorer for six people.	converted	2026-07-23 12:27:45.434976+00	Delhi	6	vegetarian	September	\N	\N
a3c7ac0e-4fc7-4829-a39f-4c92501248e5	\N	\N	web	Priyanka Desai	priyanka.desai@demo.only2bali.com	+919820000104	f	Temple trust group of eighteen. Strictly no root vegetables.	new	2026-07-23 12:27:45.434976+00	Ahmedabad	18	jain	December	\N	\N
88509f34-1226-4649-9885-fe3c5eb4c7cb	\N	\N	whatsapp	Karthik Iyer	\N	+919820000105	t	Honeymoon, pure veg.	contacted	2026-07-23 12:27:45.434976+00	Chennai	2	vegetarian	March	\N	\N
d15398fc-a7e4-4722-85e6-45e77975dc21	\N	\N	partner_referral	Nisha Mehta	nisha.mehta@demo.only2bali.com	+919820000106	t	Vegan yoga retreat group.	lost	2026-07-23 12:27:45.434976+00	Pune	9	vegan	August	\N	\N
\.

\unrestrict EFqSYB1y7fcLp13HVgHuKL1YMdvdw5jUa1y4kfT1ErK7ujtjFcyt9vhSLz4xekJ


\restrict msTw54cZj6VXSDQsUHrphjcVW9QfCQEb58eqbgV7YJj8LPj5xW2uhdvwK1vS985

COPY public.offer (id, trip_request_id, vendor_id, package_id, departure_id, origin, title, summary, total_amount, vendor_net_amount, commission_rate, currency, price_per_person, line_items, inclusions_delta, day_plan, valid_until, status, decline_reason, rank, score, submitted_at, created_at) FROM stdin;
6e809186-6f6a-4253-90d2-1fd62ad69f92	4c54d92b-b137-44bc-b0ea-ea7857ba36d2	c0e8a225-07ae-48c2-85f9-42c060151125	9c12d2d8-d493-4d11-b407-e1babafe427e	\N	vendor_bid	Six nights, two private villas with kitchens, Jain cook included	Two three-bedroom villas side by side. Cook from the Jain Cook Collective for all six days.	128400000	109140000	0.1500	INR	10700000	\N	\N	\N	2026-08-02 12:27:45.408+00	sent	\N	1	92	2026-07-19 12:27:45.408+00	2026-07-23 12:27:45.42685+00
9ec61701-dfaa-4d67-8f79-1b0297163ed6	4c54d92b-b137-44bc-b0ea-ea7857ba36d2	25d45f84-5841-4b42-bcf9-626937fca134	9c12d2d8-d493-4d11-b407-e1babafe427e	\N	vendor_bid	Six nights with all meals at our Ubud kitchen	Hotel stay plus every meal cooked on our Jain line. No villa kitchen required.	112800000	99264000	0.1200	INR	9400000	\N	\N	\N	2026-08-01 12:27:45.408+00	viewed	\N	2	84	2026-07-20 12:27:45.408+00	2026-07-23 12:27:45.42685+00
56fd13aa-63fb-4472-90cf-560342d21e58	4c54d92b-b137-44bc-b0ea-ea7857ba36d2	\N	9c12d2d8-d493-4d11-b407-e1babafe427e	\N	system_match	Sattvik Serenity — fixed departure	Matched from the catalogue. Departs within the requested window.	141600000	\N	0.1500	INR	11800000	\N	\N	\N	2026-08-06 12:27:45.408+00	sent	\N	3	71	2026-07-17 12:27:45.408+00	2026-07-23 12:27:45.42685+00
\.

\unrestrict msTw54cZj6VXSDQsUHrphjcVW9QfCQEb58eqbgV7YJj8LPj5xW2uhdvwK1vS985


\restrict 5BLgdDxEEse5hBzmoa8D143NvmrR5uVkdcGjQLCAwBWfB8DpxoK7VSBNmMcE20m

COPY public.booking (id, reference, trip_request_id, offer_id, traveller_id, package_id, departure_id, vendor_id, pax, rooms, gross_amount, currency, commission_rate, commission_amount, net_amount, status, confirmed_at, cancelled_at, cancellation_reason, created_at, updated_at) FROM stdin;
c80cc4e8-2651-419c-9ace-34c37f022cb0	O2B-DEMO-0001	812dbf67-2f27-4ac8-8b48-143dca9ef38a	\N	d9291f9f-a906-4a4b-8134-1a87d0d7b45b	2c1d94ea-a98b-4e2e-bb2e-af79310976a8	80b5c83c-2898-48a2-a680-c3d35892d10e	f1783702-0b2c-4282-9b77-b4c6d0e0a7b7	6	3	34800000	INR	0.1500	5220000	29580000	confirmed	2026-07-14 12:27:45.43+00	\N	\N	2026-07-23 12:27:45.449341+00	2026-07-23 12:27:45.449341+00
3a91036d-d2ff-488c-82ef-83be1219595a	O2B-DEMO-0002	c989e5e4-5873-4a44-a2ed-57dfc19d82f2	\N	7d0b991e-c19c-4b71-8bbd-655d33c958d8	2c1d94ea-a98b-4e2e-bb2e-af79310976a8	\N	\N	4	2	23200000	INR	0.1500	3480000	19720000	pending_payment	\N	\N	\N	2026-07-23 12:27:45.467483+00	2026-07-23 12:27:45.467483+00
75e1cbc2-a6a9-4096-8839-0648f68992e4	O2B-DEMO-0003	812dbf67-2f27-4ac8-8b48-143dca9ef38a	\N	4089b642-3910-40bb-b4cd-87c2173870bd	9c12d2d8-d493-4d11-b407-e1babafe427e	\N	25d45f84-5841-4b42-bcf9-626937fca134	8	4	94400000	INR	0.1200	11328000	83072000	completed	2026-04-19 12:27:45.453+00	\N	\N	2026-07-23 12:27:45.472239+00	2026-07-23 12:27:45.472239+00
\.

\unrestrict 5BLgdDxEEse5hBzmoa8D143NvmrR5uVkdcGjQLCAwBWfB8DpxoK7VSBNmMcE20m


\restrict KWLiY1JR5UHdZjCiQ9Adf56U0KUB4q26jdnhBwg6p71s03O3LWH9S20r82dELaH

COPY public.booking_traveller (id, booking_id, full_name, age, gender, passport_number_enc, passport_expiry, dietary_notes, is_lead) FROM stdin;
7d799df3-8f4e-4020-b07d-fb538dc3f0ac	c80cc4e8-2651-419c-9ace-34c37f022cb0	Rohit Agarwal	38	male	\N	\N	Vegetarian, no egg.	t
21c2e575-8074-42d7-8f3f-08e1993eafa1	c80cc4e8-2651-419c-9ace-34c37f022cb0	Sneha Agarwal	35	female	\N	\N	Vegetarian, no egg.	f
df81ec9c-7ba9-4d53-92b5-6b4eee395f27	c80cc4e8-2651-419c-9ace-34c37f022cb0	Aarav Agarwal	9	male	\N	\N	Vegetarian. Nut allergy.	f
6f7f84c4-9ad4-407b-8b9b-8026fd623a96	c80cc4e8-2651-419c-9ace-34c37f022cb0	Sunita Agarwal	64	female	\N	\N	Jain on Tuesdays.	f
d70c563e-a3d4-43f1-a8dd-270b3d3775d1	c80cc4e8-2651-419c-9ace-34c37f022cb0	Vikram Agarwal	67	male	\N	\N	\N	f
2a789ffb-5525-473d-8cab-626483a07b9f	c80cc4e8-2651-419c-9ace-34c37f022cb0	Priya Agarwal	41	female	\N	\N	\N	f
\.

\unrestrict KWLiY1JR5UHdZjCiQ9Adf56U0KUB4q26jdnhBwg6p71s03O3LWH9S20r82dELaH


\restrict xhCC4iUMCVSED7QeuYVjRfnnKaYWAFHebeDfCnbpV8dIZ5Em9SoiS6dFyuqC4sX

COPY public.booking_listing (id, booking_id, listing_id, price_snapshot) FROM stdin;
46114b0d-c814-443d-953c-697077fa2936	c80cc4e8-2651-419c-9ace-34c37f022cb0	2dad07ff-46ed-4c8b-b562-1c1b2fce0ed8	680000
\.

\unrestrict xhCC4iUMCVSED7QeuYVjRfnnKaYWAFHebeDfCnbpV8dIZ5Em9SoiS6dFyuqC4sX


\restrict 7vzgKkAF7Xfun9YsA3wcC9kgL2s1aQEKVi5UqFTI7VqtdDqbgdDEEob48bb8EA0

COPY public.review (id, booking_id, vendor_id, package_id, rating, food_compliance_kept, comment, published, moderated_by, created_at) FROM stdin;
e138c646-5f07-4cc8-b48c-1919979029b6	75e1cbc2-a6a9-4096-8839-0648f68992e4	25d45f84-5841-4b42-bcf9-626937fca134	9c12d2d8-d493-4d11-b407-e1babafe427e	5	t	Every single meal was as promised. The kitchen showed us the separate Jain line on the first day without being asked. Two amber meals were flagged in advance and both were substituted.	t	\N	2026-07-23 12:27:45.476724+00
\.

\unrestrict 7vzgKkAF7Xfun9YsA3wcC9kgL2s1aQEKVi5UqFTI7VqtdDqbgdDEEob48bb8EA0


-- The confirmed booking must actually take its seats out of inventory,
-- or the demo shows a departure that is full and still selling.
UPDATE public.departure SET seats_booked = 6, status = 'filling'
 WHERE id = (SELECT departure_id FROM public.booking WHERE reference = 'O2B-DEMO-0001');

COMMIT;
