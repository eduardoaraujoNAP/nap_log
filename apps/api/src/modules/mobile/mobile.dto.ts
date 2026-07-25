import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsObject,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
export class MobileCommandDto {
  @IsUUID() clientCommandId!: string;
  @IsUUID() deviceId!: string;
  @IsIn([
    "accept_activity",
    "depart_activity",
    "start_route",
    "finish_route",
    "arrive",
    "start_service",
    "fail_activity",
  ])
  type!:
    | "accept_activity"
    | "depart_activity"
    | "start_route"
    | "finish_route"
    | "arrive"
    | "start_service"
    | "fail_activity";
  @IsDateString() occurredAt!: string;
  @IsObject() payload!: Record<string, unknown>;
}
export class MobileCommandsBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MobileCommandDto)
  commands!: MobileCommandDto[];
}
export class GpsPointDto {
  @IsUUID() clientPointId!: string;
  @IsNumber() @Min(-90) @Max(90) latitude!: number;
  @IsNumber() @Min(-180) @Max(180) longitude!: number;
  @IsNumber() @Min(0) @Max(10000) accuracy!: number;
  @IsDateString() recordedAt!: string;
}
export class GpsBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => GpsPointDto)
  points!: GpsPointDto[];
}
