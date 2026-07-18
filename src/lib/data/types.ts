/**
 * The normalized data contract, produced by scripts/etl/build_dataset.py.
 *
 * Every field pairs a clean enum (filterable) with the raw source string
 * (displayable), because each source column carries a real category behind a
 * free-text qualifier we don't want to lose.
 */

export type VehicleTag = '2W' | '3W' | '4W';
export type ChargerType = 'AC' | 'DC Fast' | 'AC+DC' | 'Battery Swap' | 'Unknown';
export type OwnershipModel =
  | 'Private Network'
  | 'OEM Network'
  | 'PSU / Oil Company'
  | 'Utility / Semi-Public'
  | 'Public Authority'
  | 'Government'
  | 'Unknown';
export type AccessLevel = 'Public' | 'Semi-public' | 'Restricted' | 'Not available' | 'Unknown';
export type Confidence = 'High' | 'Medium' | 'Low';
export type StationFlag = 'closed' | 'falsely-listed-public' | 'reported-nonfunctional';

export interface Station {
  id: string;
  name: string;
  /** GeoJSON order: [longitude, latitude] */
  coordinates: [number, number];
  /**
   * The original Google Maps URL, used verbatim for "Open in Maps". For
   * `exact place` links this opens Google's canonical pin for the business,
   * which beats a coordinate reconstruction. Markers still plot from
   * `coordinates` — see the ETL for why.
   */
  googleMapsLink: string;
  /** 'exact place' (place_id link) | 'coordinate' (lat,lon query link). */
  linkType: string;
  city: string;
  area: string;
  /** Compound localities rolled up to a canonical parent for grouping. */
  areaGroup: string;
  /** Multi-valued: a station may serve several classes. Empty = unconfirmed. */
  vehicleTags: VehicleTag[];
  vehicleTagsConfirmed: boolean;
  chargerType: ChargerType;
  chargerDetail: string;
  powerKw: number | null;
  /** The fleet network running the site. Parsed out of the source Description. */
  operator: string;
  ownershipModel: OwnershipModel;
  ownershipDetail: string;
  access: AccessLevel;
  accessDetail: string;
  confidence: Confidence;
  notes: string;
  flags: StationFlag[];
}

export interface CityMeta {
  name: string;
  stationCount: number;
  operatorCount: number;
  bounds: [[number, number], [number, number]];
}

export interface Meta {
  generatedAt: string;
  totals: { stations: number; operators: number; cities: number; areas: number };
  bounds: [[number, number], [number, number]];
  cities: CityMeta[];
  vehicleCounts: Record<string, number>;
  operatorCounts: Record<string, number>;
  ownershipCounts: Record<string, number>;
  chargerTypeCounts: Record<string, number>;
  accessCounts: Record<string, number>;
  confidenceCounts: Record<string, number>;
  flagCounts: Record<string, number>;
}

export interface Dataset {
  stations: Station[];
  meta: Meta;
}

/** Display labels. The source encodes vehicle class as 2W/3W/4W; users read bikes/autos/cabs. */
export const VEHICLE_LABELS: Record<VehicleTag | 'Unconfirmed', string> = {
  '2W': 'EV Bike',
  '3W': 'EV Auto',
  '4W': 'EV Cab',
  Unconfirmed: 'Unconfirmed',
};
