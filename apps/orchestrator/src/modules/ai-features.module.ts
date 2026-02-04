import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

// Entities
import { Schema } from '../entities/schema.entity';
import { Mapping } from '../entities/mapping.entity';
import { FieldMapping } from '../entities/field-mapping.entity';
import { AISuggestion } from '../entities/ai-suggestion.entity';
import { UploadedFile } from '../entities/uploaded-file.entity';

// Services
import { SchemaLibraryService } from '../services/schema-library.service';
import { AIMappingService } from '../services/ai-mapping.service';
import { MappingService } from '../services/mapping.service';
import { ExcelParserService } from '../services/excel-parser.service';

// Controllers
import { SchemasController } from '../controllers/schemas.controller';
import { AIMappingsController } from '../controllers/ai-mappings.controller';
import { MappingsController } from '../controllers/mappings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schema, Mapping, FieldMapping, AISuggestion, UploadedFile]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [SchemasController, AIMappingsController, MappingsController],
  providers: [
    SchemaLibraryService,
    AIMappingService,
    MappingService,
    ExcelParserService,
  ],
  exports: [
    SchemaLibraryService,
    AIMappingService,
    MappingService,
    ExcelParserService,
  ],
})
export class AIFeaturesModule {}
