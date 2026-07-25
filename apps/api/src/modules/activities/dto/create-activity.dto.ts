import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  Max,
  Min,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class CreateActivityDto {
  @ApiPropertyOptional({ example: "ERP-123" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalReference?: string;

  @ApiProperty({ example: "Entregar pedido 123" })
  @IsString()
  @Length(3, 500)
  description!: string;

  @ApiProperty({ example: "Av. Paulista, 1000, São Paulo - SP" })
  @IsString()
  @Length(5, 500)
  address!: string;

  @ApiPropertyOptional({ example: -23.5614 })
  @ValidateIf(
    (value: CreateActivityDto) =>
      value.destinationLatitude !== undefined ||
      value.destinationLongitude !== undefined,
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  destinationLatitude?: number;

  @ApiPropertyOptional({ example: -46.6559 })
  @ValidateIf(
    (value: CreateActivityDto) =>
      value.destinationLatitude !== undefined ||
      value.destinationLongitude !== undefined,
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  destinationLongitude?: number;
}
