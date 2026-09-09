import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Distributor } from './entities/distributor.entity';

@Injectable()
export class DistributorsService {
  constructor(
    @InjectRepository(Distributor) private readonly repository: Repository<Distributor>,
  ) {}

  async findOneOrFail(id: string): Promise<Distributor> {
    const distributor = await this.repository.findOne({ where: { id } });
    if (!distributor) throw new NotFoundException(`Distributor ${id} not found`);
    return distributor;
  }

  create(data: Partial<Distributor>): Promise<Distributor> {
    return this.repository.save(this.repository.create(data));
  }

  findByWhatsappPhoneNumberId(phoneNumberId: string): Promise<Distributor | null> {
    return this.repository.findOne({ where: { whatsappPhoneNumberId: phoneNumberId } });
  }

  /**
   * Deliberately not tenant-scoped — only for the retention job, which by
   * its nature must sweep every tenant. Never expose this over an API
   * endpoint that doesn't already require distributor-scoped auth.
   */
  findAll(): Promise<Distributor[]> {
    return this.repository.find();
  }
}
