import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddTrackingShares1740000006000 implements MigrationInterface {
  name = 'AddTrackingShares1740000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('tracking_shares');
    if (existing) {
      await queryRunner.dropTable('tracking_shares', true);
    }

    const id = this.idColumn(queryRunner);
    const ref = (name: string, nullable = false) =>
      this.refColumn(queryRunner, name, nullable);

    await queryRunner.createTable(
      new Table({
        name: 'tracking_shares',
        columns: [
          id,
          { name: 'token', type: 'varchar', length: '64', isNullable: false },
          ref('user_id'),
          ref('subscription_id'),
          { name: 'device_id', type: 'varchar', length: '32', isNullable: false },
          { name: 'recipient_name', type: 'varchar', length: '120', isNullable: false },
          { name: 'expires_at', type: 'datetime', isNullable: true },
          { name: 'revoked_at', type: 'datetime', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'tracking_shares',
      new TableIndex({
        name: 'IDX_tracking_shares_token',
        columnNames: ['token'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'tracking_shares',
      new TableForeignKey({
        name: 'FK_tracking_shares_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tracking_shares',
      new TableForeignKey({
        name: 'FK_tracking_shares_subscription_id',
        columnNames: ['subscription_id'],
        referencedTableName: 'subscriptions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tracking_shares', true);
  }

  private isMariaFamily(queryRunner: QueryRunner): boolean {
    const type = queryRunner.connection.options.type;
    return type === 'mariadb' || type === 'mysql';
  }

  private idColumn(queryRunner: QueryRunner): TableColumnOptions {
    if (this.isMariaFamily(queryRunner)) {
      return { name: 'id', type: 'uuid', isPrimary: true };
    }
    return { name: 'id', type: 'varchar', length: '36', isPrimary: true };
  }

  private refColumn(
    queryRunner: QueryRunner,
    name: string,
    nullable = false,
  ): TableColumnOptions {
    if (this.isMariaFamily(queryRunner)) {
      return { name, type: 'uuid', isNullable: nullable };
    }
    return { name, type: 'varchar', length: '36', isNullable: nullable };
  }
}
