'use client';

import { useEffect, useRef, useCallback } from 'react';

const COLS = 90;
const ROWS = 90;

// View centered on Europe (~50°N, 15°E) - same perspective as AsciiEurope
const TILT_X = 50 * Math.PI / 180;
const CENTER_LON = 15 * Math.PI / 180;
const SWING = 12 * Math.PI / 180;
const SPEED = 0.006;

const COS_TILT = Math.cos(TILT_X);
const SIN_TILT = Math.sin(TILT_X);

// Detailed Europe bounding boxes [latMin, latMax, lonMin, lonMax]
const EUROPE: readonly [number, number, number, number][] = [
  // Iceland
  [63, 66.5, -24, -13],
  // British Isles
  [50, 52, -5.5, 2], [52, 54, -5, 0], [54, 55.5, -3.5, -0.5],
  [55.5, 58, -6, -1.5], [56, 58.5, -7.5, -4.5],
  // Ireland
  [51.5, 55.5, -10.5, -6],
  // Scandinavia — Norway
  [58, 62, 4, 12], [62, 66, 5, 16],
  // Scandinavia — Sweden/Norway/Finland belt
  [56, 61, 11, 20], [61, 66, 14, 24], [66, 69, 15, 26], [69, 71.5, 18, 31],
  // Finland
  [60, 65, 21, 30], [65, 68, 24, 30], [68, 70, 26, 30],
  // Denmark
  [54.5, 57.5, 8, 13],
  // Iberian Peninsula
  [36, 38, -9, -3], [38, 40, -9.5, -1], [40, 43.5, -9, 0],
  [38, 43, -1, 3], [37, 40, -3, 0],
  // France
  [43, 46, -2, 7], [46, 49, -5, 8], [48.5, 49.5, -5, -1], [49, 51, -2, 4],
  // Benelux
  [49.5, 51.5, 3, 7], [51.5, 53.5, 3.5, 7],
  // Germany
  [47, 50, 6, 14], [50, 52.5, 6, 15], [52.5, 54.5, 9, 15], [54, 55, 8.5, 12],
  // Switzerland & Austria
  [46, 48, 6, 10.5], [46.5, 48.5, 10, 17],
  // Italy
  [44, 46.5, 7, 14], [42, 44, 10, 15], [40, 42.5, 12, 17],
  [38, 40, 15, 19], [37, 39, 15.5, 17.5],
  [37, 38.5, 12.5, 16],  // Sicily
  [39, 41.5, 8, 10],      // Sardinia
  [41.5, 43, 8.5, 10],    // Corsica
  // Poland
  [49, 52, 14, 24], [52, 54.5, 14, 24],
  // Czech & Slovakia
  [48.5, 51, 12, 22],
  // Hungary
  [45.5, 48.5, 16, 23],
  // Romania
  [43.5, 48, 22, 30],
  // Bulgaria
  [41.5, 44, 22, 29],
  // Balkans
  [45, 47, 13, 17], [43, 46, 14, 20], [42, 46, 19, 23],
  [40.5, 43, 19, 21.5], [41, 42, 20.5, 23],
  // Greece
  [38, 42, 20, 26], [36.5, 38.5, 21, 25], [35, 36, 23, 26.5],
  // Turkey (European part)
  [40, 42, 26, 30],
  // Baltic States
  [53.5, 56, 20.5, 26.5], [56, 58, 21, 28.5], [57.5, 59.5, 22, 28],
  // Belarus
  [51, 56, 23, 33],
  // Ukraine
  [44, 48, 22, 40], [48, 52.5, 22, 40],
  // European Russia
  [52, 58, 30, 50], [58, 64, 28, 55], [64, 69, 30, 60],
];

// Surrounding land for context
const CONTEXT_LAND: readonly [number, number, number, number][] = [
  // North Africa
  [30, 37, -17, 11], [27, 37, 11, 33], [20, 30, -17, 33],
  // Middle East
  [31, 37, 33, 55], [36, 42, 36, 45],
  // Greenland
  [60, 84, -55, -18],
  // North America (east coast)
  [40, 55, -80, -55],
  // Russia/Asia
  [55, 75, 55, 100],
];

function isEurope(lat: number, lon: number): boolean {
  for (let k = 0; k < EUROPE.length; k++) {
    const r = EUROPE[k];
    if (lat >= r[0] && lat <= r[1] && lon >= r[2] && lon <= r[3]) return true;
  }
  return false;
}

function isContextLand(lat: number, lon: number): boolean {
  for (let k = 0; k < CONTEXT_LAND.length; k++) {
    const r = CONTEXT_LAND[k];
    if (lat >= r[0] && lat <= r[1] && lon >= r[2] && lon <= r[3]) return true;
  }
  return false;
}

export default function AsciiGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const rafRef = useRef(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;

    if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, displayW, displayH);

    const t = timeRef.current;

    // Y-axis rotation: gentle oscillation around Europe's center longitude
    const yAngle = CENTER_LON + SWING * Math.sin(t * SPEED);
    const cosY = Math.cos(yAngle);
    const sinY = Math.sin(yAngle);

    // The globe fills the canvas, centered
    const cx = displayW / 2;
    const cy = displayH / 2;
    const radius = Math.min(displayW, displayH) / 2;

    // Dot grid spacing
    const stepX = displayW / COLS;
    const stepY = displayH / ROWS;
    const dotRadius = Math.max(1.2, Math.min(stepX, stepY) * 0.28);

    const COLOR_EUROPE = '#00288E';
    const COLOR_CONTEXT = '#00288E';
    const COLOR_GRID = '#00288E';

    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const px = stepX * (i + 0.5);
        const py = stepY * (j + 0.5);

        // Map pixel to sphere coordinates
        const nx = (px - cx) / radius;
        const ny = (py - cy) / radius;
        const d2 = nx * nx + ny * ny;

        if (d2 >= 1) continue;

        const nz = Math.sqrt(1 - d2);

        // Step 1: Tilt around X axis (center view on latitude ~50°N)
        const x1 = nx;
        const y1 = ny * COS_TILT - nz * SIN_TILT;
        const z1 = ny * SIN_TILT + nz * COS_TILT;

        // Step 2: Rotate around Y axis (longitude centering + oscillation)
        const rx = x1 * cosY + z1 * sinY;
        const ry = y1;
        const rz = -x1 * sinY + z1 * cosY;

        // Convert to geographic coordinates
        const lat = Math.asin(Math.max(-1, Math.min(1, -ry))) * 57.2958;
        const lon = Math.atan2(rx, rz) * 57.2958;

        if (isEurope(lat, lon)) {
          // Europe: prominent dots
          ctx.fillStyle = COLOR_EUROPE;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(px, py, dotRadius * 1.1, 0, Math.PI * 2);
          ctx.fill();
        } else if (isContextLand(lat, lon)) {
          // Context land: smaller, lighter dots
          ctx.fillStyle = COLOR_CONTEXT;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(px, py, dotRadius * 0.85, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Ocean: subtle grid dots
          const onLatGrid = Math.abs(lat % 20) < 2.5;
          const onLonGrid = Math.abs(lon % 20) < 2.5;
          if (onLatGrid || onLonGrid) {
            ctx.fillStyle = COLOR_GRID;
            ctx.globalAlpha = 0.12;
            ctx.beginPath();
            ctx.arc(px, py, dotRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.globalAlpha = 1;

    timeRef.current += 1;
    rafRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  return (
    <div className="flex justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full select-none"
        style={{ aspectRatio: '1 / 1', maxWidth: '910px' }}
        aria-hidden="true"
      />
    </div>
  );
}
