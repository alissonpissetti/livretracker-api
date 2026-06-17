/**
 * Seed de rotas mock para desenvolvimento local.
 *
 * Uso:
 *   cd api
 *   npm run seed:mock-locations -- --device-id=868123456789012 --days=7 --reset
 *
 * Consulta após o seed:
 *   GET /v1/locations/devices/868123456789012/latest?limit=500
 *   GET /v1/locations/devices/868123456789012/latest?from=2026-06-10T00:00:00Z&to=2026-06-10T23:59:59Z
 */
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Device } from '../../devices/entities/device.entity';
import { Location } from '../../locations/entities/location.entity';

type LatLng = { lat: number; lng: number; label: string };

type SeedOptions = {
  deviceId: string;
  days: number;
  pointsPerDay: number;
  reset: boolean;
  city: string;
};

const CURITIBA_WAYPOINTS = {
  home: { lat: -25.442, lng: -49.285, label: 'Batel' },
  centro: { lat: -25.4284, lng: -49.2733, label: 'Centro' },
  work: { lat: -25.475, lng: -49.325, label: 'CIC' },
  lunch: { lat: -25.426, lng: -49.265, label: 'Shopping' },
  park: { lat: -25.395, lng: -49.23, label: 'Bacacheri' },
} satisfies Record<string, LatLng>;

function parseArgs(argv: string[]): SeedOptions {
  const options: SeedOptions = {
    deviceId: '868123456789012',
    days: 7,
    pointsPerDay: 30,
    reset: false,
    city: 'curitiba',
  };

  for (const arg of argv) {
    if (arg === '--reset') {
      options.reset = true;
      continue;
    }

    const [key, value] = arg.replace(/^--/, '').split('=');
    if (!value) continue;

    switch (key) {
      case 'device-id':
        options.deviceId = value.trim();
        break;
      case 'days':
        options.days = Math.max(1, Number(value) || 7);
        break;
      case 'points-per-day':
        options.pointsPerDay = Math.max(5, Number(value) || 30);
        break;
      case 'city':
        options.city = value.trim().toLowerCase();
        break;
    }
  }

  return options;
}

function getWaypoints(city: string): Record<string, LatLng> {
  if (city !== 'curitiba') {
    console.warn(`[seed] Cidade "${city}" não mapeada; usando Curitiba.`);
  }
  return CURITIBA_WAYPOINTS;
}

function interpolate(
  from: LatLng,
  to: LatLng,
  steps: number,
): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    points.push({
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t,
    });
  }

  return points;
}

function addNoise(lat: number, lng: number): { lat: number; lng: number } {
  const meters = 20 + Math.random() * 30;
  const angle = Math.random() * Math.PI * 2;
  const deltaLat = (meters / 111_320) * Math.cos(angle);
  const deltaLng =
    (meters / (111_320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);

  return {
    lat: Number((lat + deltaLat).toFixed(7)),
    lng: Number((lng + deltaLng).toFixed(7)),
  };
}

function buildRouteForDay(
  day: Date,
  pointsPerDay: number,
  isWeekend: boolean,
  waypoints: Record<string, LatLng>,
): Array<{
  latitude: number;
  longitude: number;
  recorded_at: string;
  received_at: Date;
  speed_knots: number;
  battery_percent: number;
}> {
  const segments = isWeekend
    ? [
        [waypoints.home, waypoints.park],
        [waypoints.park, waypoints.centro],
        [waypoints.centro, waypoints.home],
      ]
    : [
        [waypoints.home, waypoints.work],
        [waypoints.work, waypoints.lunch],
        [waypoints.lunch, waypoints.work],
        [waypoints.work, waypoints.home],
      ];

  const stepsPerSegment = Math.max(
    2,
    Math.floor(pointsPerDay / segments.length),
  );
  const rawPoints: Array<{ lat: number; lng: number }> = [];

  for (const [from, to] of segments) {
    const segment = interpolate(from, to, stepsPerSegment);
    if (rawPoints.length > 0) {
      segment.shift();
    }
    rawPoints.push(...segment);
  }

  const trimmed = rawPoints.slice(0, pointsPerDay);
  const startHour = isWeekend ? 9 : 8;
  const endHour = isWeekend ? 14 : 19;
  const totalMinutes = (endHour - startHour) * 60;
  const interval = totalMinutes / Math.max(trimmed.length - 1, 1);

  return trimmed.map((point, index) => {
    const noisy = addNoise(point.lat, point.lng);
    const minutes = Math.round(startHour * 60 + interval * index);
    const timestamp = new Date(day);
    timestamp.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

    const speedKnots = isWeekend
      ? Number((8 + Math.random() * 6).toFixed(1))
      : Number((12 + Math.random() * 10).toFixed(1));

    const batteryBase = isWeekend ? 92 : 88;
    const batteryDrain = Math.round((index / Math.max(trimmed.length - 1, 1)) * 18);
    const batteryPercent = Math.max(
      35,
      batteryBase - batteryDrain + Math.floor(Math.random() * 5) - 2,
    );

    return {
      latitude: noisy.lat,
      longitude: noisy.lng,
      recorded_at: timestamp.toISOString(),
      received_at: new Date(timestamp.getTime() + 1000),
      speed_knots: speedKnots,
      battery_percent: batteryPercent,
    };
  });
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

async function ensureDevice(
  deviceRepo: ReturnType<typeof AppDataSource.getRepository<Device>>,
  deviceId: string,
): Promise<Device> {
  const existing = await deviceRepo.findOne({ where: { device_id: deviceId } });
  if (existing) {
    return existing;
  }

  return deviceRepo.save(
    deviceRepo.create({
      device_id: deviceId,
      blocked: false,
    }),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const waypoints = getWaypoints(options.city);

  await AppDataSource.initialize();

  const locationRepo = AppDataSource.getRepository(Location);
  const deviceRepo = AppDataSource.getRepository(Device);

  if (options.reset) {
    const deleted = await locationRepo.delete({ device_id: options.deviceId });
    console.log(
      `[seed] Removidos ${deleted.affected ?? 0} pontos anteriores de ${options.deviceId}`,
    );
  }

  const device = await ensureDevice(deviceRepo, options.deviceId);
  const today = startOfDay(new Date());
  const allPoints: Location[] = [];

  for (let dayOffset = options.days - 1; dayOffset >= 0; dayOffset--) {
    const day = new Date(today);
    day.setDate(day.getDate() - dayOffset);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const route = buildRouteForDay(
      day,
      options.pointsPerDay,
      isWeekend,
      waypoints,
    );

    for (const point of route) {
      allPoints.push(
        locationRepo.create({
          device_id: options.deviceId,
          latitude: point.latitude,
          longitude: point.longitude,
          recorded_at: point.recorded_at,
          received_at: point.received_at,
          location_source: 'gps',
          speed_knots: point.speed_knots,
          battery_percent: point.battery_percent,
          accuracy_m: Number((3 + Math.random() * 4).toFixed(1)),
          satellites_visible: 10 + Math.floor(Math.random() * 4),
          satellites_used: 6 + Math.floor(Math.random() * 4),
          imei: options.deviceId,
          operator: 'Vivo',
        }),
      );
    }
  }

  await locationRepo.save(allPoints, { chunk: 100 });

  const lastPoint = allPoints[allPoints.length - 1];
  device.last_latitude = lastPoint.latitude;
  device.last_longitude = lastPoint.longitude;
  device.last_location_source = 'gps';
  device.last_seen_at = lastPoint.received_at;
  await deviceRepo.save(device);

  const firstDay = allPoints[0]?.recorded_at;
  const lastDay = lastPoint?.recorded_at;

  console.log(`[seed] ${allPoints.length} pontos inseridos para ${options.deviceId}`);
  console.log(`[seed] Período: ${firstDay} → ${lastDay}`);
  console.log(`[seed] Cidade: ${options.city}`);
  console.log(
    `[seed] Consulta: GET /v1/locations/devices/${options.deviceId}/latest?limit=500`,
  );

  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error('[seed] Falha:', error);
  process.exit(1);
});
