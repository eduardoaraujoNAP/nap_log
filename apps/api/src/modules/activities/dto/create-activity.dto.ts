import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateActivityDto {
  @ApiPropertyOptional({ example: 'ERP-123' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalReference?: string;

  @ApiProperty({ example: 'Entregar pedido 123' })
  @IsString()
  @Length(3, 500)
  description!: string;

  @ApiProperty({ example: 'Av. Paulista, 1000, São Paulo - SP' })
  @IsString()
  @Length(5, 500)
  address!: string;
}
