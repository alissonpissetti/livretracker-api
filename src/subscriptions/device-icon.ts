export const DEVICE_ICONS = [
  'vehicle',
  'car',
  'bicycle',
  'truck',
  'boat',
  'plane',
  'scooter',
  'backpack',
] as const;

export type DeviceIcon = (typeof DEVICE_ICONS)[number];

export const DEFAULT_DEVICE_ICON: DeviceIcon = 'vehicle';

export function isDeviceIcon(value: string): value is DeviceIcon {
  return (DEVICE_ICONS as readonly string[]).includes(value);
}
