import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsString,
  IsUUID,
  Length,
} from "class-validator";
export class CreateRouteDto {
  @IsString() @Length(3, 160) name!: string;
  @IsDateString({ strict: true }) plannedDate!: string;
  @IsUUID() driverId!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID("4", { each: true })
  activityIds!: string[];
}
