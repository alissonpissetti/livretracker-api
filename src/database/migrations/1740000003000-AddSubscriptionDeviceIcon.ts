import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSubscriptionDeviceIcon1740000003000
  implements MigrationInterface
{
  name = 'AddSubscriptionDeviceIcon1740000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('subscriptions');
    if (table && !table.findColumnByName('icon')) {
      await queryRunner.addColumn(
        'subscriptions',
        new TableColumn({
          name: 'icon',
          type: 'varchar',
          length: '16',
          isNullable: false,
          default: "'vehicle'",
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('subscriptions');
    if (table?.findColumnByName('icon')) {
      await queryRunner.dropColumn('subscriptions', 'icon');
    }
  }
}
