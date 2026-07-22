# Salvaged seed data

> Extracted 2026-07-22 from `Backend/app/data/` before the undeployed FastAPI app was deleted
> (task S0.9). Feeds the Sprint 4 circuit and vendor seeding.

## Why this file exists, and the warning that comes with it

The FastAPI app carried a 43-entry vendor list and a set of itinerary templates. **Most of it
was not usable, and some of it was actively dangerous for this product.**

| Category | Count |
|---|---|
| Veg-compliant (`pure-veg` / `jain` / `vegan`) | **7** |
| Explicitly `mixed` (serves non-vegetarian) | 6 |
| No `veg_type` field at all | 30 |

Among the `mixed` entries was **Warung Babi Guling Ibu Oka** — a Balinese *suckling pig*
specialist — and **Jimbaran Seafood Kalimatus**. Worse, the 3-day itinerary template in
`templates_seed.json` recommended the pork restaurant **for day-one lunch**.

The app was never deployed, so no customer ever saw it. But this is precisely the failure the
spec's **hard protocol filter** exists to prevent: a data set where compliance is an optional
field rather than a gate. Two lessons carried into the build:

1. `veg_type` being nullable is the bug. In the new schema, compliance is a separate
   `listing_compliance` row with an admin verifier, and a listing without one is invisible to
   matching — it does not default to "unknown, show anyway".
2. Never seed the itinerary generator from an unfiltered vendor table.

## Usable — food vendors

Verify each independently before publishing. These are leads, not verified supply.

| Name | Type | Protocol | Area | Rating | Tier |
|---|---|---|---|---|---|
| Sari Organik | restaurant | pure-veg | Ubud | 4.8 | mid |
| Bali Jain Bhojanalay | restaurant | jain | Seminyak | 4.6 | mid |
| The Nusa Dua Jain Thali | restaurant | jain | Nusa Dua | 4.5 | mid |
| Sanur Pure Veg Kitchen | restaurant | pure-veg | Sanur | 4.3 | budget |
| The Green Leaf Cafe | restaurant | vegan | Canggu | 4.7 | budget |
| The Shady Shack | restaurant | vegan | Canggu | 4.6 | budget |
| Canggu Organic Snack Co. | eatables | vegan | Canggu | 4.5 | mid |

These are **additional to** the five known operators already in the plan (Sattvik By Nature,
Darbar, Punjabi Grill, Queen's of India, Vinayak), which remain the primary Culinary circuit
seed.

## Usable — Artistic circuit

Food compliance is irrelevant for these, and they map directly onto the Artistic circuit, which
had the thinnest supply of the four.

| Name | Area | Circuit fit |
|---|---|---|
| Mas Village Wood Carvers | Ubud | Artistic — wood carving |
| Celuk Silver & Wood Craft | Ubud | Artistic — silver and wood |
| Ubud Batik Studio | Ubud | Artistic — batik |
| Sanur Batik & Textile Gallery | Sanur | Artistic — batik |
| Seminyak Batik Boutique | Seminyak | Artistic — batik |
| Kuta Wooden Souvenir Hub | Kuta | Artistic — retail |

## Usable — transport and activity leads

Names only. No compliance implications, but no verification either.

**Transport**: Ngurah Rai Airport Transfers · Bali Premium Car Charter · Ubud Scooter Rentals ·
Sanur Ferry & Transfer Hub · Bali Premium Private Tours

**Activity / Adventure circuit**: Mount Batur Trekking Co. · Nusa Dua Snorkel & Dive ·
Uluwatu Surf & Culture Tour · Canggu Surf School · Bali Sunrise Tours ·
Sacred Monkey Forest Guides

**Accommodation**: Komaneka at Bisma (Ubud) · Alaya Resort Ubud · The Layar Private Villas
(Seminyak) · Desa Seni Village Resort (Canggu) · Tandjung Sari Hotel (Sanur) ·
Mercure Bali Nusa Dua · Sundara Jimbaran Beach Resort · Puri Garden Hotel (Kuta)

Each needs a kitchen-capability assessment before it can carry a veg guarantee. An accommodation
listing with no `listing_compliance` row is bookable only on packages where meals are sourced
elsewhere.

## Discarded

Six `mixed` food vendors, discarded outright: Warung Babi Guling Ibu Oka, Merah Putih,
Nasi Ayam Kedewatan, Locavore Restaurant, KU DE TA, Jimbaran Seafood Kalimatus.

Plus the three retail entries with no circuit fit: Ubud Art Market, Seminyak Square Boutiques,
Kuta Beach Walk Mall.

The itinerary templates were discarded entirely — they were built around the discarded vendors.
