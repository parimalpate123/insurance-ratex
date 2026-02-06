import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'insurratex'),
  password: configService.get('DB_PASSWORD', 'dev_password_change_in_prod'),
  database: configService.get('DB_DATABASE', 'insurratex'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // Use migrations instead
  logging: configService.get('NODE_ENV') === 'development',
});
