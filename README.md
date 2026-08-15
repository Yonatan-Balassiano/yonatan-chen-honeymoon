# Honeymoon — Italy, 5–19 October 2026

A static site: the full day-by-day itinerary, an interactive map of 109 places,
parking, bad-weather fallbacks, food, and a booking checklist.

Live site: **https://USERNAME.github.io/honeymoon-italy-2026/**
(replace `USERNAME` once you've published it)

## Pages

| Page | What's on it |
|---|---|
| `index.html` | The seven things that shape the trip, plus links and downloads |
| `itinerary.html` | All 15 days, hour by hour, across the five bases |
| `map.html` | Interactive map — 109 pins, 7 layers, filter by day |
| `weather.html` | A rain plan and a hard-cold plan for every single day |
| `food.html` | Where to eat, by region |
| `picks.html` | Friends' and blog recommendations, reviewed one by one |
| `practical.html` | Parking, drive times and tolls, weather and packing |
| `checklist.html` | What to book now, and what to phone in late September |

## Downloads served by the site

- `assets/Honeymoon-Italy-2026-map.kml` — import into Google My Maps
- `assets/Honeymoon-Italy-2026-places.csv` — all 109 places, one row each
- `assets/map-csv-layers/` — the same data split per layer
- `assets/Honeymoon-Italy-2026-map-kit.zip` — all of the above plus a README

## Publish to GitHub Pages

```bash
# 1. create an empty repo on github.com called honeymoon-italy-2026
#    (Public is easiest; Pages on Private needs a paid plan)

# 2. from inside this folder:
git remote add origin https://github.com/USERNAME/honeymoon-italy-2026.git
git branch -M main
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: `main`, folder: `/ (root)` → Save.**

Give it a minute, then open `https://USERNAME.github.io/honeymoon-italy-2026/`.

## Updating it later

```bash
# edit any .html file, then:
git add -A
git commit -m "Update Lake Garda hotel"
git push
```

Pages redeploys automatically within a minute or so.

## Notes

- `.nojekyll` is present so GitHub serves every file as-is (no Jekyll processing).
- Leaflet and its CSS are vendored in `assets/`, so the map works without a CDN.
  Map tiles come from OpenStreetMap and need an internet connection.
- Pin coordinates are **approximate — typically within 100–300 m**. Every pin's
  popup has an "Open exact location in Google Maps" link that resolves precisely.
  Use the pin for planning and the link for driving.
- Anything in the itinerary marked "confirm" or "call" genuinely needs a phone
  call — Italian mountain businesses publish season dates late and change them.
