import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddForeignKeysAndAlignTypes1740000001000
  implements MigrationInterface
{
  name = 'AddForeignKeysAndAlignTypes1740000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (this.isMariaFamily(queryRunner)) {
      await this.alignUuidColumn(queryRunner, 'orders', 'user_id', false);
      await this.alignUuidColumn(queryRunner, 'subscriptions', 'user_id', false);
      await this.alignUuidColumn(queryRunner, 'subscriptions', 'order_id', true);
    }

    await this.createForeignKeyIfMissing(queryRunner, 'orders', {
      name: 'FK_orders_user_id',
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'RESTRICT',
    });

    await this.createForeignKeyIfMissing(queryRunner, 'order_items', {
      name: 'FK_order_items_order_id',
      columnNames: ['order_id'],
      referencedTableName: 'orders',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    });

    await this.createForeignKeyIfMissing(queryRunner, 'order_items', {
      name: 'FK_order_items_product_id',
      columnNames: ['product_id'],
      referencedTableName: 'products',
      referencedColumnNames: ['id'],
      onDelete: 'RESTRICT',
    });

    await this.createForeignKeyIfMissing(queryRunner, 'subscriptions', {
      name: 'FK_subscriptions_user_id',
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    });

    await this.createForeignKeyIfMissing(queryRunner, 'subscriptions', {
      name: 'FK_subscriptions_order_id',
      columnNames: ['order_id'],
      referencedTableName: 'orders',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    });

    await this.createForeignKeyIfMissing(queryRunner, 'subscriptions', {
      name: 'FK_subscriptions_device_id',
      columnNames: ['device_id'],
      referencedTableName: 'devices',
      referencedColumnNames: ['device_id'],
      onDelete: 'SET NULL',
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = ['subscriptions', 'order_items', 'orders'];
    for (const tableName of tables) {
      const table = await queryRunner.getTable(tableName);
      if (!table) continue;
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey(tableName, fk);
      }
    }
  }

  private isMariaFamily(queryRunner: QueryRunner): boolean {
    const type = queryRunner.connection.options.type;
    return type === 'mariadb' || type === 'mysql';
  }

  private async alignUuidColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    nullable: boolean,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table) return;

    const column = table.findColumnByName(columnName);
    if (!column || column.type === 'uuid') {
      return;
    }

    await queryRunner.changeColumn(
      tableName,
      columnName,
      new TableColumn({
        name: columnName,
        type: 'uuid',
        isNullable: nullable,
      }),
    );
  }

  private async createForeignKeyIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    options: {
      name: string;
      columnNames: string[];
      referencedTableName: string;
      referencedColumnNames: string[];
      onDelete: 'CASCADE' | 'RESTRICT' | 'SET NULL';
    },
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table) return;

    const existsByName = table.foreignKeys.some((fk) => fk.name === options.name);
    const existsByColumns = table.foreignKeys.some(
      (fk) =>
        fk.columnNames.join(',') === options.columnNames.join(',') &&
        fk.referencedTableName === options.referencedTableName,
    );

    if (existsByName || existsByColumns) {
      return;
    }

    await queryRunner.createForeignKey(
      tableName,
      new TableForeignKey({
        name: options.name,
        columnNames: options.columnNames,
        referencedTableName: options.referencedTableName,
        referencedColumnNames: options.referencedColumnNames,
        onDelete: options.onDelete,
      }),
    );
  }
}
