import type { StyleSpecification } from 'maplibre-gl';
import type { MapStyle, Theme } from '../../lib/store';

/**
 * Basemap selection is theme × style.
 *
 * Roadmap uses CARTO vector styles (no API key, no per-load billing): Positron
 * for light, Dark Matter for dark. Satellite uses ESRI World Imagery raster
 * tiles (also keyless) with a translucent reference-label overlay for street
 * legibility, and is the same imagery in either theme.
 */

const CARTO_POSITRON = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const ESRI_IMAGERY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_REFERENCE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

const ESRI_ATTRIB =
  'Imagery © Esri, Maxar, Earthstar Geographics';

const satelliteStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/fonts/{fontstack}/{range}.pbf',
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: [ESRI_IMAGERY],
      tileSize: 256,
      attribution: ESRI_ATTRIB,
      maxzoom: 19,
    },
    'esri-reference': {
      type: 'raster',
      tiles: [ESRI_REFERENCE],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'imagery', type: 'raster', source: 'esri-imagery' },
    { id: 'reference', type: 'raster', source: 'esri-reference', paint: { 'raster-opacity': 0.85 } },
  ],
};

/** A URL (vector roadmap) or an inline StyleSpecification (raster satellite). */
export function basemapFor(theme: Theme, style: MapStyle): string | StyleSpecification {
  if (style === 'satellite') return satelliteStyle;
  return theme === 'dark' ? CARTO_DARK : CARTO_POSITRON;
}
