import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfig } from '../../config';
import { EventsGateway } from './events.gateway';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({ secret: config.jwtAccessSecret }),
    }),
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class WebSocketModule {}
