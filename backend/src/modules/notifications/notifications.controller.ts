import { Controller, Get, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Centralized Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Own in-app notifications (latest 50) and unread count' })
  getMyNotifications(@CurrentUser('id') userId: string) {
    return this.notificationsService.getMyNotifications(userId);
  }

  // Declared before ':id/read' so "read-all" is never captured as an id.
  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all own notifications as read' })
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one own notification as read' })
  markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }
}
