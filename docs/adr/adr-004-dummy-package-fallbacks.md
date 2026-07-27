# ADR-004: Dummy Package Fallback Itineraries

## Status

Accepted.

## Context

Only2Bali production can currently deploy without a connected Postgres database. During the dummy-data stage, package links must still be usable and must show a concrete day-by-day itinerary instead of failing as 404 or 500. At the same time, an actually unknown package slug should not be treated as valid.

## Decision

Known package slugs use database rows when available and curated fallback package details when the database is unreachable. Fallbacks include day-by-day travel plans, meal compliance, inclusions, exclusions, departures and lower admin-selected partner offer prices. Unknown slugs still return `null`, allowing the package page to produce a real not-found response.

## Consequences

The public landing page can safely link to dummy package pages before production database variables are configured. The fallback must remain obviously replaceable by admin/provider rates and must not be treated as live inventory once the production database is connected.
