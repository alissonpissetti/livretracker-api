import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
  TableIndex,
} from 'typeorm';

export class InitialLiveTrackerSchema1740000000000
  implements MigrationInterface
{
  name = 'InitialLiveTrackerSchema1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const ts = (name: string, onUpdate = false) =>
      this.timestampColumn(queryRunner, name, onUpdate);
    const flag = (name: string, defaultValue = 1) =>
      this.booleanColumn(queryRunner, name, defaultValue);
    const id = () => this.idColumn(queryRunner);
    const ref = (name: string, nullable = false) =>
      this.refColumn(queryRunner, name, nullable);

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          id(),
          { name: 'email', type: 'varchar', length: '255', isNullable: false },
          { name: 'name', type: 'varchar', length: '120', isNullable: false },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '16',
            isNullable: false,
            ...this.stringDefault(queryRunner, 'customer'),
          },
          ts('created_at'),
        ],
      }),
      true,
    );
    await this.createIndexIfMissing(queryRunner, 'users', 'IDX_users_email', [
      'email',
    ], true);

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          id(),
          { name: 'slug', type: 'varchar', length: '64', isNullable: false },
          { name: 'name', type: 'varchar', length: '120', isNullable: false },
          { name: 'description', type: 'text', isNullable: false },
          { name: 'type', type: 'varchar', length: '16', isNullable: false },
          { name: 'price_cents', type: 'int', isNullable: false },
          flag('active', 1),
          { name: 'subscription_days', type: 'int', isNullable: true },
          ts('created_at'),
        ],
      }),
      true,
    );
    await this.createIndexIfMissing(queryRunner, 'products', 'IDX_products_slug', [
      'slug',
    ], true);

    await queryRunner.createTable(
      new Table({
        name: 'vouchers',
        columns: [
          id(),
          { name: 'code', type: 'varchar', length: '32', isNullable: false },
          {
            name: 'discount_type',
            type: 'varchar',
            length: '16',
            isNullable: false,
          },
          { name: 'discount_value', type: 'int', isNullable: false },
          flag('active', 1),
          { name: 'max_uses', type: 'int', isNullable: true },
          { name: 'used_count', type: 'int', default: 0 },
          { name: 'expires_at', type: 'datetime', isNullable: true },
          { name: 'min_order_cents', type: 'int', default: 0 },
          { name: 'description', type: 'text', isNullable: true },
          ts('created_at'),
        ],
      }),
      true,
    );
    await this.createIndexIfMissing(queryRunner, 'vouchers', 'IDX_vouchers_code', [
      'code',
    ], true);

    await queryRunner.createTable(
      new Table({
        name: 'devices',
        columns: [
          id(),
          { name: 'device_id', type: 'varchar', length: '32', isNullable: false },
          flag('blocked', 0),
          { name: 'blocked_at', type: 'datetime', isNullable: true },
          {
            name: 'blocked_reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'last_latitude', type: 'double', isNullable: true },
          { name: 'last_longitude', type: 'double', isNullable: true },
          {
            name: 'last_location_source',
            type: 'varchar',
            length: '8',
            isNullable: true,
          },
          ts('first_seen_at'),
          ts('last_seen_at', true),
        ],
      }),
      true,
    );
    await this.createIndexIfMissing(
      queryRunner,
      'devices',
      'IDX_devices_device_id',
      ['device_id'],
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          id(),
          ref('user_id'),
          {
            name: 'customer_name',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'customer_email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '16',
            isNullable: false,
            ...this.stringDefault(queryRunner, 'paid'),
          },
          { name: 'total_cents', type: 'int', isNullable: false },
          { name: 'subtotal_cents', type: 'int', default: 0 },
          { name: 'discount_cents', type: 'int', default: 0 },
          {
            name: 'voucher_code',
            type: 'varchar',
            length: '32',
            isNullable: true,
          },
          ts('created_at'),
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          id(),
          ref('order_id'),
          ref('product_id'),
          {
            name: 'product_slug',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'product_name',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          { name: 'quantity', type: 'int', default: 1 },
          { name: 'unit_price_cents', type: 'int', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'subscriptions',
        columns: [
          id(),
          ref('user_id'),
          {
            name: 'customer_email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'customer_name',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'device_id',
            type: 'varchar',
            length: '32',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '16',
            isNullable: false,
            ...this.stringDefault(queryRunner, 'pending_device'),
          },
          {
            name: 'current_period_end',
            type: 'datetime',
            isNullable: false,
          },
          ref('order_id', true),
          { name: 'label', type: 'varchar', length: '120', isNullable: true },
          ts('created_at'),
          ts('updated_at', true),
        ],
      }),
      true,
    );
    await this.createIndexIfMissing(
      queryRunner,
      'subscriptions',
      'IDX_subscriptions_device_id',
      ['device_id'],
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'locations',
        columns: [
          id(),
          { name: 'device_id', type: 'varchar', length: '32', isNullable: false },
          { name: 'latitude', type: 'double', isNullable: false },
          { name: 'longitude', type: 'double', isNullable: false },
          { name: 'altitude', type: 'double', isNullable: true },
          { name: 'speed_knots', type: 'double', isNullable: true },
          { name: 'accuracy_m', type: 'double', isNullable: true },
          { name: 'satellites_visible', type: 'int', isNullable: true },
          { name: 'satellites_used', type: 'int', isNullable: true },
          { name: 'imei', type: 'varchar', length: '20', isNullable: true },
          { name: 'iccid', type: 'varchar', length: '24', isNullable: true },
          { name: 'imsi', type: 'varchar', length: '20', isNullable: true },
          { name: 'operator', type: 'varchar', length: '64', isNullable: true },
          { name: 'apn', type: 'varchar', length: '128', isNullable: true },
          {
            name: 'location_source',
            type: 'varchar',
            length: '8',
            isNullable: true,
          },
          {
            name: 'recorded_at',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          ts('received_at'),
        ],
      }),
      true,
    );
    await this.createIndexIfMissing(
      queryRunner,
      'locations',
      'IDX_locations_device_id_received_at',
      ['device_id', 'received_at'],
      false,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('locations', true, true, true);
    await queryRunner.dropTable('subscriptions', true, true, true);
    await queryRunner.dropTable('order_items', true, true, true);
    await queryRunner.dropTable('orders', true, true, true);
    await queryRunner.dropTable('devices', true, true, true);
    await queryRunner.dropTable('vouchers', true, true, true);
    await queryRunner.dropTable('products', true, true, true);
    await queryRunner.dropTable('users', true, true, true);
  }

  private isSqlite(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'sqlite';
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

  private stringDefault(
    queryRunner: QueryRunner,
    value: string,
  ): Pick<TableColumnOptions, 'default'> {
    return { default: `'${value}'` };
  }

  private timestampColumn(
    queryRunner: QueryRunner,
    name: string,
    onUpdate = false,
  ): TableColumnOptions {
    if (this.isSqlite(queryRunner)) {
      return {
        name,
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
        ...(onUpdate ? { onUpdate: 'CURRENT_TIMESTAMP' } : {}),
      };
    }

    return {
      name,
      type: 'datetime',
      precision: 6,
      default: 'CURRENT_TIMESTAMP(6)',
      ...(onUpdate ? { onUpdate: 'CURRENT_TIMESTAMP(6)' } : {}),
    };
  }

  private booleanColumn(
    queryRunner: QueryRunner,
    name: string,
    defaultValue: number,
  ): TableColumnOptions {
    if (this.isSqlite(queryRunner)) {
      return {
        name,
        type: 'boolean',
        default: defaultValue === 1,
      };
    }

    return {
      name,
      type: 'tinyint',
      default: defaultValue,
    };
  }

  private async createIndexIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
    columnNames: string[],
    isUnique: boolean,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table) return;

    if (table.indices.some((index) => index.name === indexName)) {
      return;
    }

    await queryRunner.createIndex(
      tableName,
      new TableIndex({
        name: indexName,
        columnNames,
        isUnique,
      }),
    );
  }
}
