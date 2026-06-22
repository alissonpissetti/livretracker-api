import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDevicePowerStatus1740000007300 implements MigrationInterface {
  name = 'AddDevicePowerStatus1740000007300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('devices');

    if (table && !table.findColumnByName('last_usb_connected')) {
      await queryRunner.addColumn(
        'devices',
        new TableColumn({
          name: 'last_usb_connected',
          type: 'boolean',
          isNullable: true,
        }),
      );
    }

    if (table && !table.findColumnByName('last_battery_charging')) {
      await queryRunner.addColumn(
        'devices',
        new TableColumn({
          name: 'last_battery_charging',
          type: 'boolean',
          isNullable: true,
        }),
      );
    }

    if (table && !table.findColumnByName('last_power_at')) {
      await queryRunner.addColumn(
        'devices',
        new TableColumn({
          name: 'last_power_at',
          type: 'datetime',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('devices');

    if (table?.findColumnByName('last_power_at')) {
      await queryRunner.dropColumn('devices', 'last_power_at');
    }

    if (table?.findColumnByName('last_battery_charging')) {
      await queryRunner.dropColumn('devices', 'last_battery_charging');
    }

    if (table?.findColumnByName('last_usb_connected')) {
      await queryRunner.dropColumn('devices', 'last_usb_connected');
    }
  }
}
