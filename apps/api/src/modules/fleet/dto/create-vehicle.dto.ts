import { IsString, IsUUID, Matches } from 'class-validator';
export class CreateVehicleDto {
 @IsUUID() companyId!:string;
 @IsString() @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/) plate!:string;
}
