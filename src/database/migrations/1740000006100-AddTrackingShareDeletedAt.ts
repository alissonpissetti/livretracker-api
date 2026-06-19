import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTrackingShareDeletedAt1740000006100 implements MigrationInterface {
  name = 'AddTrackingShareDeletedAt1740000006100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tracking_shares');
    if (table && !table.findColumnByName('deleted_at')) {
      await queryRunner.addColumn(
        'tracking_shares',
        new TableColumn({
          name: 'deleted_at',
          type: 'datetime',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tracking_shares');
    if (table?.findColumnByName('deleted_at')) {
      await queryRunner.dropColumn('tracking_shares', 'deleted_at');
    }
  }
}
