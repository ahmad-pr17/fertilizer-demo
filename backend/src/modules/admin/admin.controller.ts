import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { ReplyEscalationDto } from './dto/reply-escalation.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** Live order feed */
  @Get('orders')
  getOrderFeed(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.getOrderFeed(user.distributorId);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(user.distributorId, id, dto.status);
  }

  /** Escalated conversations needing a human reply */
  @Get('escalations')
  getEscalations(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.getEscalations(user.distributorId);
  }

  /** Real accumulated LLM spend, computed from Anthropic's own per-call token usage */
  @Get('llm-usage')
  getLlmUsageSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.getLlmUsageSummary(user.distributorId);
  }

  @Post('escalations/:id/reply')
  @HttpCode(HttpStatus.OK)
  replyToEscalation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReplyEscalationDto,
  ) {
    return this.adminService.replyToEscalation(user.distributorId, id, dto.reply);
  }

  /** Dealer activity log */
  @Get('dealers/:id/activity')
  getDealerActivity(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.adminService.getDealerActivity(user.distributorId, id);
  }

  /** Retention on request — owner only */
  @Delete('distributors/me/conversation-data')
  @Roles('owner')
  deleteConversationData(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.deleteDistributorConversationData(user.distributorId);
  }
}
