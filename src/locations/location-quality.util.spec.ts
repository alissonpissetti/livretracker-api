import {
  findInvalidLocationIndices,
  impliedSpeedKmh,
  isInvalidComparedToPrevious,
  type LocationQualityPoint,
} from './location-quality.util';

function point(
  id: string,
  lat: number,
  lng: number,
  recordedAt: string,
  speedKnots?: number,
): LocationQualityPoint {
  return {
    id,
    latitude: lat,
    longitude: lng,
    recorded_at: recordedAt,
    speed_knots: speedKnots,
  };
}

describe('location-quality.util', () => {
  it('mantém trajeto urbano plausível como válido', () => {
    const baseLat = -25.4284;
    const baseLng = -49.2733;
    const points: LocationQualityPoint[] = [];

    for (let index = 0; index < 20; index += 1) {
      points.push(
        point(
          String(index),
          baseLat + index * 0.0004,
          baseLng + index * 0.0002,
          `2026-06-18T10:${String(index).padStart(2, '0')}:00.000Z`,
          12,
        ),
      );
    }

    expect(findInvalidLocationIndices(points).size).toBe(0);
  });

  it('descarta teleporte entre leituras próximas no tempo', () => {
    const points = [
      point('1', -25.4284, -49.2733, '2026-06-18T10:00:00.000Z', 0),
      point('2', -25.5, -49.4, '2026-06-18T10:00:20.000Z', 0),
      point('3', -25.4286, -49.2735, '2026-06-18T10:01:00.000Z', 8),
    ];

    const invalid = findInvalidLocationIndices(points);
    expect(invalid.has(1)).toBe(true);
    expect(invalid.has(0)).toBe(false);
    expect(invalid.has(2)).toBe(false);
  });

  it('descarta spike isolado quando prev e next permanecem juntos', () => {
    const points = [
      point('1', -25.4284, -49.2733, '2026-06-18T10:00:00.000Z', 0),
      point('2', -25.48, -49.35, '2026-06-18T10:00:30.000Z', 0),
      point('3', -25.4285, -49.2734, '2026-06-18T10:01:00.000Z', 0),
    ];

    const invalid = findInvalidLocationIndices(points);
    expect(invalid.has(1)).toBe(true);
  });

  it('usa mediana recente para tolerar trecho rápido mas barrar salto absurdo', () => {
    const points = [
      point('1', -25.4284, -49.2733, '2026-06-18T10:00:00.000Z', 55),
      point('2', -25.43, -49.275, '2026-06-18T10:01:00.000Z', 58),
      point('3', -25.432, -49.277, '2026-06-18T10:02:00.000Z', 60),
      point('4', -25.55, -49.4, '2026-06-18T10:02:30.000Z', 5),
    ];

    expect(isInvalidComparedToPrevious(points[2], points[3], [58, 60])).toBe(true);
  });

  it('calcula velocidade implícita com piso mínimo de tempo', () => {
    const from = point('1', 0, 0, '2026-06-18T10:00:00.000Z');
    const to = point('2', 0, 0.001, '2026-06-18T10:00:01.000Z');
    expect(impliedSpeedKmh(from, to)).toBeGreaterThan(0);
  });
});
