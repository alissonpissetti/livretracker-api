import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLocationPowerStatus1740000007200 implements MigrationInterface {
  name = 'AddLocationPowerStatus1740000007200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('locations');

    if (table && !table.findColumnByName('usb_connected')) {
      await queryRunner.addColumn(
        'locations',
        new TableColumn({
          name: 'usb_connected',
          type: 'boolean',
          isNullable: true,
        }),
      );
    }

    if (table && !table.findColumnByName('battery_charging')) {
      await queryRunner.addColumn(
        'locations',
        new TableColumn({
          name: 'battery_charging',
          type: 'boolean',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('locations');

    if (table?.findColumnByName('battery_charging')) {
      await queryRunner.dropColumn('locations', 'battery_charging');
    }

    if (table?.findColumnByName('usb_connected')) {
      await queryRunner.dropColumn('locations', 'usb_connected');
    }
  }
}
