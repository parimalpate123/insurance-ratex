import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSuggestionsDto {
  @ApiProperty({
    description: 'Source schema UUID',
    example: '770e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  sourceSchemaId: string;

  @ApiProperty({
    description: 'Target schema UUID',
    example: '770e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  targetSchemaId: string;

  @ApiProperty({
    description: 'Product line',
    example: 'general-liability',
    required: false,
  })
  @IsOptional()
  @IsString()
  productLine?: string;

  @ApiProperty({
    description: 'Additional context',
    required: false,
  })
  @IsOptional()
  @IsString()
  context?: string;
}
