import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantScopedRepository } from '../../common/services/tenant-scoped.repository';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService extends TenantScopedRepository<Order> {
  constructor(@InjectRepository(Order) repository: Repository<Order>) {
    super(repository);
  }

  findRecent(distributorId: string, limit = 100): Promise<Order[]> {
    return this.repository.find({
      where: { distributorId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  findByStatus(distributorId: string, status: OrderStatus): Promise<Order[]> {
    return this.repository.find({
      where: { distributorId, status },
      order: { createdAt: 'ASC' },
    });
  }

  findRecentForDealer(distributorId: string, dealerId: string, limit = 50): Promise<Order[]> {
    return this.repository.find({
      where: { distributorId, dealerId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  setStatus(distributorId: string, id: string, status: OrderStatus): Promise<Order> {
    return this.update(distributorId, id, { status });
  }
}
