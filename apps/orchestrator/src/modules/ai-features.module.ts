import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

// Entities
import { Schema } from '../entities/schema.entity';
import { Mapping } from '../entities/mapping.entity';
import { FieldMapping } from '../entities/field-mapping.entity';
import { AISuggestion } from '../entities/ai-suggestion.entity';
import { UploadedFile } from '../entities/uploaded-file.entity';
import { FieldCatalog } from '../entities/field-catalog.entity';
import { DataType } from '../entities/data-type.entity';

// Services
import { SchemaLibraryService } from '../services/schema-library.service';
import { AIMappingService } from '../services/ai-mapping.service';
import { MappingService } from '../services/mapping.service';
import { ExcelParserService } from '../services/excel-parser.service';
import { FieldCatalogService } from '../services/field-catalog.service';
import { DataTypesService } from '../services/data-types.service';

// Controllers
import { SchemasController } from '../controllers/schemas.controller';
import { AIMappingsController } from '../controllers/ai-mappings.controller';
import { MappingsController } from '../controllers/mappings.controller';
import { FieldCatalogController } from '../controllers/field-catalog.controller';
import { DataTypesController } from '../controllers/data-types.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Schema,
      Mapping,
      FieldMapping,
      AISuggestion,
      UploadedFile,
      FieldCatalog,
      DataType,
    ]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [
    SchemasController,
    AIMappingsController,
    MappingsController,
    FieldCatalogController,
    DataTypesController,
  ],
  providers: [
    SchemaLibraryService,
    AIMappingService,
    MappingService,
    ExcelParserService,
    FieldCatalogService,
    DataTypesService,
  ],
  exports: [
    SchemaLibraryService,
    AIMappingService,
    MappingService,
    ExcelParserService,
    FieldCatalogService,
    DataTypesService,
  ],
})
export class AIFeaturesModule {}
