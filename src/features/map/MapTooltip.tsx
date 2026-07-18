import type { Station } from '../../lib/data/types';
import { VEHICLE_LABELS } from '../../lib/data/types';
import { VEHICLE_COLORS, dominantVehicle } from '../../lib/theme';

interface Props {
  station: Station;
  x: number;
  y: number;
}

export function MapTooltip({ station, x, y }: Props) {
  const dominant = dominantVehicle(station.vehicleTags);

  return (
    <div className="map-tooltip" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <div className="map-tooltip__inner">
        <div className="map-tooltip__name">{station.name}</div>
        <div className="map-tooltip__meta">
          <span className="dot" style={{ background: VEHICLE_COLORS[dominant] }} />
          {station.vehicleTags.length
            ? station.vehicleTags.map((t) => VEHICLE_LABELS[t]).join(' · ')
            : 'Vehicle type unconfirmed'}
        </div>
        <div className="map-tooltip__rows">
          <span>{station.operator}</span>
          <span className="sep">·</span>
          <span>{station.chargerType}</span>
        </div>
        <div className="map-tooltip__area">{station.area}</div>
      </div>
    </div>
  );
}
