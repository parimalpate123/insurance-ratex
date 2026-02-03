import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FieldInfoDto {
  @ApiProperty()
  @IsString()
  path: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  sampleValue?: any;
}

export class SuggestMappingsDto {
  @ApiProperty({ type: [FieldInfoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldInfoDto)
  sourceFields: FieldInfoDto[];

  @ApiProperty({ type: [FieldInfoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldInfoDto)
  targetFields: FieldInfoDto[];

  @ApiProperty()
  @IsString()
  sourceSystem: string;

  @ApiProperty()
  @IsString()
  targetSystem: string;

  @ApiProperty()
  @IsString()
  productLine: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  useHistoricalMappings?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  confidenceThreshold?: number;
}
