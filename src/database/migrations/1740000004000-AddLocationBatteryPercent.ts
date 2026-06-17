import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLocationBatteryPercent1740000004000
  implements MigrationInterface
{
  name = 'AddLocationBatteryPercent1740000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('locations');
    if (table && !table.findColumnByName('battery_percent')) {
      await queryRunner.addColumn(
        'locations',
        new TableColumn({
          name: 'battery_percent',
          type: 'int',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('locations');
    if (table?.findColumnByName('battery_percent')) {
      await queryRunner.dropColumn('locations', 'battery_percent');
    }
  }
}
