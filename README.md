# Yizzy — The Ownership Engine for India's Gig Economy

A single portal with two routes, built to land the pitch for two audiences at once —
gig drivers evaluating the switch to an EV, and banks/investors evaluating the model.

| Route | What it is |
|---|---|
| `/` | **Landing page** — the pitch: hero, the end-to-end driver journey as a flowchart, an interactive earnings calculator, and market context. |
| `/infra-map` | **EV Charging Infra Map** — 192 verified Hyderabad stations across 51 operators, filterable and inspectable. |

Both share one header and nav — this is one product, not two sites.

## The four things Yizzy does

1. **Financing** — fuel vehicle to EV at zero upfront. Repayment capacity is scored from
   the driver's own bank statements via India's RBI-regulated Account Aggregator
   framework, not traditional loan paperwork.
2. **Efficiency optimization** — the app tracks earnings and rides, then optimizes routing
   and timing. Target: up to 15% more earnings from the same hours.
3. **B2B demand network** — logistics and corporate-transport partnerships give drivers
   extra paid gigs in spare hours.
4. **Battery buyback** — up to 50% of the old battery's value credited toward the
   replacement.

## Earnings calculator

Fully client-side. Standard reducing-balance EMI, a 26-day working month, and per-tab
editable inputs for Bike / Auto / Cab. The seeded defaults are the supplied bottom-up
figures and are **not** to be changed without asking — they live in
`src/features/landing/calculator/model.ts`.

With those defaults, all three vehicle classes clear their EMI:

| | Extra monthly profit | Monthly EMI | Left over |
|---|---|---|---|
| Bike | ₹6,370 | ₹3,384 | ₹2,986 |
| Auto | ₹12,480 | ₹9,492 | ₹2,988 |
| Cab | ₹29,250 | ₹27,552 | ₹1,698 |

One deliberate deviation from the brief: the stacked cost bars are scaled to *actual*
revenue rather than forced to equal heights. Revenue is identical for Bike (₹1,500 both)
but differs for Auto (₹2,500 vs ₹2,300) and Cab (₹4,000 vs ₹3,800) in the supplied
numbers, so equal-height bars would misstate the inputs. The caption adapts to say which
case you're looking at.

## Charging infra map

Current coverage: **Hyderabad — 192 stations, 51 operators**. The architecture is
pan-India by design: adding a city is a data import, not a code change.

> **Note:** the dataset does not contain `rating` or `review count`, so station popups
> omit them. Every other documented field is present and surfaced.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173 (or a harness-assigned port)
```

The app reads two static files — `public/data/stations.json` and `public/data/meta.json` —
produced by the ETL. They are committed, so the app runs without re-running the pipeline.

## Re-importing / adding a city

Everything the UI shows — the city list, operator list, filter options, map bounds,
every statistic — is derived from the ETL output. Nothing is hardcoded to Hyderabad
or to two cities.

```bash
# 1. Drop a new .xlsx or .csv (same columns) into data/raw/
# 2. Regenerate the dataset:
python3 -m venv .venv && source .venv/bin/activate
pip install -r scripts/etl/requirements.txt
python3 scripts/etl/build_dataset.py
```

The script merges every file in `data/raw/`, cleans and normalizes it, and rewrites
the two JSON files. A new city with valid coordinates appears on the map, in the
filters, and in the dashboard with no frontend change.

---

## Data model — how the source was interpreted

The source spreadsheet is operator-delivered and messy: several columns hold a clean
category behind a free-text qualifier, and the single most valuable field (the
operator) isn't a column at all. The ETL (`scripts/etl/build_dataset.py`) resolves this,
keeping a clean enum for filtering **and** the raw string for display on every field.

| Source column | What it actually is | How it's used |
|---|---|---|
| `Description` | A structured triple: `Operator: … \| Confidence: … \| Notes: …` | **Parsed into three fields.** `operator` (51 distinct networks) is the headline dimension and the "color by operator" mode; `confidence` powers the verification story; `notes` shows as field notes. |
| `Google_Maps_Link` | Original Google Maps URL — `place_id` link (166) or `?query=lat,lon` link (26) | Used **verbatim** for the "Open in Maps" action, so a `place_id` link opens Google's canonical business pin. Markers still plot from `Latitude`/`Longitude` (a `place_id` carries no extractable coordinate; the coordinate links equal the columns exactly). |
| `Link_Type` | `exact place` \| `coordinate` | Drives the "verified place" indicator in the detail panel; confirmed there were no short links needing resolution. |
| `Ownership` | The *ownership model*, not the operator (32 free-text values) | Normalized to 6 buckets (Private / OEM / PSU / Utility / Public / Government). A secondary lens, not the operator. |
| `Category` | Charging *hardware*, not business type (41 variants) | Normalized to AC / DC Fast / AC+DC / Battery Swap; raw string + parsed kW shown in the panel. |
| `Vehicle_Tag` | Multi-valued (`2W+3W+4W`), ~24% `Unconfirmed` | Parsed to a tag **array** (a station can serve several classes). Empty = unconfirmed, shown as a distinct neutral marker class rather than invented coverage. |
| `Access` | 52 free-text values over 4 real levels | Normalized to Public / Semi-public / Restricted / Not available; qualifier kept for the panel. |
| `City` / `Area` | Primary + secondary geography | `areaGroup` rolls compound localities (`Patancheru (Muthangi)`) up to a canonical parent for filtering; exact `area` stays searchable. |

The ETL also derives **ground-truth flags** from the source's own review notes —
`closed` (2), `falsely-listed-public` (4), `reported-nonfunctional` (17) — which is the
dataset's real differentiator: sites other aggregators list as live and public that the
field data contradicts.

---

## Architecture

```
scripts/etl/build_dataset.py   ETL: raw spreadsheet -> normalized JSON (the source of truth)
public/data/*.json             stations.json + derived meta.json (counts, bounds, city list)
vercel.json                    SPA rewrite — without it /infra-map 404s on refresh

src/
  brand.css                    design tokens: asphalt/paper/marigold/teal/coral, type scale
  landing.css                  landing-page styles
  styles.css                   map-route styles (scoped; must not set global body rules)
  App.tsx                      router + shared shell
  components/                  SiteHeader, SiteFooter, ScrollToTop
  pages/                       LandingPage, MapPage
  features/landing/            Hero, HowItWorks (flowchart), MarketStats
  features/landing/calculator/ model.ts (EMI + defaults), Calculator, CostBars
  config/
    zones.ts                   EDITABLE Hyderabad activity zones (polygons + tiers)
    evReference.ts             EDITABLE EV-population estimates (city + per-zone shares)
  lib/
    data/source.ts             the ONE seam to the data layer — swap for a real API here
    data/types.ts              the normalized data contract
    store.ts                   Zustand state: filters, theme, map style, selections (URL-synced)
    facets.ts                  cross-facet option counts (self-excluding multi-select)
    zones.ts                   point-in-polygon assignment, density, EV-vs-infra ratios
    theme.ts                   visual encoding, tuned per light/dark theme
  features/
    map/                       MapLibre GL: individual points, theme + satellite basemaps, zones
    filters/                   sidebar, faceted filters, typeahead search
    detail/                    right-side sliding station panel
    zones/                     EV-vs-infrastructure comparison panel
    stats/                     top stats strip + theme toggle + Map/Analytics switch
    dashboard/                 Recharts analytics view
```

### Editing the zones and EV estimates

- **Zones** (`src/config/zones.ts`): four `[lon, lat]` polygons with tier labels. Edit the
  boundaries freely — a station is assigned to the first zone (by `priority`) that contains it,
  and the overlay's shading intensity is driven by **real station density**, not the tier.
- **EV estimates** (`src/config/evReference.ts`): city-wide EV counts by class plus an editable
  per-zone `zoneShare` split. These are the only non-verified numbers in the app and are labelled
  "estimated" everywhere they appear. The per-zone split is intentionally independent of station
  locations, so the "vehicles per station" ratio genuinely differs by zone.

### Themes, basemaps, and rendering notes

- **Light is the default theme**; the choice persists in `localStorage`. Light/dark are separately
  tuned (markers, zone overlay, panels), not inverted.
- **Basemaps** are keyless: CARTO Positron (light roadmap), CARTO Dark Matter (dark roadmap), and
  ESRI World Imagery (satellite). Switching theme or style calls `setStyle`; a persistent
  `style.load` handler re-installs the station + zone layers each time.
- **No clustering** — every station renders as its own MapLibre circle at all zoom levels. The
  circle layer is already GPU-rendered, so scaling to tens of thousands of points is a tuning job,
  **not a rewrite**; deck.gl would only be needed well beyond that.

**Stack:** React + TypeScript + Vite · MapLibre GL JS (no API key, no per-load billing) ·
Zustand · Recharts.

**Key decisions**
- **MapLibre over Mapbox** — same WebGL engine, but no token, no rate limit, and no
  account that can expire mid-pitch.
- **Individual points, no clustering** — every station is always visible (GPU circle layer).
- **Filter state lives in the URL** — any filtered view is a shareable link.
- **The data layer is decoupled behind `source.ts`** — real-time status, an admin upload
  panel, or per-partner scoped/authed endpoints are extensions, not rewrites.

## Scripts

```bash
npm run dev       # dev server with HMR
npm run build     # typecheck + production build
npm run preview   # serve the production build
```

## Roadmap (architected for, not yet built)

Real-time station status via API · admin data-upload panel · partner auth (each network
sees only its own stations) · additional cities/states. None require touching the
frontend's data assumptions.
