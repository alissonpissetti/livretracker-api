import { haversineMeters } from '../common/geo.util';

type CoordinatePoint = {
  latitude: number;
  longitude: number;
};

type LatLng = { lat: number; lng: number };

const MIN_LATERAL_OFFSET_M = 50;
const MIN_ANCHOR_SEGMENT_M = 70;
const MAX_ANCHOR_SEGMENT_M = 500;
const MIN_TAIL_LATERAL_M = 45;
const MIN_TAIL_AHEAD_M = 12;
const MAX_ANCHOR_LOOKBACK = 12;
const MIN_LEG_M = 25;

function toLatLng(point: CoordinatePoint): LatLng {
  return { lat: point.latitude, lng: point.longitude };
}

function metersPerDegree(lat: number): { lat: number; lng: number } {
  return {
    lat: 110_540,
    lng: 111_320 * Math.cos((lat * Math.PI) / 180),
  };
}

function perpendicularDistanceToSegmentM(
  point: LatLng,
  start: LatLng,
  end: LatLng,
): number {
  const midLat = (start.lat + end.lat + point.lat) / 3;
  const scale = metersPerDegree(midLat);

  const ex = (end.lng - start.lng) * scale.lng;
  const ey = (end.lat - start.lat) * scale.lat;
  const px = (point.lng - start.lng) * scale.lng;
  const py = (point.lat - start.lat) * scale.lat;

  const segLen = Math.hypot(ex, ey);
  if (segLen < 1) {
    return Math.hypot(px, py);
  }

  return Math.abs(ex * py - ey * px) / segLen;
}

function isAheadOnTravelVector(
  anchorPrev: CoordinatePoint,
  anchorCurr: CoordinatePoint,
  suspect: CoordinatePoint,
): boolean {
  const midLat = (anchorPrev.latitude + anchorCurr.latitude + suspect.latitude) / 3;
  const scale = metersPerDegree(midLat);
  const ex = (anchorCurr.longitude - anchorPrev.longitude) * scale.lng;
  const ey = (anchorCurr.latitude - anchorPrev.latitude) * scale.lat;
  const sx = (suspect.longitude - anchorCurr.longitude) * scale.lng;
  const sy = (suspect.latitude - anchorCurr.latitude) * scale.lat;
  const forward = ex * sx + ey * sy;
  const segLen = Math.hypot(ex, ey);
  if (segLen < 1) {
    return false;
  }
  return forward / segLen >= MIN_TAIL_AHEAD_M;
}

function isTrailingCorridorOutlier(
  anchorPrev: CoordinatePoint,
  anchorCurr: CoordinatePoint,
  suspect: CoordinatePoint,
): boolean {
  const lateral = perpendicularDistanceToSegmentM(
    toLatLng(suspect),
    toLatLng(anchorPrev),
    toLatLng(anchorCurr),
  );
  if (lateral < MIN_TAIL_LATERAL_M) {
    return false;
  }

  const dAnchorCurr = haversineMeters(
    anchorPrev.latitude,
    anchorPrev.longitude,
    anchorCurr.latitude,
    anchorCurr.longitude,
  );
  const dCurrSuspect = haversineMeters(
    anchorCurr.latitude,
    anchorCurr.longitude,
    suspect.latitude,
    suspect.longitude,
  );
  const dAnchorSuspect = haversineMeters(
    anchorPrev.latitude,
    anchorPrev.longitude,
    suspect.latitude,
    suspect.longitude,
  );

  if (dCurrSuspect < MIN_LEG_M) {
    return false;
  }
  if (!isAheadOnTravelVector(anchorPrev, anchorCurr, suspect)) {
    return false;
  }

  const detourRatio =
    (dAnchorCurr + dCurrSuspect) / Math.max(dAnchorSuspect, 1);

  return detourRatio >= 1.12 || lateral >= MIN_LATERAL_OFFSET_M;
}

function findAnchorBefore(
  points: CoordinatePoint[],
  beforeIndex: number,
  invalidIndices: Set<number>,
): { prevIndex: number; currIndex: number } | null {
  const start = Math.max(1, beforeIndex - MAX_ANCHOR_LOOKBACK);
  for (let currIndex = beforeIndex; currIndex >= start; currIndex -= 1) {
    if (invalidIndices.has(currIndex)) {
      continue;
    }
    const prevIndex = currIndex - 1;
    if (invalidIndices.has(prevIndex)) {
      continue;
    }
    const distanceM = haversineMeters(
      points[prevIndex].latitude,
      points[prevIndex].longitude,
      points[currIndex].latitude,
      points[currIndex].longitude,
    );
    if (distanceM >= MIN_ANCHOR_SEGMENT_M && distanceM <= MAX_ANCHOR_SEGMENT_M) {
      return { prevIndex, currIndex };
    }
  }
  return null;
}

export function findTrailingCorridorOutlierIndices(
  points: CoordinatePoint[],
  existingInvalid: Set<number> = new Set(),
): Set<number> {
  const invalid = new Set<number>();
  if (points.length < 4) {
    return invalid;
  }

  const blocked = new Set([...existingInvalid, ...invalid]);
  let scanIndex = points.length - 1;

  while (scanIndex >= 2) {
    if (blocked.has(scanIndex)) {
      scanIndex -= 1;
      continue;
    }

    const anchor = findAnchorBefore(points, scanIndex - 1, blocked);
    if (!anchor || scanIndex <= anchor.currIndex) {
      break;
    }

    if (
      !isTrailingCorridorOutlier(
        points[anchor.prevIndex],
        points[anchor.currIndex],
        points[scanIndex],
      )
    ) {
      break;
    }

    invalid.add(scanIndex);
    blocked.add(scanIndex);
    scanIndex -= 1;
  }

  return invalid;
}
