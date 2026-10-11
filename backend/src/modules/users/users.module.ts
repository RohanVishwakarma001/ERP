import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminBootstrapService } from './admin-bootstrap.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AdminBootstrapService],
})
export class UsersModule {}
