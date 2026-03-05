/**
 * Converts Natural Earth GeoJSON into a compact TypeScript module
 * with polygon data and a latitude-bucketed spatial index.
 *
 * Usage: node scripts/build-land-data.js
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '../src/data/ne_110m_land.json');
const OUTPUT = path.join(__dirname, '../src/data/landPolygons.ts');

const geojson = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

// Extract all polygon rings (outer rings only — skip holes for simplicity)
const polygons = [];
// Also track which polygons are "Europe" for highlighting
const EUROPE_BBOX = { latMin: 35, latMax: 72, lonMin: -25, lonMax: 60 };

for (const feature of geojson.features) {
  const { type, coordinates } = feature.geometry;
  if (type === 'Polygon') {
    // First ring is the outer boundary
    polygons.push(coordinates[0].map(([lon, lat]) => [lat, lon]));
  } else if (type === 'MultiPolygon') {
    for (const poly of coordinates) {
      polygons.push(poly[0].map(([lon, lat]) => [lat, lon]));
    }
  }
}

// Determine which polygons overlap the Europe bounding box
const europeIndices = new Set();
for (let i = 0; i < polygons.length; i++) {
  const ring = polygons[i];
  let hasPointInEurope = false;
  for (const [lat, lon] of ring) {
    if (lat >= EUROPE_BBOX.latMin && lat <= EUROPE_BBOX.latMax &&
        lon >= EUROPE_BBOX.lonMin && lon <= EUROPE_BBOX.lonMax) {
      hasPointInEurope = true;
      break;
    }
  }
  if (hasPointInEurope) europeIndices.add(i);
}

// Build latitude-bucketed spatial index
// For each 5° latitude band, list polygon indices whose bbox overlaps that band
const LAT_BUCKET_SIZE = 5;
const buckets = {}; // key: bucket index, value: array of polygon indices

for (let i = 0; i < polygons.length; i++) {
  const ring = polygons[i];
  let minLat = 90, maxLat = -90;
  for (const [lat] of ring) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const bucketStart = Math.floor(minLat / LAT_BUCKET_SIZE);
  const bucketEnd = Math.floor(maxLat / LAT_BUCKET_SIZE);
  for (let b = bucketStart; b <= bucketEnd; b++) {
    if (!buckets[b]) buckets[b] = [];
    buckets[b].push(i);
  }
}

// Round coordinates to 2 decimal places to save space
function roundRing(ring) {
  return ring.map(([lat, lon]) => [
    Math.round(lat * 100) / 100,
    Math.round(lon * 100) / 100
  ]);
}

// Generate TypeScript output
let ts = `// Auto-generated from Natural Earth ne_110m_land.json
// Do not edit manually. Run: node scripts/build-land-data.js

// Each polygon is an array of [lat, lon] pairs (outer ring only)
export const LAND_POLYGONS: readonly (readonly [number, number])[][] = [\n`;

for (let i = 0; i < polygons.length; i++) {
  const rounded = roundRing(polygons[i]);
  ts += `  ${JSON.stringify(rounded)},\n`;
}
ts += `];\n\n`;

// Europe polygon indices
ts += `// Polygon indices that overlap the European bounding box\n`;
ts += `export const EUROPE_POLYGON_INDICES: ReadonlySet<number> = new Set(${JSON.stringify([...europeIndices])});\n\n`;

// Spatial index
ts += `// Latitude-bucketed spatial index (bucket size: ${LAT_BUCKET_SIZE}°)\n`;
ts += `// Key: floor(lat / ${LAT_BUCKET_SIZE}), Value: polygon indices\n`;
ts += `export const LAT_BUCKET_SIZE = ${LAT_BUCKET_SIZE};\n`;
ts += `export const SPATIAL_INDEX: Readonly<Record<number, readonly number[]>> = {\n`;
const sortedKeys = Object.keys(buckets).map(Number).sort((a, b) => a - b);
for (const key of sortedKeys) {
  ts += `  [${key}]: ${JSON.stringify(buckets[key])},\n`;
}
ts += `};\n`;

fs.writeFileSync(OUTPUT, ts, 'utf-8');

const stats = fs.statSync(OUTPUT);
console.log(`Generated ${OUTPUT}`);
console.log(`  Polygons: ${polygons.length}`);
console.log(`  Europe polygons: ${europeIndices.size}`);
console.log(`  Spatial index buckets: ${sortedKeys.length}`);
console.log(`  File size: ${(stats.size / 1024).toFixed(1)} KB`);
