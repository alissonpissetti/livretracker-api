import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeviceSmsCommandFields1740000007400 implements MigrationInterface {
  name = 'AddDeviceSmsCommandFields1740000007400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('devices');

    if (table && !table.findColumnByName('sim_msisdn')) {
      await queryRunner.addColumn(
        'devices',
        new TableColumn({
          name: 'sim_msisdn',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }),
      );
    }

    if (table && !table.findColumnByName('sms_command_pin')) {
      await queryRunner.addColumn(
        'devices',
        new TableColumn({
          name: 'sms_command_pin',
          type: 'varchar',
          length: '8',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('devices');

    if (table?.findColumnByName('sms_command_pin')) {
      await queryRunner.dropColumn('devices', 'sms_command_pin');
    }

    if (table?.findColumnByName('sim_msisdn')) {
      await queryRunner.dropColumn('devices', 'sim_msisdn');
    }
  }
}
