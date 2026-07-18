import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Dataset, Station } from '../../lib/data/types';
import { applyFilters, colorKeyFor, useStore } from '../../lib/store';
import {
  MARKER_STROKE_FLAG, MARKER_STROKE_MULTI_DARK, MARKER_STROKE_MULTI_LIGHT,
  OPERATOR_OTHER_COLOR, VEHICLE_COLORS,
  markerGlowOpacity, markerSelectedStroke, markerStroke, operatorColorMap, topOperators,
} from '../../lib/theme';
import { basemapFor } from './basemaps';
import { MapLegend } from './MapLegend';
import { MapStyleControl } from './MapStyleControl';
import { MapTooltip } from './MapTooltip';

const STATION_SRC = 'stations';
const FIT_PADDING = { top: 96, bottom: 64, left: 380, right: 96 };

interface Props {
  dataset: Dataset;
  visible: Station[];
}

export function MapView({ dataset, visible }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [tooltip, setTooltip] = useState<{ station: Station; x: number; y: number } | null>(null);

  const filters = useStore((s) => s.filters);
  const colorMode = useStore((s) => s.colorMode);
  const theme = useStore((s) => s.theme);
  const mapStyle = useStore((s) => s.mapStyle);
  const select = useStore((s) => s.select);
  const selectedId = useStore((s) => s.selectedId);

  const opColors = useMemo(() => operatorColorMap(dataset.meta.operatorCounts), [dataset.meta]);
  const topOps = useMemo(() => new Set(topOperators(dataset.meta.operatorCounts)), [dataset.meta]);
  const byId = useMemo(() => new Map(dataset.stations.map((s) => [s.id, s])), [dataset.stations]);

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: visible.map((s) => ({
        type: 'Feature' as const,
        id: s.id,
        geometry: { type: 'Point' as const, coordinates: s.coordinates },
        properties: {
          id: s.id,
          colorKey: colorKeyFor(s, colorMode, topOps),
          multi: s.vehicleTags.length > 1 ? 1 : 0,
          flagged: s.flags.length > 0 ? 1 : 0,
        },
      })),
    }),
    [visible, colorMode, topOps],
  );

  const colorExpression = useMemo(() => {
    const pairs: string[] =
      colorMode === 'vehicle'
        ? Object.entries(VEHICLE_COLORS).flat()
        : Object.entries(opColors).flat();
    return ['match', ['get', 'colorKey'], ...pairs, OPERATOR_OTHER_COLOR] as unknown as maplibregl.ExpressionSpecification;
  }, [colorMode, opColors]);

  // Latest values the (re)install reads — install fires on load and after every
  // basemap swap, outside React's render, so it pulls from refs.
  const live = useRef({ geojson, colorExpression, theme });
  live.current = { geojson, colorExpression, theme };

  /**
   * (Re)install our sources + layers. Called on first load and after each
   * setStyle (which wipes all non-basemap layers). No clustering: every station
   * is its own circle at every zoom. MapLibre's circle layer is already a
   * GPU-rendered layer, so scaling to tens of thousands of points later is a
   * paint-property/tuning job, not a rewrite. (deck.gl would be the next step
   * only if we outgrow that.)
   */
  const installLayers = (map: maplibregl.Map) => {
    const { theme: t } = live.current;

    if (!map.getSource(STATION_SRC)) {
      map.addSource(STATION_SRC, { type: 'geojson', data: live.current.geojson });
    }
    map.addLayer({
      id: 'point-glow',
      type: 'circle',
      source: STATION_SRC,
      paint: {
        'circle-color': live.current.colorExpression,
        'circle-opacity': markerGlowOpacity(t),
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 6, 16, 20],
        'circle-blur': 0.8,
      },
    });
    map.addLayer({
      id: 'points',
      type: 'circle',
      source: STATION_SRC,
      paint: {
        'circle-color': live.current.colorExpression,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 3.6, 16, 9],
        'circle-stroke-width': [
          'case',
          ['boolean', ['feature-state', 'selected'], false], 3,
          ['==', ['get', 'multi'], 1], 2,
          1.2,
        ],
        'circle-stroke-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false], markerSelectedStroke(t),
          ['==', ['get', 'flagged'], 1], MARKER_STROKE_FLAG,
          ['==', ['get', 'multi'], 1], t === 'light' ? MARKER_STROKE_MULTI_LIGHT : MARKER_STROKE_MULTI_DARK,
          markerStroke(t),
        ],
      },
    });
  };

  // --- Map setup: once. --------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: basemapFor(theme, mapStyle),
      bounds: dataset.meta.bounds as LngLatBoundsLike,
      fitBoundsOptions: { padding: FIT_PADDING },
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    // Persistent handler: `style.load` fires on the initial load AND after every
    // setStyle (theme or satellite switch), which wipes custom layers. Re-adding
    // here — rather than via a per-switch once() — avoids a race when setStyle is
    // handed an inline style object (satellite) that resolves synchronously.
    map.on('style.load', () => { installLayers(map); setReady(true); });

    // Click a station marker to open it; empty map clears the selection.
    map.on('click', (e) => {
      const pts = map.queryRenderedFeatures(e.point, { layers: ['points'] });
      if (pts.length) { select(pts[0].properties!.id as string); return; }
      select(null);
    });

    map.on('mouseenter', 'points', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'points', () => { map.getCanvas().style.cursor = ''; });

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Basemap swap on theme / style change ------------------------------
  const styleKey = `${theme}:${mapStyle}`;
  const appliedStyle = useRef(styleKey);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || appliedStyle.current === styleKey) return;
    appliedStyle.current = styleKey;

    setReady(false);
    // The persistent 'style.load' handler (registered at map creation) re-installs
    // our layers once the new basemap is parsed.
    map.setStyle(basemapFor(theme, mapStyle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleKey, ready]);

  // --- Hover tooltip -----------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const onMove = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      const station = feature && byId.get(feature.properties!.id as string);
      if (station) setTooltip({ station, x: e.point.x, y: e.point.y });
    };
    const onLeave = () => setTooltip(null);
    map.on('mousemove', 'points', onMove);
    map.on('mouseleave', 'points', onLeave);
    return () => { map.off('mousemove', 'points', onMove); map.off('mouseleave', 'points', onLeave); };
  }, [ready, byId]);

  // --- Push station data -------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource(STATION_SRC) as GeoJSONSource | undefined)?.setData(geojson);
  }, [geojson, ready]);

  // --- Push color mode ---------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setPaintProperty('points', 'circle-color', colorExpression);
    map.setPaintProperty('point-glow', 'circle-color', colorExpression);
  }, [colorExpression, ready]);

  // --- Reframe when the visible city/search changes ----------------------
  const cityKey = filters.cities.join('~');
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !visible.length) return;
    const bounds = new maplibregl.LngLatBounds();
    for (const s of visible) bounds.extend(s.coordinates);
    map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: 13, duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityKey, ready]);

  // --- Selected station: fly + highlight ---------------------------------
  const prevSelected = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (prevSelected.current) {
      map.setFeatureState({ source: STATION_SRC, id: prevSelected.current }, { selected: false });
    }
    if (selectedId) {
      map.setFeatureState({ source: STATION_SRC, id: selectedId }, { selected: true });
      const station = byId.get(selectedId);
      if (station) {
        map.easeTo({ center: station.coordinates, zoom: Math.max(map.getZoom(), 14), offset: [-160, 0], duration: 800 });
      }
    }
    prevSelected.current = selectedId;
  }, [selectedId, ready, byId]);

  return (
    <div className="map-root">
      <div ref={containerRef} className="map-canvas" />
      {tooltip && <MapTooltip station={tooltip.station} x={tooltip.x} y={tooltip.y} />}
      <div className="map-controls-br">
        <MapStyleControl />
        <MapLegend meta={dataset.meta} />
      </div>
      {!visible.length && (
        <div className="map-empty">
          <strong>No stations match these filters</strong>
          <span>Try removing a facet or clearing the search.</span>
        </div>
      )}
    </div>
  );
}
