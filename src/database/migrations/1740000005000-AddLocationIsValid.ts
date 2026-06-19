import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLocationIsValid1740000005000 implements MigrationInterface {
  name = 'AddLocationIsValid1740000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('locations');
    if (table && !table.findColumnByName('is_valid')) {
      await queryRunner.addColumn(
        'locations',
        new TableColumn({
          name: 'is_valid',
          type: 'boolean',
          default: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('locations');
    if (table?.findColumnByName('is_valid')) {
      await queryRunner.dropColumn('locations', 'is_valid');
    }
  }
}
