import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeviceBatteryAlerts1740000007100 implements MigrationInterface {
  name = 'AddDeviceBatteryAlerts1740000007100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const subscriptions = await queryRunner.getTable('subscriptions');
    if (subscriptions) {
      if (!subscriptions.findColumnByName('alert_battery_low_enabled')) {
        await queryRunner.addColumn(
          'subscriptions',
          new TableColumn({
            name: 'alert_battery_low_enabled',
            type: 'boolean',
            default: false,
          }),
        );
      }

      if (!subscriptions.findColumnByName('alert_battery_full_enabled')) {
        await queryRunner.addColumn(
          'subscriptions',
          new TableColumn({
            name: 'alert_battery_full_enabled',
            type: 'boolean',
            default: false,
          }),
        );
      }
    }

    const devices = await queryRunner.getTable('devices');
    if (devices) {
      if (!devices.findColumnByName('last_battery_percent')) {
        await queryRunner.addColumn(
          'devices',
          new TableColumn({
            name: 'last_battery_percent',
            type: 'int',
            isNullable: true,
          }),
        );
      }

      if (!devices.findColumnByName('battery_low_alert_active')) {
        await queryRunner.addColumn(
          'devices',
          new TableColumn({
            name: 'battery_low_alert_active',
            type: 'boolean',
            default: false,
          }),
        );
      }

      if (!devices.findColumnByName('battery_full_alert_active')) {
        await queryRunner.addColumn(
          'devices',
          new TableColumn({
            name: 'battery_full_alert_active',
            type: 'boolean',
            default: false,
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const devices = await queryRunner.getTable('devices');
    if (devices?.findColumnByName('battery_full_alert_active')) {
      await queryRunner.dropColumn('devices', 'battery_full_alert_active');
    }
    if (devices?.findColumnByName('battery_low_alert_active')) {
      await queryRunner.dropColumn('devices', 'battery_low_alert_active');
    }
    if (devices?.findColumnByName('last_battery_percent')) {
      await queryRunner.dropColumn('devices', 'last_battery_percent');
    }

    const subscriptions = await queryRunner.getTable('subscriptions');
    if (subscriptions?.findColumnByName('alert_battery_full_enabled')) {
      await queryRunner.dropColumn('subscriptions', 'alert_battery_full_enabled');
    }
    if (subscriptions?.findColumnByName('alert_battery_low_enabled')) {
      await queryRunner.dropColumn('subscriptions', 'alert_battery_low_enabled');
    }
  }
}
