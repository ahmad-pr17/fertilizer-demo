import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Distributor } from './entities/distributor.entity';
import { DistributorsService } from './distributors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Distributor])],
  providers: [DistributorsService],
  exports: [DistributorsService],
})
export class DistributorsModule {}
