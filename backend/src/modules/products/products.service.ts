import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantScopedRepository } from '../../common/services/tenant-scoped.repository';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService extends TenantScopedRepository<Product> {
  constructor(@InjectRepository(Product) repository: Repository<Product>) {
    super(repository);
  }

  findActive(distributorId: string): Promise<Product[]> {
    return this.findAll(distributorId, { active: true } as any);
  }
}
