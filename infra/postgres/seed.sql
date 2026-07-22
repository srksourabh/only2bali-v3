--
-- Only2Bali catalogue seed
--
-- Circuits, places, packages (with nights, places, inclusions, USP highlights,
-- day-by-day itineraries and per-meal compliance ratings) and twelve months of
-- fixed departures with seasonal pricing.
--
-- Generated from lib/db/seed.ts. Plain SQL, so the VPS needs no Node toolchain:
--     psql "$DATABASE_URL" -f seed.sql
--
-- Wrapped in a transaction: a failure part-way leaves the database untouched
-- rather than half-populated. Intended for an empty database - bootstrap.sh
-- checks first and skips if the catalogue is already present.
--

BEGIN;
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: circuit; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.circuit VALUES ('4245c117-8ed6-412c-88c1-fb33e7dbac20', 'ramayana', 'Ramayana', 'Besakih, Tirta Empul, Lempuyang and the Kecak fire dance at Uluwatu.', NULL, '/Asset/D-card-img2.png', 1, true, '2026-07-22 20:00:10.15576+00', '2026-07-22 20:00:10.15576+00');
INSERT INTO public.circuit VALUES ('d8e3dc25-597b-42f1-9ad2-e2f2e808aa30', 'adventure', 'Adventure', 'Ayung river, Mount Batur before dawn, Nusa Penida water.', NULL, '/Asset/adventure.png', 2, true, '2026-07-22 20:00:10.166927+00', '2026-07-22 20:00:10.166927+00');
INSERT INTO public.circuit VALUES ('e97024de-a517-4813-825d-92738d80c9dd', 'culinary', 'Culinary', 'Pure-veg kitchens, a cooking class, and warungs that cook to protocol.', NULL, '/Asset/culinary.png', 3, true, '2026-07-22 20:00:10.172505+00', '2026-07-22 20:00:10.172505+00');
INSERT INTO public.circuit VALUES ('e5d67435-4463-4a3b-b660-1d3dd600f2c9', 'artistic', 'Artistic', 'Wood-carving, silver and batik, working alongside the artisans.', NULL, '/Asset/cultures.png', 4, true, '2026-07-22 20:00:10.177392+00', '2026-07-22 20:00:10.177392+00');


--
-- Data for Name: package; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.package VALUES ('9c12d2d8-d493-4d11-b407-e1babafe427e', 'sattvik-serenity', 'Sattvik Serenity', 6, 5, 'premium', '{jain,vegetarian}', 2, 30, 11800000, 'INR', 'per_person', '/Asset/D-card-img2.png', NULL, 'Ubud and Uluwatu in private villas with a Jain-protocol kitchen and an optional accompanying cook.', NULL, true, true, '{Hindi,Gujarati,English}', 'fixed', 'published', '2026-07-22 20:00:10.331351+00', '2026-07-22 20:00:10.331351+00');
INSERT INTO public.package VALUES ('2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'bali-veg-explorer', 'Bali Veg Explorer', 5, 4, 'economical', '{vegetarian,jain}', 2, 30, 5800000, 'INR', 'per_person', '/Asset/beaches.png', NULL, 'Value-packed group trip: Kuta, Ubud and water sports with verified Indian veg restaurants throughout.', NULL, false, true, '{Hindi,English}', 'fixed', 'published', '2026-07-22 20:00:10.470839+00', '2026-07-22 20:00:10.470839+00');
INSERT INTO public.package VALUES ('c916f56e-ef6d-4280-ab00-35b124c9e63f', 'active-bali', 'Active Bali', 5, 4, 'economical', '{vegetarian,vegan}', 2, 30, 6200000, 'INR', 'per_person', '/Asset/adventure.png', NULL, 'Rafting, ATV, snorkelling and a volcano sunrise, with high-energy veg and vegan meal plans.', NULL, false, false, '{Hindi,English}', 'fixed', 'published', '2026-07-22 20:00:10.591677+00', '2026-07-22 20:00:10.591677+00');


--
-- Data for Name: departure; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.departure VALUES ('44dee756-65ad-42f4-9a12-16277d03dbbd', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2026-08-12', '2026-08-17', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('fcb09d1e-6f46-4712-bc99-868d87eb842c', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2026-08-27', '2026-09-01', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('3e618fdf-d27d-4619-8578-659f0888ba30', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2026-09-11', '2026-09-16', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('860472df-590d-4f19-ba42-77bfe2e0dcd3', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2026-09-26', '2026-10-01', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('4a63fc64-dea7-49fa-889c-deff4dde8c5d', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2026-10-11', '2026-10-16', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('07cd764f-b617-443c-854a-d299560bb878', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2026-10-26', '2026-10-31', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('5384e6a2-8b6f-4cc6-99f1-43ad68f30577', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2026-11-10', '2026-11-15', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('2b0b0710-102c-4c7f-9334-2943d955f222', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2026-11-25', '2026-11-30', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('d22eaf0b-2db5-4868-997f-fec0deac760b', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2026-12-10', '2026-12-15', 13924000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('fd18b7f8-0c0e-4330-82b7-df6a0b54fb31', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2026-12-25', '2026-12-30', 13924000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('ca3870ee-5d78-401e-a121-c0a9993564ec', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-01-09', '2027-01-14', 13924000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('c9082416-2b78-4e7e-9f24-abef56f6f8f6', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-01-24', '2027-01-29', 13924000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('85a2aafd-f66e-4d6d-b4f3-8b27b6c0d58f', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-02-08', '2027-02-13', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('6adc65d5-182c-46c3-964c-eb2b685d3774', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-02-23', '2027-02-28', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('6d7439d4-267c-4675-a0e9-ba634372edec', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-03-10', '2027-03-15', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('fe1518af-6394-4d52-aad7-c6b4ddc40286', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-03-25', '2027-03-30', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('5949cbc4-2149-43ad-a728-9b6c44e7155a', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-04-09', '2027-04-14', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('2b0d2beb-f88b-4131-b93a-ce0c233f343a', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-04-24', '2027-04-29', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('6b2c27e3-705e-4a3c-8f1a-ec25db4fc380', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-05-09', '2027-05-14', 13924000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('3c1f1c9e-d811-458d-b040-cbf621b6244c', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-05-24', '2027-05-29', 13924000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('7fbbdde3-bf29-41f0-8a75-64512b71d6b3', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-06-08', '2027-06-13', 13924000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('82f9c39e-f848-471f-856d-a9930f442c69', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-06-23', '2027-06-28', 13924000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('e26eb3f0-b541-44e6-905a-5febdff7f6e0', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-07-08', '2027-07-13', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('ef4c5cdb-79c4-4cfe-91ce-445581c5d342', '9c12d2d8-d493-4d11-b407-e1babafe427e', '2027-07-23', '2027-07-28', 11800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.461372+00');
INSERT INTO public.departure VALUES ('80b5c83c-2898-48a2-a680-c3d35892d10e', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2026-08-12', '2026-08-16', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('2260afe5-e99a-4e2a-a4be-334e61aedec3', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2026-08-27', '2026-08-31', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('5f24c518-419c-4f72-9627-88714fcbf4b5', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2026-09-11', '2026-09-15', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('832e188e-a1c8-4def-81e9-f473cbc8d1c7', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2026-09-26', '2026-09-30', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('6294b958-a3dc-4cb7-8f71-9039a535ff22', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2026-10-11', '2026-10-15', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('9ceaf576-7c51-4840-b9f3-448d91430591', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2026-10-26', '2026-10-30', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('d4501d84-1996-48b1-9879-b17918874bc4', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2026-11-10', '2026-11-14', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('8fe54843-647a-4788-9e90-6de34d08f68a', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2026-11-25', '2026-11-29', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('c9835238-8c0b-4747-a953-f2d4f7c1845a', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2026-12-10', '2026-12-14', 6844000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('a6e00d50-71ad-4540-9790-95d75930c2b2', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2026-12-25', '2026-12-29', 6844000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('f202b699-7c8b-48bb-854a-edaeb576d3ad', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-01-09', '2027-01-13', 6844000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('2eab8d2e-864d-42e8-b7f2-070dbdb134b3', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-01-24', '2027-01-28', 6844000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('f41fb851-02cb-478c-a1e7-c5d4851f2daa', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-02-08', '2027-02-12', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('1e127623-5fc3-474e-bad3-716c232cfaf5', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-02-23', '2027-02-27', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('1b228892-b447-4a79-873e-b8021eabd308', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-03-10', '2027-03-14', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('5923de4d-4465-4bf2-85b8-c1e6b80a0f17', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-03-25', '2027-03-29', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('6e00d080-b749-4748-80f9-d49ad40eddca', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-04-09', '2027-04-13', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('827702ea-5bd8-4520-afb6-550e7c9c3833', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-04-24', '2027-04-28', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('62089520-5940-4f16-8c9a-0a4427dbbe6f', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-05-09', '2027-05-13', 6844000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('f4a37db0-3352-42e9-ba5f-070078b84152', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-05-24', '2027-05-28', 6844000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('bc1ed2cc-9a84-41c4-b5f1-69fe6292f3d6', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-06-08', '2027-06-12', 6844000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('662015c3-ec4a-4470-aaca-0df8cc10f185', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-06-23', '2027-06-27', 6844000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('e8854386-d872-4ade-aefd-ea130cbc209b', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-07-08', '2027-07-12', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('af1b0c3d-c741-48af-86c6-ca9bc2f42da1', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '2027-07-23', '2027-07-27', 5800000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.582703+00');
INSERT INTO public.departure VALUES ('e7d25347-ed6e-436b-b51d-822400d21670', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2026-08-12', '2026-08-16', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('e0a89ddc-1fe4-4b2d-8c56-1a559e767340', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2026-08-27', '2026-08-31', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('01a84a6e-07bd-49cb-a421-48dfac8f3d0f', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2026-09-11', '2026-09-15', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('1c7a2b49-673c-40fa-9004-f035f19c8bd1', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2026-09-26', '2026-09-30', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('a81b251b-33e3-4348-a6f6-c70e9c73ec3e', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2026-10-11', '2026-10-15', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('e462849f-0bb6-4457-a6e8-4d1e3bdf7e42', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2026-10-26', '2026-10-30', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('465f9e60-7371-4e14-975e-37080582e0a9', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2026-11-10', '2026-11-14', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('ff8377d1-acff-4118-802b-807e9fe3ab8b', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2026-11-25', '2026-11-29', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('67a2d1da-219b-4bd1-ad63-ee2b48846f80', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2026-12-10', '2026-12-14', 7316000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('5783b4af-84cb-439f-b047-c110c031f258', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2026-12-25', '2026-12-29', 7316000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('ec7849b4-f2cf-41a0-b168-59d636f9cc1b', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-01-09', '2027-01-13', 7316000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('83dc1b0a-ed4a-4d60-86f2-dcb25db465c7', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-01-24', '2027-01-28', 7316000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('11c2ba0d-44ee-4715-ac47-594ae6d81565', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-02-08', '2027-02-12', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('459ad730-01d1-4fc8-927f-8d0e6ab03391', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-02-23', '2027-02-27', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('2a9e827e-9b8f-45cb-b003-3a07052dab8e', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-03-10', '2027-03-14', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('47f71d6b-2f82-45fa-aa01-a75c18b2a6ce', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-03-25', '2027-03-29', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('41ec6379-7068-4959-82b6-a704ecd7e28d', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-04-09', '2027-04-13', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('d41392d7-76e7-4cb8-9e7c-51de528ff9d7', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-04-24', '2027-04-28', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('43528e42-a52a-4c3d-a99a-b54b0806d080', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-05-09', '2027-05-13', 7316000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('e8bd33fc-4386-482b-95fe-a1a27b6117b1', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-05-24', '2027-05-28', 7316000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('bce368f8-486e-4d8d-a943-066d2881ea7d', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-06-08', '2027-06-12', 7316000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('f98d437f-3bbd-44d3-85ce-d03b9cdbd269', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-06-23', '2027-06-27', 7316000, 'INR', 16, 0, 0, 'open', true, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('159990bf-2d6a-474c-9827-eb96abdad373', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-07-08', '2027-07-12', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');
INSERT INTO public.departure VALUES ('92d637b2-2c86-4033-bfb6-fb6ca76f3e8e', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', '2027-07-23', '2027-07-27', 6200000, 'INR', 16, 0, 0, 'open', false, NULL, '2026-07-22 20:00:10.687132+00');


--
-- Data for Name: package_circuit; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.package_circuit VALUES ('9c12d2d8-d493-4d11-b407-e1babafe427e', '4245c117-8ed6-412c-88c1-fb33e7dbac20');
INSERT INTO public.package_circuit VALUES ('2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'd8e3dc25-597b-42f1-9ad2-e2f2e808aa30');
INSERT INTO public.package_circuit VALUES ('2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'e97024de-a517-4813-825d-92738d80c9dd');
INSERT INTO public.package_circuit VALUES ('c916f56e-ef6d-4280-ab00-35b124c9e63f', 'd8e3dc25-597b-42f1-9ad2-e2f2e808aa30');


--
-- Data for Name: package_day; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.package_day VALUES ('540976b7-e32e-48cb-9769-516c1b170135', '9c12d2d8-d493-4d11-b407-e1babafe427e', 1, 'Arrival, villa check-in, welcome Jain thali', NULL, 'Ubud', NULL);
INSERT INTO public.package_day VALUES ('15a3ba65-d2fc-4f15-b5cb-35c0b921efce', '9c12d2d8-d493-4d11-b407-e1babafe427e', 2, 'Tirta Empul holy springs and Ubud palace', NULL, 'Ubud', NULL);
INSERT INTO public.package_day VALUES ('75b0fdfb-a6e4-47e5-b132-7961d81f11e9', '9c12d2d8-d493-4d11-b407-e1babafe427e', 3, 'Tegallalang rice terraces and a wellness afternoon', NULL, 'Ubud', NULL);
INSERT INTO public.package_day VALUES ('2ca79944-6d0a-4b85-b8d7-6741a84a9a75', '9c12d2d8-d493-4d11-b407-e1babafe427e', 4, 'Uluwatu temple and the Kecak fire dance at sunset', NULL, 'Uluwatu', NULL);
INSERT INTO public.package_day VALUES ('498cff38-d26e-453e-b59d-1c5781968aa7', '9c12d2d8-d493-4d11-b407-e1babafe427e', 5, 'Nusa Dua beach day, satvik dinner', NULL, 'Nusa Dua', NULL);
INSERT INTO public.package_day VALUES ('c7973bf1-595e-471d-be34-c75de4063e94', '9c12d2d8-d493-4d11-b407-e1babafe427e', 6, 'Departure', NULL, NULL, NULL);
INSERT INTO public.package_day VALUES ('1097d49e-239d-437d-9ed2-d662a3a16771', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 1, 'Arrival and Kuta sunset', NULL, 'Kuta', NULL);
INSERT INTO public.package_day VALUES ('ebc4c747-5480-4cbc-b223-8eccdad4af99', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 2, 'Water sports and Uluwatu', NULL, 'Kuta', NULL);
INSERT INTO public.package_day VALUES ('6fc027bc-7f8b-46fd-988d-3dec2d4b2bb6', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 3, 'Ubud day trip and a veg warung lunch', NULL, 'Ubud', NULL);
INSERT INTO public.package_day VALUES ('946ed04d-8c1e-4f43-92f6-43259946cd06', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 4, 'Shopping and beach clubs with veg menus', NULL, 'Seminyak', NULL);
INSERT INTO public.package_day VALUES ('48b88877-f4ec-4626-b352-02e8a33bcba9', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 5, 'Departure', NULL, NULL, NULL);
INSERT INTO public.package_day VALUES ('72f36c3c-91a6-4671-becf-025d4e6ee253', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 1, 'Arrival', NULL, 'Ubud', NULL);
INSERT INTO public.package_day VALUES ('cfe253f8-af78-4ee9-82dc-063b364efc6b', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 2, 'Ayung river rafting and ATV', NULL, 'Ubud', NULL);
INSERT INTO public.package_day VALUES ('e763c1a9-c431-4527-ab2c-30a574e7f14c', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 3, 'Mount Batur sunrise trek and veg brunch', NULL, 'Ubud', NULL);
INSERT INTO public.package_day VALUES ('8cfe9a0e-685e-42b9-a1d2-53a53de256d6', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 4, 'Nusa Penida snorkelling', NULL, 'Nusa Penida', NULL);
INSERT INTO public.package_day VALUES ('30766d6d-5df1-4756-a1e3-9e285743f3ff', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 5, 'Departure', NULL, NULL, NULL);


--
-- Data for Name: package_day_meal; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.package_day_meal VALUES ('9b8dcd15-3675-453a-81f0-ef4edc3c9df2', '540976b7-e32e-48cb-9769-516c1b170135', 'breakfast', 'In-flight catering', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('c47c49df-c2c2-482a-90ee-24f53381ec49', '540976b7-e32e-48cb-9769-516c1b170135', 'lunch', 'Welcome refreshments at the villa', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('b82ddb56-42b8-4217-b620-d79d554e43d2', '540976b7-e32e-48cb-9769-516c1b170135', 'dinner', 'Jain thali prepared in the villa kitchen', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('585d3ae5-4406-4cd6-9a82-4e22dcb75bc3', '15a3ba65-d2fc-4f15-b5cb-35c0b921efce', 'breakfast', 'Villa kitchen — Gujarati breakfast', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('1643512c-ed36-4aff-8d73-4da3d759f64c', '15a3ba65-d2fc-4f15-b5cb-35c0b921efce', 'lunch', 'Sattvik By Nature, Ubud', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('8982bbf9-897c-4c18-a9bd-c5da0ca345f2', '15a3ba65-d2fc-4f15-b5cb-35c0b921efce', 'dinner', 'Villa kitchen — satvik dinner', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('8c2d3fcf-c3e5-4478-9f3a-937bc0e67adc', '75b0fdfb-a6e4-47e5-b132-7961d81f11e9', 'breakfast', 'Villa kitchen — Gujarati thali', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('926c8608-d42a-44c4-98ba-72382bf11996', '75b0fdfb-a6e4-47e5-b132-7961d81f11e9', 'lunch', 'Sattvik By Nature, Ubud', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('5f11d574-071d-4509-928f-eedd418686bf', '75b0fdfb-a6e4-47e5-b132-7961d81f11e9', 'dinner', 'Warung near Tegallalang — substituted for a Jain-capable kitchen', 'red', NULL);
INSERT INTO public.package_day_meal VALUES ('6e8cdb8f-7fe2-45d9-bb5f-44833ece266b', '2ca79944-6d0a-4b85-b8d7-6741a84a9a75', 'breakfast', 'Villa kitchen', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('42fdf26c-04c5-45be-9a94-ae0057d1b19a', '2ca79944-6d0a-4b85-b8d7-6741a84a9a75', 'lunch', 'Packed protocol lunch for the cliff walk', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('4c4b2790-9927-4599-ae03-4d3975e0c1d9', '2ca79944-6d0a-4b85-b8d7-6741a84a9a75', 'dinner', 'Private dinner after the Kecak performance', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('ebb8f6a7-b142-41a7-b457-30e88575df64', '498cff38-d26e-453e-b59d-1c5781968aa7', 'breakfast', 'Resort breakfast, dedicated veg counter', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('b0bd697c-ce33-4496-b5e2-fee51349d927', '498cff38-d26e-453e-b59d-1c5781968aa7', 'lunch', 'Beachfront Indian restaurant, verified', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('19f1cc1a-eccf-4c6f-bdce-e0d25a03f26c', '498cff38-d26e-453e-b59d-1c5781968aa7', 'dinner', 'Satvik farewell dinner', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('4a8b6adb-aa82-48f1-923e-d7cfc9df71d3', 'c7973bf1-595e-471d-be34-c75de4063e94', 'breakfast', 'Villa kitchen', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('bf9aeba3-cef4-4481-95b0-25369b769255', 'c7973bf1-595e-471d-be34-c75de4063e94', 'lunch', 'Airport — packed protocol meal', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('8dc0f448-b51f-451d-aa04-150ef3ed6d21', 'c7973bf1-595e-471d-be34-c75de4063e94', 'dinner', 'In-flight catering', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('051d7a43-b1b8-4be9-8e9a-e53eb39e82de', '1097d49e-239d-437d-9ed2-d662a3a16771', 'breakfast', 'In-flight catering', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('660bded4-daf1-4974-818e-091c7e43c0ac', '1097d49e-239d-437d-9ed2-d662a3a16771', 'lunch', 'Queen''s of India, Kuta', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('947961bc-63f3-4365-8abd-87d32e276bb8', '1097d49e-239d-437d-9ed2-d662a3a16771', 'dinner', 'Hotel buffet, veg counter', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('afe44f5c-c249-4d58-b778-4d8124504e4e', 'ebc4c747-5480-4cbc-b223-8eccdad4af99', 'breakfast', 'Hotel breakfast, veg counter', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('e6104c65-3f98-4e6b-a078-57b3dd78ff5a', 'ebc4c747-5480-4cbc-b223-8eccdad4af99', 'lunch', 'Packed veg lunch at the water sports centre', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('15000a67-ee72-4542-8594-7c59bb827246', 'ebc4c747-5480-4cbc-b223-8eccdad4af99', 'dinner', 'Vinayak, Kuta', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('23d3e4db-131d-4c4a-9f58-a87ece08dee0', '6fc027bc-7f8b-46fd-988d-3dec2d4b2bb6', 'breakfast', 'Hotel breakfast', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('3d126174-a48c-49a0-ae89-ffed0d49476c', '6fc027bc-7f8b-46fd-988d-3dec2d4b2bb6', 'lunch', 'Sattvik By Nature, Ubud', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('afedabca-fb11-4caf-baf3-35f84649fc7e', '6fc027bc-7f8b-46fd-988d-3dec2d4b2bb6', 'dinner', 'Punjabi Grill', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('0972c9d7-c2e4-4abb-ad0b-42eeba5b9e93', '946ed04d-8c1e-4f43-92f6-43259946cd06', 'breakfast', 'Hotel breakfast', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('53d4b5a4-1ba3-423d-ba61-1e800f7e7a85', '946ed04d-8c1e-4f43-92f6-43259946cd06', 'lunch', 'Beach club, veg menu, shared kitchen', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('6ec3f5cd-aac0-4318-871a-bad8957119cd', '946ed04d-8c1e-4f43-92f6-43259946cd06', 'dinner', 'Darbar — separate 100% veg kitchen', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('26eb2579-feb3-4331-ab59-2e4e4981eddf', '48b88877-f4ec-4626-b352-02e8a33bcba9', 'breakfast', 'Hotel breakfast', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('669983ed-6219-48bb-a0e7-38727d74fa32', '48b88877-f4ec-4626-b352-02e8a33bcba9', 'lunch', 'Airport — packed veg meal', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('0288508c-d6c0-4c69-8d07-bec19edfe895', '48b88877-f4ec-4626-b352-02e8a33bcba9', 'dinner', 'In-flight catering', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('027d01ac-93e1-47b2-9352-380ba744412b', '72f36c3c-91a6-4671-becf-025d4e6ee253', 'breakfast', 'In-flight catering', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('b82e7058-8b37-4f70-ae13-749a738c7a12', '72f36c3c-91a6-4671-becf-025d4e6ee253', 'lunch', 'The Shady Shack, Canggu', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('c85b365d-a909-4351-af74-704382e19fae', '72f36c3c-91a6-4671-becf-025d4e6ee253', 'dinner', 'Hotel dinner, veg menu', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('0202abea-2646-446b-8ea1-f10760cf3e14', 'cfe253f8-af78-4ee9-82dc-063b364efc6b', 'breakfast', 'High-protein veg breakfast', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('bdc3abf2-863e-4a68-88bb-ecb517158c50', 'cfe253f8-af78-4ee9-82dc-063b364efc6b', 'lunch', 'Riverside packed lunch', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('bf8246b6-c99a-40a1-86ca-3289e0462477', 'cfe253f8-af78-4ee9-82dc-063b364efc6b', 'dinner', 'Sattvik By Nature, Ubud', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('44db594f-7ffa-49ea-a700-716df2803602', 'e763c1a9-c431-4527-ab2c-30a574e7f14c', 'breakfast', 'Packed pre-dawn protocol breakfast', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('384b6e07-a44e-4b98-8d6c-e5eb186de1a4', 'e763c1a9-c431-4527-ab2c-30a574e7f14c', 'lunch', 'Post-trek veg brunch', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('4737127d-9a6f-4b6d-852b-7d6497fc56bc', 'e763c1a9-c431-4527-ab2c-30a574e7f14c', 'dinner', 'Hotel dinner', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('b9dc1804-3aa3-4f03-8161-3388d496262c', '8cfe9a0e-685e-42b9-a1d2-53a53de256d6', 'breakfast', 'Early hotel breakfast', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('8e414278-1622-46c5-9c63-096932335da1', '8cfe9a0e-685e-42b9-a1d2-53a53de256d6', 'lunch', 'Boat packed veg lunch', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('4e7c766c-5a08-42f8-8499-7cccf6262e8e', '8cfe9a0e-685e-42b9-a1d2-53a53de256d6', 'dinner', 'Vegan kitchen, Canggu', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('5542cc6f-7379-45da-8590-44e893d003d5', '30766d6d-5df1-4756-a1e3-9e285743f3ff', 'breakfast', 'Hotel breakfast', 'amber', NULL);
INSERT INTO public.package_day_meal VALUES ('a3ca6060-2fbc-434e-9169-8da3eeef0b38', '30766d6d-5df1-4756-a1e3-9e285743f3ff', 'lunch', 'Airport — packed veg meal', 'green', NULL);
INSERT INTO public.package_day_meal VALUES ('215c69d7-a87a-471d-93c2-de14972eb50c', '30766d6d-5df1-4756-a1e3-9e285743f3ff', 'dinner', 'In-flight catering', 'amber', NULL);


--
-- Data for Name: place; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.place VALUES ('b8af1315-69db-45fe-9d8e-776a4645878c', 'Ubud', 'Ubud', 'bali', NULL, NULL, '2026-07-22 20:00:10.18904+00');
INSERT INTO public.place VALUES ('6d80f023-8283-4daf-a178-e2380f9eb30b', 'Uluwatu', 'Uluwatu', 'bali', NULL, NULL, '2026-07-22 20:00:10.198134+00');
INSERT INTO public.place VALUES ('353e748a-07b0-4d4a-9972-ab371943c71d', 'Nusa Dua', 'Nusa Dua', 'bali', NULL, NULL, '2026-07-22 20:00:10.20546+00');
INSERT INTO public.place VALUES ('b133be1a-f71e-4e58-beaa-d2d1a290ccee', 'Kuta', 'Kuta', 'bali', NULL, NULL, '2026-07-22 20:00:10.21345+00');
INSERT INTO public.place VALUES ('41e38b53-534d-4df5-b549-371663764600', 'Seminyak', 'Seminyak', 'bali', NULL, NULL, '2026-07-22 20:00:10.221173+00');
INSERT INTO public.place VALUES ('e687c29d-f902-40ef-b39e-6688e2659048', 'Canggu', 'Canggu', 'bali', NULL, NULL, '2026-07-22 20:00:10.23035+00');
INSERT INTO public.place VALUES ('0805913e-e6be-45b1-a568-5194e527c979', 'Sanur', 'Sanur', 'bali', NULL, NULL, '2026-07-22 20:00:10.237828+00');
INSERT INTO public.place VALUES ('0f6f7a15-bfc4-49ee-be19-2768074dd578', 'Jimbaran', 'Jimbaran', 'bali', NULL, NULL, '2026-07-22 20:00:10.246756+00');
INSERT INTO public.place VALUES ('a7cabd1c-b9d6-4322-bc73-fc3839ee48da', 'Tegallalang', 'Tegallalang', 'bali', NULL, NULL, '2026-07-22 20:00:10.254783+00');
INSERT INTO public.place VALUES ('a577c07a-4f44-426d-9a96-4219b6d08dfb', 'Tirta Empul', 'Tirta Empul', 'bali', NULL, NULL, '2026-07-22 20:00:10.262332+00');
INSERT INTO public.place VALUES ('438f7ee6-a852-4be0-83a4-2f715d662211', 'Besakih', 'Besakih', 'bali', NULL, NULL, '2026-07-22 20:00:10.270699+00');
INSERT INTO public.place VALUES ('4aa22f01-565b-4de2-a6fa-b70b78b60373', 'Lempuyang', 'Lempuyang', 'bali', NULL, NULL, '2026-07-22 20:00:10.279984+00');
INSERT INTO public.place VALUES ('fce4e9df-b318-4fea-a968-0bc4ccf6c366', 'Tanah Lot', 'Tanah Lot', 'bali', NULL, NULL, '2026-07-22 20:00:10.287195+00');
INSERT INTO public.place VALUES ('dcd96a7e-8b45-49e1-a15c-ebb3a6d034b8', 'Mount Batur', 'Mount Batur', 'bali', NULL, NULL, '2026-07-22 20:00:10.294508+00');
INSERT INTO public.place VALUES ('b0b940a0-0d98-4b8e-a150-a99a4801dd47', 'Nusa Penida', 'Nusa Penida', 'bali', NULL, NULL, '2026-07-22 20:00:10.302009+00');
INSERT INTO public.place VALUES ('e4565596-3261-40f3-815d-9fb2dc315f38', 'Ayung River', 'Ayung River', 'bali', NULL, NULL, '2026-07-22 20:00:10.310776+00');
INSERT INTO public.place VALUES ('74bfa3f4-31c8-46b4-86f4-8ce1c7950da0', 'Mas Village', 'Mas Village', 'bali', NULL, NULL, '2026-07-22 20:00:10.31888+00');
INSERT INTO public.place VALUES ('d5f850e8-1c14-432a-aab9-635e7dcf07d1', 'Celuk', 'Celuk', 'bali', NULL, NULL, '2026-07-22 20:00:10.326275+00');


--
-- Data for Name: package_day_place; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: package_highlight; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.package_highlight VALUES ('5d009826-88a9-4ea1-a763-b77b6f9e6cdb', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'Jain-protocol kitchen in the villa, cook optional', NULL, 0);
INSERT INTO public.package_highlight VALUES ('4c9b583c-209e-4630-bade-46bc04b28cbe', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'Gujarati and Hindi-speaking guide throughout', NULL, 1);
INSERT INTO public.package_highlight VALUES ('9f651c8a-93f3-4caf-87a5-a65e077e648c', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'Temple mornings timed before the crowds', NULL, 2);
INSERT INTO public.package_highlight VALUES ('ce67bc93-9056-4ed8-9d0f-b094dfc831cf', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'Verified Indian veg restaurants on every travel day', NULL, 0);
INSERT INTO public.package_highlight VALUES ('045e275f-9d20-4984-b799-d7a5f32cf152', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'Water sports and Uluwatu Kecak included', NULL, 1);
INSERT INTO public.package_highlight VALUES ('1074f43b-c0fe-48fc-a9d5-9e9261ba61b4', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'Built for first-time groups on a tighter budget', NULL, 2);
INSERT INTO public.package_highlight VALUES ('1ff84ee9-04b0-4f35-9664-030b824b203e', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 'High-protein veg and vegan meal plans for trek days', NULL, 0);
INSERT INTO public.package_highlight VALUES ('268620dc-0d18-4738-bd13-1ff8d14df754', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 'Batur sunrise with a packed protocol breakfast', NULL, 1);
INSERT INTO public.package_highlight VALUES ('6b373010-3c6a-45bc-bede-5093c244256a', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 'Rafting, ATV and snorkelling in one week', NULL, 2);


--
-- Data for Name: package_inclusion; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.package_inclusion VALUES ('21ae8b1d-99f3-4e86-8ddb-9005bc98a136', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'included', 'other', 'Private villa stay', NULL, 0);
INSERT INTO public.package_inclusion VALUES ('7c5cf6db-ace9-4402-8cdf-5ce682facef1', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'included', 'other', 'All meals to protocol', NULL, 1);
INSERT INTO public.package_inclusion VALUES ('6f0051a3-9d8c-47c5-842c-d2d26b0fd4fb', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'included', 'other', 'Private transport', NULL, 2);
INSERT INTO public.package_inclusion VALUES ('d62b78c3-721d-43b8-a073-74a66393da09', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'included', 'other', 'Indian-language guide', NULL, 3);
INSERT INTO public.package_inclusion VALUES ('9897a8e9-72b0-4836-9984-3f9c60d8130c', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'included', 'other', 'Temple entry fees', NULL, 4);
INSERT INTO public.package_inclusion VALUES ('c8c8bd55-11f2-4866-bce9-2ecc84e4125e', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'excluded', 'other', 'International flights', NULL, 0);
INSERT INTO public.package_inclusion VALUES ('bf155dd3-664e-4dd4-bdbb-042370634292', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'excluded', 'other', 'Visa on arrival', NULL, 1);
INSERT INTO public.package_inclusion VALUES ('a56d3ee8-f82b-4107-8b56-a0ba2bc38c1e', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'excluded', 'other', 'Personal expenses', NULL, 2);
INSERT INTO public.package_inclusion VALUES ('66c13bfc-613b-4b42-b75f-653e8ef1a9f8', '9c12d2d8-d493-4d11-b407-e1babafe427e', 'excluded', 'other', 'Tips', NULL, 3);
INSERT INTO public.package_inclusion VALUES ('a7545296-c70c-446e-b54f-eeb3d1753a36', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'included', 'other', '3-star hotel stay', NULL, 0);
INSERT INTO public.package_inclusion VALUES ('7273ffdd-621a-46d9-9beb-e7752b288bf9', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'included', 'other', 'Daily breakfast and dinner', NULL, 1);
INSERT INTO public.package_inclusion VALUES ('666767ef-0d06-4b73-bf0d-87a8e2fc186b', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'included', 'other', 'Shared transport', NULL, 2);
INSERT INTO public.package_inclusion VALUES ('e1c67b6f-79f1-47f2-9fac-701f2b0e5402', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'included', 'other', 'Hindi-speaking guide', NULL, 3);
INSERT INTO public.package_inclusion VALUES ('ac59e0cb-50c8-4317-a865-539cbcd43ab1', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'excluded', 'other', 'International flights', NULL, 0);
INSERT INTO public.package_inclusion VALUES ('cb6947dd-6956-4548-8740-6ad0d512f55a', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'excluded', 'other', 'Visa on arrival', NULL, 1);
INSERT INTO public.package_inclusion VALUES ('1b2b9d5a-c6a1-42d7-90e9-eb1fd79b8dc4', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'excluded', 'other', 'Lunches on free days', NULL, 2);
INSERT INTO public.package_inclusion VALUES ('ecf7a355-525d-48c6-9487-08c9ad8e1c5a', '2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'excluded', 'other', 'Personal expenses', NULL, 3);
INSERT INTO public.package_inclusion VALUES ('564ffd06-e7f5-4059-bb38-ad75e403b28f', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 'included', 'other', 'Hotel stay', NULL, 0);
INSERT INTO public.package_inclusion VALUES ('eacba1db-c1d3-471c-88c2-c48d5a7b516a', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 'included', 'other', 'All activity fees', NULL, 1);
INSERT INTO public.package_inclusion VALUES ('92350fc8-4ae4-43bb-9191-7a0d5685b971', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 'included', 'other', 'Private transport', NULL, 2);
INSERT INTO public.package_inclusion VALUES ('7da1d219-5fbc-4b5b-b3ae-00f1d357a41c', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 'included', 'other', 'Trek guide', NULL, 3);
INSERT INTO public.package_inclusion VALUES ('db8b133c-7e72-4b9c-980e-976889289d2d', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 'excluded', 'other', 'International flights', NULL, 0);
INSERT INTO public.package_inclusion VALUES ('5c329925-e7e4-4e5a-9d7e-cceba51c122e', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 'excluded', 'other', 'Visa on arrival', NULL, 1);
INSERT INTO public.package_inclusion VALUES ('b69fc7b5-0920-44e3-818a-d05e0759bb07', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 'excluded', 'other', 'Equipment hire', NULL, 2);
INSERT INTO public.package_inclusion VALUES ('7bad0f0f-87f5-49ff-b397-7a796ce5fe23', 'c916f56e-ef6d-4280-ab00-35b124c9e63f', 'excluded', 'other', 'Tips', NULL, 3);


--
-- Data for Name: package_place; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.package_place VALUES ('9c12d2d8-d493-4d11-b407-e1babafe427e', 'b8af1315-69db-45fe-9d8e-776a4645878c', 0);
INSERT INTO public.package_place VALUES ('9c12d2d8-d493-4d11-b407-e1babafe427e', 'a577c07a-4f44-426d-9a96-4219b6d08dfb', 1);
INSERT INTO public.package_place VALUES ('9c12d2d8-d493-4d11-b407-e1babafe427e', '6d80f023-8283-4daf-a178-e2380f9eb30b', 2);
INSERT INTO public.package_place VALUES ('9c12d2d8-d493-4d11-b407-e1babafe427e', '353e748a-07b0-4d4a-9972-ab371943c71d', 3);
INSERT INTO public.package_place VALUES ('2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'b133be1a-f71e-4e58-beaa-d2d1a290ccee', 0);
INSERT INTO public.package_place VALUES ('2c1d94ea-a98b-4e2e-bb2e-af79310976a8', 'b8af1315-69db-45fe-9d8e-776a4645878c', 1);
INSERT INTO public.package_place VALUES ('2c1d94ea-a98b-4e2e-bb2e-af79310976a8', '6d80f023-8283-4daf-a178-e2380f9eb30b', 2);
INSERT INTO public.package_place VALUES ('c916f56e-ef6d-4280-ab00-35b124c9e63f', 'e4565596-3261-40f3-815d-9fb2dc315f38', 0);
INSERT INTO public.package_place VALUES ('c916f56e-ef6d-4280-ab00-35b124c9e63f', 'dcd96a7e-8b45-49e1-a15c-ebb3a6d034b8', 1);
INSERT INTO public.package_place VALUES ('c916f56e-ef6d-4280-ab00-35b124c9e63f', 'b0b940a0-0d98-4b8e-a150-a99a4801dd47', 2);
INSERT INTO public.package_place VALUES ('c916f56e-ef6d-4280-ab00-35b124c9e63f', 'b8af1315-69db-45fe-9d8e-776a4645878c', 3);


--
-- Data for Name: package_price_tier; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: point_of_interest; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--


COMMIT;
