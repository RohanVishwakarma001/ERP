import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [UsersController, ProfileController],
  providers: [UsersService, AdminBootstrapService, ProfileService],
})
export class UsersModule {}
