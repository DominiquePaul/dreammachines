'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  LAND_POLYGONS,
  SPATIAL_INDEX,
  LAT_BUCKET_SIZE,
} from '@/data/landPolygons';

const COLS = 160;
const ROWS = 80;
const SHADE = '.:-=+*#%@';

// View centered on Europe (~50°N, 15°E)
const TILT_X = 50 * Math.PI / 180;
const CENTER_LON = 15 * Math.PI / 180;
const ROTATION_SPEED = 0.08; // radians per second
const TILT_RETURN_SPEED = 0.4; // how slowly tilt converges back (lower = slower)

// ── Ray-casting point-in-polygon ────────────────────────────────────
// Returns true if point (lat, lon) is inside the polygon ring
function pointInRing(lat: number, lon: number, ring: readonly (readonly [number, number])[]): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const yi = ring[i][0], xi = ring[i][1];
    const yj = ring[j][0], xj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// ── Europe geographic bounds ────────────────────────────────────────
// Simple bounding box check for whether a land point is in Europe
function isInEurope(lat: number, lon: number): boolean {
  // Main continental Europe + British Isles
  if (lat >= 36 && lat <= 71 && lon >= -11 && lon <= 40) return true;
  // Iberian Peninsula western edge
  if (lat >= 36 && lat <= 44 && lon >= -10 && lon <= 0) return true;
  // Scandinavia / Finland extending east
  if (lat >= 55 && lat <= 71 && lon >= 5 && lon <= 32) return true;
  // Iceland
  if (lat >= 63 && lat <= 67 && lon >= -25 && lon <= -13) return true;
  // Eastern Europe / Baltics / Ukraine
  if (lat >= 44 && lat <= 60 && lon >= 20 && lon <= 45) return true;
  // European Russia
  if (lat >= 50 && lat <= 70 && lon >= 30 && lon <= 60) return true;
  return false;
}

// ── Land lookup with spatial index ──────────────────────────────────
// Returns: 0 = ocean, 1 = other land, 2 = Europe
function classifyPoint(lat: number, lon: number): number {
  const bucket = Math.floor(lat / LAT_BUCKET_SIZE);
  const candidates = SPATIAL_INDEX[bucket];
  if (!candidates) return 0;

  for (let c = 0; c < candidates.length; c++) {
    const idx = candidates[c];
    if (pointInRing(lat, lon, LAND_POLYGONS[idx])) {
      return isInEurope(lat, lon) ? 2 : 1;
    }
  }
  return 0;
}

// ── Precompute a land classification grid ───────────────────────────
// Since polygons don't change, we can cache classification for any
// (lat, lon) we've seen. But for a rotating globe we need to check
// different points each frame, so instead we just call classifyPoint
// directly — it's fast enough with the spatial index.

export default function AsciiEurope() {
  const preRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  // Rotation angles (Y = longitude rotation, X = tilt/latitude)
  const yAngleRef = useRef(CENTER_LON);
  const xAngleRef = useRef(TILT_X);
  const lastTimeRef = useRef(0);

  // Drag state
  const draggingRef = useRef(false);
  const autoRotRef = useRef(true);
  const returningTiltRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const yAngleAtDragStartRef = useRef(0);
  const xAngleAtDragStartRef = useRef(0);
  const dragSensitivity = 0.003;

  const startDrag = useCallback((clientX: number, clientY: number) => {
    draggingRef.current = true;
    autoRotRef.current = false;
    returningTiltRef.current = false;
    dragStartXRef.current = clientX;
    dragStartYRef.current = clientY;
    yAngleAtDragStartRef.current = yAngleRef.current;
    xAngleAtDragStartRef.current = xAngleRef.current;
  }, []);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    const dx = clientX - dragStartXRef.current;
    const dy = clientY - dragStartYRef.current;
    // Dragging left → globe surface moves left (decrease Y angle)
    yAngleRef.current = yAngleAtDragStartRef.current - dx * dragSensitivity;
    // Dragging down → globe surface moves down (increase X angle)
    const newX = xAngleAtDragStartRef.current + dy * dragSensitivity;
    xAngleRef.current = Math.max(-80 * Math.PI / 180, Math.min(80 * Math.PI / 180, newX));
  }, []);

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    // Resume rotation and tilt return immediately
    autoRotRef.current = true;
    returningTiltRef.current = true;
    lastTimeRef.current = performance.now();
  }, []);

  const render = useCallback(() => {
    if (!preRef.current) return;

    const now = performance.now();
    const dt = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = now;

    // Horizontal auto-rotation (resumes after 2s delay)
    if (autoRotRef.current && !draggingRef.current) {
      yAngleRef.current += dt * ROTATION_SPEED;
    }

    // Tilt return starts immediately on drag end
    if (returningTiltRef.current && !draggingRef.current) {
      const xDiff = TILT_X - xAngleRef.current;
      if (Math.abs(xDiff) > 0.001) {
        xAngleRef.current += xDiff * Math.min(1, dt * TILT_RETURN_SPEED);
      } else {
        xAngleRef.current = TILT_X;
        returningTiltRef.current = false;
      }
    }

    const yAngle = yAngleRef.current;
    const xAngle = xAngleRef.current;
    const cosY = Math.cos(yAngle);
    const sinY = Math.sin(yAngle);
    const cosX = Math.cos(xAngle);
    const sinX = Math.sin(xAngle);

    const lines: string[] = [];
    const R = ROWS / 2;

    for (let j = 0; j < ROWS; j++) {
      let row = '';
      for (let i = 0; i < COLS; i++) {
        const x = (i - COLS / 2) / R * 0.5;
        const y = (j - R) / R;
        const d2 = x * x + y * y;

        if (d2 >= 1) {
          row += ' ';
          continue;
        }

        const z = Math.sqrt(1 - d2);

        // Tilt around X axis (dynamic)
        const x1 = x;
        const y1 = y * cosX - z * sinX;
        const z1 = y * sinX + z * cosX;

        // Rotate around Y axis
        const rx = x1 * cosY + z1 * sinY;
        const ry = y1;
        const rz = -x1 * sinY + z1 * cosY;

        const lat = Math.asin(Math.max(-1, Math.min(1, -ry))) * 57.2958;
        const lon = Math.atan2(rx, rz) * 57.2958;

        // Diffuse lighting from front-right-top
        const light = Math.max(0, z * 0.55 + x * 0.2 - y * 0.25);

        const classification = classifyPoint(lat, lon);

        if (classification === 2) {
          // Europe: full shading range
          const idx = Math.min(SHADE.length - 1, Math.floor(light * SHADE.length));
          row += SHADE[idx];
        } else if (classification === 1) {
          // Other land: lighter shading
          const idx = Math.min(3, Math.floor(light * 4));
          row += SHADE[idx];
        } else {
          row += ' ';
        }
      }
      lines.push(row);
    }

    preRef.current.textContent = lines.join('\n');
    rafRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => { e.preventDefault(); startDrag(e.clientX, e.clientY); };
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onMouseUp = () => endDrag();
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => endDrag();

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [render, startDrag, moveDrag, endDrag]);

  return (
    <div
      className="overflow-hidden select-none"
      style={{
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        marginTop: '-5%',
        maxHeight: '70vh',
        cursor: 'default',
        touchAction: 'none',
      }}
    >
      <div
        ref={containerRef}
        className="flex justify-center"
        style={{
          marginTop: '-18%',
          cursor: 'default',
        }}
      >
        <pre
          ref={preRef}
          className="text-[3.5px] sm:text-[4.5px] md:text-[5.5px] leading-[1.05] sm:leading-[1.1] text-navy pointer-events-none"
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            cursor: 'default',
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
