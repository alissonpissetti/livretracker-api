import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddUserPhoneAndLoginOtp1740000002000
  implements MigrationInterface
{
  name = 'AddUserPhoneAndLoginOtp1740000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    if (usersTable && !usersTable.findColumnByName('phone')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'phone',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }),
      );
    }

    const usersAfter = await queryRunner.getTable('users');
    if (
      usersAfter &&
      !usersAfter.indices.some((index) => index.name === 'IDX_users_phone')
    ) {
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'IDX_users_phone',
          columnNames: ['phone'],
          isUnique: true,
        }),
      );
    }

    const hasLoginOtps = await queryRunner.hasTable('login_otps');
    if (!hasLoginOtps) {
      await queryRunner.createTable(
        new Table({
          name: 'login_otps',
          columns: [
            this.idColumn(queryRunner),
            {
              name: 'user_id',
              type: this.isMariaFamily(queryRunner) ? 'uuid' : 'varchar',
              length: this.isMariaFamily(queryRunner) ? undefined : '36',
              isNullable: false,
            },
            {
              name: 'code_hash',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'purpose',
              type: 'varchar',
              length: '16',
              isNullable: false,
            },
            {
              name: 'expires_at',
              type: 'datetime',
              isNullable: false,
            },
            {
              name: 'attempts',
              type: 'int',
              default: 0,
            },
            this.timestampColumn(queryRunner, 'created_at'),
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'login_otps',
        new TableIndex({
          name: 'IDX_login_otps_user_id',
          columnNames: ['user_id'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('login_otps')) {
      await queryRunner.dropTable('login_otps', true, true, true);
    }

    const usersTable = await queryRunner.getTable('users');
    if (usersTable?.indices.some((index) => index.name === 'IDX_users_phone')) {
      await queryRunner.dropIndex('users', 'IDX_users_phone');
    }

    if (usersTable?.findColumnByName('phone')) {
      await queryRunner.dropColumn('users', 'phone');
    }
  }

  private isMariaFamily(queryRunner: QueryRunner): boolean {
    const type = queryRunner.connection.options.type;
    return type === 'mariadb' || type === 'mysql';
  }

  private idColumn(queryRunner: QueryRunner) {
    if (this.isMariaFamily(queryRunner)) {
      return { name: 'id', type: 'uuid', isPrimary: true };
    }
    return { name: 'id', type: 'varchar', length: '36', isPrimary: true };
  }

  private timestampColumn(queryRunner: QueryRunner, name: string) {
    if (queryRunner.connection.options.type === 'sqlite') {
      return {
        name,
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
      };
    }

    return {
      name,
      type: 'datetime',
      precision: 6,
      default: 'CURRENT_TIMESTAMP(6)',
    };
  }
}
