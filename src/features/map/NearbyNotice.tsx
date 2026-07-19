import { useMemo } from 'react';
import type { Station } from '../../lib/data/types';
import { useStore } from '../../lib/store';
import { OUT_OF_COVERAGE_KM, formatDistance, nearestStation } from '../../lib/geo';

interface Props {
  stations: Station[];
  /** Fly the map to a station — used to jump to the nearest one. */
  onGoTo: (station: Station) => void;
}

/**
 * What the visitor's location actually means for them.
 *
 * Coverage is currently two cities, so a large share of visitors will be
 * nowhere near a station. Saying "nearest is 710 km away in Hyderabad" is far
 * more useful than dropping them on an empty map and letting them assume the
 * product is broken.
 */
export function NearbyNotice({ stations, onGoTo }: Props) {
  const userLocation = useStore((s) => s.userLocation);
  const geoStatus = useStore((s) => s.geoStatus);

  const nearest = useMemo(
    () => (userLocation ? nearestStation(userLocation.coordinates, stations) : null),
    [userLocation, stations],
  );

  // A known position always wins: if we have coordinates, show what they mean,
  // whatever the permission flag happens to say.
  if (!userLocation || !nearest) {
    if (geoStatus === 'denied' || geoStatus === 'unavailable') {
      return (
        <div className="nearby nearby--muted">
          <PinOffIcon />
          <span>
            {geoStatus === 'denied'
              ? 'Location off — showing all cities.'
              : "Couldn't get your location — showing all cities."}
            <em>Use the locate button to find stations near you.</em>
          </span>
        </div>
      );
    }
    return null;
  }

  const far = nearest.km > OUT_OF_COVERAGE_KM;

  return (
    <div className={`nearby ${far ? 'nearby--far' : 'nearby--near'}`}>
      <LocateIcon />
      <span>
        {far ? (
          <>
            You're outside our current coverage.
            <em>
              Nearest station is {formatDistance(nearest.km)} away in {nearest.station.city}.
            </em>
          </>
        ) : (
          <>
            Nearest station is {formatDistance(nearest.km)} away
            <em>{nearest.station.name} · {nearest.station.area}</em>
          </>
        )}
      </span>
      <button className="nearby__go" onClick={() => onGoTo(nearest.station)}>
        Show it
      </button>
    </div>
  );
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <circle cx="8" cy="8" r="3" fill="currentColor" />
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 0.5 V2.5 M8 13.5 V15.5 M0.5 8 H2.5 M13.5 8 H15.5"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PinOffIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path d="M12.5 6.6 C12.5 10, 8 14.5, 8 14.5 S3.5 10, 3.5 6.6 a4.5 4.5 0 0 1 7.7-3.2"
        fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M2 2 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
