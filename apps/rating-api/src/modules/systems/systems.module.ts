import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemEntity } from '../../entities/system.entity';
import { SystemsController } from './systems.controller';
import { SystemsService } from './systems.service';

@Module({
  imports: [TypeOrmModule.forFeature([SystemEntity])],
  controllers: [SystemsController],
  providers: [SystemsService],
  exports: [SystemsService],
})
export class SystemsModule {}
