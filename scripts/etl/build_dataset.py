"""Yizzy EV infrastructure ETL.

Reads the raw operator-sourced spreadsheet and emits the normalized dataset the
frontend reads: public/data/stations.json + public/data/meta.json.

Adding a city is a data change, not a code change: drop a new sheet with the same
columns into data/raw/ and re-run. Every enum, city, operator and map bound in the
UI is derived from the output of this script.

    python3 scripts/etl/build_dataset.py

Source columns (as delivered): Name, Latitude, Longitude, City, Area, Category,
Vehicle_Tag, Ownership, Access, Description.
"""

from __future__ import annotations

import glob
import hashlib
import json
import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw"
OUT_DIR = ROOT / "public" / "data"

# India bounding box - anything outside is a coordinate error, not a station.
INDIA_BBOX = (68.0, 6.0, 98.0, 37.0)  # west, south, east, north

REQUIRED_COLUMNS = [
    "Name", "Latitude", "Longitude", "Google_Maps_Link", "Link_Type", "City", "Area",
    "Category", "Vehicle_Tag", "Ownership", "Access", "Description",
]


# --------------------------------------------------------------------------
# Field parsers
#
# Every messy source column carries a clean enum behind a prefix plus a
# free-text qualifier. Each parser returns the enum; the raw string is always
# preserved alongside it for the detail panel.
# --------------------------------------------------------------------------

def parse_description(text: str) -> tuple[str, str, str]:
    """Description is a structured triple, not free text:

        "Operator: Tata Power | Confidence: High | Notes: <free text>"

    The operator is the single most valuable field in the dataset and exists
    nowhere else, so it is promoted to a first-class column here.
    """
    text = str(text or "")
    operator = re.search(r"Operator:\s*([^|]+?)\s*(?:\||$)", text)
    confidence = re.search(r"Confidence:\s*([^|]+?)\s*(?:\||$)", text)
    notes = re.search(r"Notes:\s*(.*)$", text, re.DOTALL)

    conf_raw = (confidence.group(1).strip().title() if confidence else "")
    return (
        operator.group(1).strip() if operator else "Unknown",
        conf_raw if conf_raw in ("High", "Medium", "Low") else "Low",
        notes.group(1).strip() if notes else "",
    )


def parse_vehicle_tags(raw: str) -> list[str]:
    """Vehicle_Tag is multi-valued ("2W+3W+4W"), not a single enum.

    An empty list means unconfirmed - the source encodes ~24% of rows as
    "Unconfirmed" rather than leaving them blank. We keep that as an absence of
    evidence rather than inventing coverage.
    """
    raw = str(raw or "")
    return [tag for tag in ("2W", "3W", "4W") if re.search(rf"\b{tag}\b", raw)]


def parse_charger_type(raw: str) -> str:
    """Category describes charging hardware (not business type), in 41 free-text
    variants that collapse cleanly on their prefix."""
    raw = str(raw or "").strip()
    lowered = raw.lower()
    if lowered.startswith("battery swap"):
        return "Battery Swap"
    if lowered.startswith(("ac+dc", "dc fast + ac")):
        return "AC+DC"
    if lowered.startswith("dc fast"):
        return "DC Fast"
    if lowered.startswith("ac charging"):
        return "AC"
    return "Unknown"


def parse_power_kw(raw: str) -> int | None:
    """Only ~18 rows state a rating, so this is display-only, not a filter."""
    match = re.search(r"(\d+)\s*kW", str(raw or ""))
    return int(match.group(1)) if match else None


def parse_ownership_model(raw: str) -> str:
    """Ownership is the *ownership model*, not the operator - 32 free-text
    values over 6 real categories."""
    raw = str(raw or "").strip()
    for prefix, model in (
        ("PSU", "PSU / Oil Company"),
        ("OEM", "OEM Network"),
        ("Government", "Government"),
        ("Public", "Public Authority"),
        ("Semi-Public", "Utility / Semi-Public"),
        ("Private", "Private Network"),
    ):
        if raw.startswith(prefix):
            return model
    return "Unknown"


def parse_access(raw: str) -> str:
    raw = str(raw or "").strip()
    lowered = raw.lower()
    if lowered.startswith("not available"):
        return "Not available"
    if lowered.startswith(("restricted", "possibly restricted")):
        return "Restricted"
    if lowered.startswith("semi-public"):
        return "Semi-public"
    if lowered.startswith("public"):
        return "Public"
    return "Unknown"


def parse_area_group(raw: str) -> str:
    """Roll compound/parenthesised localities up to a canonical parent so
    "Patancheru", "Patancheru (Muthangi)" and "Patancheru (ORR Exit 3)" group
    together. The precise original stays searchable as `area`.
    """
    raw = str(raw or "").strip()
    raw = re.sub(r"\s*\([^)]*\)", "", raw)  # drop parentheticals
    return raw.split("/")[0].strip() or "Unknown"


NONFUNCTIONAL_RE = re.compile(
    r"non-functional|not working|charger not working|reported down|not present|"
    r"permanently closed|frequently non-functional",
    re.IGNORECASE,
)


def derive_flags(access_raw: str, category_raw: str, access: str, notes: str) -> list[str]:
    """Ground-truth signals the source captured from on-site reviews.

    These are the dataset's differentiator - they mark listings that other
    aggregators carry as live and correct - so they are surfaced, not smoothed away.
    """
    flags: list[str] = []
    access_raw, category_raw = str(access_raw or ""), str(category_raw or "")

    if access == "Not available" or category_raw.strip() in ("Decommissioned", "Listed but not present"):
        flags.append("closed")
    if access == "Restricted" and "review confirms" in access_raw.lower():
        flags.append("falsely-listed-public")
    if NONFUNCTIONAL_RE.search(notes) or NONFUNCTIONAL_RE.search(access_raw):
        flags.append("reported-nonfunctional")
    return flags


def make_id(name: str, lat: float, lon: float) -> str:
    """Stable across re-imports. Name alone is not unique - the dataset holds
    three distinct "Tata Power Charging Station" sites - so location is included.
    """
    return hashlib.sha1(f"{name}|{lat:.6f}|{lon:.6f}".encode()).hexdigest()[:12]


# --------------------------------------------------------------------------
# Pipeline
# --------------------------------------------------------------------------

def load_raw() -> pd.DataFrame:
    sources = sorted(glob.glob(str(RAW_DIR / "*.xlsx"))) + sorted(glob.glob(str(RAW_DIR / "*.csv")))
    if not sources:
        sys.exit(f"No .xlsx/.csv found in {RAW_DIR}")

    frames = []
    for path in sources:
        if path.endswith(".csv"):
            frame = pd.read_csv(path)
        else:
            frame = pd.concat(pd.read_excel(path, sheet_name=None).values(), ignore_index=True)
        missing = [c for c in REQUIRED_COLUMNS if c not in frame.columns]
        if missing:
            sys.exit(f"{Path(path).name} is missing required columns: {missing}")
        frame["_source"] = Path(path).name
        frames.append(frame)
        print(f"  read {Path(path).name}: {len(frame)} rows")

    return pd.concat(frames, ignore_index=True)


def transform(df: pd.DataFrame) -> tuple[list[dict], dict]:
    report = {"input_rows": len(df), "dropped_missing_coords": 0,
              "dropped_out_of_bounds": 0, "dropped_duplicate": 0}

    df = df.copy()
    df["Latitude"] = pd.to_numeric(df["Latitude"], errors="coerce")
    df["Longitude"] = pd.to_numeric(df["Longitude"], errors="coerce")

    before = len(df)
    df = df.dropna(subset=["Latitude", "Longitude", "Name"])
    report["dropped_missing_coords"] = before - len(df)

    west, south, east, north = INDIA_BBOX
    before = len(df)
    df = df[df.Latitude.between(south, north) & df.Longitude.between(west, east)]
    report["dropped_out_of_bounds"] = before - len(df)

    # Same name at the same coordinates is a true duplicate. Same name at a
    # different location is a distinct site sharing a generic operator name.
    before = len(df)
    df = df.drop_duplicates(subset=["Name", "Latitude", "Longitude"])
    report["dropped_duplicate"] = before - len(df)

    stations = []
    for _, row in df.iterrows():
        operator, confidence, notes = parse_description(row.Description)
        access = parse_access(row.Access)
        vehicle_tags = parse_vehicle_tags(row.Vehicle_Tag)
        lat, lon = float(row.Latitude), float(row.Longitude)

        # Google_Maps_Link is the source of truth for "Open in Maps": for the 166
        # place_id links this opens Google's canonical pin, which is better than a
        # coordinate reconstruction. Markers still plot from Latitude/Longitude —
        # place_id links carry no extractable coordinates, and coordinate links
        # equal the columns exactly (verified: max delta 0.0).
        gmaps_link = str(getattr(row, "Google_Maps_Link", "") or "").strip()
        link_type = str(getattr(row, "Link_Type", "") or "").strip()

        stations.append({
            "id": make_id(str(row.Name), lat, lon),
            "name": str(row.Name).strip(),
            "coordinates": [lon, lat],  # GeoJSON order
            "googleMapsLink": gmaps_link,
            "linkType": link_type,
            "city": str(row.City).strip(),
            "area": str(row.Area).strip(),
            "areaGroup": parse_area_group(row.Area),
            "vehicleTags": vehicle_tags,
            "vehicleTagsConfirmed": bool(vehicle_tags),
            "chargerType": parse_charger_type(row.Category),
            "chargerDetail": str(row.Category).strip(),
            "powerKw": parse_power_kw(row.Category),
            "operator": operator,
            "ownershipModel": parse_ownership_model(row.Ownership),
            "ownershipDetail": str(row.Ownership).strip(),
            "access": access,
            "accessDetail": str(row.Access).strip(),
            "confidence": confidence,
            "notes": notes,
            "flags": derive_flags(row.Access, row.Category, access, notes),
        })

    report["output_rows"] = len(stations)
    return stations, report


def build_meta(stations: list[dict]) -> dict:
    """Everything the UI needs to configure itself. No city, operator or bound is
    hardcoded in the frontend - it all comes from here."""
    def tally(key):
        counts: dict[str, int] = {}
        for s in stations:
            counts[s[key]] = counts.get(s[key], 0) + 1
        return dict(sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])))

    vehicle_counts: dict[str, int] = {"2W": 0, "3W": 0, "4W": 0, "Unconfirmed": 0}
    for s in stations:
        if not s["vehicleTags"]:
            vehicle_counts["Unconfirmed"] += 1
        for tag in s["vehicleTags"]:
            vehicle_counts[tag] += 1

    lons = [s["coordinates"][0] for s in stations]
    lats = [s["coordinates"][1] for s in stations]

    cities = []
    for city in sorted({s["city"] for s in stations}):
        rows = [s for s in stations if s["city"] == city]
        c_lons = [s["coordinates"][0] for s in rows]
        c_lats = [s["coordinates"][1] for s in rows]
        cities.append({
            "name": city,
            "stationCount": len(rows),
            "operatorCount": len({s["operator"] for s in rows}),
            "bounds": [[min(c_lons), min(c_lats)], [max(c_lons), max(c_lats)]],
        })

    flag_counts: dict[str, int] = {}
    for s in stations:
        for flag in s["flags"]:
            flag_counts[flag] = flag_counts.get(flag, 0) + 1

    return {
        "generatedAt": pd.Timestamp.utcnow().isoformat(),
        "totals": {
            "stations": len(stations),
            "operators": len({s["operator"] for s in stations}),
            "cities": len(cities),
            "areas": len({s["areaGroup"] for s in stations}),
        },
        "bounds": [[min(lons), min(lats)], [max(lons), max(lats)]],
        "cities": cities,
        "vehicleCounts": vehicle_counts,
        "operatorCounts": tally("operator"),
        "ownershipCounts": tally("ownershipModel"),
        "chargerTypeCounts": tally("chargerType"),
        "accessCounts": tally("access"),
        "confidenceCounts": tally("confidence"),
        "flagCounts": flag_counts,
    }


def main() -> None:
    print("Yizzy ETL")
    df = load_raw()
    stations, report = transform(df)
    meta = build_meta(stations)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "stations.json").write_text(json.dumps(stations, ensure_ascii=False, separators=(",", ":")))
    (OUT_DIR / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))

    print(f"\n  {report['input_rows']} in -> {report['output_rows']} out")
    for key in ("dropped_missing_coords", "dropped_out_of_bounds", "dropped_duplicate"):
        if report[key]:
            print(f"  dropped ({key.replace('dropped_', '')}): {report[key]}")
    print(f"\n  {meta['totals']['operators']} operators across "
          f"{meta['totals']['cities']} cities, {meta['totals']['areas']} localities")
    print(f"  vehicles: {meta['vehicleCounts']}")
    print(f"  flags:    {meta['flagCounts']}")
    print(f"\n  -> {OUT_DIR/'stations.json'}\n  -> {OUT_DIR/'meta.json'}")


if __name__ == "__main__":
    main()
