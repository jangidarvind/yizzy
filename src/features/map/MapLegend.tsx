import type { Meta } from '../../lib/data/types';
import { VEHICLE_LABELS } from '../../lib/data/types';
import { useStore } from '../../lib/store';
import {
  OPERATOR_OTHER_COLOR, TOP_OPERATOR_COUNT, VEHICLE_COLORS, operatorColorMap, topOperators,
} from '../../lib/theme';

interface Props {
  meta: Meta;
}

/**
 * Doubles as the colour-mode switch. "Colour by operator" is the view that makes
 * network fragmentation legible at a glance, so it's one click from the map,
 * not buried in the filter rail.
 */
export function MapLegend({ meta }: Props) {
  const colorMode = useStore((s) => s.colorMode);
  const setColorMode = useStore((s) => s.setColorMode);

  const opColors = operatorColorMap(meta.operatorCounts);
  const tops = topOperators(meta.operatorCounts);
  const tailCount = meta.totals.operators - tops.length;

  return (
    <div className="legend">
      <div className="legend__switch" role="tablist" aria-label="Marker colour mode">
        {(['vehicle', 'operator'] as const).map((mode) => (
          <button
            key={mode}
            role="tab"
            aria-selected={colorMode === mode}
            className={colorMode === mode ? 'is-active' : ''}
            onClick={() => setColorMode(mode)}
          >
            {mode === 'vehicle' ? 'Vehicle type' : 'Operator'}
          </button>
        ))}
      </div>

      <div className="legend__items">
        {colorMode === 'vehicle'
          ? (Object.keys(VEHICLE_COLORS) as (keyof typeof VEHICLE_COLORS)[]).map((tag) => (
              <div className="legend__item" key={tag}>
                <span className="dot" style={{ background: VEHICLE_COLORS[tag] }} />
                <span className="legend__label">{VEHICLE_LABELS[tag]}</span>
                <span className="legend__count">{meta.vehicleCounts[tag] ?? 0}</span>
              </div>
            ))
          : (
            <>
              {tops.map((op) => (
                <div className="legend__item" key={op}>
                  <span className="dot" style={{ background: opColors[op] }} />
                  <span className="legend__label" title={op}>{op}</span>
                  <span className="legend__count">{meta.operatorCounts[op]}</span>
                </div>
              ))}
              {tailCount > 0 && (
                <div className="legend__item">
                  <span className="dot" style={{ background: OPERATOR_OTHER_COLOR }} />
                  <span className="legend__label">{tailCount} smaller networks</span>
                </div>
              )}
              <p className="legend__note">
                Top {TOP_OPERATOR_COUNT} of {meta.totals.operators} operators shown by colour.
              </p>
            </>
          )}
      </div>

      <div className="legend__key">
        <div><span className="key-ring" /> Serves multiple vehicle types</div>
        <div><span className="key-ring key-ring--flag" /> Flagged in verification</div>
      </div>
    </div>
  );
}
