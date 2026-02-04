import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ContextDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sourceSystem?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetSystem?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productLine?: string;
}

export class ParseTextDto {
  @ApiProperty({
    description: 'Text requirements to parse (JIRA story, plain text, etc.)',
    example: 'Map quoteNumber to policy.id\nMap insured.name to insured.name',
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Optional context information',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContextDto)
  context?: ContextDto;
}
