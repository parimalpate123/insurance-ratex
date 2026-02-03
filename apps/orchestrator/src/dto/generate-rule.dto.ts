import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class GenerateRuleDto {
  @ApiProperty({ description: 'Natural language rule description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Product line for the rule' })
  @IsString()
  productLine: string;

  @ApiProperty({ required: false, enum: ['lookup', 'decision', 'conditional'] })
  @IsOptional()
  @IsEnum(['lookup', 'decision', 'conditional'])
  ruleType?: 'lookup' | 'decision' | 'conditional';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  context?: {
    availableFields?: string[];
    operators?: string[];
    actions?: string[];
  };
}
