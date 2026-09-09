import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DealersService } from './dealers.service';
import { CreateDealerDto } from './dto/create-dealer.dto';

@Controller('dealers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DealersController {
  constructor(private readonly dealersService: DealersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.dealersService.findAll(user.distributorId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.dealersService.findOneOrFail(user.distributorId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDealerDto) {
    return this.dealersService.create(user.distributorId, dto);
  }
}
