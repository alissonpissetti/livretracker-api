import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { normalizePhone } from './phone.util';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAdminUser();
  }

  async create(
    name: string,
    email: string,
    password: string,
    phone: string,
  ): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    const existingEmail = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const existingPhone = await this.usersRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (existingPhone) {
      throw new ConflictException('Telefone já cadastrado');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password_hash,
      role: 'customer',
    });

    return this.usersRepository.save(user);
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return null;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    return valid ? user : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      const normalizedPhone = normalizePhone(phone);
      return this.usersRepository.findOne({ where: { phone: normalizedPhone } });
    } catch {
      return null;
    }
  }

  async updatePassword(userId: string, password: string): Promise<User> {
    const user = await this.findById(userId);
    user.password_hash = await bcrypt.hash(password, 10);
    return this.usersRepository.save(user);
  }

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string | null },
  ): Promise<User> {
    const user = await this.findById(userId);

    if (data.name !== undefined) {
      user.name = data.name.trim();
    }

    if (data.phone !== undefined) {
      if (data.phone === null || data.phone.trim() === '') {
        user.phone = null;
      } else {
        const normalizedPhone = normalizePhone(data.phone);
        const existingPhone = await this.usersRepository.findOne({
          where: { phone: normalizedPhone },
        });
        if (existingPhone && existingPhone.id !== userId) {
          throw new ConflictException('Telefone já cadastrado em outra conta');
        }
        user.phone = normalizedPhone;
      }
    }

    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  private async seedAdminUser(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL', '').trim().toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD', '').trim();
    const name = this.config.get<string>('ADMIN_NAME', 'Administrador').trim();

    if (!email || !password) {
      return;
    }

    const existing = await this.usersRepository.findOne({ where: { email } });
    if (!existing) {
      const password_hash = await bcrypt.hash(password, 10);
      await this.usersRepository.save(
        this.usersRepository.create({
          email,
          name,
          password_hash,
          role: 'admin',
        }),
      );
      console.log(`[ADMIN] Conta administrativa criada: ${email}`);
      return;
    }

    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await this.usersRepository.save(existing);
      console.log(`[ADMIN] Conta promovida a administrador: ${email}`);
    }
  }
}
