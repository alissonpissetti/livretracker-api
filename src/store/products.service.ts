import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

const DEFAULT_PRODUCTS: Array<
  Pick<Product, 'slug' | 'name' | 'description' | 'type' | 'price_cents' | 'subscription_days'>
> = [
  {
    slug: 'kit-tsim7080g',
    name: 'Kit Rastreador T-SIM7080G',
    description:
      'Placa LilyGO T-SIM7080G com modem NB-IoT/LTE-M, antena GPS e chip M2M pré-configurado para LIVRE TRACKER.',
    type: 'hardware',
    price_cents: 44900,
  },
  {
    slug: 'assinatura-mensal',
    name: 'Assinatura de Rastreamento',
    description:
      'Monitoramento em tempo real, histórico de rotas e alertas. Renovação mensal por equipamento.',
    type: 'subscription',
    price_cents: 2990,
    subscription_days: 30,
  },
];

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const item of DEFAULT_PRODUCTS) {
      const existing = await this.productsRepository.findOne({
        where: { slug: item.slug },
      });

      if (!existing) {
        await this.productsRepository.save(this.productsRepository.create(item));
      }
    }
  }

  async findAllActive(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { active: true },
      order: { type: 'ASC', price_cents: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { slug, active: true },
    });
  }
}

export function formatBrl(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
