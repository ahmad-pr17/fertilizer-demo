import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantScopedRepository } from '../../common/services/tenant-scoped.repository';
import { Dealer } from './entities/dealer.entity';

@Injectable()
export class DealersService extends TenantScopedRepository<Dealer> {
  constructor(@InjectRepository(Dealer) repository: Repository<Dealer>) {
    super(repository);
  }

  findByWhatsappNumber(distributorId: string, whatsappNumber: string): Promise<Dealer | null> {
    return this.findOne(distributorId, { whatsappNumber } as any);
  }
}
