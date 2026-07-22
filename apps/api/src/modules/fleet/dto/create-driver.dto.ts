import { IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
export class CreateDriverDto {
 @IsUUID() companyId!:string;
 @IsString() @Length(3,160) name!:string;
 @IsOptional() @IsString() @MaxLength(120) document?:string;
}
